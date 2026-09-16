const PALETTE = {
  parchment: '#FEFAE0',
  lowland: '#FAEDCD',
  midtone: '#E9EDC9',
  highland: '#D4A373',
  water: '#CCD5AE',
  ink: '#283618',
  accent: '#BC6C25'
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
      }
    ]
  }
});

let focusedId = null;

function applyFocusStyle() {
  const opacityExpr = focusedId
    ? ['case', ['==', ['get', 'id'], focusedId], 1, 0.3]
    : 1;
  map.setPaintProperty('location-points', 'circle-opacity', opacityExpr);
  map.setPaintProperty('location-points', 'circle-stroke-opacity', opacityExpr);
}

function openInfoPanel(props) {
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

function closeInfoPanel() {
  document.getElementById('info-panel').classList.add('hidden');
  focusedId = null;
  applyFocusStyle();
}

window.addEventListener('resize', function () {
  map.resize();
});

map.on('load', function () {
  map.resize();

  map.on('click', 'location-points', function (e) {
    const feature = e.features[0];
    const props = feature.properties;

    focusedId = props.id;
    applyFocusStyle();

    map.flyTo({
      center: feature.geometry.coordinates,
      zoom: Math.max(map.getZoom(), 7),
      speed: 0.8
    });

    openInfoPanel(props);
  });

  map.on('mouseenter', 'location-points', function () {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', 'location-points', function () {
    map.getCanvas().style.cursor = '';
  });
});

document.getElementById('info-close').addEventListener('click', closeInfoPanel);

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
