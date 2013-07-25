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

  app.factory('KinectServer', function() {
    return {
      jsonCallbacks: [function(json) {
        console.log(json)
      }],
      dataCallbacks: [],
      init: function() {
        var self = this;
        self.ws = new WebSocket("ws://localhost:9002");
        self.ws.onopen = function() {
          console.log("Socket open and ready!");

          self.ws.onmessage = function(e) {
            window.e = e;
            if (typeof e.data == "string") {
              var json = JSON.parse(e.data);
              angular.forEach(self.jsonCallbacks, function(f) {
                f(json);
              });
            } else {
              angular.forEach(self.dataCallbacks, function(f) {
                f(e.data);
              });
            }
          };
          self.moarData();
        };
      },
      moarData: function() {
        this.ws.send("MOAR PLOX");
      }
    }
  });

  app.directive('threejsCanvas', function(KinectServer) {
    return function(scope, element, attrs) {
      if (!Detector.webgl) Detector.addGetWebGLMessage();

      var container, stats;
      var mouseX = 0, mouseY = 0;

      var windowHalfX = window.innerWidth / 2;
      var windowHalfY = window.innerHeight / 2;

      init();
      animate();

      function init() {
        KinectServer.init();

        container = element[0];

        window.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);
        camera.position.z = 600;

        window.scene = new THREE.Scene();
        //        scene.fog = new THREE.FogExp2(0x000000, 0.0007);

        var size = 1.0;

        var material = new THREE.ParticleBasicMaterial({ size: size, vertexColors: true });
        //        material.color.setHSL(0, 50, 50);
        var geometry = new THREE.Geometry();

        for (var i = 0; i < 640 * 480; i++) {
          geometry.vertices.push(new THREE.Vector3());
          geometry.colors.push(new THREE.Color("#ffffff"));
        }

        KinectServer.dataCallbacks.push(function(data) {
          console.log("data!")

          window.reader = new FileReader();
          reader.addEventListener("loadend", function() {
            console.log("Loaded");
            // reader.result contains the contents of blob as a typed array
            window.array = new Uint8Array(reader.result);
            for (var i = 0, l = array.length; i < l; i += 2) {
              var depthIn11Bit = array[i + 1] * Math.pow(2, 8) + array[i];
              var pixelIndex = Math.floor(i / 2);
              var vector = geometry.vertices[pixelIndex];
              vector.x = Math.floor(pixelIndex % 640) - 320;
              vector.y = 240 - Math.floor(pixelIndex / 640);
              if (depthIn11Bit === Math.pow(2, 11) - 1) {
                vector.z = Infinity;
              } else {
                vector.z = (Math.pow(2, 10) - depthIn11Bit);
              }
              geometry.colors[pixelIndex].setHSL(0, 1, 1 - depthIn11Bit / Math.pow(2, 11));
            }
            window.geometry = geometry;
            geometry.verticesNeedUpdate = true;
            geometry.colorsNeedUpdate = true;
          });
          reader.readAsArrayBuffer(data);
          KinectServer.moarData();
        });

        var particles = new THREE.ParticleSystem(geometry, material);
        scene.add(particles);

        window.renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);

        var effect = new THREE.OculusRiftEffect( renderer, {worldScale: 100} );
        effect.setSize( window.innerWidth, window.innerHeight );

        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';
        container.appendChild(stats.domElement);

        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('touchstart', onDocumentTouchStart, false);
        document.addEventListener('touchmove', onDocumentTouchMove, false);

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
        var time = Date.now() * 0.0001;
                camera.position.x += ( mouseX - camera.position.x ) * 0.05;
                camera.position.y += ( -mouseY - camera.position.y ) * 0.05;
                camera.lookAt(scene.position);

//
//        for (var i = 0; i < scene.children.length; i++) {
//          var object = scene.children[ i ];
//          if (object instanceof THREE.ParticleSystem) {
//            object.rotation.y = time * ( i < 4 ? i + 1 : -( i + 1 ) );
//          }
//        }

//        renderer.render(scene, camera);
        effect.render( scene, camera );
      }

    }
  });


})(angular.module('rubyTestApp', []));
