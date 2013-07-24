(function(app) {
  'use strict';

  app.config(function($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });

  app.directive('datCanvas', function() {
    return function(scope, element, attrs) {
      var canvas = element[0],
        context = canvas.getContext("2d");
      window.context = context;

      window.ws = new WebSocket("ws://localhost:9001");
      ws.onopen = function() {
        var playback = false;

        console.timeStamp("Socket open and ready!");

        ws.onmessage = function(e) {
          window.e = e;
          if (typeof e.data == "string") {
            var json = JSON.parse(e.data);
            console.log(json)
            console.timeStamp("Json response");

          } else {
            window.reader = new FileReader();
            reader.addEventListener("loadend", function() {
              console.timeStamp("Loaded");
               // reader.result contains the contents of blob as a typed array
              window.array = new Uint8Array(reader.result);
              window.imgData = context.getImageData(0, 0, 640, 480);
              console.log(array.length)
              var accum = 0;
              for (var i = 0, l = array.length; i < l; i++) {
                imgData.data[Math.floor(i / 3) * 4 + (i % 3)] = array[i];
                imgData.data[Math.floor(i / 3) * 4 + 3] = 255;
              }
              console.timeStamp("Image data putting");
              context.putImageData(imgData, 0, 0)
              console.timeStamp("Image data put");

              if (playback) ws.send("GIMME IMAGE");
            });
            console.timeStamp("Reading data");
            reader.readAsArrayBuffer(e.data);

          }
        };

        scope.togglePlayback = function() {
          playback = !playback;
          if (playback) ws.send("GIMME IMAGE");
        }
      }
    }
  })


})(angular.module('rubyTestApp', []));
