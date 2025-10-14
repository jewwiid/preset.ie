# Map Discovery Guide — MapLibre + Supabase (PostGIS)

Goal: interactive map view where users see gigs inside the visible map area and/or within a chosen travel distance from their profile or current location. Cheap (open-source), fast, and fits the Preset stack (Next.js + Supabase).

⸻

## Quick summary / architecture

- **Frontend**: MapLibre GL JS (open-source equivalent of Mapbox GL) inside Next.js React.
- **Tiles**: OpenStreetMap tiles via MapTiler (free tier) or any OSM tile host.
- **Backend DB**: Supabase (Postgres) with PostGIS extension enabled.
- **Spatial queries**: PostGIS functions (ST_DWithin, ST_Distance, ST_MakeEnvelope) to filter by radius or map bounding box.
- **API layer**: Next.js API routes or Supabase Edge Functions that run spatial SQL (use service role key server-side).
- **Extras**: clustering via GeoJSON cluster: true, optional isochrones (OpenRouteService / Mapbox) for travel-time filtering.

⸻

## Prereqs

- Supabase project for Preset (you already use Supabase).
- Enable PostGIS in your Supabase DB (see step below).
- A tile provider (MapTiler free tier recommended) — you only need a small monthly budget for hosted tiles if you want nicer maps and less load on OSM.
- Next.js app (your existing web app).
- MapLibre GL JS dependency.

⸻

## 1) Database: schema & spatial index

### 1.1 Enable PostGIS

Run this SQL in Supabase SQL editor:

```sql
-- enable PostGIS (Supabase supports or you may need to enable it via dashboard)
create extension if not exists postgis;
```

### 1.2 Add a location column (geography point) to gigs table

```sql
alter table gigs
  add column location geography(point,4326);
```

If you prefer to keep lat/lng as floats, keep them and add a generated geography column:

```sql
alter table gigs
  add column lat double precision,
  add column lng double precision;

alter table gigs
  add column location geography(point,4326)
    generated always as (ST_MakePoint(lng, lat)::geography) stored;
```

### 1.3 Create spatial index (very important for performance)

```sql
create index if not exists idx_gigs_location on gigs using gist(location);
```

⸻

## 2) Useful PostGIS queries

### 2.1 Query gigs within a radius (meters) of a point and order by distance

```sql
-- params: lon, lat, radius_meters, limit
select id, title, owner_user_id, lat, lng,
  ST_Distance(location, ST_MakePoint($1, $2)::geography) as distance_m
from gigs
where ST_DWithin(location, ST_MakePoint($1, $2)::geography, $3)
order by distance_m
limit $4;
```

(Substitute $1=$lon, $2=$lat, $3=$radius_meters, $4=limit)

### 2.2 Query gigs inside the current map bounding box (fast)

```sql
-- params: minLng, minLat, maxLng, maxLat
select id,title,owner_user_id,lat,lng
from gigs
where ST_Within(location, ST_MakeEnvelope($1, $2, $3, $4, 4326));
```

Note: ST_MakeEnvelope(xmin, ymin, xmax, ymax, srid) expects xmin=minLon, ymin=minLat etc.

### 2.3 Query gigs intersecting map bbox + optional radius filtering (hybrid)

```sql
-- params: minLng,minLat,maxLng,maxLat, centerLon, centerLat, radius_m
select id,title,lat,lng,
  ST_Distance(location, ST_MakePoint($5,$6)::geography) as distance_m
from gigs
where ST_Within(location, ST_MakeEnvelope($1,$2,$3,$4,4326))
  and ST_DWithin(location, ST_MakePoint($5,$6)::geography, $7);
```

### 2.4 Create an index for bounding box queries (the GIST index above works)

⸻

## 3) Server API (Next.js example)

Create a secure API endpoint (server-side) that accepts bbox or center+radius and returns GeoJSON.

`/pages/api/gigs/map.js` (Next.js API route example — Node/JS):

```javascript
// pages/api/gigs/map.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  const { bbox, center, radius, limit = 200 } = req.query;
  // bbox format: "minLng,minLat,maxLng,maxLat"
  // center format: "lon,lat"
  try {
    if (bbox) {
      const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
      const sql = `
        select id, title, description, lat, lng
        from gigs
        where ST_Within(location, ST_MakeEnvelope($1, $2, $3, $4, 4326))
        limit $5;
      `;
      const { data, error } = await supabase.rpc('sql', {
        // supabase-js doesn't allow raw SQL by default; use from('gigs').select if possible.
      });

      // Simpler using filter via supabase client:
      const { data: gigs, error: e } = await supabase
        .from('gigs')
        .select('id,title,description,lat,lng')
        .filter('location', 'within', `ST_MakeEnvelope(${minLng},${minLat},${maxLng},${maxLat},4326)::geometry`);
      // But the generic filter string above may not work. Easiest: use a Postgres function or edge function.
    }

    // We'll use a safer approach: call a Postgres function exposed as RPC that runs the SQL above.
    res.status(200).json({ msg: 'Implement RPC as shown in docs.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
```

