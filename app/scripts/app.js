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

      var startPlayback = function(type) {
        ws = new WebSocket("ws://localhost:9001");
        ws.onopen = function() {
          console.log("Socket open and ready!");

          ws.onmessage = function(e) {
            window.e = e;
            if (typeof e.data == "string") {
              var json = JSON.parse(e.data);
              console.log(json)

            } else {
              window.reader = new FileReader();
              reader.addEventListener("loadend", function() {
                console.log("Loaded");
                // reader.result contains the contents of blob as a typed array
                window.array = new Uint8Array(reader.result);
                window.imgData = context.getImageData(0, 0, 640, 480);
                console.log(array.length)
                if (type === 'video') {
                  for (var i = 0, l = array.length; i < l; i++) {
                    imgData.data[Math.floor(i / 3) * 4 + (i % 3)] = array[i];
                    imgData.data[Math.floor(i / 3) * 4 + 3] = 255;
                  }
                } else {
                  var max = 0, min = Math.pow(2, 16), accum = 0;
                  for (var i = 0, l = array.length; i < l; i += 2) {
                    var depthIn11Bit = array[i + 1] * Math.pow(2, 8) + array[i];
                    if (depthIn11Bit > max) max = depthIn11Bit;
                    if (depthIn11Bit < min) min = depthIn11Bit;
                    accum += depthIn11Bit;
                    var depthIn8Bit = 255 - Math.max(0, Math.min(255, depthIn11Bit / 8));
                    imgData.data[i * 4 + 0] = depthIn8Bit;
                    imgData.data[i * 4 + 1] = depthIn8Bit;
                    imgData.data[i * 4 + 2] = depthIn8Bit;
                    imgData.data[i * 4 + 3] = 255;
                  }
                  console.log(max, min, accum / array.length)
                }
                context.putImageData(imgData, 0, 0)
                if (playback) ws.send("MOAR PLOX");
              });
              reader.readAsArrayBuffer(e.data);
            }
          };
          ws.send(type === 'video' ? "IMAGES RWAR" : "DAT DEPTH")
        };
      };

      scope.togglePlayback = function(type) {
        playback = !playback;
        if (playback) startPlayback(type);
      }
    }
  });
  app.directive('threejsCanvas', function() {
    return function(scope, element, attrs) {


      if (!Detector.webgl) Detector.addGetWebGLMessage();

      var container, stats;
      var camera, scene, renderer, parameters, i, h, color;
      var mouseX = 0, mouseY = 0;

      var windowHalfX = window.innerWidth / 2;
      var windowHalfY = window.innerHeight / 2;

      init();
      animate();

      function init() {

        container = document.createElement('div');
        document.body.appendChild(container);

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);
        camera.position.z = 200;

        scene = new THREE.Scene();
//        scene.fog = new THREE.FogExp2(0x000000, 0.0007);

        parameters = [
          [
            [1, 1, 0.5],
            5
          ]
        ];

        for (i = 0; i < parameters.length; i++) {

          var color = parameters[i][0];
          var size = parameters[i][1];

          var material = new THREE.ParticleBasicMaterial({ size: size });
          material.color.setHSL( color[0], color[1], color[2] );

          var geometry = new THREE.Geometry();

          for (i = 0; i < 200; i++) {

            var vertex = new THREE.Vector3();
            vertex.x = Math.random() * 100 - 50;
            vertex.y = Math.random() * 100 - 50;
            vertex.z = Math.random() * 100;

            geometry.vertices.push(vertex);

          }

          var particles = new THREE.ParticleSystem(geometry, material);

          particles.rotation.x = Math.random() * 6;
          particles.rotation.y = Math.random() * 6;
          particles.rotation.z = Math.random() * 6;

          scene.add(particles);

        }

        renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);

        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';
        container.appendChild(stats.domElement);

        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('touchstart', onDocumentTouchStart, false);
        document.addEventListener('touchmove', onDocumentTouchMove, false);

        //

        window.addEventListener('resize', onWindowResize, false);
      }

      function onWindowResize() {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }

      function onDocumentMouseMove(event) {
        mouseX = event.clientX - windowHalfX;
        mouseY = event.clientY - windowHalfY;
      }

      function onDocumentTouchStart(event) {
        if (event.touches.length === 1) {
          event.preventDefault();
          mouseX = event.touches[ 0 ].pageX - windowHalfX;
          mouseY = event.touches[ 0 ].pageY - windowHalfY;
        }
      }

      function onDocumentTouchMove(event) {
        if (event.touches.length === 1) {
          event.preventDefault();
          mouseX = event.touches[ 0 ].pageX - windowHalfX;
          mouseY = event.touches[ 0 ].pageY - windowHalfY;
        }
      }

      function animate() {
        requestAnimationFrame(animate);
        render();
        stats.update();
      }

      function render() {
        camera.position.x += ( mouseX - camera.position.x ) * 0.05;
        camera.position.y += ( -mouseY - camera.position.y ) * 0.05;
        camera.lookAt(scene.position);
        renderer.render(scene, camera);
      }
    }
  });


})(angular.module('rubyTestApp', []));
