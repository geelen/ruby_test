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
        var frame = {};

        ws.onmessage = function(e) {
          window.e = e;
          if (typeof e.data == "string") {
            console.log(e.data)
            var json = JSON.parse(e.data);
            console.log(json);
          } else {
            console.log(e);

            window.reader = new FileReader();
            reader.addEventListener("loadend", function() {
               // reader.result contains the contents of blob as a typed array
              console.log("read!")
              window.array = new Uint8Array(reader.result);
              console.log(array.length)
            });
            reader.readAsArrayBuffer(e.data);

          }
        };

        ws.send("GIMME IMAGE");
      }
    }
  })


})(angular.module('rubyTestApp', []));
