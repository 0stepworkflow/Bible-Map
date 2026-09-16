const PALETTE = {
  parchment: '#FEFAE0',
  lowland: '#FAEDCD',
  midtone: '#E9EDC9',
  highland: '#D4A373',
  water: '#CCD5AE',
  ink: '#283618',
  accent: '#BC6C25',
  waterFill: '#6E96A3',
  waterLine: '#3F5C66'
};

const map = new maplibregl.Map({
  container: 'map',
  center: [35.5, 31.5],
  zoom: 5.5,
  minZoom: 3,
  maxZoom: 12,
  style: {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      terrain: {
        type: 'raster-dem',
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        encoding: 'terrarium',
        tileSize: 256,
        maxzoom: 13
      },
      'water-areas': {
        type: 'geojson',
        data: 'data/water-areas.geojson'
      },
      'water-rivers': {
        type: 'geojson',
        data: 'data/water-rivers.geojson'
      },
      kingdoms: {
        type: 'geojson',
        data: 'data/kingdoms.geojson'
      },
      regions: {
        type: 'geojson',
        data: 'data/regions.geojson'
      },
      seas: {
        type: 'geojson',
        data: 'data/seas.geojson'
      },
      locations: {
        type: 'geojson',
        data: 'data/locations.geojson'
      },
      'route-line': {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      },
      'route-stops': {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      }
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': PALETTE.lowland }
      },
      {
        id: 'hillshade',
        type: 'hillshade',
        source: 'terrain',
        paint: {
          'hillshade-shadow-color': PALETTE.ink,
          'hillshade-highlight-color': PALETTE.parchment,
          'hillshade-accent-color': PALETTE.highland,
          'hillshade-exaggeration': 0.6
        }
      },
      {
        id: 'water-fill',
        type: 'fill',
        source: 'water-areas',
        paint: {
          'fill-color': PALETTE.waterFill,
          'fill-opacity': 0.85
        }
      },
      {
        id: 'water-outline',
        type: 'line',
        source: 'water-areas',
        paint: {
          'line-color': PALETTE.waterLine,
          'line-width': 0.8
        }
      },
      {
        id: 'river-lines',
        type: 'line',
        source: 'water-rivers',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': PALETTE.waterFill,
          'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.8, 8, 2.5]
        }
      },
      {
        id: 'kingdom-fill',
        type: 'fill',
        source: 'kingdoms',
        paint: {
          'fill-color': PALETTE.ink,
          'fill-opacity': 0
        }
      },
      {
        id: 'kingdom-outline',
        type: 'line',
        source: 'kingdoms',
        layout: {
          'line-join': 'round'
        },
        paint: {
          'line-color': PALETTE.ink,
          'line-width': 1.3,
          'line-dasharray': [2, 2],
          'line-opacity': 0
        }
      },
      {
        id: 'region-labels',
        type: 'symbol',
        source: 'regions',
        layout: {
          'text-field': ['upcase', ['get', 'name']],
          'text-font': ['Noto Sans Bold'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 3, 11, 8, 18],
          'text-letter-spacing': 0.08
        },
        paint: {
          'text-color': PALETTE.ink,
          'text-halo-color': PALETTE.lowland,
          'text-halo-width': 1.4
        }
      },
      {
        id: 'sea-labels',
        type: 'symbol',
        source: 'seas',
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Italic'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 3, 10, 8, 15]
        },
        paint: {
          'text-color': PALETTE.ink,
          'text-halo-color': PALETTE.lowland,
          'text-halo-width': 1.4
        }
      },
      {
        id: 'location-points',
        type: 'circle',
        source: 'locations',
        paint: {
          'circle-radius': 8,
          'circle-color': PALETTE.parchment,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': PALETTE.ink,
          'circle-opacity': 1,
          'circle-stroke-opacity': 1
        }
      },
      {
        id: 'route-line-layer',
        type: 'line',
        source: 'route-line',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': PALETTE.accent,
          'line-width': 2.5,
          'line-dasharray': [1, 1.4]
        }
      },
      {
        id: 'route-stops-circle',
        type: 'circle',
        source: 'route-stops',
        paint: {
          'circle-radius': 10,
          'circle-color': PALETTE.accent,
          'circle-stroke-width': 2,
          'circle-stroke-color': PALETTE.parchment
        }
      },
      {
        id: 'route-stops-number',
        type: 'symbol',
        source: 'route-stops',
        layout: {
          'text-field': ['get', 'index'],
          'text-font': ['Noto Sans Bold'],
          'text-size': 12
        },
        paint: {
          'text-color': PALETTE.parchment
        }
      },
      {
        id: 'route-stops-label',
        type: 'symbol',
        source: 'route-stops',
        layout: {
          'text-field': ['format',
            ['get', 'name'], { 'font-scale': 1.05 },
            '\n', {},
            ['get', 'citation'], { 'font-scale': 0.85 }
          ],
          'text-font': ['Noto Sans Bold'],
          'text-size': 12,
          'text-anchor': 'top',
          'text-offset': [0, 1.4]
        },
        paint: {
          'text-color': PALETTE.ink,
          'text-halo-color': PALETTE.parchment,
          'text-halo-width': 1.6
        }
      }
    ]
  }
});

