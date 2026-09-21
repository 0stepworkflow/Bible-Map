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

let focusedId = null;
let currentYear = -5;
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
        lineMetrics: true,
        data: { type: 'FeatureCollection', features: [] }
      },
      'route-stops': {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      },
      'route-stop-hints': {
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
          'fill-opacity': timelineOpacityExpr(0.12)
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
          'line-opacity': timelineOpacityExpr(0.85)
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
          'text-halo-width': 1.4,
          'text-opacity': timelineOpacityExpr(0.8)
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
          'text-halo-width': 1.4,
          'text-opacity': 0.8
        }
      },
      {
        id: 'river-labels',
        type: 'symbol',
        source: 'water-rivers',
        layout: {
          'symbol-placement': 'line',
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Italic'],
          'text-size': 11
        },
        paint: {
          'text-color': PALETTE.waterLine,
          'text-halo-color': PALETTE.lowland,
          'text-halo-width': 1.2,
          'text-opacity': 0.8
        }
      }
    ]
  }
});

// Map markers: the locked Set 1 icon on its own, drawn larger than in the legend (see design/icons/set1 and design/brand-guide.md).
// Each icon has a see-through colored wash and a wobbly ink line, made with two small SVG filters.
const MARKER_ICONS = {
  person: {
    wash: PALETTE.highland,
    shapes: '<circle cx="12" cy="7.6" r="3.4"/><path d="M5.2 20.2c.4-4 3.1-6.6 6.8-6.6s6.4 2.6 6.8 6.6z"/>',
    ink: '<circle cx="12" cy="7.6" r="3.4"/><path d="M5.2 20.2c.4-4 3.1-6.6 6.8-6.6s6.4 2.6 6.8 6.6"/>'
  },
  event: {
    wash: PALETTE.accent,
    shapes: '<path d="M11 3c.7 4.6 2.3 6.3 6.9 7-4.6.7-6.2 2.4-6.9 7-.7-4.6-2.3-6.3-6.9-7C8.7 9.3 10.3 7.6 11 3z"/>',
    ink: '<path d="M11 3c.7 4.6 2.3 6.3 6.9 7-4.6.7-6.2 2.4-6.9 7-.7-4.6-2.3-6.3-6.9-7C8.7 9.3 10.3 7.6 11 3z"/><path d="M18.6 14.4c.3 1.9.9 2.5 2.8 2.8-1.9.3-2.5.9-2.8 2.8-.3-1.9-.9-2.5-2.8-2.8 1.9-.3 2.5-.9 2.8-2.8z"/>'
  },
  landmark: {
    wash: PALETTE.water,
    shapes: '<path d="M3.4 9.6L12 4l8.6 5.6z"/>',
    ink: '<path d="M3.4 9.6L12 4l8.6 5.6z"/><path d="M6.6 12v6M10.2 12v6M13.8 12v6M17.4 12v6"/><path d="M3.6 20.4h16.8M5 18.4h14"/>'
  }
};

const MARKER_SIZE = 34;
const MARKER_ICON_SCALE = 1.3;
const MARKER_PIXEL_RATIO = 2;

function markerSvg(icon) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + MARKER_SIZE + '" height="' + MARKER_SIZE + '" viewBox="0 0 ' + MARKER_SIZE + ' ' + MARKER_SIZE + '">' +
    '<defs>' +
    '<filter id="wander" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="1" seed="5" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="0.7"/></filter>' +
    '<filter id="wash" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="2" seed="8" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" result="d"/><feGaussianBlur in="d" stdDeviation="0.25"/></filter>' +
    '</defs>' +
    '<g transform="translate(' + (MARKER_SIZE - 24 * MARKER_ICON_SCALE) / 2 + ' ' + (MARKER_SIZE - 24 * MARKER_ICON_SCALE) / 2 + ') scale(' + MARKER_ICON_SCALE + ')">' +
    '<g filter="url(#wash)" stroke="none"><g fill="' + PALETTE.parchment + '">' + icon.shapes + '</g><g fill="' + icon.wash + '" fill-opacity="0.55">' + icon.shapes + '</g></g>' +
    '<g filter="url(#wander)" fill="none" stroke="' + PALETTE.ink + '" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">' + icon.ink + '</g>' +
    '</g></svg>';
}