Note: Supabase client doesn't execute arbitrary SQL from the client in a simple call — create a Postgres rpc function on your DB to run paramaterised spatial queries server-side, then call via supabase.rpc('get_gigs_in_bbox', { ... }). Using Edge Functions is another secure way.

Example RPC function to install (SQL):

```sql
create or replace function get_gigs_in_bbox(min_lng double precision, min_lat double precision, max_lng double precision, max_lat double precision, limit_count int)
returns setof gigs as $$
  select * from gigs
  where ST_Within(location, ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326))
  limit limit_count;
$$ language sql stable;
```

Then call from server:

```javascript
const { data, error } = await supabase.rpc('get_gigs_in_bbox', {
  min_lng: minLng,
  min_lat: minLat,
  max_lng: maxLng,
  max_lat: maxLat,
  limit_count: Number(limit),
});
```

Security note: Always use the Supabase service role key or server-side credentials for RPC calls that access raw geometry or write operations. Never expose service role on the client.

⸻

## 4) Frontend map: MapLibre + React example

Install:

```bash
npm install maplibre-gl
# optional: npm i @mapbox/geojson-extent
```

Example React component using MapLibre and fetching gigs for current viewport:

```javascript
// components/GigsMap.js
import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';

const TILE_URL = `https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`;
// or use OSM tiles: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

export default function GigsMap({ initialCenter = [-6.2603, 53.3498], initialZoom = 12 }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'raster-tiles': {
            type: 'raster',
            tiles: [TILE_URL],
            tileSize: 256
          }
        },
        layers: [{
          id: 'simple-tiles',
          type: 'raster',
          source: 'raster-tiles'
        }]
      },
      center: initialCenter,
      zoom: initialZoom
    });

    mapRef.current = map;

    map.on('load', () => {
      setMapLoaded(true);

      // Add empty source for gigs (geojson) with clustering
      map.addSource('gigs', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 40
      });

      // cluster layer
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'gigs',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#FF7A59',
          'circle-radius': ['step', ['get', 'point_count'], 15, 10, 20, 50, 30]
        }
      });

      // cluster count
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'gigs',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12
        }
      });

      // single point
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'gigs',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#00D1B2',
          'circle-radius': 8,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff'
        }
      });

      // click handlers
      map.on('click', 'unclustered-point', (e) => {
        const props = e.features[0].properties;
        // Show a popup or update sidebar with gig info
        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`<strong>${props.title}</strong><p>${props.description || ''}</p>`)
          .addTo(map);
      });

      map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features[0].properties.cluster_id;
        map.getSource('gigs').getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          map.easeTo({ center: features[0].geometry.coordinates, zoom });
        });
      });

      // fetch initial gigs
      fetchGigsForBounds();
    });

    // Fetch gigs whenever map movement ends
    map.on('moveend', () => {
      fetchGigsForBounds();
    });

    async function fetchGigsForBounds() {
      if (!mapRef.current) return;
      const bounds = mapRef.current.getBounds();
      const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()].join(',');
      // call our server API
      const url = `/api/gigs/map?bbox=${bbox}&limit=500`;
      const res = await fetch(url);
      if (!res.ok) return;
      const gigs = await res.json(); // expect array with lat,lng,title,description,id

      const features = gigs.map(g => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [Number(g.lng), Number(g.lat)]
        },
        properties: {
          id: g.id,
          title: g.title,
          description: g.description
        }
      }));

      const geojson = { type: 'FeatureCollection', features };

      const source = mapRef.current.getSource('gigs');
      if (source) {
        source.setData(geojson);
      }
    }

    return () => map.remove();
  }, []);

  return <div ref={mapContainer} style={{ width: '100%', height: '100vh' }} />;
}
```

Notes:
- The component fetches gigs from `/api/gigs/map?bbox=...` using the map bounds.
- Clustering is done client-side by MapLibre source with cluster: true.
- On cluster click, map zooms into cluster.
- Add a sidebar or bottom sheet that lists gigs returned (makes browsing better UX).

⸻

## 5) Travel distance & travel time filtering

