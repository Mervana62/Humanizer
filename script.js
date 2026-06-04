/* ==========================================================================
   GeoElite Sphere — script.js  (Third Rebuild)
   ========================================================================== */
(function () {
  'use strict';

  /* =========================================================================
     NAVBAR — scroll state + mobile menu
     ====================================================================== */
  const navbar   = document.getElementById('navbar');
  const burger   = document.getElementById('navBurger');
  const navLinks = document.getElementById('navLinks');

  window.addEventListener('scroll', function () {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });

  burger.addEventListener('click', function () {
    const isOpen = navLinks.classList.toggle('open');
    burger.setAttribute('aria-expanded', isOpen);
  });

  // Close menu when a nav link is clicked
  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      navLinks.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });

  /* =========================================================================
     INTERSECTION OBSERVER — .reveal elements
     ====================================================================== */
  const revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(function (el) {
    revealObserver.observe(el);
  });

  /* =========================================================================
     USGS EARTHQUAKE API — Live Seismic Intelligence
     ====================================================================== */
  var seismicMap    = null;
  var seismicMarkers = [];

  function initSeismicMap() {
    seismicMap = L.map('seismicMap', {
      center: [20, 0],
      zoom: 2,
      minZoom: 1,
      maxZoom: 8,
      worldCopyJump: true,
      zoomControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(seismicMap);

    fetchUSGSData();
  }

  function magColor(mag) {
    if (mag >= 6)   return '#d73027';
    if (mag >= 5)   return '#f46d43';
    if (mag >= 3)   return '#fdae61';
    return '#fee08b';
  }

  function magSize(mag) {
    if (mag >= 6)   return 20;
    if (mag >= 5)   return 16;
    if (mag >= 3)   return 12;
    return 8;
  }

  function depthClass(depth) {
    if (depth > 300) return { label: 'Deep (>' + depth + ' km)', color: '#ef4444', border: '#dc2626' };
    if (depth > 70)  return { label: 'Intermediate (' + depth + ' km)', color: '#f97316', border: '#ea580c' };
    return            { label: 'Shallow (' + depth + ' km)', color: '#ffd700', border: '#ca8a04' };
  }

  function setSeismicStatus(state, text) {
    var dot  = document.querySelector('#seismicStatus .status-dot');
    var span = document.getElementById('seismicStatusText');
    if (dot)  { dot.className = 'status-dot ' + state; }
    if (span) { span.textContent = text; }
  }

  function fetchUSGSData() {
    setSeismicStatus('loading', 'Connecting to USGS feed…');

    var url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson';

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data.features || data.features.length === 0) {
          throw new Error('No features returned');
        }
        renderSeismicData(data.features);
        var count = data.features.length;
        setSeismicStatus('ok', count + ' events · Past 7 days');
        document.getElementById('seismicFallback').style.display = 'none';
      })
      .catch(function (err) {
        console.warn('USGS fetch error:', err);
        setSeismicStatus('error', 'Feed unavailable');
        document.getElementById('seismicFallback').style.display = 'block';
        renderSeismicError();
      });
  }

  function renderSeismicError() {
    var listEl = document.getElementById('seismicList');
    listEl.innerHTML = '<div class="seismic-error"><strong>Live feed unavailable</strong>The USGS Earthquake API could not be reached from this network. The feed at <code>earthquake.usgs.gov</code> is public and free — data will appear when the endpoint is reachable.</div>';
  }

  function renderSeismicData(features) {
    var listEl = document.getElementById('seismicList');
    listEl.innerHTML = '';

    // Sort by magnitude descending, limit to 50 for performance
    var sorted = features
      .filter(function (f) { return f.geometry && f.geometry.coordinates; })
      .sort(function (a, b) { return (b.properties.mag || 0) - (a.properties.mag || 0) })
      .slice(0, 200);

    // Add markers to map
    sorted.forEach(function (feature) {
      var props = feature.properties;
      var coords = feature.geometry.coordinates;
      var lng = coords[0], lat = coords[1], depth = coords[2] || 0;
      var mag = props.mag || 0;

      if (lat == null || lng == null) return;

      var color  = magColor(mag);
      var size   = magSize(mag);
      var dc     = depthClass(depth);
      var border = dc.border;

      var marker = L.circleMarker([lat, lng], {
        radius:      size / 2,
        fillColor:   color,
        color:       border,
        weight:      1.5,
        opacity:     0.9,
        fillOpacity: 0.75
      });

      var timeStr = props.time ? new Date(props.time).toUTCString().replace(' GMT', ' UTC') : 'Unknown time';
      var place   = props.place || 'Location unknown';

      marker.bindPopup(
        '<strong>M ' + (mag ? mag.toFixed(1) : '?') + ' — ' + place + '</strong>' +
        '<br>Depth: ' + depth.toFixed(1) + ' km (' + (depth > 300 ? 'Deep' : depth > 70 ? 'Intermediate' : 'Shallow') + ')' +
        '<br><small style="color:#8893a8">' + timeStr + '</small>' +
        '<br><small><a href="' + (props.url || '#') + '" target="_blank" rel="noopener" style="color:#00d4ff">USGS Event Page ↗</a></small>',
        { maxWidth: 260 }
      );

      marker.addTo(seismicMap);
      seismicMarkers.push(marker);
    });

    // Render event list (top 40 by magnitude)
    var listItems = sorted.slice(0, 40);
    listItems.forEach(function (feature) {
      var props  = feature.properties;
      var coords = feature.geometry.coordinates;
      var depth  = coords[2] || 0;
      var mag    = props.mag || 0;
      var color  = magColor(mag);
      var dc     = depthClass(depth);

      var timeAgo = '';
      if (props.time) {
        var diff = Date.now() - props.time;
        var hrs  = Math.floor(diff / 3600000);
        if (hrs < 1) { timeAgo = Math.floor(diff / 60000) + ' min ago'; }
        else if (hrs < 24) { timeAgo = hrs + 'h ago'; }
        else { timeAgo = Math.floor(hrs / 24) + 'd ago'; }
      }

      var place = props.place || 'Unknown region';
      if (place.length > 38) { place = place.substring(0, 36) + '…'; }

      var item = document.createElement('div');
      item.className = 'seismic-event';
      item.innerHTML =
        '<div class="se-mag" style="background:' + color + '22;color:' + color + ';border-color:' + color + '">' +
          (mag ? mag.toFixed(1) : '?') +
        '</div>' +
        '<div class="se-info">' +
          '<div class="se-place">' + escapeHTML(place) + '</div>' +
          '<div class="se-time">' + (timeAgo || '') + '</div>' +
        '</div>' +
        '<div class="se-depth" style="color:' + dc.border + '">' +
          depth.toFixed(0) + ' km' +
        '</div>';

      // Click to pan map
      item.addEventListener('click', function () {
        var c = feature.geometry.coordinates;
        seismicMap.setView([c[1], c[0]], 5, { animate: true });
      });
      item.style.cursor = 'pointer';

      listEl.appendChild(item);
    });
  }

  function escapeHTML(str) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
  }

  // Initialize seismic map when section is near viewport
  var seismicInited = false;
  var seismicSection = document.getElementById('seismic');
  if (seismicSection) {
    var seismicWatcher = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && !seismicInited) {
        seismicInited = true;
        initSeismicMap();
        seismicWatcher.disconnect();
      }
    }, { rootMargin: '200px' });
    seismicWatcher.observe(seismicSection);
  }

  /* =========================================================================
     GLOBE.GL — Hero Globe
     ====================================================================== */
  function initGlobe() {
    var mountEl = document.getElementById('globeMount');
    var loadingEl = document.getElementById('globeLoading');

    if (!mountEl || typeof Globe === 'undefined') {
      if (loadingEl) loadingEl.innerHTML = '<p style="color:#5a6580;font-size:0.75rem">Globe unavailable</p>';
      return;
    }

    // Project locations (city markers)
    var cities = [
      { lat: 33.89, lng: 35.50, name: 'Beirut, Lebanon',    type: 'hq' },
      { lat: 24.68, lng: 46.72, name: 'Riyadh, Saudi Arabia', type: 'project' },
      { lat: 25.20, lng: 55.27, name: 'Dubai, UAE',          type: 'project' },
      { lat: 30.06, lng: 31.25, name: 'Cairo, Egypt',        type: 'project' },
      { lat: 31.95, lng: 35.93, name: 'Amman, Jordan',       type: 'project' },
      { lat: 36.19, lng: 37.16, name: 'Aleppo, Syria',       type: 'project' },
      { lat: 15.55, lng: 32.53, name: 'Khartoum, Sudan',     type: 'project' },
      { lat: 33.34, lng: 44.40, name: 'Baghdad, Iraq',       type: 'project' },
      { lat: 48.85, lng:  2.35, name: 'Paris, France',       type: 'partner' },
      { lat: 51.51, lng: -0.13, name: 'London, UK',          type: 'partner' },
    ];

    // Arcs between Beirut and project cities
    var arcs = cities
      .filter(function (c) { return c.type === 'project' || c.type === 'partner'; })
      .map(function (c) {
        return {
          startLat: 33.89, startLng: 35.50,
          endLat:   c.lat,  endLng:   c.lng,
          label:    c.name
        };
      });

    var size = Math.min(mountEl.clientWidth, mountEl.clientHeight) || 480;

    var globe = Globe({ animateIn: true })
      (mountEl)
      .width(size)
      .height(size)
      .backgroundColor('rgba(0,0,0,0)')
      .atmosphereColor('#00d4ff')
      .atmosphereAltitude(0.15)
      .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-dark.jpg')
      // Country polygons from Natural Earth via Globe.gl default
      .hexPolygonsData([])
      .pointsData(cities)
      .pointLat('lat')
      .pointLng('lng')
      .pointColor(function (d) {
        if (d.type === 'hq')      return '#c9a227';
        if (d.type === 'partner') return '#a855f7';
        return '#00d4ff';
      })
      .pointAltitude(function (d) { return d.type === 'hq' ? 0.06 : 0.02; })
      .pointRadius(function (d) { return d.type === 'hq' ? 0.5 : 0.3; })
      .pointLabel(function (d) { return '<div style="font-size:11px;color:#e8edf4;background:rgba(5,16,30,0.9);padding:4px 8px;border-radius:4px;border:1px solid rgba(201,162,39,0.3)">' + d.name + '</div>'; })
      .arcsData(arcs)
      .arcStartLat('startLat').arcStartLng('startLng')
      .arcEndLat('endLat').arcEndLng('endLng')
      .arcColor(function () { return ['rgba(201,162,39,0)', 'rgba(201,162,39,0.7)', 'rgba(0,212,255,0.7)', 'rgba(0,212,255,0)']; })
      .arcDashLength(0.4)
      .arcDashGap(0.15)
      .arcDashAnimateTime(2500)
      .arcStroke(0.4)
      .arcAltitudeAutoScale(0.3);

    // Auto-rotate
    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.4;
    globe.controls().enableZoom = false;

    // Initial camera position — centered over MENA region
    globe.pointOfView({ lat: 26, lng: 35, altitude: 2.2 }, 0);

    // Hide loading indicator
    if (loadingEl) loadingEl.style.display = 'none';

    // Handle resize
    window.addEventListener('resize', function () {
      var s = Math.min(mountEl.clientWidth, mountEl.clientHeight) || 480;
      globe.width(s).height(s);
    }, { passive: true });
  }

  // Init globe after page load
  if (document.readyState === 'complete') {
    initGlobe();
  } else {
    window.addEventListener('load', initGlobe);
  }

  /* =========================================================================
     REMOTE SENSING COMPARISON SLIDER
     ====================================================================== */
  var rsSlider  = document.getElementById('rsSlider');
  var rsAfter   = document.getElementById('rsAfter');
  var rsHandle  = document.getElementById('rsHandle');

  if (rsSlider && rsAfter && rsHandle) {
    var isDragging = false;

    function setSliderPosition(clientX) {
      var rect = rsSlider.getBoundingClientRect();
      var x    = Math.max(0, Math.min(clientX - rect.left, rect.width));
      var pct  = (x / rect.width) * 100;

      rsAfter.style.clipPath  = 'inset(0 ' + (100 - pct).toFixed(1) + '% 0 0)';
      rsHandle.style.left     = pct.toFixed(1) + '%';
      rsHandle.setAttribute('aria-valuenow', Math.round(pct));
    }

    rsHandle.addEventListener('mousedown', function (e) {
      isDragging = true;
      e.preventDefault();
    });
    rsSlider.addEventListener('mousedown', function (e) {
      isDragging = true;
      setSliderPosition(e.clientX);
    });
    window.addEventListener('mousemove', function (e) {
      if (isDragging) setSliderPosition(e.clientX);
    });
    window.addEventListener('mouseup', function () { isDragging = false; });

    // Touch support
    rsHandle.addEventListener('touchstart', function (e) {
      isDragging = true;
      e.preventDefault();
    }, { passive: false });
    rsSlider.addEventListener('touchstart', function (e) {
      isDragging = true;
      setSliderPosition(e.touches[0].clientX);
    }, { passive: true });
    window.addEventListener('touchmove', function (e) {
      if (isDragging) setSliderPosition(e.touches[0].clientX);
    }, { passive: true });
    window.addEventListener('touchend', function () { isDragging = false; });

    // Keyboard support
    rsHandle.addEventListener('keydown', function (e) {
      var rect = rsSlider.getBoundingClientRect();
      var cur  = parseFloat(rsHandle.getAttribute('aria-valuenow') || '50');
      var step = 2;
      if (e.key === 'ArrowLeft')  { setSliderPosition(rect.left + ((cur - step) / 100) * rect.width); }
      if (e.key === 'ArrowRight') { setSliderPosition(rect.left + ((cur + step) / 100) * rect.width); }
    });
  }

  /* =========================================================================
     PUBLICATIONS — search + filter
     ====================================================================== */
  var pubSearch    = document.getElementById('pubSearch');
  var pubGrid      = document.getElementById('pubGrid');
  var pubNoResults = document.getElementById('pubNoResults');
  var filterBtns   = document.querySelectorAll('.pfbtn');
  var activeType   = 'all';

  function filterPublications() {
    var q     = pubSearch ? pubSearch.value.toLowerCase().trim() : '';
    var cards = pubGrid ? pubGrid.querySelectorAll('.pub-card') : [];
    var visible = 0;

    cards.forEach(function (card) {
      var typeMatch = (activeType === 'all') || (card.getAttribute('data-ptype') === activeType);
      var text      = card.textContent.toLowerCase();
      var textMatch = (q === '') || text.includes(q);

      if (typeMatch && textMatch) {
        card.style.display = '';
        visible++;
      } else {
        card.style.display = 'none';
      }
    });

    if (pubNoResults) {
      pubNoResults.style.display = (visible === 0) ? 'block' : 'none';
    }
  }

  if (pubSearch) {
    pubSearch.addEventListener('input', filterPublications);
  }

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      activeType = btn.getAttribute('data-ptype') || 'all';
      filterPublications();
    });
  });

  /* =========================================================================
     TRAINING — course search
     ====================================================================== */
  var courseSearch    = document.getElementById('courseSearch');
  var courseGrid      = document.getElementById('courseGrid');
  var courseNoResults = document.getElementById('courseNoResults');

  if (courseSearch) {
    courseSearch.addEventListener('input', function () {
      var q      = courseSearch.value.toLowerCase().trim();
      var cards  = courseGrid ? courseGrid.querySelectorAll('.course-card') : [];
      var visible = 0;

      cards.forEach(function (card) {
        var haystack = (card.getAttribute('data-course') || '') + ' ' + card.textContent;
        if (q === '' || haystack.toLowerCase().includes(q)) {
          card.style.display = '';
          visible++;
        } else {
          card.style.display = 'none';
        }
      });

      if (courseNoResults) {
        courseNoResults.style.display = (visible === 0) ? 'block' : 'none';
      }
    });
  }

  /* =========================================================================
     CONTACT FORM — client-side validation
     ====================================================================== */
  var contactForm = document.getElementById('contactForm');
  var formSuccess = document.getElementById('formSuccess');

  function clearErrors(form) {
    form.querySelectorAll('.cferr').forEach(function (el) { el.textContent = ''; });
    form.querySelectorAll('input, select, textarea').forEach(function (el) {
      el.style.borderColor = '';
    });
  }

  function showError(fieldId, msg) {
    var field = document.getElementById(fieldId);
    if (!field) return;
    field.style.borderColor = '#ef4444';
    var errEl = field.parentElement.querySelector('.cferr');
    if (errEl) errEl.textContent = msg;
  }

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors(contactForm);

      var name  = document.getElementById('cf-name');
      var email = document.getElementById('cf-email');
      var svc   = document.getElementById('cf-svc');
      var msg   = document.getElementById('cf-msg');
      var valid = true;

      if (!name || name.value.trim().length < 2) {
        showError('cf-name', 'Please enter your full name.');
        valid = false;
      }

      if (!email || !email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        showError('cf-email', 'Please enter a valid email address.');
        valid = false;
      }

      if (!svc || !svc.value) {
        showError('cf-svc', 'Please select a service.');
        valid = false;
      }

      if (!msg || msg.value.trim().length < 10) {
        showError('cf-msg', 'Please describe your project (at least 10 characters).');
        valid = false;
      }

      if (!valid) return;

      // Simulate submit (static site — no backend)
      var submitBtn = contactForm.querySelector('button[type="submit"]');
      var btnTxt    = submitBtn.querySelector('.btn-txt');
      var btnSpin   = submitBtn.querySelector('.btn-spin');

      submitBtn.disabled = true;
      if (btnTxt)  btnTxt.textContent = 'Sending…';
      if (btnSpin) btnSpin.classList.add('active');

      setTimeout(function () {
        submitBtn.disabled = false;
        if (btnTxt)  btnTxt.textContent = 'Send Consultation Request';
        if (btnSpin) btnSpin.classList.remove('active');

        contactForm.style.display = 'none';
        if (formSuccess) formSuccess.style.display = 'flex';

        // mailto fallback — opens mail client with form data
        var nameVal  = name.value.trim();
        var emailVal = email.value.trim();
        var svcVal   = svc.value;
        var msgVal   = msg.value.trim();
        var org      = document.getElementById('cf-org');
        var loc      = document.getElementById('cf-loc');
        var orgVal   = org  ? org.value.trim()  : '';
        var locVal   = loc  ? loc.value.trim()  : '';

        var body = 'Name: ' + nameVal + '\n' +
                   'Email: ' + emailVal + '\n' +
                   (orgVal ? 'Organization: ' + orgVal + '\n' : '') +
                   (locVal ? 'Location: ' + locVal + '\n' : '') +
                   'Service: ' + svcVal + '\n\n' + msgVal;

        window.location.href = 'mailto:info@geoelitesphere.com' +
          '?subject=' + encodeURIComponent('Consultation Request — ' + svcVal) +
          '&body=' + encodeURIComponent(body);
      }, 800);
    });
  }

  /* =========================================================================
     ACTIVE NAV LINK — highlight current section on scroll
     ====================================================================== */
  var sections  = document.querySelectorAll('section[id]');
  var navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');

  function updateActiveNav() {
    var scrollY = window.scrollY + 100;
    var current = '';
    sections.forEach(function (sec) {
      if (sec.offsetTop <= scrollY) current = sec.id;
    });
    navAnchors.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();

})();
