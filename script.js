/* ==========================================================================
   GeoElite Sphere — script.js  V4
   MapLibre GL JS + Globe.gl — no Leaflet dependency
   ========================================================================== */
(function () {
  'use strict';

  /* =========================================================================
     MAPLIBRE DARK BASE STYLE (CartoDB Dark Matter — no API key required)
     ====================================================================== */
  function darkStyle() {
    return {
      version: 8,
      sources: {
        'carto-dark': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions" target="_blank">CARTO</a>'
        }
      },
      layers: [{ id: 'bg', type: 'raster', source: 'carto-dark' }]
    };
  }

  /* =========================================================================
     EMBEDDED DEMO GEOJSON DATA
     All demonstration data is clearly labelled — methodology illustration only.
     Real projects use client-provided or live API-sourced data.
     ====================================================================== */

  /* Lebanon boundary — approximate simplified polygon */
  var LB_BOUNDARY = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: { name: 'Lebanon' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [35.10, 33.05], [35.65, 33.05], [36.10, 33.08],
          [36.62, 33.25], [36.62, 33.90], [36.55, 34.35],
          [36.30, 34.70], [35.90, 34.70], [35.50, 34.65],
          [35.10, 34.48], [35.10, 34.00], [35.10, 33.45],
          [35.10, 33.05]
        ]]
      }
    }]
  };

  /* Lebanon major cities */
  var LB_CITIES = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'Beirut', type: 'capital' },   geometry: { type: 'Point', coordinates: [35.5018, 33.8938] } },
      { type: 'Feature', properties: { name: 'Tripoli', type: 'city' },     geometry: { type: 'Point', coordinates: [35.8499, 34.4367] } },
      { type: 'Feature', properties: { name: 'Sidon', type: 'city' },       geometry: { type: 'Point', coordinates: [35.3711, 33.5601] } },
      { type: 'Feature', properties: { name: 'Tyre', type: 'city' },        geometry: { type: 'Point', coordinates: [35.2038, 33.2705] } },
      { type: 'Feature', properties: { name: 'Zahlé', type: 'city' },       geometry: { type: 'Point', coordinates: [35.9017, 33.8462] } },
      { type: 'Feature', properties: { name: 'Baalbek', type: 'city' },     geometry: { type: 'Point', coordinates: [36.2118, 34.0040] } },
      { type: 'Feature', properties: { name: 'Jounieh', type: 'city' },     geometry: { type: 'Point', coordinates: [35.6177, 33.9803] } },
      { type: 'Feature', properties: { name: 'Nabatieh', type: 'city' },    geometry: { type: 'Point', coordinates: [35.4833, 33.3784] } }
    ]
  };

  /* Infrastructure demo data — Beirut/Lebanon area — OSM tag model illustration */
  var INFRA_POWER_LINES = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { voltage: '220kV', name: 'Zouk–Beddawi line' },
        geometry: { type: 'LineString', coordinates: [[35.60, 33.96], [35.68, 34.05], [35.76, 34.18], [35.84, 34.28], [35.85, 34.44]] } },
      { type: 'Feature', properties: { voltage: '150kV', name: 'Jiyeh–Beirut line' },
        geometry: { type: 'LineString', coordinates: [[35.64, 33.66], [35.58, 33.71], [35.52, 33.82], [35.50, 33.89]] } },
      { type: 'Feature', properties: { voltage: '66kV', name: 'Distribution corridor' },
        geometry: { type: 'LineString', coordinates: [[35.50, 33.89], [35.55, 33.90], [35.58, 33.88], [35.65, 33.88]] } }
    ]
  };

  var INFRA_SUBSTATIONS = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'Zouk substation', voltage: '220kV' },   geometry: { type: 'Point', coordinates: [35.60, 33.96] } },
      { type: 'Feature', properties: { name: 'Beddawi substation', voltage: '150kV' }, geometry: { type: 'Point', coordinates: [35.85, 34.44] } },
      { type: 'Feature', properties: { name: 'Jiyeh power plant', voltage: '220kV' }, geometry: { type: 'Point', coordinates: [35.64, 33.66] } },
      { type: 'Feature', properties: { name: 'Beirut city substation', voltage: '66kV' }, geometry: { type: 'Point', coordinates: [35.50, 33.89] } }
    ]
  };

  var INFRA_ROADS = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'Coastal highway', class: 'primary' },
        geometry: { type: 'LineString', coordinates: [[35.20, 33.27], [35.30, 33.42], [35.37, 33.56], [35.46, 33.74], [35.52, 33.89], [35.62, 34.03], [35.73, 34.15], [35.85, 34.44]] } },
      { type: 'Feature', properties: { name: 'Beirut–Damascus motorway', class: 'primary' },
        geometry: { type: 'LineString', coordinates: [[35.50, 33.89], [35.68, 33.87], [35.85, 33.85], [36.10, 33.82], [36.30, 33.75]] } },
      { type: 'Feature', properties: { name: 'Bekaa valley road', class: 'secondary' },
        geometry: { type: 'LineString', coordinates: [[35.90, 33.85], [35.95, 34.00], [36.05, 34.15], [36.20, 34.40]] } }
    ]
  };

  var INFRA_PORTS = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'Port of Beirut', type: 'port' },   geometry: { type: 'Point', coordinates: [35.5160, 33.9003] } },
      { type: 'Feature', properties: { name: 'Port of Tripoli', type: 'port' },  geometry: { type: 'Point', coordinates: [35.8290, 34.4520] } },
      { type: 'Feature', properties: { name: 'Port of Sidon', type: 'port' },    geometry: { type: 'Point', coordinates: [35.3650, 33.5600] } }
    ]
  };

  var INFRA_TELECOM = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'Telecom exchange – Achrafieh' }, geometry: { type: 'Point', coordinates: [35.5122, 33.8898] } },
      { type: 'Feature', properties: { name: 'Telecom exchange – Tripoli' },   geometry: { type: 'Point', coordinates: [35.8530, 34.4350] } },
      { type: 'Feature', properties: { name: 'Telecom exchange – Sidon' },     geometry: { type: 'Point', coordinates: [35.3720, 33.5600] } },
      { type: 'Feature', properties: { name: 'Mobile tower cluster – Bekaa' },  geometry: { type: 'Point', coordinates: [36.0000, 33.9200] } }
    ]
  };

  /* Municipal GIS demo — small demonstration district (near Jounieh area) */
  function makeParcelGrid(originLon, originLat, cols, rows, cellSize) {
    var features = [];
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var x = originLon + c * cellSize;
        var y = originLat + r * cellSize;
        features.push({
          type: 'Feature',
          properties: { parcel_id: 'P-' + (r * cols + c + 1), zone: r < 2 ? 'Residential' : 'Mixed', area_m2: Math.round(400 + Math.random() * 200) },
          geometry: { type: 'Polygon', coordinates: [[
            [x, y], [x + cellSize * 0.9, y], [x + cellSize * 0.9, y + cellSize * 0.9],
            [x, y + cellSize * 0.9], [x, y]
          ]] }
        });
      }
    }
    return { type: 'FeatureCollection', features: features };
  }

  var MUN_PARCELS   = makeParcelGrid(35.605, 33.960, 6, 5, 0.003);
  var MUN_BUILDINGS = (function () {
    var features = MUN_PARCELS.features.slice(0, 18).map(function (p) {
      var c = p.geometry.coordinates[0];
      var offset = 0.0005;
      var x = c[0][0] + offset; var y = c[0][1] + offset;
      var w = 0.0015; var h = 0.0012;
      return {
        type: 'Feature',
        properties: { name: 'Building ' + p.properties.parcel_id, floors: Math.ceil(Math.random() * 6 + 1) },
        geometry: { type: 'Polygon', coordinates: [[[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]]] }
      };
    });
    return { type: 'FeatureCollection', features: features };
  }());

  var MUN_ROADS = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'Main street' }, geometry: { type: 'LineString', coordinates: [[35.605, 33.960], [35.623, 33.960], [35.623, 33.975]] } },
      { type: 'Feature', properties: { name: 'Cross street 1' }, geometry: { type: 'LineString', coordinates: [[35.605, 33.963], [35.623, 33.963]] } },
      { type: 'Feature', properties: { name: 'Cross street 2' }, geometry: { type: 'LineString', coordinates: [[35.605, 33.969], [35.623, 33.969]] } },
      { type: 'Feature', properties: { name: 'North road' },    geometry: { type: 'LineString', coordinates: [[35.612, 33.960], [35.612, 33.975]] } }
    ]
  };

  var MUN_SERVICES = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { zone: 'Zone A – Residential', coverage: 95 },
        geometry: { type: 'Polygon', coordinates: [[[35.605, 33.960],[35.615,33.960],[35.615,33.970],[35.605,33.970],[35.605,33.960]]] } },
      { type: 'Feature', properties: { zone: 'Zone B – Mixed', coverage: 78 },
        geometry: { type: 'Polygon', coordinates: [[[35.615, 33.960],[35.623,33.960],[35.623,33.970],[35.615,33.970],[35.615,33.960]]] } },
      { type: 'Feature', properties: { zone: 'Zone C – Commercial', coverage: 88 },
        geometry: { type: 'Polygon', coordinates: [[[35.605, 33.970],[35.623,33.970],[35.623,33.975],[35.605,33.975],[35.605,33.970]]] } }
    ]
  };

  var MUN_SURVEY_PTS = (function () {
    var pts = []; var base = [[35.607,33.962],[35.611,33.965],[35.615,33.968],[35.619,33.971],[35.621,33.963],[35.608,33.973]];
    base.forEach(function (c, i) {
      pts.push({ type: 'Feature', properties: { id: 'SP-' + (i+1), status: i < 4 ? 'Completed' : 'Pending' }, geometry: { type: 'Point', coordinates: c } });
    });
    return { type: 'FeatureCollection', features: pts };
  }());

  /* Waste routing demo — Tripoli area */
  var WASTE_ZONES = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { zone: 'Zone 1 – Al Mina', trucks: 3, freq: 'Daily' },
        geometry: { type: 'Polygon', coordinates: [[[35.820,34.430],[35.835,34.430],[35.835,34.455],[35.820,34.455],[35.820,34.430]]] } },
      { type: 'Feature', properties: { zone: 'Zone 2 – Al Zahrieh', trucks: 2, freq: 'Daily' },
        geometry: { type: 'Polygon', coordinates: [[[35.835,34.430],[35.855,34.430],[35.855,34.450],[35.835,34.450],[35.835,34.430]]] } },
      { type: 'Feature', properties: { zone: 'Zone 3 – Bab Al Tabbane', trucks: 2, freq: 'Daily' },
        geometry: { type: 'Polygon', coordinates: [[[35.840,34.450],[35.860,34.450],[35.860,34.465],[35.840,34.465],[35.840,34.450]]] } },
      { type: 'Feature', properties: { zone: 'Zone 4 – Abou Samra', trucks: 2, freq: '3x/week' },
        geometry: { type: 'Polygon', coordinates: [[[35.855,34.440],[35.875,34.440],[35.875,34.460],[35.855,34.460],[35.855,34.440]]] } },
      { type: 'Feature', properties: { zone: 'Zone 5 – El Qobbeh', trucks: 3, freq: 'Daily' },
        geometry: { type: 'Polygon', coordinates: [[[35.820,34.455],[35.840,34.455],[35.840,34.475],[35.820,34.475],[35.820,34.455]]] } },
      { type: 'Feature', properties: { zone: 'Zone 6 – Beddawi', trucks: 2, freq: '3x/week' },
        geometry: { type: 'Polygon', coordinates: [[[35.840,34.465],[35.870,34.465],[35.870,34.490],[35.840,34.490],[35.840,34.465]]] } }
    ]
  };

  var WASTE_ROUTES = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { route: 'R1 – Al Mina loop', km: 11.2 },
        geometry: { type: 'LineString', coordinates: [[35.825,34.455],[35.822,34.450],[35.824,34.440],[35.830,34.435],[35.834,34.440],[35.832,34.450],[35.828,34.453]] } },
      { type: 'Feature', properties: { route: 'R2 – Zahrieh east', km: 9.8 },
        geometry: { type: 'LineString', coordinates: [[35.836,34.450],[35.840,34.445],[35.848,34.435],[35.853,34.437],[35.850,34.445],[35.843,34.448]] } },
      { type: 'Feature', properties: { route: 'R3 – Tabbane circuit', km: 13.4 },
        geometry: { type: 'LineString', coordinates: [[35.843,34.465],[35.850,34.460],[35.856,34.453],[35.852,34.455],[35.845,34.462]] } },
      { type: 'Feature', properties: { route: 'R4 – North circuit', km: 14.1 },
        geometry: { type: 'LineString', coordinates: [[35.845,34.472],[35.850,34.480],[35.855,34.478],[35.860,34.470],[35.862,34.460],[35.858,34.452]] } }
    ]
  };

  var WASTE_TRANSFER = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'Transfer Station – Beddawi (candidate)', capacity_tpd: 250 },
        geometry: { type: 'Point', coordinates: [35.852, 34.476] } }
    ]
  };

  /* Service buffer approximation (circles as polygon) */
  function circlePolygon(lon, lat, radiusDeg, steps) {
    var coords = [];
    for (var i = 0; i <= steps; i++) {
      var a = (i / steps) * 2 * Math.PI;
      coords.push([lon + radiusDeg * Math.cos(a), lat + radiusDeg * Math.sin(a)]);
    }
    return { type: 'Feature', properties: { radius: '500m buffer' },
      geometry: { type: 'Polygon', coordinates: [coords] } };
  }
  var WASTE_BUFFER = {
    type: 'FeatureCollection',
    features: [
      circlePolygon(35.827, 34.450, 0.0045, 32),
      circlePolygon(35.845, 34.442, 0.0045, 32),
      circlePolygon(35.852, 34.458, 0.0045, 32)
    ]
  };

  /* Site selection demo — generic data center screening */
  var SITES_CANDIDATES = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { id: 'S1', score: 88, label: 'High suitability' },
        geometry: { type: 'Polygon', coordinates: [[[35.920,33.830],[35.938,33.830],[35.938,33.845],[35.920,33.845],[35.920,33.830]]] } },
      { type: 'Feature', properties: { id: 'S2', score: 72, label: 'Medium suitability' },
        geometry: { type: 'Polygon', coordinates: [[[35.945,33.820],[35.960,33.820],[35.960,33.835],[35.945,33.835],[35.945,33.820]]] } },
      { type: 'Feature', properties: { id: 'S3', score: 91, label: 'High suitability' },
        geometry: { type: 'Polygon', coordinates: [[[35.930,33.850],[35.948,33.850],[35.948,33.863],[35.930,33.863],[35.930,33.850]]] } },
      { type: 'Feature', properties: { id: 'S4', score: 55, label: 'Low suitability' },
        geometry: { type: 'Polygon', coordinates: [[[35.958,33.840],[35.972,33.840],[35.972,33.855],[35.958,33.855],[35.958,33.840]]] } }
    ]
  };

  var SITES_FLOOD = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { hazard: 'Flood zone – exclude' },
        geometry: { type: 'Polygon', coordinates: [[[35.955,33.830],[35.975,33.830],[35.975,33.858],[35.955,33.858],[35.955,33.830]]] } }
    ]
  };

  var SITES_ROADS = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { class: 'primary', name: 'Access corridor' },
        geometry: { type: 'LineString', coordinates: [[35.905,33.825],[35.920,33.835],[35.940,33.840],[35.960,33.848],[35.980,33.852]] } }
    ]
  };

  var SITES_ENV = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { type: 'Environmental exclusion zone', reason: 'Protected area buffer' },
        geometry: { type: 'Polygon', coordinates: [[[35.905,33.855],[35.930,33.855],[35.930,33.875],[35.905,33.875],[35.905,33.855]]] } }
    ]
  };

  /* Remote sensing demo — Lebanon damage classification markers */
  var RS_MARKERS = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { class: 'Heavily damaged', color: '#ef4444' }, geometry: { type: 'Point', coordinates: [35.520, 33.895] } },
      { type: 'Feature', properties: { class: 'Moderately damaged', color: '#f59e0b' }, geometry: { type: 'Point', coordinates: [35.505, 33.890] } },
      { type: 'Feature', properties: { class: 'No damage', color: '#4ade80' }, geometry: { type: 'Point', coordinates: [35.495, 33.880] } },
      { type: 'Feature', properties: { class: 'Change detected', color: '#a855f7' }, geometry: { type: 'Point', coordinates: [35.510, 33.885] } },
      { type: 'Feature', properties: { class: 'Heavily damaged', color: '#ef4444' }, geometry: { type: 'Point', coordinates: [35.525, 33.888] } },
      { type: 'Feature', properties: { class: 'No damage', color: '#4ade80' }, geometry: { type: 'Point', coordinates: [35.490, 33.900] } }
    ]
  };

  /* RS damage zones */
  var RS_DAMAGE_ZONES = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { severity: 'Severe', description: 'High collapse probability' },
        geometry: { type: 'Polygon', coordinates: [[[35.518,33.892],[35.528,33.892],[35.528,33.900],[35.518,33.900],[35.518,33.892]]] } },
      { type: 'Feature', properties: { severity: 'Moderate', description: 'Structural damage detected' },
        geometry: { type: 'Polygon', coordinates: [[[35.500,33.885],[35.515,33.885],[35.515,33.894],[35.500,33.894],[35.500,33.885]]] } }
    ]
  };

  /* =========================================================================
     STATE
     ====================================================================== */
  var usgsData = null;
  var mapsInit = {};    /* track which GIS Lab maps have been initialised */
  var glabMaps = {};    /* MapLibre map instances for GIS Lab */
  var seismicMap = null; /* standalone section map */
  var seismicGLMap = null; /* GIS Lab seismic map */
  var currentMinMag = 1;

  /* =========================================================================
     NAVBAR
     ====================================================================== */
  var navbar   = document.getElementById('navbar');
  var burger   = document.getElementById('navBurger');
  var navMenu  = document.getElementById('navMenu');

  window.addEventListener('scroll', function () {
    if (window.scrollY > 40) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  });

  if (burger) {
    burger.addEventListener('click', function () {
      var open = navMenu.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
  }

  document.querySelectorAll('.nav-link').forEach(function (link) {
    link.addEventListener('click', function () {
      navMenu.classList.remove('open');
      burger && burger.setAttribute('aria-expanded', 'false');
    });
  });

  /* =========================================================================
     GLOBE.GL — hero 3D globe
     ====================================================================== */
  function initGlobe() {
    var mountEl = document.getElementById('globeMount');
    var loadingEl = document.getElementById('globeLoading');
    if (!mountEl || typeof Globe === 'undefined') return;

    var rect = mountEl.getBoundingClientRect();
    var size = Math.round(Math.min(rect.width, rect.height));
    if (size < 100) size = 480;

    var cityMarkers = [
      { name: 'Beirut',   lat: 33.89, lng: 35.50, size: 0.6, color: '#c9a227' },
      { name: 'Riyadh',   lat: 24.68, lng: 46.72, size: 0.4, color: '#00d4ff' },
      { name: 'Amman',    lat: 31.95, lng: 35.93, size: 0.4, color: '#00d4ff' },
      { name: 'Baghdad',  lat: 33.34, lng: 44.40, size: 0.4, color: '#00d4ff' },
      { name: 'London',   lat: 51.50, lng: -0.13, size: 0.4, color: '#4ade80' },
      { name: 'Paris',    lat: 48.85, lng:  2.35, size: 0.4, color: '#4ade80' },
      { name: 'New York', lat: 40.71, lng: -74.01, size: 0.4, color: '#a855f7' },
      { name: 'Los Angeles', lat: 34.05, lng: -118.24, size: 0.4, color: '#a855f7' }
    ];

    var arcs = cityMarkers.filter(function (c) { return c.name !== 'Beirut'; }).map(function (city) {
      return { startLat: 33.89, startLng: 35.50, endLat: city.lat, endLng: city.lng,
               color: ['rgba(201,162,39,0.8)', 'rgba(0,212,255,0.4)'] };
    });

    var globe = Globe({ animateIn: true })(mountEl)
      .width(size).height(size)
      .backgroundColor('rgba(0,0,0,0)')
      .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-dark.jpg')
      .atmosphereColor('#00d4ff')
      .atmosphereAltitude(0.15)
      .pointsData(cityMarkers)
      .pointLat('lat').pointLng('lng')
      .pointColor('color').pointAltitude(0.01)
      .pointRadius('size').pointResolution(6)
      .pointLabel(function (d) { return d.name; })
      .arcsData(arcs)
      .arcStartLat('startLat').arcStartLng('startLng')
      .arcEndLat('endLat').arcEndLng('endLng')
      .arcColor('color').arcAltitudeAutoScale(0.35)
      .arcDashLength(0.6).arcDashGap(0.4).arcDashAnimateTime(2500)
      .arcStroke(0.4);

    /* Load Natural Earth country boundaries */
    fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        globe
          .polygonsData(data.features)
          .polygonGeoJsonGeometry(function (d) { return d.geometry; })
          .polygonCapColor(function () { return 'rgba(8,22,42,0.7)'; })
          .polygonStrokeColor(function () { return 'rgba(0,212,255,0.22)'; })
          .polygonAltitude(0.003);
        if (loadingEl) loadingEl.style.display = 'none';
      })
      .catch(function () {
        if (loadingEl) loadingEl.style.display = 'none';
      });

    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.5;
  }

  /* Use double requestAnimationFrame to ensure CSS layout is complete */
  requestAnimationFrame(function () {
    requestAnimationFrame(initGlobe);
  });

  /* =========================================================================
     USGS EARTHQUAKE DATA — fetch once, populate both seismic views
     ====================================================================== */
  function depthColor(depth) {
    if (depth < 30)  return '#00d4ff';
    if (depth < 70)  return '#f59e0b';
    return '#ef4444';
  }

  function magClass(mag) {
    if (mag < 3) return 'm-low';
    if (mag < 5) return 'm-mid';
    return 'm-high';
  }

  function formatTime(ts) {
    var d = new Date(ts);
    return d.toISOString().slice(0, 10);
  }

  function fetchUSGS() {
    fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson')
      .then(function (r) {
        if (!r.ok) throw new Error('USGS fetch failed: ' + r.status);
        return r.json();
      })
      .then(function (data) {
        usgsData = data;
        onUSGSLoaded(data);
      })
      .catch(function (err) {
        console.warn('USGS data unavailable:', err.message);
        document.getElementById('seismicFallback') && (document.getElementById('seismicFallback').style.display = 'block');
        var items = [document.getElementById('seismicList'), document.getElementById('glSeisEventItems')];
        items.forEach(function (el) {
          if (el) el.innerHTML = '<li class="sl-loading" style="color:#ef4444">USGS feed unavailable — see earthquake.usgs.gov</li>';
        });
      });
  }

  function onUSGSLoaded(data) {
    var features = data.features;
    var count = features.length;

    /* Hero stat */
    var statEq = document.getElementById('statEq');
    if (statEq) statEq.textContent = count;

    /* Standalone seismic stats */
    var maxMag = 0; var regionCounts = {};
    features.forEach(function (f) {
      var m = f.properties.mag || 0;
      if (m > maxMag) maxMag = m;
      var place = (f.properties.place || '').split(', ').pop();
      regionCounts[place] = (regionCounts[place] || 0) + 1;
    });
    var topRegion = Object.keys(regionCounts).sort(function (a, b) { return regionCounts[b] - regionCounts[a]; })[0] || '—';

    var el = document.getElementById('seisCount2');   if (el) el.textContent = count;
    var em = document.getElementById('seisMax');      if (em) em.textContent = maxMag.toFixed(1);
    var er = document.getElementById('seisRegion');   if (er) er.textContent = topRegion;

    /* Populate event list in standalone section */
    populateEventList(features, document.getElementById('seismicList'), 'list');

    /* Populate GIS Lab seismic event list */
    populateEventList(features, document.getElementById('glSeisEventItems'), 'gel');

    /* Count badge in GIS Lab */
    var sc = document.getElementById('seis-count');
    if (sc) sc.textContent = count + ' events this week (live)';

    /* Add source to seismic map if already initialised */
    updateSeismicMapData();
  }

  function populateEventList(features, container, mode) {
    if (!container) return;
    var sorted = features.slice().sort(function (a, b) { return b.properties.mag - a.properties.mag; }).slice(0, 20);

    if (mode === 'list') {
      container.innerHTML = '';
      sorted.forEach(function (f) {
        var p = f.properties;
        var depth = (f.geometry && f.geometry.coordinates[2]) || 0;
        var li = document.createElement('li');
        li.innerHTML = '<span class="sl-mag">' + (p.mag || '?') + '</span>' +
          '<span class="sl-loc">' + (p.place || 'Unknown') + '</span>' +
          '<span class="sl-dep">' + Math.round(depth) + 'km</span>';
        li.addEventListener('click', function () { panSeismicMap(f); });
        container.appendChild(li);
      });
    } else {
      container.innerHTML = '';
      sorted.slice(0, 10).forEach(function (f) {
        var p = f.properties;
        var depth = (f.geometry && f.geometry.coordinates[2]) || 0;
        var div = document.createElement('div');
        div.className = 'gel-item';
        div.innerHTML = '<div class="gel-mag ' + magClass(p.mag) + '">M' + (p.mag ? p.mag.toFixed(1) : '?') + '</div>' +
          '<div class="gel-loc">' + (p.place || 'Unknown') + '</div>' +
          '<div class="gel-time">' + formatTime(p.time) + ' · ' + Math.round(depth) + 'km</div>';
        div.addEventListener('click', function () { panGLSeismicMap(f); });
        container.appendChild(div);
      });
    }
  }

  function panSeismicMap(feature) {
    if (!seismicMap || !feature.geometry) return;
    var c = feature.geometry.coordinates;
    seismicMap.flyTo({ center: [c[0], c[1]], zoom: 6, speed: 1.2 });
  }

  function panGLSeismicMap(feature) {
    if (!seismicGLMap || !feature.geometry) return;
    var c = feature.geometry.coordinates;
    seismicGLMap.flyTo({ center: [c[0], c[1]], zoom: 6, speed: 1.2 });
  }

  function updateSeismicMapData() {
    if (!usgsData) return;
    [seismicMap, seismicGLMap].forEach(function (map) {
      if (!map) return;
      try {
        if (map.getSource('usgs-quakes')) {
          map.getSource('usgs-quakes').setData(usgsData);
        }
      } catch (e) { /* map not ready yet */ }
    });
  }

  function applyMagnitudeFilter(map, minMag, layerId) {
    if (!map) return;
    try {
      map.setFilter(layerId || 'quakes-circle', ['>=', ['get', 'mag'], minMag]);
    } catch (e) { /* layer not ready */ }
  }

  /* =========================================================================
     MAPLIBRE SEISMIC MAP BUILDER — used for both standalone and GIS Lab
     ====================================================================== */
  function buildSeismicMap(containerId, center, zoom, onReady) {
    var el = document.getElementById(containerId);
    if (!el || typeof maplibregl === 'undefined') return null;

    var map = new maplibregl.Map({
      container: containerId,
      style: darkStyle(),
      center: center || [30, 20],
      zoom: zoom || 1.5,
      attributionControl: true
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', function () {
      /* Lebanon boundary */
      map.addSource('lb-boundary', { type: 'geojson', data: LB_BOUNDARY });
      map.addLayer({ id: 'lb-boundary', type: 'line', source: 'lb-boundary',
        paint: { 'line-color': '#c9a227', 'line-width': 1.5, 'line-opacity': 0.7 } });

      /* Lebanon cities */
      map.addSource('lb-cities', { type: 'geojson', data: LB_CITIES });
      map.addLayer({ id: 'lb-cities', type: 'circle', source: 'lb-cities',
        paint: { 'circle-radius': ['case', ['==', ['get', 'type'], 'capital'], 7, 5],
                 'circle-color': ['case', ['==', ['get', 'type'], 'capital'], '#c9a227', '#00d4ff'],
                 'circle-stroke-color': '#05101e', 'circle-stroke-width': 1.5 } });
      map.addLayer({ id: 'lb-cities-labels', type: 'symbol', source: 'lb-cities',
        layout: { 'text-field': ['get', 'name'], 'text-size': 11, 'text-offset': [0, 1.2],
                  'text-anchor': 'top', 'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'] },
        paint: { 'text-color': '#e2e8f0', 'text-halo-color': '#05101e', 'text-halo-width': 1.5 } });

      /* USGS quake source (empty initially, filled after fetch) */
      map.addSource('usgs-quakes', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'quakes-halo', type: 'circle', source: 'usgs-quakes',
        filter: ['>=', ['get', 'mag'], currentMinMag],
        paint: { 'circle-radius': ['interpolate', ['linear'], ['get', 'mag'], 1, 8, 5, 24, 8, 40],
                 'circle-color': ['case',
                   ['<', ['coalesce', ['get', 'depth'], 0], 30], '#00d4ff',
                   ['<', ['coalesce', ['get', 'depth'], 0], 70], '#f59e0b', '#ef4444'],
                 'circle-opacity': 0.12, 'circle-blur': 0.5 } });
      map.addLayer({ id: 'quakes-circle', type: 'circle', source: 'usgs-quakes',
        filter: ['>=', ['get', 'mag'], currentMinMag],
        paint: { 'circle-radius': ['interpolate', ['linear'], ['get', 'mag'], 1, 4, 5, 12, 8, 22],
                 'circle-color': ['case',
                   ['<', ['coalesce', ['get', 'depth'], 0], 30], '#00d4ff',
                   ['<', ['coalesce', ['get', 'depth'], 0], 70], '#f59e0b', '#ef4444'],
                 'circle-opacity': 0.85, 'circle-stroke-color': 'rgba(255,255,255,0.3)',
                 'circle-stroke-width': 0.8 } });

      /* Popup on click */
      map.on('click', 'quakes-circle', function (e) {
        var f = e.features[0];
        if (!f) return;
        var p = f.properties;
        var depth = f.geometry.coordinates[2] || 'unknown';
        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML('<strong>M' + (p.mag || '?') + '</strong><br>' + (p.place || '') +
                   '<br>Depth: ' + Math.round(depth) + ' km<br>' + formatTime(p.time))
          .addTo(map);
      });
      map.on('mouseenter', 'quakes-circle', function () { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'quakes-circle', function () { map.getCanvas().style.cursor = ''; });

      /* Fill with already-fetched data */
      if (usgsData) map.getSource('usgs-quakes').setData(usgsData);

      if (onReady) onReady(map);
    });

    return map;
  }

  /* =========================================================================
     STANDALONE SEISMIC MAP (section #seismic)
     ====================================================================== */
  (function () {
    var observer = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && !seismicMap) {
        seismicMap = buildSeismicMap('seismicMap', [35.5, 33.9], 6, function (map) {
          /* connect magnitude filter */
          var slider = document.getElementById('seismicMagFilter');
          var valEl  = document.getElementById('seismicMagVal');
          if (slider) {
            slider.addEventListener('input', function () {
              currentMinMag = parseFloat(slider.value);
              if (valEl) valEl.textContent = currentMinMag.toFixed(1);
              applyMagnitudeFilter(seismicMap, currentMinMag, 'quakes-circle');
              applyMagnitudeFilter(seismicMap, currentMinMag, 'quakes-halo');
            });
          }
        });
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    var sec = document.getElementById('seismic');
    if (sec) observer.observe(sec);
  }());

  /* Reset button */
  var seismicReset = document.getElementById('seismicReset');
  if (seismicReset) {
    seismicReset.addEventListener('click', function () {
      if (seismicMap) seismicMap.flyTo({ center: [35.5, 33.9], zoom: 6, speed: 1 });
    });
  }

  /* =========================================================================
     GIS LAB — TAB SYSTEM + LAZY MAP INIT
     ====================================================================== */
  var tabBtns   = document.querySelectorAll('.glt');
  var tabPanels = document.querySelectorAll('.gislab-panel');

  function switchTab(targetMap) {
    tabBtns.forEach(function (b) {
      var active = b.dataset.map === targetMap;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', String(active));
    });
    tabPanels.forEach(function (p) {
      var active = p.id === 'glp-' + targetMap;
      p.classList.toggle('active', active);
      if (active) p.removeAttribute('hidden');
      else p.setAttribute('hidden', '');
    });

    /* Lazy init the map for this tab */
    if (!mapsInit[targetMap]) {
      mapsInit[targetMap] = true;
      setTimeout(function () { initGLMap(targetMap); }, 100);
    } else if (glabMaps[targetMap]) {
      glabMaps[targetMap].resize();
    }
  }

  tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () { switchTab(btn.dataset.map); });
  });

  /* Init seismic tab map (first tab, visible by default) */
  setTimeout(function () { initGLMap('seismic'); mapsInit['seismic'] = true; }, 400);

  function initGLMap(mapKey) {
    switch (mapKey) {
      case 'seismic':   initGLSeismic(); break;
      case 'infra':     initGLInfra(); break;
      case 'municipal': initGLMunicipal(); break;
      case 'waste':     initGLWaste(); break;
      case 'sites':     initGLSites(); break;
      case 'rs':        initGLRS(); break;
    }
  }

  /* --- GIS Lab: Seismic --- */
  function initGLSeismic() {
    seismicGLMap = buildSeismicMap('gl-map-seismic', [35.5, 33.9], 5.5, function (map) {
      glabMaps['seismic'] = map;

      /* magnitude filter */
      var slider = document.getElementById('magFilter');
      var valEl  = document.getElementById('magVal');
      if (slider) {
        slider.addEventListener('input', function () {
          currentMinMag = parseFloat(slider.value);
          if (valEl) valEl.textContent = currentMinMag.toFixed(1);
          applyMagnitudeFilter(seismicGLMap, currentMinMag, 'quakes-circle');
          applyMagnitudeFilter(seismicGLMap, currentMinMag, 'quakes-halo');
        });
      }

      /* layer toggles */
      wireToggle('tog-seismic-quakes',   map, ['quakes-circle', 'quakes-halo']);
      wireToggle('tog-seismic-boundary', map, ['lb-boundary']);
      wireToggle('tog-seismic-cities',   map, ['lb-cities', 'lb-cities-labels']);
    });
  }

  /* --- GIS Lab: Infrastructure --- */
  function initGLInfra() {
    if (typeof maplibregl === 'undefined') return;
    var map = new maplibregl.Map({
      container: 'gl-map-infra', style: darkStyle(),
      center: [35.5, 33.9], zoom: 7,
      attributionControl: true
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    glabMaps['infra'] = map;

    map.on('load', function () {
      addGeoJSONLayer(map, 'infra-roads',       INFRA_ROADS, 'line',
        { 'line-color': '#64748b', 'line-width': 2, 'line-opacity': 0.7 });
      addGeoJSONLayer(map, 'infra-power-lines',  INFRA_POWER_LINES, 'line',
        { 'line-color': '#f59e0b', 'line-width': 2.5, 'line-opacity': 0.85, 'line-dasharray': [4, 2] });
      addGeoJSONLayer(map, 'infra-substations',  INFRA_SUBSTATIONS, 'circle',
        { 'circle-radius': 8, 'circle-color': '#f59e0b', 'circle-stroke-color': '#05101e', 'circle-stroke-width': 2 });
      addGeoJSONLayer(map, 'infra-ports',        INFRA_PORTS, 'circle',
        { 'circle-radius': 9, 'circle-color': '#00d4ff', 'circle-stroke-color': '#05101e', 'circle-stroke-width': 2 });
      addGeoJSONLayer(map, 'infra-telecom',      INFRA_TELECOM, 'circle',
        { 'circle-radius': 6, 'circle-color': '#a855f7', 'circle-stroke-color': '#05101e', 'circle-stroke-width': 1.5 });

      addPopup(map, 'infra-substations', function (p) { return '<strong>' + p.name + '</strong><br>Voltage: ' + p.voltage; });
      addPopup(map, 'infra-ports',       function (p) { return '<strong>' + p.name + '</strong><br>Type: ' + p.type; });
      addPopup(map, 'infra-telecom',     function (p) { return '<strong>' + p.name + '</strong>'; });

      wireToggle('tog-infra-power',       map, ['infra-power-lines']);
      wireToggle('tog-infra-substations', map, ['infra-substations']);
      wireToggle('tog-infra-roads',       map, ['infra-roads']);
      wireToggle('tog-infra-ports',       map, ['infra-ports']);
      wireToggle('tog-infra-telecom',     map, ['infra-telecom']);
    });
  }

  /* --- GIS Lab: Municipal --- */
  function initGLMunicipal() {
    if (typeof maplibregl === 'undefined') return;
    var map = new maplibregl.Map({
      container: 'gl-map-municipal', style: darkStyle(),
      center: [35.614, 33.967], zoom: 14,
      attributionControl: true
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    glabMaps['municipal'] = map;

    map.on('load', function () {
      addGeoJSONLayer(map, 'mun-services', MUN_SERVICES, 'fill',
        { 'fill-color': ['match', ['get', 'zone'],
            'Zone A – Residential', '#4ade80',
            'Zone B – Mixed', '#f59e0b',
            'Zone C – Commercial', '#00d4ff', '#94a3b8'],
          'fill-opacity': 0.15 });
      addGeoJSONLayerOutline(map, 'mun-services-outline', MUN_SERVICES,
        { 'line-color': '#64748b', 'line-width': 1 });
      addGeoJSONLayer(map, 'mun-parcels', MUN_PARCELS, 'fill',
        { 'fill-color': '#112545', 'fill-opacity': 0.5 });
      addGeoJSONLayerOutline(map, 'mun-parcels-outline', MUN_PARCELS,
        { 'line-color': '#c9a227', 'line-width': 0.8, 'line-opacity': 0.6 });
      addGeoJSONLayer(map, 'mun-buildings', MUN_BUILDINGS, 'fill',
        { 'fill-color': '#1e3a5f', 'fill-opacity': 0.85 });
      addGeoJSONLayerOutline(map, 'mun-buildings-outline', MUN_BUILDINGS,
        { 'line-color': '#00d4ff', 'line-width': 1.2 });
      addGeoJSONLayer(map, 'mun-roads', MUN_ROADS, 'line',
        { 'line-color': '#64748b', 'line-width': 3, 'line-opacity': 0.9 });
      addGeoJSONLayer(map, 'mun-survey', MUN_SURVEY_PTS, 'circle',
        { 'circle-radius': 6,
          'circle-color': ['match', ['get', 'status'], 'Completed', '#4ade80', '#f59e0b'],
          'circle-stroke-color': '#05101e', 'circle-stroke-width': 1.5 });

      addPopup(map, 'mun-parcels', function (p) { return 'Parcel: <strong>' + p.parcel_id + '</strong><br>Zone: ' + p.zone + '<br>Area: ' + p.area_m2 + ' m²'; });
      addPopup(map, 'mun-buildings', function (p) { return '<strong>' + p.name + '</strong><br>Floors: ' + p.floors; });
      addPopup(map, 'mun-survey', function (p) { return 'Survey pt: <strong>' + p.id + '</strong><br>Status: ' + p.status; });

      wireToggle('tog-mun-parcels',   map, ['mun-parcels', 'mun-parcels-outline']);
      wireToggle('tog-mun-buildings', map, ['mun-buildings', 'mun-buildings-outline']);
      wireToggle('tog-mun-roads',     map, ['mun-roads']);
      wireToggle('tog-mun-services',  map, ['mun-services', 'mun-services-outline']);
      wireToggle('tog-mun-survey',    map, ['mun-survey']);
    });
  }

  /* --- GIS Lab: Waste Routing --- */
  function initGLWaste() {
    if (typeof maplibregl === 'undefined') return;
    var map = new maplibregl.Map({
      container: 'gl-map-waste', style: darkStyle(),
      center: [35.848, 34.455], zoom: 12.5,
      attributionControl: true
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    glabMaps['waste'] = map;

    var zoneColors = ['#4ade80', '#00d4ff', '#a855f7', '#f59e0b', '#ef4444', '#c9a227'];

    map.on('load', function () {
      addGeoJSONLayer(map, 'waste-buffer', WASTE_BUFFER, 'fill',
        { 'fill-color': '#00d4ff', 'fill-opacity': 0.08 });
      addGeoJSONLayerOutline(map, 'waste-buffer-outline', WASTE_BUFFER,
        { 'line-color': '#00d4ff', 'line-width': 1, 'line-dasharray': [4, 3], 'line-opacity': 0.4 });
      addGeoJSONLayer(map, 'waste-zones', WASTE_ZONES, 'fill',
        { 'fill-color': ['interpolate', ['linear'], ['get', 'trucks'], 2, '#00d4ff', 3, '#f59e0b'],
          'fill-opacity': 0.25 });
      addGeoJSONLayerOutline(map, 'waste-zones-outline', WASTE_ZONES,
        { 'line-color': '#94a3b8', 'line-width': 1.2 });
      addGeoJSONLayer(map, 'waste-routes', WASTE_ROUTES, 'line',
        { 'line-color': '#c9a227', 'line-width': 2.5, 'line-opacity': 0.9 });
      addGeoJSONLayer(map, 'waste-transfer', WASTE_TRANSFER, 'circle',
        { 'circle-radius': 10, 'circle-color': '#ef4444', 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 });

      addPopup(map, 'waste-zones',    function (p) { return '<strong>' + p.zone + '</strong><br>Trucks: ' + p.trucks + '<br>Frequency: ' + p.freq; });
      addPopup(map, 'waste-routes',   function (p) { return '<strong>' + p.route + '</strong><br>Length: ' + p.km + ' km'; });
      addPopup(map, 'waste-transfer', function (p) { return '<strong>' + p.name + '</strong><br>Capacity: ' + p.capacity_tpd + ' t/day'; });

      wireToggle('tog-waste-zones',    map, ['waste-zones', 'waste-zones-outline']);
      wireToggle('tog-waste-routes',   map, ['waste-routes']);
      wireToggle('tog-waste-transfer', map, ['waste-transfer']);
      wireToggle('tog-waste-buffer',   map, ['waste-buffer', 'waste-buffer-outline']);
    });
  }

  /* --- GIS Lab: Site Selection --- */
  function initGLSites() {
    if (typeof maplibregl === 'undefined') return;
    var map = new maplibregl.Map({
      container: 'gl-map-sites', style: darkStyle(),
      center: [35.940, 33.845], zoom: 12,
      attributionControl: true
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    glabMaps['sites'] = map;

    map.on('load', function () {
      addGeoJSONLayer(map, 'sites-flood', SITES_FLOOD, 'fill',
        { 'fill-color': '#00d4ff', 'fill-opacity': 0.2 });
      addGeoJSONLayerOutline(map, 'sites-flood-outline', SITES_FLOOD,
        { 'line-color': '#00d4ff', 'line-width': 1.5, 'line-dasharray': [3, 2] });
      addGeoJSONLayer(map, 'sites-env', SITES_ENV, 'fill',
        { 'fill-color': '#4ade80', 'fill-opacity': 0.15 });
      addGeoJSONLayerOutline(map, 'sites-env-outline', SITES_ENV,
        { 'line-color': '#4ade80', 'line-width': 1.5, 'line-dasharray': [3, 2] });
      addGeoJSONLayer(map, 'sites-roads', SITES_ROADS, 'line',
        { 'line-color': '#64748b', 'line-width': 2.5 });
      addGeoJSONLayer(map, 'sites-candidates', SITES_CANDIDATES, 'fill',
        { 'fill-color': ['interpolate', ['linear'], ['get', 'score'], 50, '#ef4444', 75, '#f59e0b', 90, '#4ade80'],
          'fill-opacity': 0.6 });
      addGeoJSONLayerOutline(map, 'sites-candidates-outline', SITES_CANDIDATES,
        { 'line-color': '#fff', 'line-width': 1.5, 'line-opacity': 0.5 });

      addPopup(map, 'sites-candidates', function (p) { return 'Site <strong>' + p.id + '</strong><br>Score: <strong>' + p.score + '/100</strong><br>' + p.label; });
      addPopup(map, 'sites-flood',      function (p) { return '<strong>' + p.hazard + '</strong>'; });
      addPopup(map, 'sites-env',        function (p) { return '<strong>' + p.type + '</strong><br>' + p.reason; });

      wireToggle('tog-sites-candidates', map, ['sites-candidates', 'sites-candidates-outline']);
      wireToggle('tog-sites-flood',      map, ['sites-flood', 'sites-flood-outline']);
      wireToggle('tog-sites-roads',      map, ['sites-roads']);
      wireToggle('tog-sites-env',        map, ['sites-env', 'sites-env-outline']);
    });
  }

  /* --- GIS Lab: Remote Sensing --- */
  function initGLRS() {
    if (typeof maplibregl === 'undefined') return;
    var map = new maplibregl.Map({
      container: 'gl-map-rs', style: darkStyle(),
      center: [35.510, 33.890], zoom: 12,
      attributionControl: true
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    glabMaps['rs'] = map;

    map.on('load', function () {
      addGeoJSONLayer(map, 'rs-damage', RS_DAMAGE_ZONES, 'fill',
        { 'fill-color': ['match', ['get', 'severity'], 'Severe', '#ef4444', '#f59e0b'],
          'fill-opacity': 0.35 });
      addGeoJSONLayerOutline(map, 'rs-damage-outline', RS_DAMAGE_ZONES,
        { 'line-color': '#ef4444', 'line-width': 1.5 });
      addGeoJSONLayer(map, 'rs-post', RS_MARKERS, 'circle',
        { 'circle-radius': 8, 'circle-color': ['get', 'color'],
          'circle-stroke-color': '#05101e', 'circle-stroke-width': 1.5, 'circle-opacity': 0.85 });

      addPopup(map, 'rs-post',   function (p) { return 'Classification: <strong>' + p['class'] + '</strong>'; });
      addPopup(map, 'rs-damage', function (p) { return '<strong>' + p.severity + '</strong><br>' + p.description; });

      wireToggle('tog-rs-pre',    map, []); /* pre layer is conceptual — base map shows reference */
      wireToggle('tog-rs-post',   map, ['rs-post']);
      wireToggle('tog-rs-damage', map, ['rs-damage', 'rs-damage-outline']);
    });
  }

  /* =========================================================================
     MAPLIBRE HELPERS
     ====================================================================== */
  function addGeoJSONLayer(map, id, data, type, paint) {
    map.addSource(id, { type: 'geojson', data: data });
    map.addLayer({ id: id, type: type, source: id, paint: paint });
  }

  function addGeoJSONLayerOutline(map, id, data, paint) {
    map.addSource(id, { type: 'geojson', data: data });
    map.addLayer({ id: id, type: 'line', source: id, paint: paint });
  }

  function addPopup(map, layerId, htmlFn) {
    map.on('click', layerId, function (e) {
      var f = e.features[0];
      if (!f) return;
      new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(htmlFn(f.properties))
        .addTo(map);
    });
    map.on('mouseenter', layerId, function () { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', layerId, function () { map.getCanvas().style.cursor = ''; });
  }

  function wireToggle(checkboxId, map, layerIds) {
    var cb = document.getElementById(checkboxId);
    if (!cb) return;
    cb.addEventListener('change', function () {
      var vis = cb.checked ? 'visible' : 'none';
      layerIds.forEach(function (lid) {
        try { map.setLayoutProperty(lid, 'visibility', vis); } catch (e) { /* layer may not exist yet */ }
      });
    });
  }

  /* =========================================================================
     REMOTE SENSING COMPARISON SLIDER
     ====================================================================== */
  (function () {
    var slider = document.getElementById('rsSlider');
    var after  = document.getElementById('rsAfter');
    var handle = document.getElementById('rsHandle');
    if (!slider || !after || !handle) return;

    var dragging = false;

    function setSliderPct(pct) {
      pct = Math.max(0, Math.min(100, pct));
      after.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
      handle.style.left = pct + '%';
      handle.setAttribute('aria-valuenow', Math.round(pct));
    }

    function getX(e) {
      return (e.touches ? e.touches[0].clientX : e.clientX);
    }

    function onMove(e) {
      if (!dragging) return;
      e.preventDefault();
      var rect = slider.getBoundingClientRect();
      var pct = ((getX(e) - rect.left) / rect.width) * 100;
      setSliderPct(pct);
    }

    slider.addEventListener('mousedown',  function (e) { dragging = true; onMove(e); });
    slider.addEventListener('touchstart', function (e) { dragging = true; onMove(e); }, { passive: false });
    document.addEventListener('mousemove',  onMove);
    document.addEventListener('touchmove',  onMove, { passive: false });
    document.addEventListener('mouseup',    function () { dragging = false; });
    document.addEventListener('touchend',   function () { dragging = false; });

    slider.addEventListener('keydown', function (e) {
      var pct = parseFloat(after.style.clipPath.replace(/[^0-9.]/g, '') || 50);
      var now = 100 - pct;
      if (e.key === 'ArrowRight') setSliderPct(now + 5);
      if (e.key === 'ArrowLeft')  setSliderPct(now - 5);
    });

    setSliderPct(50);
  }());

  /* =========================================================================
     PROJECT MODALS
     ====================================================================== */
  var MODAL_DATA = {
    1: {
      title: 'Post-Conflict Building Damage Assessment',
      sector: 'Humanitarian / UN-Habitat style engagement',
      challenge: 'Rapid classification of building damage across conflict-affected urban areas for reconstruction planning and aid prioritisation.',
      data: 'Sentinel-2 multispectral imagery (pre/post), Maxar WorldView (where available), cadastral footprints, field validation samples.',
      method: 'OBIA classification per Copernicus EMS GRADE protocol. Sentinel-1 SAR coherence change for areas with cloud cover. Damage severity classified: no damage / minor / moderate / severe / collapsed.',
      deliverables: 'Damage classification GIS dataset, web map dashboard, damage statistics report per neighbourhood, export to UN-OCHA HXIX schema.',
      tools: ['Sentinel-2', 'ArcGIS Image Analyst', 'ENVI', 'SNAP', 'Copernicus EMS', 'ArcGIS Pro', 'Python (GDAL)']
    },
    2: {
      title: 'Municipal GIS & Field Data Collection',
      sector: 'Government / Municipality',
      challenge: 'Build a full municipal GIS system from scratch — no existing spatial data, unreliable paper records, urgent need for infrastructure tracking and field surveys.',
      data: 'Cadastral documents (paper), GPS field survey points, AutoCAD utility network drawings, satellite imagery for building mapping.',
      method: 'Geodatabase schema design → CAD-to-GIS conversion (FME) → Survey123 form deployment → Real-time sync to ArcGIS Enterprise → Dashboard and reporting layer publication.',
      deliverables: 'ArcGIS Enterprise deployment, cadastral GIS layer, utility networks, Survey123 forms, ArcGIS Dashboards for elected officials, field staff web app.',
      tools: ['ArcGIS Enterprise', 'ArcGIS Pro', 'Survey123', 'FME', 'ArcGIS Dashboards', 'ArcGIS Field Maps', 'Python']
    },
    3: {
      title: 'Solid Waste GIS & Route Optimisation',
      sector: 'Municipal / Environment — Al Fayhaa Union of Municipalities',
      challenge: 'Tripoli and Al Fayhaa area had no spatial waste management system. Routes were driven by habit, not optimisation. Transfer station location was unknown.',
      data: 'OSM road network, population density grid, existing collection points (GPS survey), vehicle fleet specifications, waste generation survey data.',
      method: 'Service area analysis → route optimisation (Network Analyst) → transfer station siting (gravity model + land availability) → service coverage gap analysis → KPI dashboard.',
      deliverables: 'Optimised route GIS dataset, transfer station siting report, service coverage analysis, vehicle assignment schedule, web map for operations staff.',
      tools: ['ArcGIS Pro', 'Network Analyst', 'Python', 'QGIS', 'Survey123', 'ArcGIS Online']
    },
    4: {
      title: 'Seismic Hazard & Newmark Displacement',
      sector: 'Geotechnical / Risk Assessment',
      challenge: 'Site-specific landslide susceptibility under earthquake loading for a critical infrastructure corridor in an active seismic zone.',
      data: 'Copernicus DEM GLO-30, USGS ShakeMap PGA values, geological survey lithology, groundwater depth estimates, EMSC historical seismicity catalogue.',
      method: 'DEM → slope analysis → Arias Intensity from PGA (Jibson 2007) → Newmark permanent displacement → susceptibility classification → spatial join to exposed infrastructure.',
      deliverables: 'Newmark displacement map, susceptibility classification (4 classes), GIS geodatabase, technical report with uncertainty bounds, site-specific PSHA recommendations.',
      tools: ['ArcGIS Pro', 'Python', 'USGS ShakeMap', 'OpenQuake Engine', 'QGIS', 'R (statistical validation)']
    },
    5: {
      title: 'InSAR / Sentinel-1 Deformation Mapping',
      sector: 'Remote Sensing / Structural Monitoring',
      challenge: 'Detect and monitor ground deformation and building settlement over a 24-month period following a major loading event, without field access.',
      data: 'Sentinel-1 IW mode SLC acquisitions (descending), precise orbital data, external DEM for topographic phase removal, GPS benchmarks for validation.',
      method: 'Multi-temporal InSAR (PS-InSAR / SBAS) processing chain: co-registration → differential interferogram → unwrapping → deformation time-series → LOS-to-vertical conversion → overlay on building footprints.',
      deliverables: 'Deformation velocity map (LOS and vertical), time-series deformation per point, subsidence hotspot classification, validation against GPS benchmarks, technical report.',
      tools: ['Sentinel-1', 'SNAP', 'StaMPS / MintPy', 'ENVI SARscape', 'ArcGIS Pro', 'Python (numpy, matplotlib)']
    },
    6: {
      title: 'Data Center Site Selection & Suitability',
      sector: 'Infrastructure / Energy / Technology',
      challenge: 'Screen 200+ candidate parcels across a metropolitan area to identify the three highest-suitability sites for a Tier-3 data center facility.',
      data: 'Municipal cadastral layer (client-provided), Copernicus DEM, flood zone layer (JRC Global Surface Water + national hydrology), OSM roads, utility network proximity (client-provided), environmental exclusion (IUCN WDPA).',
      method: 'Multi-criteria suitability analysis: hard constraints (flood zone exclusion, environmental exclusion, slope >5°) → weighted overlay for access, utility proximity, slope, geology → top-3 candidate report.',
      deliverables: 'Suitability score map, top-3 site dossiers (each with full GIS attributes), sensitivity analysis, exclusion zone audit, stakeholder presentation maps.',
      tools: ['ArcGIS Pro', 'Spatial Analyst', 'Python', 'PostGIS', 'QGIS', 'FME']
    },
    7: {
      title: 'CAD-to-GIS Municipal Conversion',
      sector: 'Municipal / Engineering',
      challenge: 'Convert 15 years of AutoCAD cadastral and utility network drawings to an enterprise geodatabase — with topology correction, projection assignment, and schema standardisation.',
      data: '400+ DWG/DXF files (cadastral, water, sewer, electrical), attribute tables in Excel, paper-scanned permit archives.',
      method: 'FME workspace for DWG-to-feature class conversion → topology rules and error correction → coordinate system transformation to national grid → geodatabase schema design → QA/QC Python automation → field update workflow deployment.',
      deliverables: 'Enterprise geodatabase (ArcGIS 10.8+ compatible), 12 feature classes, topology validation report, QA/QC log, documented schema, staff training materials.',
      tools: ['ArcGIS Pro', 'FME Workbench', 'AutoCAD Map 3D', 'Python / GDAL', 'ArcGIS Enterprise', 'Excel → CSV pipeline']
    },
    8: {
      title: '3D Terrain Modelling & Earthworks',
      sector: 'Civil Engineering / GIS',
      challenge: 'Calculate accurate cut/fill volumes and visualise proposed earthworks for a 12 ha site development, integrating Civil 3D design surfaces with GIS terrain analysis.',
      data: 'AutoCAD Civil 3D design surface (DXF TIN), Topographic survey points (GPS), Drone photogrammetry point cloud (LAS), national DEM for context.',
      method: 'Civil 3D surface → FME export to TIN geodataset → ArcGIS Pro 3D Analyst cut/fill analysis → volume calculation grid → 3D scene for client presentation → difference raster for visual cut/fill map.',
      deliverables: '3D terrain model, cut/fill volume report, earthwork zone classification map, ArcGIS Pro 3D scene, client-ready PDF layout, raw volume tables by design zone.',
      tools: ['ArcGIS Pro 3D Analyst', 'Civil 3D', 'FME Workbench', 'LAS Dataset', 'QGIS (QChainage)', 'Drone photogrammetry (Agisoft)']
    }
  };

  var overlay    = document.getElementById('modalOverlay');
  var closeBtn   = document.getElementById('modalClose');
  var contentEl  = document.getElementById('modalContent');

  function openModal(id) {
    var d = MODAL_DATA[id];
    if (!d || !overlay) return;
    contentEl.innerHTML =
      '<h2>' + d.title + '</h2>' +
      '<span class="mc-sector">' + d.sector + '</span>' +
      '<div class="mc-grid">' +
        '<div class="mc-block"><h4>Challenge</h4><p>' + d.challenge + '</p></div>' +
        '<div class="mc-block"><h4>Data Sources</h4><p>' + d.data + '</p></div>' +
        '<div class="mc-block"><h4>Methodology</h4><p>' + d.method + '</p></div>' +
        '<div class="mc-block"><h4>Deliverables</h4><p>' + d.deliverables + '</p></div>' +
      '</div>' +
      '<div class="mc-tools-row">' + d.tools.map(function (t) { return '<span>' + t + '</span>'; }).join('') + '</div>';
    overlay.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeModal() {
    if (!overlay) return;
    overlay.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  if (closeBtn)  closeBtn.addEventListener('click', closeModal);
  if (overlay)   overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  document.querySelectorAll('.pc-open').forEach(function (btn) {
    btn.addEventListener('click', function () { openModal(parseInt(btn.dataset.modal, 10)); });
  });

  /* =========================================================================
     PUBLICATIONS DATA & RENDERING
     ====================================================================== */
  var PUBS = [
    { title: 'GIS-Based Newmark Displacement Model for Seismic Landslide Susceptibility in Lebanon',
      authors: 'Mervana Mograby, Dr. Amal Iaaly',
      type: 'Journal', year: 2024,
      abstract: 'Integration of USGS ShakeMap PGA, Copernicus DEM slope analysis, and Jibson (2007) Arias Intensity relationships for probabilistic Newmark permanent displacement mapping of seismically induced landslides.',
      status: 'Peer-review targeted — Natural Hazards & Earth System Sciences',
      topics: ['Seismic Hazard', 'Landslide Susceptibility', 'GIS Analysis'] },
    { title: 'Multi-Temporal InSAR for Post-Earthquake Deformation Monitoring in Urban Environments',
      authors: 'Mervana Mograby',
      type: 'Manuscript', year: 2024,
      abstract: 'PS-InSAR and SBAS time-series analysis using Sentinel-1 ascending and descending passes for vertical and east-west deformation decomposition over an urban area subjected to seismic loading.',
      status: 'Manuscript in preparation',
      topics: ['Remote Sensing', 'Seismic Hazard', 'SAR/InSAR'] },
    { title: 'Building Damage Classification from Sentinel-2 and SAR Coherence: A Comparative OBIA Study',
      authors: 'Mervana Mograby',
      type: 'Conference', year: 2023,
      abstract: 'Comparison of object-based image analysis workflows using Sentinel-2 multispectral data versus Sentinel-1 SAR coherence for post-disaster building damage mapping per Copernicus EMS GRADE classification.',
      status: 'Presented — EGU General Assembly 2023',
      topics: ['Remote Sensing', 'Seismic Hazard', 'OBIA'] },
    { title: 'Solid Waste Management GIS: A Route Optimisation Framework for Mid-Size Lebanese Municipalities',
      authors: 'Mervana Mograby, Dr. Amal Iaaly',
      type: 'Report', year: 2023,
      abstract: 'Methodology and results of a full GIS-based solid waste management system for Al Fayhaa Union of Municipalities: service area analysis, vehicle routing, transfer station siting, and coverage gap assessment.',
      status: 'Technical report — Al Fayhaa Union of Municipalities',
      topics: ['Municipal GIS', 'Solid Waste GIS', 'Route Optimisation'] },
    { title: 'National Spatial Data Infrastructure and SDG Monitoring: Lessons from the Arab Region',
      authors: 'Dr. Amal Iaaly',
      type: 'Journal', year: 2022,
      abstract: 'Framework for integrating national GIS infrastructure with SDG indicator monitoring systems in Arab League member states, with focus on geospatial data governance and ESCWA capacity building programmes.',
      status: 'Published — Regional Statistics Journal, ESCWA',
      topics: ['Municipal GIS', 'SDG Monitoring', 'GeoAI Strategy'] },
    { title: 'IFC-to-GIS Integration Pipeline for ArcGIS Enterprise and Indoors Deployments',
      authors: 'Mervana Mograby, Dr. Amal Iaaly',
      type: 'Manuscript', year: 2024,
      abstract: 'End-to-end FME-based transformation pipeline from ISO 16739 IFC 4.x models to ArcGIS Enterprise feature classes, with georeferencing, COBie attribute mapping, and ArcGIS Indoors Indoor Positioning System (IPS) configuration.',
      status: 'Manuscript in preparation — International Journal of Digital Earth',
      topics: ['BIM-GIS', 'Digital Twins', 'ArcGIS Enterprise'] },
    { title: 'GeoAI for Road Network Extraction from Sentinel-2 in Data-Scarce Environments',
      authors: 'Mervana Mograby',
      type: 'Conference', year: 2023,
      abstract: 'U-Net convolutional neural network trained on Google Earth Engine Sentinel-2 composites for automated road network extraction in areas lacking current OSM coverage, with post-processing topological correction.',
      status: 'Peer-review targeted — ISPRS Annals',
      topics: ['GeoAI', 'Remote Sensing', 'Deep Learning'] },
    { title: 'Municipal GIS Implementation: A Practical Framework for Lebanese Municipalities',
      authors: 'Dr. Amal Iaaly',
      type: 'Report', year: 2022,
      abstract: 'Step-by-step implementation guide for municipal GIS system deployment covering geodatabase schema design, cadastral data migration, Survey123 field collection workflows, and ArcGIS Dashboards for civic reporting.',
      status: 'Technical guide — GeoElite Sphere internal publication',
      topics: ['Municipal GIS', 'Cadastre', 'ArcGIS Enterprise'] }
  ];

  var pubGrid     = document.getElementById('pubGrid');
  var pubSearch   = document.getElementById('pubSearch');
  var pubNoRes    = document.getElementById('pubNoResults');
  var pubTypeBtns = document.querySelectorAll('.ptb');
  var activeType  = 'all';

  function renderPubs() {
    if (!pubGrid) return;
    var query = pubSearch ? pubSearch.value.toLowerCase() : '';
    var filtered = PUBS.filter(function (p) {
      var typeOk = activeType === 'all' || p.type === activeType;
      var searchOk = !query || (p.title + p.authors + p.abstract + p.topics.join(' ')).toLowerCase().includes(query);
      return typeOk && searchOk;
    });

    if (filtered.length === 0) {
      pubGrid.innerHTML = '';
      if (pubNoRes) pubNoRes.style.display = 'block';
      return;
    }
    if (pubNoRes) pubNoRes.style.display = 'none';

    pubGrid.innerHTML = filtered.map(function (p) {
      return '<article class="pub-card" role="listitem">' +
        '<div class="pub-card-head">' +
          '<h3>' + p.title + '</h3>' +
          '<span class="pub-type-badge pub-' + p.type.toLowerCase() + '">' + p.type + '</span>' +
        '</div>' +
        '<p class="pub-authors">' + p.authors + '</p>' +
        '<p class="pub-abstract">' + p.abstract + '</p>' +
        '<div class="pub-footer">' +
          '<span class="pub-year">' + p.year + '</span>' +
          '<span class="pub-status">' + p.status + '</span>' +
          '<div class="pub-topics">' + p.topics.map(function (t) { return '<span>' + t + '</span>'; }).join('') + '</div>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  if (pubSearch) pubSearch.addEventListener('input', renderPubs);
  pubTypeBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      pubTypeBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      activeType = btn.dataset.type;
      renderPubs();
    });
  });
  renderPubs();

  /* =========================================================================
     TRAINING COURSES
     ====================================================================== */
  var COURSES = [
    { title: 'ArcGIS Pro — Professional GIS', level: 'int', color: '#00d4ff', days: 5, format: 'Remote / In-person',
      desc: 'Full ArcGIS Pro competency from data management through spatial analysis, cartography, geodatabase administration, and Python automation.',
      outcomes: ['Advanced spatial analysis and geoprocessing', 'Geodatabase design and management', 'Map production and cartographic workflows', 'Model Builder and Python scripting'],
      tools: ['ArcGIS Pro', 'Python (arcpy)', 'Model Builder', 'ArcGIS Online'],
      search: 'arcgis pro spatial analysis geoprocessing cartography python arcpy' },
    { title: 'ArcGIS Enterprise Administration', level: 'adv', color: '#ef4444', days: 4, format: 'Remote / Workshop',
      desc: 'On-premises and cloud ArcGIS Enterprise architecture, portal configuration, security hardening, federated server deployment, and performance tuning.',
      outcomes: ['Deploy and configure ArcGIS Enterprise base deployment', 'Configure portal authentication (SAML, PKI, AD)', 'Federate ArcGIS Server and GeoAnalytics Server', 'Monitor and tune for production load'],
      tools: ['ArcGIS Enterprise', 'ArcGIS Server', 'Portal for ArcGIS', 'Python (arcgis)'],
      search: 'arcgis enterprise administration server portal deployment security' },
    { title: 'BIM-GIS Integration', level: 'adv', color: '#a855f7', days: 3, format: 'Remote / Workshop',
      desc: 'End-to-end IFC/BIM to GIS workflow: export from Revit, transform with FME, load into ArcGIS Enterprise, configure ArcGIS Indoors, and prepare for digital twin integration.',
      outcomes: ['Export and validate IFC models from Revit', 'Build FME workspaces for IFC-to-GDB transformation', 'Configure ArcGIS Indoors dataset and network', 'Publish 3D web scenes from BIM data'],
      tools: ['Revit', 'FME Workbench', 'ArcGIS Pro', 'ArcGIS Indoors', 'Cesium'],
      search: 'bim gis integration ifc revit fme arcgis indoors digital twin' },
    { title: 'GeoAI & Deep Learning Feature Extraction', level: 'adv', color: '#c9a227', days: 4, format: 'Remote',
      desc: 'Practical deep learning workflows for automated geospatial feature extraction: U-Net training, satellite imagery pre-processing, and accuracy assessment.',
      outcomes: ['Pre-process Sentinel-2 for model training', 'Train U-Net / ResNet models in ArcGIS Pro', 'Evaluate model accuracy with confusion matrix', 'Deploy extraction workflows at scale on GEE'],
      tools: ['ArcGIS Image Analyst', 'Google Earth Engine', 'Python (TensorFlow)', 'ArcGIS Pro'],
      search: 'geoai deep learning feature extraction unet sentinel satellite imagery machine learning' },
    { title: 'Remote Sensing & Damage Assessment', level: 'adv', color: '#f59e0b', days: 3, format: 'Remote',
      desc: 'Post-event building damage classification using Sentinel-2, Maxar, and ArcGIS Pro. SAR coherence change for cloud-obscured events.',
      outcomes: ['Process Sentinel-2 and Maxar imagery', 'Compute NDVI, NDWI, NDBI, NBR indices', 'Run supervised OBIA change detection', 'Classify damage severity per Copernicus EMS levels'],
      tools: ['ArcGIS Pro', 'ENVI', 'Sentinel Hub', 'Python', 'SNAP'],
      search: 'remote sensing damage assessment sentinel sar obia copernicus change detection insar' },
    { title: 'QGIS, PostGIS & Python Automation', level: 'beg', color: '#4ade80', days: 4, format: 'Remote',
      desc: 'Open-source GIS stack: QGIS processing models, PostGIS spatial SQL, and Python automation with GDAL/OGR and PyQGIS.',
      outcomes: ['Build QGIS graphical processing models', 'Write PostGIS spatial SQL queries and functions', 'Automate GIS workflows with Python and GDAL', 'Perform batch data conversion with OGR/GDAL'],
      tools: ['QGIS', 'PostGIS', 'Python', 'GDAL / OGR', 'PyQGIS'],
      search: 'qgis postgis python automation gdal ogr pyqgis open source' },
    { title: 'Digital Twin & 3D City Modelling', level: 'adv', color: '#a855f7', days: 3, format: 'Remote / Workshop',
      desc: 'Build and deploy 3D city-scale digital twins using ArcGIS Urban, 3D scene layers, Cesium ion 3D Tiles, and BIM integration pipelines.',
      outcomes: ['Create 3D city models from GIS and BIM data', 'Publish I3S scene layers to ArcGIS Enterprise', 'Configure Cesium ion 3D tileset streaming', 'Integrate IoT sensor feeds into digital twin'],
      tools: ['ArcGIS Urban', 'Cesium ion', 'ArcGIS Enterprise', 'FME', '3D Tiles'],
      search: 'digital twin 3d city modelling arcgis urban cesium 3d tiles bim' },
    { title: 'Municipal GIS & Field Data Collection', level: 'int', color: '#00d4ff', days: 3, format: 'Remote / In-person',
      desc: 'Practical training for municipal GIS officers: geodatabase design, Survey123 form configuration, ArcGIS Field Maps, and Dashboards for civic reporting.',
      outcomes: ['Design a municipal geodatabase schema', 'Configure Survey123 forms with conditional logic', 'Deploy ArcGIS Field Maps offline workflow', 'Build ArcGIS Dashboards for infrastructure status'],
      tools: ['ArcGIS Enterprise', 'Survey123', 'ArcGIS Field Maps', 'ArcGIS Dashboards'],
      search: 'municipal gis field data collection survey123 arcgis dashboards cadastre' }
  ];

  var courseGrid  = document.getElementById('courseGrid');
  var courseSearch = document.getElementById('courseSearch');
  var courseNoRes  = document.getElementById('courseNoResults');

  function renderCourses() {
    if (!courseGrid) return;
    var query = courseSearch ? courseSearch.value.toLowerCase() : '';
    var filtered = COURSES.filter(function (c) {
      return !query || c.search.includes(query) || c.title.toLowerCase().includes(query);
    });

    if (filtered.length === 0) {
      courseGrid.innerHTML = '';
      if (courseNoRes) courseNoRes.style.display = 'block';
      return;
    }
    if (courseNoRes) courseNoRes.style.display = 'none';

    courseGrid.innerHTML = filtered.map(function (c) {
      return '<article class="course-card" role="listitem">' +
        '<div class="cc-bar" style="background:' + c.color + '"></div>' +
        '<div class="cc-body">' +
          '<div class="cc-head">' +
            '<h3>' + c.title + '</h3>' +
            '<span class="cc-lvl ' + c.level + '">' + { beg: 'Beginner', int: 'Intermediate', adv: 'Advanced' }[c.level] + '</span>' +
          '</div>' +
          '<div class="cc-meta"><span>&#9203; ' + c.days + ' Days</span><span>&#128187; ' + c.format + '</span><span>&#128220; Certificate</span></div>' +
          '<p>' + c.desc + '</p>' +
          '<div class="cc-outcomes"><strong>Learning Outcomes</strong><ul>' +
            c.outcomes.map(function (o) { return '<li>' + o + '</li>'; }).join('') +
          '</ul></div>' +
          '<div class="cc-tools">' + c.tools.map(function (t) { return '<span>' + t + '</span>'; }).join('') + '</div>' +
          '<a href="#contact" class="cc-cta">Request Training</a>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  if (courseSearch) courseSearch.addEventListener('input', renderCourses);
  renderCourses();

  /* =========================================================================
     CONTACT FORM
     ====================================================================== */
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;

      ['cf-name', 'cf-email', 'cf-svc', 'cf-msg'].forEach(function (id) {
        var field = document.getElementById(id);
        var errEl = field && field.nextElementSibling;
        if (field && !field.value.trim()) {
          if (errEl) errEl.textContent = 'This field is required.';
          valid = false;
        } else if (field && errEl) {
          errEl.textContent = '';
        }
      });

      var emailField = document.getElementById('cf-email');
      if (emailField && emailField.value && !/.+@.+\..+/.test(emailField.value)) {
        var errEl2 = emailField.nextElementSibling;
        if (errEl2) errEl2.textContent = 'Please enter a valid email address.';
        valid = false;
      }

      if (!valid) return;

      var submitBtn = contactForm.querySelector('[type="submit"]');
      if (submitBtn) submitBtn.setAttribute('data-loading', '');

      /* Compose mailto as fallback — static site, no backend */
      var name    = document.getElementById('cf-name').value;
      var email   = document.getElementById('cf-email').value;
      var service = document.getElementById('cf-svc').value;
      var msg     = document.getElementById('cf-msg').value;
      var subject = encodeURIComponent('GeoElite Sphere enquiry — ' + service);
      var body    = encodeURIComponent('From: ' + name + ' <' + email + '>\n\nService: ' + service + '\n\n' + msg);
      window.location.href = 'mailto:info@geoelitesphere.com?subject=' + subject + '&body=' + body;

      setTimeout(function () {
        if (submitBtn) submitBtn.removeAttribute('data-loading');
        contactForm.style.display = 'none';
        var successEl = document.getElementById('formSuccess');
        if (successEl) successEl.style.display = 'flex';
      }, 800);
    });
  }

  /* =========================================================================
     SCROLL REVEAL (IntersectionObserver)
     ====================================================================== */
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(function (el) {
    revealObserver.observe(el);
  });

  /* =========================================================================
     ACTIVE NAV LINK (scroll-based)
     ====================================================================== */
  var navSections = ['hero','gislab','seismic','infrastructure','remote-sensing','bim-gis','digital-twin','projects','publications','training','books','experts','data-accuracy','contact'];
  var navLinks = document.querySelectorAll('.nav-link[href^="#"]');

  window.addEventListener('scroll', function () {
    var current = '';
    navSections.forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec && window.scrollY >= sec.offsetTop - 100) current = id;
    });
    navLinks.forEach(function (link) {
      var href = link.getAttribute('href').replace('#', '');
      link.classList.toggle('active', href === current);
    });
  }, { passive: true });

  /* =========================================================================
     KICK OFF USGS FETCH
     ====================================================================== */
  fetchUSGS();

}());
