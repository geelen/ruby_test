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

      console.log(canvas, context)
    }
  })


})(angular.module('rubyTestApp', []));