### Option A — approximate by straight-line distance (fast)
- Use ST_DWithin(location, ST_MakePoint(lon,lat)::geography, radius_m) on DB side.
- Good for quick filtering by "within X km". Use the radius slider on UI.

### Option B — travel-time / driving/walking (accurate but needs external service)
- Use an isochrone API (OpenRouteService has free tier, Mapbox also provides isochrones).
- Flow:
  1. From UI: get user center and travel mode + time (e.g., driving 15 minutes).
  2. Call ORS / Mapbox isochrone to receive a polygon for travel envelope.
  3. Send the polygon to server and run:

```sql
select * from gigs
where ST_Within(location::geometry, ST_GeomFromGeoJSON('<isochrone polygon>')::geometry);
```

- Cost: ORS free tier adequate for small usage; Mapbox may cost more.

Recommendation: Start with Option A (radius), add Option B for pro tier users.

⸻

## 6) UX ideas & improvements

- Sidebar list sync: show a list of gigs for current map viewport; clicking a list item centers the map and opens popup.
- Profile centered default: center map on user's saved profile location (fallback to browser geolocation).
- Saved searches: allow users to save location + filters.
- Filters: travel distance slider, comp type, date, tags/style (use embeddings/tags for smart filtering).
- Clustering + heatmap: use maplibre layers to show density heatmap of gigs.
- Performance: server returns only gigs inside viewport + limit (e.g., 500). Implement pagination on list view.
- Mobile: show map with bottom sheet card for selected gig (good mobile UX).

⸻

## 7) Security & rate limiting

- Use server-side API routes or Edge Functions for all DB queries (never run PostGIS SQL from client).
- Add rate limiting / caching: cache recent bbox queries using Vercel Edge or an in-memory cache with short TTL.
- Protect the service role key — only available server-side.

⸻

## 8) Indexing & performance tips

- Ensure GIST index on location.
- Use limit + bounding box to reduce scan size.
- For large scale, partition gigs by region or use materialized views for frequent queries.

⸻

## 9) Environment variables (example)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...server-only...

# Map tiles
NEXT_PUBLIC_MAPTILER_KEY=your_maptiler_key_here

# Optional isochrone/routing
OPENROUTESERVICE_KEY=your_ors_key_here
```

⸻

## 10) Testing checklist before launch

- PostGIS enabled and location set for sample gigs.
- Spatial index created.
- API RPC functions tested with real bbox and radius params.
- Map loads tiles correctly (test MapTiler key).
- Map clustering works and popups show content.
- Map + sidebar sync works on mobile and desktop.
- Rate limiting / caching in place for heavy traffic.
- Optional isochrone flow tested for at least one route mode.

⸻

## 11) Example roadmap / phases

1. **Phase 1 (MVP)**: MapLibre + bbox queries + radius filter + clustering + sidebar listing.
2. **Phase 2**: Add travel-time (isochrone) support for pro users (ORS).
3. **Phase 3**: Add heatmaps, saved searches, map-based gig creation, analytics.
4. **Phase 4**: Offline tile caching or paid tile hosting if usage grows.

⸻

## 12) TL;DR recommendation & costs

- **Best free/cheap stack**: MapLibre GL JS + OpenStreetMap tiles (MapTiler) + Supabase PostGIS.
- **Costs**: Map tiles (free -> small tier ~$5/mo if using MapTiler), Supabase costs (data & compute) — overall extremely low for small/medium traffic.
- **Why**: Full control, no vendor lock-in, integrates cleanly with your existing DB and credit/capacity architecture.

⸻

## Appendix — Helpful SQL / RPC snippets

### RPC: gigs near point

```sql
create or replace function get_gigs_near_point(center_lon double precision, center_lat double precision, radius_m int, limit_count int)
returns table(id uuid, title text, description text, lat double precision, lng double precision, distance_m double precision) as $$
  select id, title, description, ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng,
         ST_Distance(location, ST_MakePoint(center_lon, center_lat)::geography) as distance_m
  from gigs
  where ST_DWithin(location, ST_MakePoint(center_lon, center_lat)::geography, radius_m)
  order by distance_m
  limit limit_count;
$$ language sql stable;
```

Call with:

```javascript
const { data, error } = await supabase.rpc('get_gigs_near_point', {
  center_lon: -6.2603,
  center_lat: 53.3498,
  radius_m: 10000,
  limit_count: 200
});
```

⸻

If you want, I can now:
- Generate the exact Next.js API file and React MapLibre component files ready to paste into your repo (including a small CSS layout and mobile behavior).
- Or produce a short migration script to populate lat,lng,location for your existing gigs.

Which one should I generate for you right now?
