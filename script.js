/* ============================================================
   GeoElite Sphere — script.js  (Rebuild v2)
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     NAVBAR
     ============================================================ */
  var navbar   = document.getElementById('navbar');
  var navBurger = document.getElementById('navBurger');
  var navLinks  = document.getElementById('navLinks');

  function onNavScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onNavScroll, { passive: true });
  onNavScroll();

  if (navBurger) {
    navBurger.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      navBurger.classList.toggle('open', open);
      navBurger.setAttribute('aria-expanded', open.toString());
      document.body.style.overflow = open ? 'hidden' : '';
    });
  }

  /* Close menu on link click */
  if (navLinks) {
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('open');
        navBurger.classList.remove('open');
        navBurger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* Close menu on outside click */
  document.addEventListener('click', function (e) {
    if (navLinks && navLinks.classList.contains('open') &&
        !navLinks.contains(e.target) && !navBurger.contains(e.target)) {
      navLinks.classList.remove('open');
      navBurger.classList.remove('open');
      navBurger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

  /* ============================================================
     THREE.JS GLOBE
     ============================================================ */
  (function initGlobe() {
    if (typeof THREE === 'undefined') return;

    var canvas = document.getElementById('globeCanvas');
    if (!canvas) return;

    var W = canvas.offsetWidth;
    var H = canvas.offsetHeight;
    if (W === 0 || H === 0) { W = 520; H = 560; }

    /* Scene */
    var scene    = new THREE.Scene();
    var camera   = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 0, 2.8);

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);

    /* Globe sphere */
    var globeGeo = new THREE.SphereGeometry(1, 48, 48);
    var globeMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }
      },
      vertexShader: [
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
        '  vNormal = normalize(normalMatrix * normal);',
        '  vUv = uv;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'uniform float uTime;',
        'const float PI = 3.14159265;',
        'void main() {',
        '  float lat = (vUv.y - 0.5) * PI;',
        '  float lon = (vUv.x - 0.5) * 2.0 * PI;',
        '  float gridLat = abs(sin(lat * 12.0));',
        '  float gridLon = abs(sin(lon * 12.0));',
        '  float grid = smoothstep(0.97, 1.0, max(gridLat, gridLon));',
        '  vec3 baseColor = vec3(0.02, 0.06, 0.14);',
        '  vec3 gridColor = mix(vec3(0.0, 0.56, 0.73), vec3(0.64, 0.51, 0.09), vUv.x);',
        '  vec3 col = mix(baseColor, gridColor * 0.55, grid * 0.6);',
        '  float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);',
        '  rim = pow(rim, 2.5);',
        '  col += vec3(0.0, 0.52, 0.72) * rim * 0.55;',
        '  col += vec3(0.64, 0.51, 0.09) * rim * 0.18;',
        '  gl_FragColor = vec4(col, 0.92);',
        '}'
      ].join('\n'),
      transparent: true
    });
    var globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    /* Atmosphere glow */
    var atmGeo = new THREE.SphereGeometry(1.08, 48, 48);
    var atmMat = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: [
        'varying vec3 vNormal;',
        'void main() {',
        '  vNormal = normalize(normalMatrix * normal);',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vNormal;',
        'void main() {',
        '  float intensity = pow(1.0 - abs(dot(vNormal, vec3(0,0,1))), 3.0);',
        '  gl_FragColor = vec4(0.0, 0.6, 0.8, intensity * 0.35);',
        '}'
      ].join('\n'),
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false
    });
    scene.add(new THREE.Mesh(atmGeo, atmMat));

    /* Star field */
    var starVerts = [];
    for (var i = 0; i < 1500; i++) {
      starVerts.push(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 80
      );
    }
    var starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
    var starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, sizeAttenuation: true, transparent: true, opacity: 0.55 });
    scene.add(new THREE.Points(starGeo, starMat));

    /* Helper: lat/lng → Vec3 */
    function ll2v(lat, lng, r) {
      r = r || 1.01;
      var phi   = (90 - lat)  * Math.PI / 180;
      var theta = (lng + 180) * Math.PI / 180;
      return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
         r * Math.cos(phi),
         r * Math.sin(phi) * Math.sin(theta)
      );
    }

    /* City markers */
    var cities = [
      { lat: 33.9,  lng: 35.5,  name: 'Beirut'  },
      { lat: 24.7,  lng: 46.7,  name: 'Riyadh'  },
      { lat: 33.3,  lng: 44.4,  name: 'Baghdad' },
      { lat: 31.5,  lng: 34.5,  name: 'Gaza'    },
      { lat: 40.7,  lng: -74.0, name: 'New York' },
      { lat: 51.5,  lng: -0.1,  name: 'London'  },
      { lat: 48.8,  lng: 2.3,   name: 'Paris'   },
      { lat: 25.2,  lng: 55.3,  name: 'Dubai'   }
    ];

    var dotGeo = new THREE.SphereGeometry(0.016, 8, 8);
    cities.forEach(function (c) {
      var pos  = ll2v(c.lat, c.lng, 1.02);
      var isLE = (c.name === 'Beirut' || c.name === 'Gaza');
      var mat  = new THREE.MeshBasicMaterial({ color: isLE ? 0xc9a227 : 0x00d4ff });
      var dot  = new THREE.Mesh(dotGeo, mat);
      dot.position.copy(pos);
      scene.add(dot);

      /* Pulse ring */
      var ringGeo = new THREE.RingGeometry(0.022, 0.032, 16);
      var ringMat = new THREE.MeshBasicMaterial({ color: isLE ? 0xc9a227 : 0x00d4ff, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
      var ring    = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(new THREE.Vector3(0, 0, 0));
      ring.userData.pulse = Math.random() * Math.PI * 2;
      scene.add(ring);
    });

    /* Arc curves between city pairs */
    var pairs = [
      [0, 2], [0, 3], [0, 1], [0, 4],
      [1, 7], [4, 5], [4, 6], [0, 5]
    ];
    var arcs = [];

    pairs.forEach(function (pair) {
      var a   = ll2v(cities[pair[0]].lat, cities[pair[0]].lng);
      var b   = ll2v(cities[pair[1]].lat, cities[pair[1]].lng);
      var mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(1.5);
      var curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      var pts   = curve.getPoints(50);
      var geo   = new THREE.BufferGeometry().setFromPoints(pts);
      var mat   = new THREE.LineBasicMaterial({
        color: Math.random() > 0.5 ? 0x00d4ff : 0xc9a227,
        transparent: true,
        opacity: 0.5
      });
      var line = new THREE.Line(geo, mat);
      line.userData.progress = Math.random();
      line.userData.speed    = 0.002 + Math.random() * 0.003;
      arcs.push({ curve: curve, line: line, mat: mat });
      scene.add(line);
    });

    /* Animation */
    var raf = null;
    var clock = new THREE.Clock();

    function animate() {
      raf = requestAnimationFrame(animate);
      var t = clock.getElapsedTime();

      globe.rotation.y += 0.0015;
      globeMat.uniforms.uTime.value = t;

      /* Pulse rings */
      scene.children.forEach(function (obj) {
        if (obj.userData.pulse !== undefined) {
          obj.userData.pulse += 0.04;
          obj.material.opacity = 0.3 + 0.3 * Math.abs(Math.sin(obj.userData.pulse));
          var s = 1 + 0.15 * Math.abs(Math.sin(obj.userData.pulse));
          obj.scale.set(s, s, s);
        }
      });

      /* Arc travel */
      arcs.forEach(function (arc) {
        arc.line.userData.progress += arc.line.userData.speed;
        if (arc.line.userData.progress > 1) arc.line.userData.progress = 0;
        var p = arc.line.userData.progress;
        arc.mat.opacity = 0.2 + 0.35 * Math.sin(p * Math.PI);
      });

      renderer.render(scene, camera);
    }
    animate();

    /* Resize */
    window.addEventListener('resize', function () {
      var nw = canvas.offsetWidth;
      var nh = canvas.offsetHeight;
      if (nw > 0 && nh > 0) {
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      }
    });

    /* Pause when off-screen */
    if ('IntersectionObserver' in window) {
      var heroEl = document.getElementById('hero');
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { if (!raf) animate(); }
          else { cancelAnimationFrame(raf); raf = null; }
        });
      }, { threshold: 0 });
      if (heroEl) obs.observe(heroEl);
    }
  })();

  /* ============================================================
     ANIMATED COUNTERS
     ============================================================ */
  function animateCounter(el, target, dur) {
    var start = performance.now();
    function step(ts) {
      var p    = Math.min((ts - start) / dur, 1);
      var ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(target * ease);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var statEls = document.querySelectorAll('.hstat-n[data-target]');
  var statsStarted = false;

  if (statEls.length && 'IntersectionObserver' in window) {
    var statsObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !statsStarted) {
          statsStarted = true;
          statEls.forEach(function (el) {
            animateCounter(el, parseInt(el.dataset.target, 10), 1800);
          });
          statsObs.disconnect();
        }
      });
    }, { threshold: 0.5 });
    var statsWrap = document.querySelector('.hero-stats');
    if (statsWrap) statsObs.observe(statsWrap);
  } else {
    statEls.forEach(function (el) { el.textContent = el.dataset.target; });
  }

  /* ============================================================
     LEAFLET MAPS — Spatial Intelligence Lab
     ============================================================ */
  var mapInited = [false, false, false, false, false, false];

  /* CartoDB dark tiles */
  var TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  var TILE_OPTS = { attribution: '&copy; OpenStreetMap &copy; CartoDB', subdomains: 'abcd', maxZoom: 19 };

  /* GeoJSON datasets */
  var GEO = {

    /* 0 — Lebanon Municipalities */
    municipalGIS: {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: { name: 'Beirut', type: 'Coastal', pop: 361366 }, geometry: { type: 'Polygon', coordinates: [[[35.48,33.87],[35.56,33.87],[35.56,33.91],[35.48,33.91],[35.48,33.87]]] } },
        { type: 'Feature', properties: { name: 'Tripoli', type: 'Coastal', pop: 229398 }, geometry: { type: 'Polygon', coordinates: [[[35.82,34.43],[35.89,34.43],[35.89,34.47],[35.82,34.47],[35.82,34.43]]] } },
        { type: 'Feature', properties: { name: 'Sidon', type: 'Coastal', pop: 163554 }, geometry: { type: 'Polygon', coordinates: [[[35.36,33.55],[35.41,33.55],[35.41,33.58],[35.36,33.58],[35.36,33.55]]] } },
        { type: 'Feature', properties: { name: 'Zahle', type: 'Inland', pop: 150000 }, geometry: { type: 'Polygon', coordinates: [[[35.88,33.84],[35.92,33.84],[35.92,33.88],[35.88,33.88],[35.88,33.84]]] } },
        { type: 'Feature', properties: { name: 'Baalbek', type: 'Inland', pop: 82000 }, geometry: { type: 'Polygon', coordinates: [[[36.2,34.0],[36.25,34.0],[36.25,34.04],[36.2,34.04],[36.2,34.0]]] } },
        { type: 'Feature', properties: { name: 'Bcharre', type: 'Mountain', pop: 5900 }, geometry: { type: 'Polygon', coordinates: [[[36.00,34.25],[36.05,34.25],[36.05,34.28],[36.00,34.28],[36.00,34.25]]] } },
        { type: 'Feature', properties: { name: 'Beit Mery', type: 'Mountain', pop: 9000 }, geometry: { type: 'Polygon', coordinates: [[[35.59,33.87],[35.62,33.87],[35.62,33.90],[35.59,33.90],[35.59,33.87]]] } }
      ]
    },

    /* 1 — Seismic Risk Zones */
    seismicRisk: {
      zones: { type: 'FeatureCollection', features: [
        { type: 'Feature', properties: { risk: 'High', name: 'Yammouneh Zone' }, geometry: { type: 'Polygon', coordinates: [[[35.70,33.9],[36.00,33.9],[36.00,34.4],[35.70,34.4],[35.70,33.9]]] } },
        { type: 'Feature', properties: { risk: 'Medium', name: 'Mt Lebanon' }, geometry: { type: 'Polygon', coordinates: [[[35.48,33.7],[35.75,33.7],[35.75,34.15],[35.48,34.15],[35.48,33.7]]] } },
        { type: 'Feature', properties: { risk: 'Low', name: 'South Lebanon' }, geometry: { type: 'Polygon', coordinates: [[[35.25,33.0],[35.70,33.0],[35.70,33.5],[35.25,33.5],[35.25,33.0]]] } }
      ]},
      faults: { type: 'FeatureCollection', features: [
        { type: 'Feature', properties: { name: 'Yammouneh Fault', type: 'Major' }, geometry: { type: 'LineString', coordinates: [[35.85,33.7],[35.87,34.0],[35.90,34.3],[35.92,34.6]] } },
        { type: 'Feature', properties: { name: 'Roum Fault', type: 'Secondary' }, geometry: { type: 'LineString', coordinates: [[35.50,33.35],[35.53,33.55],[35.56,33.75]] } }
      ]}
    },

    /* 2 — BIM-GIS Assets */
    bimAssets: {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: { id: 'BIM-001', name: 'Govt Tower A', type: 'Commercial', floors: 18, bimStatus: 'Integrated' }, geometry: { type: 'Point', coordinates: [35.5018, 33.8869] } },
        { type: 'Feature', properties: { id: 'BIM-002', name: 'Civic Center', type: 'Public', floors: 5, bimStatus: 'Integrated' }, geometry: { type: 'Point', coordinates: [35.5064, 33.8893] } },
        { type: 'Feature', properties: { id: 'BIM-003', name: 'Warehouse B', type: 'Industrial', floors: 2, bimStatus: 'Pending' }, geometry: { type: 'Point', coordinates: [35.5125, 33.8842] } },
        { type: 'Feature', properties: { id: 'BIM-004', name: 'Hospital Wing', type: 'Public', floors: 8, bimStatus: 'Review' }, geometry: { type: 'Point', coordinates: [35.4975, 33.8910] } },
        { type: 'Feature', properties: { id: 'BIM-005', name: 'University Hall', type: 'Public', floors: 6, bimStatus: 'Integrated' }, geometry: { type: 'Point', coordinates: [35.4940, 33.8848] } },
        { type: 'Feature', properties: { id: 'BIM-006', name: 'Retail Plaza', type: 'Commercial', floors: 4, bimStatus: 'Pending' }, geometry: { type: 'Point', coordinates: [35.5200, 33.8875] } },
        { type: 'Feature', properties: { id: 'BIM-007', name: 'Residential Tower', type: 'Residential', floors: 22, bimStatus: 'Integrated' }, geometry: { type: 'Point', coordinates: [35.5150, 33.8955] } }
      ]
    },

    /* 3 — Site Selection */
    siteSelection: {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: { name: 'Site Alpha', score: 92, suitability: 'High' }, geometry: { type: 'Polygon', coordinates: [[[35.50,33.88],[35.53,33.88],[35.53,33.91],[35.50,33.91],[35.50,33.88]]] } },
        { type: 'Feature', properties: { name: 'Site Beta', score: 87, suitability: 'High' }, geometry: { type: 'Polygon', coordinates: [[[35.54,33.89],[35.57,33.89],[35.57,33.92],[35.54,33.92],[35.54,33.89]]] } },
        { type: 'Feature', properties: { name: 'Site Gamma', score: 68, suitability: 'Medium' }, geometry: { type: 'Polygon', coordinates: [[[35.46,33.86],[35.49,33.86],[35.49,33.89],[35.46,33.89],[35.46,33.86]]] } },
        { type: 'Feature', properties: { name: 'Site Delta', score: 74, suitability: 'Medium' }, geometry: { type: 'Polygon', coordinates: [[[35.52,33.84],[35.55,33.84],[35.55,33.87],[35.52,33.87],[35.52,33.84]]] } },
        { type: 'Feature', properties: { name: 'Site Epsilon', score: 42, suitability: 'Low' }, geometry: { type: 'Polygon', coordinates: [[[35.48,33.93],[35.51,33.93],[35.51,33.96],[35.48,33.96],[35.48,33.93]]] } }
      ]
    },

    /* 4 — Flood Risk */
    floodRisk: {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: { name: 'Coastal Flood Zone', return: '10yr', risk: 'High' }, geometry: { type: 'Polygon', coordinates: [[[35.44,33.84],[35.52,33.84],[35.52,33.88],[35.44,33.88],[35.44,33.84]]] } },
        { type: 'Feature', properties: { name: 'Wadi Flood Zone', return: '25yr', risk: 'Medium' }, geometry: { type: 'Polygon', coordinates: [[[35.52,33.86],[35.60,33.86],[35.60,33.92],[35.52,33.92],[35.52,33.86]]] } },
        { type: 'Feature', properties: { name: 'Valley Overflow', return: '50yr', risk: 'Medium' }, geometry: { type: 'Polygon', coordinates: [[[35.55,33.82],[35.63,33.82],[35.63,33.86],[35.55,33.86],[35.55,33.82]]] } },
        { type: 'Feature', properties: { name: 'Upland Risk', return: '100yr', risk: 'Low' }, geometry: { type: 'Polygon', coordinates: [[[35.60,33.88],[35.68,33.88],[35.68,33.94],[35.60,33.94],[35.60,33.88]]] } }
      ]
    },

    /* 5 — Waste Routing */
    wasteRouting: {
      routes: { type: 'FeatureCollection', features: [
        { type: 'Feature', properties: { route: 'A', label: 'Route A — Northern Loop' }, geometry: { type: 'LineString', coordinates: [[35.84,34.43],[35.86,34.45],[35.87,34.47],[35.85,34.48],[35.83,34.46]] } },
        { type: 'Feature', properties: { route: 'B', label: 'Route B — Central' }, geometry: { type: 'LineString', coordinates: [[35.85,34.44],[35.87,34.44],[35.88,34.46],[35.86,34.47]] } },
        { type: 'Feature', properties: { route: 'C', label: 'Route C — Southern' }, geometry: { type: 'LineString', coordinates: [[35.84,34.43],[35.86,34.42],[35.88,34.43],[35.87,34.45]] } }
      ]},
      depots: { type: 'FeatureCollection', features: [
        { type: 'Feature', properties: { name: 'Depot North', capacity: 40 }, geometry: { type: 'Point', coordinates: [35.852, 34.465] } },
        { type: 'Feature', properties: { name: 'Depot Central', capacity: 65 }, geometry: { type: 'Point', coordinates: [35.858, 34.445] } },
        { type: 'Feature', properties: { name: 'Landfill', capacity: 200 }, geometry: { type: 'Point', coordinates: [35.880, 34.430] } }
      ]}
    }
  };

  /* Colour helpers */
  function muniColor(type) {
    return type === 'Coastal' ? '#00d4ff' : type === 'Mountain' ? '#4ade80' : '#c9a227';
  }
  function riskColor(r) {
    return r === 'High' ? '#ef4444' : r === 'Medium' ? '#f97316' : '#eab308';
  }
  function bimColor(type) {
    return type === 'Commercial' ? '#00d4ff' : type === 'Residential' ? '#c9a227' : '#4ade80';
  }
  function suitColor(s) {
    return s === 'High' ? '#c9a227' : s === 'Medium' ? '#00d4ff' : '#5a6478';
  }
  function floodColor(r) {
    return r === 'High' ? '#1e40af' : r === 'Medium' ? '#3b82f6' : '#93c5fd';
  }
  function routeColor(r) {
    return r === 'A' ? '#c9a227' : r === 'B' ? '#00d4ff' : '#4ade80';
  }

  /* Build each Leaflet map lazily */
  function buildMap(idx) {
    if (!mapInited[idx]) return;
    if (typeof L === 'undefined') return;

    var el   = document.getElementById('lmap' + idx);
    if (!el) return;

    if (idx === 0) {
      /* Lebanon Municipal GIS */
      var m0 = L.map(el, { zoomControl: true }).setView([33.85, 35.85], 8);
      L.tileLayer(TILES, TILE_OPTS).addTo(m0);
      L.geoJSON(GEO.municipalGIS, {
        style: function (f) { return { color: muniColor(f.properties.type), weight: 2, fillOpacity: 0.3 }; },
        onEachFeature: function (f, layer) {
          layer.bindPopup('<b>' + f.properties.name + '</b><br>Type: ' + f.properties.type + '<br>Pop: ' + f.properties.pop.toLocaleString());
        }
      }).addTo(m0);

    } else if (idx === 1) {
      /* Seismic Risk */
      var m1 = L.map(el, { zoomControl: true }).setView([33.8, 35.8], 8);
      L.tileLayer(TILES, TILE_OPTS).addTo(m1);
      L.geoJSON(GEO.seismicRisk.zones, {
        style: function (f) { return { color: riskColor(f.properties.risk), weight: 1.5, fillOpacity: 0.28 }; },
        onEachFeature: function (f, l) { l.bindPopup('<b>' + f.properties.name + '</b><br>Hazard: ' + f.properties.risk); }
      }).addTo(m1);
      L.geoJSON(GEO.seismicRisk.faults, {
        style: function () { return { color: '#ef4444', weight: 2.5, dashArray: '6 4', opacity: 0.8 }; },
        onEachFeature: function (f, l) { l.bindPopup('<b>' + f.properties.name + '</b><br>' + f.properties.type + ' Fault'); }
      }).addTo(m1);

    } else if (idx === 2) {
      /* BIM-GIS Assets */
      var m2 = L.map(el, { zoomControl: true }).setView([33.889, 35.506], 14);
      L.tileLayer(TILES, TILE_OPTS).addTo(m2);
      L.geoJSON(GEO.bimAssets, {
        pointToLayer: function (f, latlng) {
          return L.circleMarker(latlng, { radius: 9, fillColor: bimColor(f.properties.type), color: '#fff', weight: 1.5, fillOpacity: 0.85 });
        },
        onEachFeature: function (f, l) {
          l.bindPopup('<b>' + f.properties.name + '</b><br>ID: ' + f.properties.id + '<br>Type: ' + f.properties.type + '<br>Floors: ' + f.properties.floors + '<br>BIM: ' + f.properties.bimStatus);
        }
      }).addTo(m2);

    } else if (idx === 3) {
      /* Site Selection */
      var m3 = L.map(el, { zoomControl: true }).setView([33.89, 35.52], 13);
      L.tileLayer(TILES, TILE_OPTS).addTo(m3);
      L.geoJSON(GEO.siteSelection, {
        style: function (f) { return { color: suitColor(f.properties.suitability), weight: 2, fillOpacity: 0.35 }; },
        onEachFeature: function (f, l) {
          l.bindPopup('<b>' + f.properties.name + '</b><br>Score: ' + f.properties.score + '/100<br>Suitability: ' + f.properties.suitability);
        }
      }).addTo(m3);

    } else if (idx === 4) {
      /* Flood Risk */
      var m4 = L.map(el, { zoomControl: true }).setView([33.87, 35.55], 12);
      L.tileLayer(TILES, TILE_OPTS).addTo(m4);
      L.geoJSON(GEO.floodRisk, {
        style: function (f) { return { color: floodColor(f.properties.risk), weight: 2, fillOpacity: 0.4 }; },
        onEachFeature: function (f, l) {
          l.bindPopup('<b>' + f.properties.name + '</b><br>Return period: ' + f.properties.return + '<br>Risk: ' + f.properties.risk);
        }
      }).addTo(m4);

    } else if (idx === 5) {
      /* Waste Routing */
      var m5 = L.map(el, { zoomControl: true }).setView([34.446, 35.862], 14);
      L.tileLayer(TILES, TILE_OPTS).addTo(m5);
      L.geoJSON(GEO.wasteRouting.routes, {
        style: function (f) { return { color: routeColor(f.properties.route), weight: 3.5, opacity: 0.85 }; },
        onEachFeature: function (f, l) { l.bindPopup('<b>' + f.properties.label + '</b>'); }
      }).addTo(m5);
      L.geoJSON(GEO.wasteRouting.depots, {
        pointToLayer: function (f, latlng) {
          return L.circleMarker(latlng, { radius: 10, fillColor: '#c9a227', color: '#fff', weight: 2, fillOpacity: 0.9 });
        },
        onEachFeature: function (f, l) { l.bindPopup('<b>' + f.properties.name + '</b><br>Capacity: ' + f.properties.capacity + ' t/day'); }
      }).addTo(m5);
    }
  }

  /* Map tab switching */
  var mapTabs = document.querySelectorAll('.mtab');
  var mapPanels = document.querySelectorAll('.map-panel');

  mapTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var idx = parseInt(tab.dataset.map, 10);

      mapTabs.forEach(function (t) {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      mapPanels.forEach(function (p) { p.classList.remove('active'); });

      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      var panel = document.getElementById('mapPanel-' + idx);
      if (panel) panel.classList.add('active');

      if (!mapInited[idx]) {
        mapInited[idx] = true;
        buildMap(idx);
      }
    });
  });

  /* Init first map on load */
  mapInited[0] = true;
  buildMap(0);

  /* ============================================================
     SERVICE FILTER
     ============================================================ */
  var sfBtns  = document.querySelectorAll('.sfbtn');
  var svcCards = document.querySelectorAll('.svc-card');

  sfBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var filter = btn.dataset.filter;
      sfBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      svcCards.forEach(function (card) {
        if (filter === 'all' || card.dataset.category === filter) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });

  /* ============================================================
     CASE STUDY MODAL
     ============================================================ */
  var CS_DATA = {
    cs0: {
      badge: 'Remote Sensing',
      title: 'Post-Conflict Satellite Damage Assessment',
      challenge: 'Map structural damage across conflict-affected urban areas quickly enough to guide humanitarian response planning.',
      methodology: [
        'Multi-temporal Maxar and Sentinel-2 imagery acquisition',
        'Change detection using spectral indices (NDVI, NDBI, NBR)',
        'Object-based image analysis (OBIA) for building footprints',
        'Damage classification: Destroyed / Major / Minor / No Damage'
      ],
      deliverables: [
        'Spatial damage extent map (1:5,000 scale)',
        'Building-level damage attribute table',
        'ArcGIS Online humanitarian dashboard',
        'Technical report with methodology and QA/QC notes'
      ],
      tools: ['Maxar WorldView', 'Sentinel-2', 'ArcGIS Pro', 'Python (Rasterio)', 'GDAL', 'ArcGIS Online'],
      impact: 'Damage classification delivered within 72 hours of imagery receipt; supported prioritization of emergency shelter and infrastructure repair across 3 urban zones.'
    },
    cs1: {
      badge: 'Municipal GIS',
      title: 'Solid Waste Management GIS — Al Fayhaa',
      challenge: 'Tripoli municipalities lacked spatial visibility into waste collection routes, bin locations, and service coverage, leading to inefficiencies and resident complaints.',
      methodology: [
        'GPS-based field survey of all waste bins and collection points',
        'Network Analyst routing optimization across municipal boundaries',
        'Service area analysis to identify underserved zones',
        'ArcGIS Dashboards for operational fleet tracking'
      ],
      deliverables: [
        'Georeferenced waste bin inventory (2,400+ features)',
        'Optimized collection route geodatabase',
        'Service area coverage maps by district',
        'Live operational dashboard for supervisors'
      ],
      tools: ['ArcGIS Pro', 'Network Analyst', 'Survey123', 'ArcGIS Dashboards', 'Python', 'Field Maps'],
      impact: 'Route optimization reduced collection time by 22%, uncovered 6 previously unserviced zones, and reduced fuel costs by an estimated 18%.'
    },
    cs2: {
      badge: 'Digital Twin / QA',
      title: 'National Digital Twin QA/QC Training',
      challenge: 'National mapping agency staff needed practical skills to quality-assure digital twin datasets at scale before national deployment.',
      methodology: [
        'Needs assessment and gap analysis of existing QA workflows',
        'Custom Python + GDAL toolkit development for automated checks',
        'Hands-on workshops (topology, attribute completeness, CRS validation)',
        'Competency assessments and certification programme design'
      ],
      deliverables: [
        'Custom QA/QC Python toolkit (open-source)',
        'National QA standards documentation',
        '3-day training curriculum and materials',
        '40+ certified GIS technicians'
      ],
      tools: ['Python', 'GDAL', 'ArcGIS Pro', 'Jupyter Notebooks', 'FME'],
      impact: 'Reduced data error rate in national GIS from 14% to below 2%; training programme adopted as national standard.'
    },
    cs3: {
      badge: 'Land & Parcel GIS',
      title: 'Parcel & Land Screening — US Market',
      challenge: 'Commercial real estate developer required systematic multi-criteria parcel analysis across multiple US counties to identify acquisition targets.',
      methodology: [
        'Parcel data acquisition from county assessor portals',
        'Multi-criteria suitability modeling (zoning, access, area, topography)',
        'Census demographic overlay analysis',
        'Weighted overlay scoring and ranked output'
      ],
      deliverables: [
        'Multi-county parcel GIS database',
        'Suitability score map per county',
        'Top-50 ranked parcel shortlist with attribute summary',
        'Interactive ArcGIS Online viewer'
      ],
      tools: ['ArcGIS Pro', 'Python', 'US Census Data', 'ArcGIS Online', 'Spatial Analyst'],
      impact: 'Screened 84,000 parcels across 7 counties in 2 weeks; client acquired 3 sites from the shortlist within 6 months.'
    },
    cs4: {
      badge: 'Climate Risk',
      title: 'Flood Risk Mapping — Lebanon Coast',
      challenge: 'Coastal municipalities needed a flood hazard assessment for infrastructure resilience planning under climate change scenarios.',
      methodology: [
        '1D/2D HEC-RAS hydraulic modelling with DEM inputs',
        'Multi-scenario analysis: 10yr, 50yr, 100yr, 200yr return periods',
        'Building exposure analysis and loss estimation',
        'Spatial integration with municipal cadastral data'
      ],
      deliverables: [
        'Multi-scenario flood extent rasters',
        'Building exposure and loss estimation database',
        'Resilience action plan with priority investments map',
        'ArcGIS StoryMap for stakeholder communication'
      ],
      tools: ['HEC-RAS', 'ArcGIS Pro', 'Spatial Analyst', 'Python', 'DEM (Copernicus 10m)'],
      impact: 'Identified 1,240 buildings in high-risk zones; flood resilience investments prioritized across 4 coastal municipalities.'
    },
    cs5: {
      badge: 'Seismic GIS',
      title: 'Seismic Hazard & Landslide Susceptibility',
      challenge: 'Infrastructure planning authority required geospatial hazard maps to guide site selection and structural design standards.',
      methodology: [
        'Fault digitization and seismic source characterization',
        'Peak ground acceleration (PGA) interpolation from historical records',
        'Slope, aspect, lithology and land-use analysis for landslide susceptibility',
        'Weighted multi-criteria overlay and hazard classification'
      ],
      deliverables: [
        'Seismic zonation map (4 zones)',
        'Landslide susceptibility raster (5 classes)',
        'Combined geohazard overlay for planning use',
        'Technical GIS report with methodology and data sources'
      ],
      tools: ['ArcGIS Pro', 'QGIS', 'Python', 'Spatial Analyst', 'Geological survey data'],
      impact: 'Hazard maps adopted into national building code revision and used for siting of 3 critical infrastructure projects.'
    },
    cs6: {
      badge: 'BIM-GIS Integration',
      title: 'BIM-GIS Facility Integration',
      challenge: 'Government facility management team could not link building floor plans and asset data to their enterprise GIS, limiting operational intelligence.',
      methodology: [
        'IFC model export from Revit for 12 buildings',
        'FME workspace development for IFC → ArcGIS feature class conversion',
        'ArcGIS Indoors configuration with space categories and occupancy data',
        'Indoor routing network dataset build for wayfinding'
      ],
      deliverables: [
        'ArcGIS Indoors geodatabase for 12 buildings',
        'Indoor/outdoor unified GIS map',
        'FME replication workspace for future updates',
        'Facility manager training (3 days)'
      ],
      tools: ['Autodesk Revit', 'IFC', 'FME', 'ArcGIS Indoors', 'ArcGIS Pro', 'ArcGIS Online'],
      impact: 'Facility management workflow time reduced by 40%; emergency evacuation routing enabled for 14,000 daily occupants.'
    },
    cs7: {
      badge: 'CAD-to-GIS',
      title: 'CAD-to-GIS Municipal Conversion',
      challenge: 'Municipal authority held 20 years of infrastructure data in AutoCAD DWG format with no spatial reference, coordinate system, or topology — unusable for GIS analysis.',
      methodology: [
        'CAD layer audit and feature categorization',
        'Georeferencing using survey control points',
        'Automated Python conversion pipeline (DWG → Shapefile → GDB)',
        'Topology rules creation and automated repair workflows'
      ],
      deliverables: [
        'Enterprise geodatabase with 38 feature classes',
        'Full topology validation report',
        'Python automation scripts for future updates',
        'Metadata catalogue (ISO 19115 standard)'
      ],
      tools: ['AutoCAD', 'Civil 3D', 'ArcGIS Pro', 'Python (ArcPy)', 'FME', 'GDAL'],
      impact: 'Converted 850 DWG files covering 180 km² of municipal infrastructure; municipality gained full GIS operational capability within 4 months.'
    }
  };

  var modal     = document.getElementById('caseModal');
  var modalBox  = modal ? modal.querySelector('.modal-box') : null;
  var modalClose = document.getElementById('modalClose');

  function openModal(id) {
    var data = CS_DATA[id];
    if (!data || !modal) return;

    var delivList = data.deliverables.map(function (d) { return '<li>' + d + '</li>'; }).join('');
    var methList  = data.methodology.map(function (m) { return '<li>' + m + '</li>'; }).join('');
    var toolTags  = data.tools.map(function (t) { return '<span>' + t + '</span>'; }).join('');

    modal.querySelector('#modalBody').innerHTML = [
      '<span class="mb-badge">' + data.badge + '</span>',
      '<h2 class="mb-title">' + data.title + '</h2>',
      '<div class="mb-grid">',
        '<div class="mb-section"><h4>Challenge</h4><p>' + data.challenge + '</p></div>',
        '<div class="mb-section"><h4>Methodology</h4><ul>' + methList + '</ul></div>',
        '<div class="mb-section"><h4>Deliverables</h4><ul>' + delivList + '</ul></div>',
        '<div class="mb-section"><h4>Tools Used</h4><div class="mb-tools">' + toolTags + '</div></div>',
      '</div>',
      '<div class="mb-impact"><h4>Impact</h4><p>' + data.impact + '</p></div>'
    ].join('');

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    if (modalClose) modalClose.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  document.querySelectorAll('.cs-btn, .cs-card').forEach(function (el) {
    el.addEventListener('click', function (e) {
      var id = el.dataset.modal || el.closest('[data-modal]').dataset.modal;
      if (id && CS_DATA[id]) {
        e.stopPropagation();
        openModal(id);
      }
    });
  });

  /* ============================================================
     PUBLICATIONS — search + filter
     ============================================================ */
  var pubCards  = document.querySelectorAll('.pub-card');
  var pfBtns    = document.querySelectorAll('.pfbtn');
  var pubInput  = document.querySelector('.pub-search input');
  var activeType = 'all';
  var searchTerm = '';

  function filterPubs() {
    pubCards.forEach(function (card) {
      var matchType   = activeType === 'all' || card.dataset.ptype === activeType;
      var matchSearch = !searchTerm || card.textContent.toLowerCase().indexOf(searchTerm) !== -1;
      card.classList.toggle('hidden', !(matchType && matchSearch));
    });
  }

  pfBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      pfBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      activeType = btn.dataset.ptype || 'all';
      filterPubs();
    });
  });

  if (pubInput) {
    pubInput.addEventListener('input', function () {
      searchTerm = pubInput.value.toLowerCase().trim();
      filterPubs();
    });
  }

  /* ============================================================
     INTERSECTION OBSERVER — reveal
     ============================================================ */
  if ('IntersectionObserver' in window) {
    var revealEls = document.querySelectorAll('.reveal');
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          revealObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.07, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { revealObs.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('visible'); });
  }

  /* ============================================================
     CONTACT FORM
     ============================================================ */
  var form    = document.getElementById('contactForm');
  var formOK  = document.getElementById('formSuccess');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateForm()) return;

      var btn = form.querySelector('[type="submit"]');
      btn.classList.add('loading');
      btn.disabled = true;

      setTimeout(function () {
        btn.classList.remove('loading');
        btn.disabled = false;
        form.style.display = 'none';
        if (formOK) { formOK.style.display = 'flex'; }
      }, 1400);
    });

    function validateForm() {
      var ok = true;

      var name = form.querySelector('#cf-name');
      setErr(name, name.value.trim().length < 2 ? 'Please enter your full name.' : '');
      if (name.value.trim().length < 2) ok = false;

      var email = form.querySelector('#cf-email');
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      setErr(email, !emailOk ? 'Please enter a valid email address.' : '');
      if (!emailOk) ok = false;

      var svc = form.querySelector('#cf-svc');
      setErr(svc, !svc.value ? 'Please select a service.' : '');
      if (!svc.value) ok = false;

      var msg = form.querySelector('#cf-msg');
      setErr(msg, msg.value.trim().length < 15 ? 'Please provide a brief description (min. 15 chars).' : '');
      if (msg.value.trim().length < 15) ok = false;

      return ok;
    }

    function setErr(input, msg) {
      var g = input.closest('.cform-group');
      var e = g ? g.querySelector('.cferr') : null;
      if (e) {
        e.textContent = msg;
        input.style.borderColor = msg ? 'rgba(248,113,113,.6)' : '';
      }
    }

    form.querySelectorAll('input, select, textarea').forEach(function (el) {
      el.addEventListener('input', function () {
        var g = el.closest('.cform-group');
        var e = g ? g.querySelector('.cferr') : null;
        if (e) { e.textContent = ''; el.style.borderColor = ''; }
      });
    });
  }

  /* ============================================================
     SMOOTH SCROLL FALLBACK
     ============================================================ */
  if (!CSS.supports('scroll-behavior', 'smooth')) {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var t = document.querySelector(a.getAttribute('href'));
        if (!t) return;
        e.preventDefault();
        t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

})();