// The marker layer is added only after all the images are ready, so the map never asks for an image it does not have yet.
function loadMarkerImages() {
  const loads = Object.keys(MARKER_ICONS).map(function (category) {
    return new Promise(function (resolve, reject) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement('canvas');
        canvas.width = MARKER_SIZE * MARKER_PIXEL_RATIO;
        canvas.height = MARKER_SIZE * MARKER_PIXEL_RATIO;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        map.addImage('marker-' + category, ctx.getImageData(0, 0, canvas.width, canvas.height), { pixelRatio: MARKER_PIXEL_RATIO });
        resolve();
      };
      img.onerror = reject;
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markerSvg(MARKER_ICONS[category]));
    });
  });

  return Promise.all(loads.concat([loadPinBase()])).then(function () {
    map.addLayer({
      id: 'location-points',
      type: 'symbol',
      source: 'locations',
      layout: {
        'icon-image': ['concat', 'marker-', ['get', 'category']],
        'icon-size': 1,
        'icon-allow-overlap': true,
        'icon-ignore-placement': true
      },
      paint: { 'icon-opacity': timelineOpacityExpr(1) }
    }, 'region-labels');
    applyFocusStyle();
  });
}

function focusOpacityExpr() {
  return focusedId
    ? ['case', ['==', ['get', 'id'], focusedId], 1, 0.3]
    : 1;
}

function applyFocusStyle() {
  if (!map.getLayer('location-points')) return;
  // While a route is in focus, that person's own marker is removed (the numbered pins take over).
  map.setFilter('location-points', activePerson ? ['!=', ['get', 'id'], activePerson.id] : null);
  const combined = ['*', timelineOpacityExpr(1), focusOpacityExpr()];
  map.setPaintProperty('location-points', 'icon-opacity', combined);
}

function applyTimelineStyles() {
  map.setPaintProperty('kingdom-fill', 'fill-opacity', timelineOpacityExpr(0.12));
  map.setPaintProperty('kingdom-outline', 'line-opacity', timelineOpacityExpr(0.85));
  map.setPaintProperty('region-labels', 'text-opacity', timelineOpacityExpr(0.8));
  applyFocusStyle();
}

function formatYear(year) {
  return year < 0 ? Math.abs(year) + ' BC' : 'AD ' + Math.max(year, 1);
}

const BIBLE_BOOK_CODES = {
  'Genesis': 'GEN', 'Exodus': 'EXO', 'Leviticus': 'LEV', 'Numbers': 'NUM', 'Deuteronomy': 'DEU',
  'Joshua': 'JOS', 'Judges': 'JDG', 'Ruth': 'RUT', '1 Samuel': '1SA', '2 Samuel': '2SA',
  '1 Kings': '1KI', '2 Kings': '2KI', '1 Chronicles': '1CH', '2 Chronicles': '2CH', 'Ezra': 'EZR',
  'Nehemiah': 'NEH', 'Esther': 'EST', 'Job': 'JOB', 'Psalm': 'PSA', 'Psalms': 'PSA', 'Proverbs': 'PRO',
  'Ecclesiastes': 'ECC', 'Song of Solomon': 'SNG', 'Song of Songs': 'SNG', 'Isaiah': 'ISA',
  'Jeremiah': 'JER', 'Lamentations': 'LAM', 'Ezekiel': 'EZK', 'Daniel': 'DAN', 'Hosea': 'HOS',
  'Joel': 'JOL', 'Amos': 'AMO', 'Obadiah': 'OBA', 'Jonah': 'JON', 'Micah': 'MIC', 'Nahum': 'NAM',
  'Habakkuk': 'HAB', 'Zephaniah': 'ZEP', 'Haggai': 'HAG', 'Zechariah': 'ZEC', 'Malachi': 'MAL',
  'Matthew': 'MAT', 'Mark': 'MRK', 'Luke': 'LUK', 'John': 'JHN', 'Acts': 'ACT', 'Romans': 'ROM',
  '1 Corinthians': '1CO', '2 Corinthians': '2CO', 'Galatians': 'GAL', 'Ephesians': 'EPH',
  'Philippians': 'PHP', 'Colossians': 'COL', '1 Thessalonians': '1TH', '2 Thessalonians': '2TH',
  '1 Timothy': '1TI', '2 Timothy': '2TI', 'Titus': 'TIT', 'Philemon': 'PHM', 'Hebrews': 'HEB',
  'James': 'JAS', '1 Peter': '1PE', '2 Peter': '2PE', '1 John': '1JN', '2 John': '2JN', '3 John': '3JN',
  'Jude': 'JUD', 'Revelation': 'REV'
};

