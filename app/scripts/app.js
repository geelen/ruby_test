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

      var playback = false;
      var ws = undefined;

      var startPlayback = function() {
        ws = new WebSocket("ws://localhost:9001");
        ws.onopen = function() {
          console.log("Socket open and ready!");
          var parsing = false;

          ws.onmessage = function(e) {
            window.e = e;
            if (typeof e.data == "string") {
              var json = JSON.parse(e.data);
              console.log(json)

            } else {
              if (!parsing) {
                parsing = true;
                window.reader = new FileReader();
                reader.addEventListener("loadend", function() {
                  console.log("Loaded");
                  // reader.result contains the contents of blob as a typed array
                  window.array = new Uint8Array(reader.result);
                  window.imgData = context.getImageData(0, 0, 640, 480);
                  console.log(array.length)
                  for (var i = 0, l = array.length; i < l; i++) {
                    imgData.data[Math.floor(i / 3) * 4 + (i % 3)] = array[i];
                    imgData.data[Math.floor(i / 3) * 4 + 3] = 255;
                  }
                  context.putImageData(imgData, 0, 0)
                  parsing = false;
                });
                reader.readAsArrayBuffer(e.data);
              }
            }
          };
          ws.send("IMAGES RWAR")
        };
      }

      scope.togglePlayback = function() {
        playback = !playback;
        if (playback) startPlayback();
        if (!playback) ws.close();
      }
    }
  })


})(angular.module('rubyTestApp', []));