let focusedId = null;
let currentYear = -930;
const FADE_YEARS = 20;

function timelineOpacityExpr(maxOpacity) {
  const distanceOutside = [
    'max',
    ['-', ['get', 'startYear'], currentYear],
    ['-', currentYear, ['get', 'endYear']],
    0
  ];
  return ['interpolate', ['linear'], distanceOutside, 0, maxOpacity, FADE_YEARS, 0];
}

function focusOpacityExpr() {
  return focusedId
    ? ['case', ['==', ['get', 'id'], focusedId], 1, 0.3]
    : 1;
}

function applyFocusStyle() {
  const combined = ['*', timelineOpacityExpr(1), focusOpacityExpr()];
  map.setPaintProperty('location-points', 'circle-opacity', combined);
  map.setPaintProperty('location-points', 'circle-stroke-opacity', combined);
}

function applyTimelineStyles() {
  map.setPaintProperty('kingdom-fill', 'fill-opacity', timelineOpacityExpr(0.12));
  map.setPaintProperty('kingdom-outline', 'line-opacity', timelineOpacityExpr(0.85));
  map.setPaintProperty('region-labels', 'text-opacity', timelineOpacityExpr(1));
  applyFocusStyle();
}

function formatYear(year) {
  return year < 0 ? Math.abs(year) + ' BC' : 'AD ' + Math.max(year, 1);
}

function openInfoPanel(props) {
  document.getElementById('info-back').classList.add('hidden');
  document.getElementById('info-bullets').classList.add('hidden');
  document.getElementById('info-bullets').innerHTML = '';

  document.getElementById('info-category').textContent = props.category;
  document.getElementById('info-name').textContent = props.name;
  document.getElementById('info-summary').textContent = props.summary;
  document.getElementById('info-reference').textContent = 'Read more: ' + props.reference;

  const timeline = JSON.parse(props.timeline);
  const timelineEl = document.getElementById('info-timeline');
  timelineEl.innerHTML = '';
  timeline.forEach(function (item) {
    const div = document.createElement('div');
    div.className = 'timeline-item';
    div.textContent = item.date + ' — ' + item.label;
    timelineEl.appendChild(div);
  });

  document.getElementById('info-panel').classList.remove('hidden');
}

let focusLevel = 0;
let activePerson = null;
const EMPTY_FC = { type: 'FeatureCollection', features: [] };