function bibleUrl(citation) {
  const m = /^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(citation.trim());
  if (!m || !BIBLE_BOOK_CODES[m[1]]) return null;
  const verses = m[4] ? m[3] + '-' + m[4] : m[3];
  return 'https://www.bible.com/bible/116/' + BIBLE_BOOK_CODES[m[1]] + '.' + m[2] + '.' + verses + '.NLT';
}

function makeCitationNode(citation, className) {
  const url = bibleUrl(citation);
  const el = document.createElement(url ? 'a' : 'span');
  if (className) el.className = className;
  el.textContent = citation;
  if (url) {
    el.href = url;
    el.target = '_blank';
    el.rel = 'noopener noreferrer';
    el.title = 'Read ' + citation + ' (NLT) on Bible.com';
  }
  return el;
}

function openInfoPanel(props) {
  document.getElementById('info-nav').classList.add('hidden');
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

const loadedStopIcons = new Set();

// Route stops use the Set 1 drop pin with the stop number where the little circle used to be.
// The number is drawn with the body font (Shantell Sans), which loadMarkerImages makes sure is ready first.
const PIN_PATH = 'M12 21.4s-6.6-5.9-6.6-10.9a6.6 6.6 0 1 1 13.2 0c0 5-6.6 10.9-6.6 10.9z';
const PIN_VIEWBOX = { x: 3.4, y: 2.4, w: 17.2, h: 20 };
const PIN_SCALE = 2.2;
const PIN_CENTER = { x: 12, y: 10.4 };
let pinBaseImage = null;

function pinSvg() {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + PIN_VIEWBOX.w * PIN_SCALE + '" height="' + PIN_VIEWBOX.h * PIN_SCALE + '" viewBox="' + PIN_VIEWBOX.x + ' ' + PIN_VIEWBOX.y + ' ' + PIN_VIEWBOX.w + ' ' + PIN_VIEWBOX.h + '">' +
    '<defs>' +
    '<filter id="wander" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="1" seed="5" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="0.7"/></filter>' +
    '<filter id="wash" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="2" seed="8" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" result="d"/><feGaussianBlur in="d" stdDeviation="0.25"/></filter>' +
    '</defs>' +
    '<g filter="url(#wash)" stroke="none"><path fill="' + PALETTE.parchment + '" d="' + PIN_PATH + '"/><path fill="' + PALETTE.accent + '" fill-opacity="0.55" d="' + PIN_PATH + '"/></g>' +
    '<g filter="url(#wander)" fill="none" stroke="' + PALETTE.ink + '" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="' + PIN_PATH + '"/></g>' +
    '</svg>';
}

function loadPinBase() {
  const fontReady = document.fonts ? document.fonts.load('700 13px "Shantell Sans"') : Promise.resolve();
  const imageReady = new Promise(function (resolve, reject) {
    const img = new Image();
    img.onload = function () { pinBaseImage = img; resolve(); };
    img.onerror = reject;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(pinSvg());
  });
  return Promise.all([fontReady, imageReady]);
}

function ensureStopIcon(index) {
  const id = 'route-stop-dot-' + index;
  if (loadedStopIcons.has(id) || !pinBaseImage) return;

  const ratio = MARKER_PIXEL_RATIO;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(PIN_VIEWBOX.w * PIN_SCALE * ratio);
  canvas.height = Math.round(PIN_VIEWBOX.h * PIN_SCALE * ratio);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(pinBaseImage, 0, 0, canvas.width, canvas.height);

  ctx.fillStyle = PALETTE.ink;
  ctx.font = '700 ' + 13 * ratio + 'px "Shantell Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(index), (PIN_CENTER.x - PIN_VIEWBOX.x) * PIN_SCALE * ratio, (PIN_CENTER.y - PIN_VIEWBOX.y) * PIN_SCALE * ratio + ratio);

  map.addImage(id, ctx.getImageData(0, 0, canvas.width, canvas.height), { pixelRatio: ratio });
  loadedStopIcons.add(id);
}

const loadedHintIcons = new Set();

function ensureHintIcon(count) {
  const id = 'route-stop-hint-' + count;
  if (loadedHintIcons.has(id)) return;

  const size = 20;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const radius = size / 2;

  ctx.beginPath();
  ctx.arc(radius, radius, radius - 1.5, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.ink;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = PALETTE.parchment;
  ctx.stroke();

  ctx.fillStyle = PALETTE.parchment;
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+' + count, radius, radius + 1);

  map.addImage(id, ctx.getImageData(0, 0, size, size));
  loadedHintIcons.add(id);
}

let activeRouteStops = [];

function updateStopHints() {
  if (focusLevel !== 1 || !activeRouteStops.length) {
    map.getSource('route-stop-hints').setData(EMPTY_FC);
    return;
  }

  const visibleIds = new Set(
    map.queryRenderedFeatures({ layers: ['route-stops-marker'] }).map(function (f) { return f.properties.id; })
  );
  const visibleStops = activeRouteStops.filter(function (s) { return visibleIds.has(s.id); });
  const hiddenStops = activeRouteStops.filter(function (s) { return !visibleIds.has(s.id); });

  if (!hiddenStops.length || !visibleStops.length) {
    map.getSource('route-stop-hints').setData(EMPTY_FC);
    return;
  }

  const NEARBY_PX_THRESHOLD = 60;
  const hiddenByVisibleId = {};
  hiddenStops.forEach(function (hidden) {
    const hiddenPx = map.project([hidden.lng, hidden.lat]);
    let nearest = null;
    let nearestDist = Infinity;
    visibleStops.forEach(function (visible) {
      const visiblePx = map.project([visible.lng, visible.lat]);
      const dist = Math.hypot(hiddenPx.x - visiblePx.x, hiddenPx.y - visiblePx.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = visible;
      }
    });
    if (nearest && nearestDist <= NEARBY_PX_THRESHOLD) {
      if (!hiddenByVisibleId[nearest.id]) hiddenByVisibleId[nearest.id] = [];
      hiddenByVisibleId[nearest.id].push(hidden.id);
    }
  });

  const hintFeatures = Object.keys(hiddenByVisibleId).map(function (visibleId) {
    const visible = visibleStops.find(function (s) { return s.id === visibleId; });
    const hiddenIds = hiddenByVisibleId[visibleId];
    ensureHintIcon(hiddenIds.length);
    return {
      type: 'Feature',
      properties: { count: hiddenIds.length, hiddenIds: JSON.stringify(hiddenIds) },
      geometry: { type: 'Point', coordinates: [visible.lng, visible.lat] }
    };
  });

  map.getSource('route-stop-hints').setData({ type: 'FeatureCollection', features: hintFeatures });
}

function buildRouteGeoJSON(route) {
  route.forEach(function (_, i) { ensureStopIcon(i + 1); });
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
        story: stop.story,
        labelSide: stop.labelSide || 'right'
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
  map.getSource('route-stop-hints').setData(EMPTY_FC);
  activeRouteStops = [];
}

let activeRoute = null;
let currentStepIndex = 0;

function fitRouteBounds(route) {
  const bounds = route.reduce(function (b, s) {
    return b.extend([s.lng, s.lat]);
  }, new maplibregl.LngLatBounds([route[0].lng, route[0].lat], [route[0].lng, route[0].lat]));
  map.fitBounds(bounds, { padding: 80, maxZoom: 8 });
}

function updateNavControls() {
  const nav = document.getElementById('info-nav');
  if (!activePerson) {
    nav.classList.add('hidden');
    return;
  }
  const total = activeRoute.length;
  nav.classList.remove('hidden');
  document.getElementById('info-prev').disabled = currentStepIndex === 0;
  document.getElementById('info-next').disabled = currentStepIndex === total;
  document.getElementById('info-step-label').textContent = currentStepIndex === 0
    ? 'Overview'
    : currentStepIndex + ' / ' + total;
}

function showStep(index) {
  if (!activePerson || !activeRoute) return;
  currentStepIndex = Math.max(0, Math.min(activeRoute.length, index));

  document.getElementById('info-bullets').innerHTML = '';

  if (currentStepIndex === 0) {
    focusLevel = 1;
    focusedId = activePerson.id;
    applyFocusStyle();

    const bullets = JSON.parse(activePerson.bioBullets);
    document.getElementById('info-category').textContent = activePerson.category;
    document.getElementById('info-name').textContent = activePerson.name;
    document.getElementById('info-summary').textContent = activePerson.bioIntro;

    const bulletsEl = document.getElementById('info-bullets');
    bullets.forEach(function (b) {
      const li = document.createElement('li');
      li.appendChild(document.createTextNode(b.text));
      if (b.citation) {
        li.appendChild(document.createTextNode(' '));
        li.appendChild(makeCitationNode(b.citation, 'bullet-ref'));
      }
      bulletsEl.appendChild(li);
    });
    bulletsEl.classList.remove('hidden');

    document.getElementById('info-timeline').innerHTML = '';
    document.getElementById('info-reference').textContent = '';

    fitRouteBounds(activeRoute);
  } else {
    focusLevel = 2;
    const stop = activeRoute[currentStepIndex - 1];

    document.getElementById('info-category').textContent = activePerson.category;
    document.getElementById('info-name').textContent = stop.name;
    document.getElementById('info-summary').textContent = stop.story;
    document.getElementById('info-bullets').classList.add('hidden');
    document.getElementById('info-timeline').innerHTML = '';
    const referenceEl = document.getElementById('info-reference');
    if (stop.citation) {
      referenceEl.replaceChildren(makeCitationNode(stop.citation, 'ref-link'));
    } else {
      referenceEl.replaceChildren();
    }

    map.flyTo({ center: [stop.lng, stop.lat], zoom: Math.max(map.getZoom(), 8), speed: 0.8 });
  }

  document.getElementById('info-panel').classList.remove('hidden');
  updateNavControls();
}

const PULSE_BAND = 0.08;
const PULSE_SWEEP_MS = 5000;
const PULSE_GAP_MS = 2500;
const PULSE_BRIGHT_COLOR = PALETTE.parchment;
const PULSE_IDLE_GRADIENT = ['interpolate', ['linear'], ['line-progress'], 0, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,0)'];

let pulseFrameId = null;
let pulseStartTs = null;
let pulseInGap = false;

function pulseGradientForCenter(center) {
  const half = PULSE_BAND;
  const raw = [
    { pos: 0, bright: false },
    { pos: center - half, bright: false },
    { pos: center, bright: true },
    { pos: center + half, bright: false },
    { pos: 1, bright: false }
  ];
  const cleaned = [];
  raw.forEach(function (s) {
    let pos = Math.max(0, Math.min(1, s.pos));
    if (cleaned.length && pos <= cleaned[cleaned.length - 1].pos) {
      pos = cleaned[cleaned.length - 1].pos + 0.0001;
    }
    cleaned.push({ pos: pos, bright: s.bright });
  });
  const expr = ['interpolate', ['linear'], ['line-progress']];
  cleaned.forEach(function (s) {
    expr.push(s.pos, s.bright ? PULSE_BRIGHT_COLOR : 'rgba(0,0,0,0)');
  });
  return expr;
}

function stepPulse(ts) {
  if (!map.getLayer('route-line-pulse')) {
    pulseFrameId = null;
    return;
  }
  if (pulseStartTs === null) pulseStartTs = ts;
  const cycle = PULSE_SWEEP_MS + PULSE_GAP_MS;
  const elapsed = (ts - pulseStartTs) % cycle;

  if (elapsed <= PULSE_SWEEP_MS) {
    const linear = elapsed / PULSE_SWEEP_MS;
    const t = linear * linear * (3 - 2 * linear);
    const center = -PULSE_BAND + t * (1 + 2 * PULSE_BAND);
    map.setPaintProperty('route-line-pulse', 'line-gradient', pulseGradientForCenter(center));
    pulseInGap = false;
  } else if (!pulseInGap) {
    map.setPaintProperty('route-line-pulse', 'line-gradient', PULSE_IDLE_GRADIENT);
    pulseInGap = true;
  }

  pulseFrameId = requestAnimationFrame(stepPulse);
}

function startPulseAnimation() {
  if (pulseFrameId) return;
  pulseStartTs = null;
  pulseInGap = false;
  pulseFrameId = requestAnimationFrame(stepPulse);
}

function stopPulseAnimation() {
  if (pulseFrameId) {
    cancelAnimationFrame(pulseFrameId);
    pulseFrameId = null;
  }
}

function ensureRouteLayers() {
  if (map.getLayer('route-stop-hint-marker')) return;

  map.addLayer({
    id: 'route-line-layer',
    type: 'line',
    source: 'route-line',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': PALETTE.accent,
      'line-width': 5
    }
  });

  map.addLayer({
    id: 'route-line-pulse',
    type: 'line',
    source: 'route-line',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-width': 5.5,
      'line-blur': 2,
      'line-gradient': PULSE_IDLE_GRADIENT
    }
  });

  map.addLayer({
    id: 'route-stops-marker',
    type: 'symbol',
    source: 'route-stops',
    layout: {
      'icon-image': ['concat', 'route-stop-dot-', ['to-string', ['get', 'index']]],
      'icon-size': 1,
      'icon-anchor': 'bottom',
      'icon-allow-overlap': false,
      'text-field': ['format',
        ['get', 'name'], { 'font-scale': 1.05 },
        '\n', {},
        ['get', 'citation'], { 'font-scale': 0.85 }
      ],
      'text-font': ['Noto Sans Bold'],
      'text-size': 12,
      'text-anchor': ['case', ['==', ['get', 'labelSide'], 'left'], 'right', 'left'],
      'text-offset': ['case', ['==', ['get', 'labelSide'], 'left'], ['literal', [-1.5, -1.4]], ['literal', [1.5, -1.4]]],
      'text-justify': ['case', ['==', ['get', 'labelSide'], 'left'], 'right', 'left'],
      'text-allow-overlap': false
    },
    paint: {
      'text-color': PALETTE.ink,
      'text-halo-color': PALETTE.parchment,
      'text-halo-width': 1.6
    }
  });

  map.addLayer({
    id: 'route-stop-hint-marker',
    type: 'symbol',
    source: 'route-stop-hints',
    layout: {
      'icon-image': ['concat', 'route-stop-hint-', ['to-string', ['get', 'count']]],
      'icon-size': 1,
      'icon-offset': [15, -40],
      'icon-allow-overlap': true,
      'icon-ignore-placement': true
    }
  });
}

