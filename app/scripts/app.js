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

      window.ws = new WebSocket("ws://localhost:9001");
      ws.onopen = function() {
        ws.onmessage = function(e) {
          console.log("GOT: " + e.data);
        };

        ws.send("GIMME PPM " + attrs.datCanvas);
      }
    }
  })


})(angular.module('rubyTestApp', []));
