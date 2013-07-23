require 'em-websocket'


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


port = 9001
EM.run {
  puts "Listening on #{port}"
  EM::WebSocket.run(:host => "0.0.0.0", :port => port) do |ws|
    ws.onopen { |handshake|
      STDERR.puts "WebSocket connection open"

      # Access properties on the EM::WebSocket::Handshake object, e.g.
      # path, query_string, origin, headers

      # Publish message to the client
      ws.send "Hello Client, you connected to #{handshake.path}"
    }

    ws.onclose { puts "Connection closed" }

    ws.onmessage { |msg|
      STDERR.puts "Recieved message: #{msg}"
      ws.send "Pong: #{msg}"

      if msg =~ /GIMME PPM (.+)/
        puts $1
      end

      if msg =~ /GIMME IMAGE/
        STDERR.puts "GETTING AN IMAGE"

        dev.led = :red # play with the led

        dev.video_mode = Freenect.video_mode(:medium, :rgb)
        dev.start_video()
        $snapshot_finished = nil

        dev.set_video_callback do |device, video, timestamp|
          if not $snapshot_finished
            ws.send [dev.video_mode.width, dev.video_mode.height, dev.video_mode.bytes].join(" ")
            $snapshot_finished = true
          end
        end

        ret = -1
        until $snapshot_finished
          break if (ret=ctx.process_events) < 0
        end

        if ret < 0
          STDERR.puts "Error: unable to take snapshot. process_events code=#{ret}"
        end

        dev.led = :green
        dev.stop_video

      end
    }
  end
}

dev.close
ctx.close