function openPersonFocus(props) {
  activePerson = props;
  activeRoute = JSON.parse(props.route);
  activeRouteStops = activeRoute;

  applyFocusStyle();
  const built = buildRouteGeoJSON(activeRoute);
  map.getSource('route-line').setData(built.line);
  map.getSource('route-stops').setData(built.stops);
  ensureRouteLayers();
  startPulseAnimation();

  showStep(0);
}

function closeInfoPanel() {
  document.getElementById('info-panel').classList.add('hidden');
  focusedId = null;
  focusLevel = 0;
  activePerson = null;
  activeRoute = null;
  currentStepIndex = 0;
  stopPulseAnimation();
  clearRoute();
  applyFocusStyle();
}

window.addEventListener('resize', function () {
  map.resize();
});

map.on('load', function () {
  map.resize();
  loadMarkerImages();
  applyTimelineStyles();

  map.on('moveend', updateStopHints);

  map.on('click', function (e) {
    const personFeatures = map.queryRenderedFeatures(e.point, { layers: ['location-points'] });
    if (personFeatures.length) {
      const feature = personFeatures[0];
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
      return;
    }

    if (!map.getLayer('route-stops-marker')) return;

    const hintFeatures = map.queryRenderedFeatures(e.point, { layers: ['route-stop-hint-marker'] });
    if (hintFeatures.length) {
      const hiddenIds = JSON.parse(hintFeatures[0].properties.hiddenIds);
      const hiddenIndex = activeRouteStops.findIndex(function (s) { return s.id === hiddenIds[0]; });
      if (hiddenIndex !== -1) {
        showStep(hiddenIndex + 1);
      }
      return;
    }

    const stopFeatures = map.queryRenderedFeatures(e.point, { layers: ['route-stops-marker'] });
    if (stopFeatures.length) {
      showStep(stopFeatures[0].properties.index);
    }
  });

  ['location-points', 'route-stops-marker', 'route-stop-hint-marker'].forEach(function (layerId) {
    map.on('mouseenter', layerId, function () {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', layerId, function () {
      map.getCanvas().style.cursor = '';
    });
  });
});

document.getElementById('info-close').addEventListener('click', closeInfoPanel);

document.getElementById('info-prev').addEventListener('click', function () {
  showStep(currentStepIndex - 1);
});

document.getElementById('info-next').addEventListener('click', function () {
  showStep(currentStepIndex + 1);
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