function buildRouteGeoJSON(route) {
  const lineFeature = {
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates: route.map(function (s) { return [s.lng, s.lat]; }) }
  };
  const stopFeatures = route.map(function (stop, i) {
    return {
      type: 'Feature',
      properties: {
        id: stop.id,
        index: i + 1,
        name: stop.name,
        date: stop.date,
        citation: stop.citation,
        story: stop.story
      },
      geometry: { type: 'Point', coordinates: [stop.lng, stop.lat] }
    };
  });
  return {
    line: { type: 'FeatureCollection', features: [lineFeature] },
    stops: { type: 'FeatureCollection', features: stopFeatures }
  };
}

function clearRoute() {
  map.getSource('route-line').setData(EMPTY_FC);
  map.getSource('route-stops').setData(EMPTY_FC);
}

function openPersonFocus(props) {
  focusLevel = 1;
  activePerson = props;
  focusedId = props.id;
  applyFocusStyle();

  const bullets = JSON.parse(props.bioBullets);
  const route = JSON.parse(props.route);
  const built = buildRouteGeoJSON(route);
  map.getSource('route-line').setData(built.line);
  map.getSource('route-stops').setData(built.stops);

  document.getElementById('info-back').classList.add('hidden');
  document.getElementById('info-category').textContent = props.category;
  document.getElementById('info-name').textContent = props.name;
  document.getElementById('info-summary').textContent = props.bioIntro;

  const bulletsEl = document.getElementById('info-bullets');
  bulletsEl.innerHTML = '';
  bullets.forEach(function (b) {
    const li = document.createElement('li');
    li.textContent = b;
    bulletsEl.appendChild(li);
  });
  bulletsEl.classList.remove('hidden');

  document.getElementById('info-timeline').innerHTML = '';
  document.getElementById('info-reference').textContent = '';

  document.getElementById('info-panel').classList.remove('hidden');

  const bounds = route.reduce(function (b, s) {
    return b.extend([s.lng, s.lat]);
  }, new maplibregl.LngLatBounds([route[0].lng, route[0].lat], [route[0].lng, route[0].lat]));
  map.fitBounds(bounds, { padding: 80, maxZoom: 8 });
}

function openRouteStopFocus(stopProps, coordinates) {
  focusLevel = 2;

  document.getElementById('info-back').classList.remove('hidden');
  document.getElementById('info-category').textContent = activePerson.category;
  document.getElementById('info-name').textContent = stopProps.name;
  document.getElementById('info-summary').textContent = stopProps.story;
  document.getElementById('info-bullets').classList.add('hidden');
  document.getElementById('info-bullets').innerHTML = '';
  document.getElementById('info-timeline').innerHTML = '';
  document.getElementById('info-reference').textContent = stopProps.citation;

  document.getElementById('info-panel').classList.remove('hidden');

  map.flyTo({ center: coordinates, zoom: Math.max(map.getZoom(), 8), speed: 0.8 });
}

function closeInfoPanel() {
  document.getElementById('info-panel').classList.add('hidden');
  focusedId = null;
  focusLevel = 0;
  activePerson = null;
  clearRoute();
  applyFocusStyle();
}

window.addEventListener('resize', function () {
  map.resize();
});

map.on('load', function () {
  map.resize();
  applyTimelineStyles();

  map.on('click', 'location-points', function (e) {
    const feature = e.features[0];
    const props = feature.properties;

    if (props.route) {
      openPersonFocus(props);
      return;
    }

    focusedId = props.id;
    applyFocusStyle();

    map.flyTo({
      center: feature.geometry.coordinates,
      zoom: Math.max(map.getZoom(), 7),
      speed: 0.8
    });

    openInfoPanel(props);
  });

  map.on('click', 'route-stops-circle', function (e) {
    const feature = e.features[0];
    openRouteStopFocus(feature.properties, feature.geometry.coordinates);
  });

  ['location-points', 'route-stops-circle'].forEach(function (layerId) {
    map.on('mouseenter', layerId, function () {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', layerId, function () {
      map.getCanvas().style.cursor = '';
    });
  });
});

document.getElementById('info-close').addEventListener('click', closeInfoPanel);

