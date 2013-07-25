# encoding: UTF-8

require 'em-websocket'
require 'json'
require "base64"

$: << File.expand_path(File.join(File.dirname(__FILE__), "ffi-libfreenect"))
require 'freenect'
ctx = Freenect.init()

devs = ctx.num_devices

STDERR.puts "Number of Kinects detected: #{devs}"
unless devs > 0
  STDERR.puts "Error: no kinect detected"
  exit 1
end

STDERR.puts "Selecting device 0"
dev = ctx.open_device(0)

dev.led = :green # play with the led
$waiting_for_events = false
$ready_to_receive = false

port = 9001
EM.run {
  wait_for_usb = -> {
    print "^"
    ret = ctx.process_events

    if ret < 0
      STDERR.puts "Error: unable to take snapshot. process_events code=#{ret}"
    end

    EM.next_tick(&wait_for_usb) if $waiting_for_events
  }

  puts "Listening on #{port}"
  EM::WebSocket.run(:host => "0.0.0.0", :port => port) do |ws|
    ws.onopen { |handshake|
      STDERR.puts "WebSocket connection open"

      # Access properties on the EM::WebSocket::Handshake object, e.g.
      # path, query_string, origin, headers

      # Publish message to the client
      ws.send({hi: "Hello Client, you connected to #{handshake.path}"}.to_json)
    }

    ws.onclose {
      puts "Connection closed"
      dev.led = :green
      dev.stop_video
      $waiting_for_events = false
    }

    ws.onmessage { |msg|
      STDERR.puts "Recieved message: #{msg}"
      ws.send({Pong: "#{msg}"}.to_json)

      case msg
      when "GIMME IMAGE"
        STDERR.puts "GETTING AN IMAGE"

        dev.led = :red # play with the led

        dev.video_mode = Freenect.video_mode(:medium, :rgb)
        dev.start_video()
        snapshot_finished = nil

        dev.set_video_callback do |device, video, timestamp|
          if !snapshot_finished
            ws.send({
                      image: {
                        width: dev.video_mode.width,
                        height: dev.video_mode.height
                      }
                    }.to_json)
            ws.send_binary(video.read_string_length(dev.video_mode.bytes))
            snapshot_finished = true
          end
        end

        ret = -1
        until snapshot_finished
          break if (ret=ctx.process_events) < 0
        end

        if ret < 0
          STDERR.puts "Error: unable to take snapshot. process_events code=#{ret}"
        end

        dev.led = :green
        dev.stop_video
      when "IMAGES RWAR"
        STDERR.puts "FIRE IT UP!"

        dev.led = :red # play with the led

        dev.video_mode = Freenect.video_mode(:medium, :rgb)
        dev.start_video()
        dev.set_video_callback do |device, video, timestamp|
          if $ready_to_receive
            STDERR.puts "SENT!"
            ws.send_binary(video.read_string_length(dev.video_mode.bytes))
            $ready_to_receive = false
          else
            STDERR.print "v"
          end
        end
        $ready_to_receive = true
        $waiting_for_events = true
        EM.next_tick(&wait_for_usb)
      when "MOAR PLOX"
        $ready_to_receive = true
      when "NOOOPE"
        dev.led = :green
        dev.stop_video
        $waiting_for_events = false
      when "DAT DEPTH"
        dev.led = :yellow # play with the led

        dev.depth_mode = Freenect.depth_mode(:medium, :depth_11bit)
        dev.start_depth()
        dev.set_depth_callback do |device, depth, timestamp|
          if $ready_to_receive
            STDERR.puts "SENT!"
            ws.send_binary(depth.read_string_length(dev.depth_mode.bytes))
            $ready_to_receive = false
          else
            STDERR.print "v"
          end
        end
        $ready_to_receive = true
        $waiting_for_events = true
        EM.next_tick(&wait_for_usb)


      end
    }
  end
}

dev.close
ctx.close