document.getElementById('info-back').addEventListener('click', function () {
  if (activePerson) {
    openPersonFocus(activePerson);
  }
});

const TIMELINE_MIN_YEAR = -2000;
const TIMELINE_MAX_YEAR = 100;
const TIMELINE_PX_PER_YEAR = 3;
const TIMELINE_MINOR_STEP = 10;
const TIMELINE_MAJOR_STEP = 50;

const timelineBar = document.getElementById('timeline-bar');
const timelineTrack = document.getElementById('timeline-track');
const timelineBubble = document.getElementById('timeline-year-bubble');

function buildTimelineTrack() {
  const frag = document.createDocumentFragment();
  for (let year = TIMELINE_MIN_YEAR; year <= TIMELINE_MAX_YEAR; year += TIMELINE_MINOR_STEP) {
    const x = (year - TIMELINE_MIN_YEAR) * TIMELINE_PX_PER_YEAR;
    const isMajor = year % TIMELINE_MAJOR_STEP === 0;

    const tick = document.createElement('div');
    tick.className = 'tick ' + (isMajor ? 'major' : 'minor');
    tick.style.left = x + 'px';
    frag.appendChild(tick);

    if (isMajor) {
      const label = document.createElement('div');
      label.className = 'tick-label';
      label.style.left = x + 'px';
      label.textContent = formatYear(year);
      frag.appendChild(label);
    }
  }
  timelineTrack.style.width = ((TIMELINE_MAX_YEAR - TIMELINE_MIN_YEAR) * TIMELINE_PX_PER_YEAR) + 'px';
  timelineTrack.appendChild(frag);
}

function renderTimelinePosition() {
  const viewportCenter = timelineBar.clientWidth / 2;
  const trackX = (currentYear - TIMELINE_MIN_YEAR) * TIMELINE_PX_PER_YEAR;
  timelineTrack.style.transform = 'translateX(' + (viewportCenter - trackX) + 'px)';
  timelineBubble.textContent = formatYear(currentYear);
}

function setTimelineYear(year) {
  currentYear = Math.max(TIMELINE_MIN_YEAR, Math.min(TIMELINE_MAX_YEAR, Math.round(year)));
  renderTimelinePosition();
  applyTimelineStyles();
}

let timelineDrag = null;

timelineBar.addEventListener('pointerdown', function (e) {
  timelineDrag = { startX: e.clientX, startYear: currentYear };
  timelineBar.classList.add('dragging');
  timelineBar.setPointerCapture(e.pointerId);
});

timelineBar.addEventListener('pointermove', function (e) {
  if (!timelineDrag) return;
  const deltaPx = e.clientX - timelineDrag.startX;
  const deltaYears = -deltaPx / TIMELINE_PX_PER_YEAR;
  setTimelineYear(timelineDrag.startYear + deltaYears);
});

function endTimelineDrag() {
  timelineDrag = null;
  timelineBar.classList.remove('dragging');
}

timelineBar.addEventListener('pointerup', endTimelineDrag);
timelineBar.addEventListener('pointercancel', endTimelineDrag);

window.addEventListener('resize', renderTimelinePosition);

buildTimelineTrack();
renderTimelinePosition();

document.getElementById('legend-toggle').addEventListener('click', function () {
  document.getElementById('legend-panel').classList.toggle('hidden');
});

document.querySelectorAll('#legend-panel input[type="checkbox"]').forEach(function (checkbox) {
  checkbox.addEventListener('change', function () {
    const category = checkbox.dataset.category;
    const checkedCategories = Array.from(
      document.querySelectorAll('#legend-panel input[type="checkbox"]:checked')
    ).map(function (c) { return c.dataset.category; });

    map.setFilter('location-points',
      checkedCategories.length
        ? ['in', ['get', 'category'], ['literal', checkedCategories]]
        : ['==', ['get', 'category'], '__none__']
    );
  });
});
