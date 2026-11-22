import { Map as GlobeMap, NavigationControl, ScaleControl, setWorkerUrl } from '../../vendor/maplibre/maplibre-gl.mjs';
setWorkerUrl(new URL('../../vendor/maplibre/maplibre-gl-worker.mjs', import.meta.url).href);
import { selectionLayers } from './selection.js';
import { directedLines } from '../domain/cartography.js';
import { routeStyle } from './portrayal.js';
const CIRCUMFERENCE = 40075016.686;
export class AtlasMap {
    map;
    ready = false;
    setting = false;
    pending;
    selected;
    onCamera;
    constructor(container, camera, onCamera, onSelect, onError) {
        this.onCamera = onCamera;
        this.map = new GlobeMap({ container, style: { version: 8, projection: { type: 'globe' }, sources: { land: { type: 'geojson', data: new URL('basemap/land.geojson', document.baseURI).href } }, layers: [{ id: 'ocean', type: 'background', paint: { 'background-color': '#d8e6e2' } }, { id: 'land', type: 'fill', source: 'land', paint: { 'fill-color': '#f5f3ea' } }, { id: 'coast', type: 'line', source: 'land', paint: { 'line-color': '#a0b5ad', 'line-width': 0.8 } }] }, center: [camera.longitude, camera.latitude], zoom: this.zoom(camera), bearing: camera.bearing ?? 0, pitch: camera.pitch ?? 0, maxPitch: 60, attributionControl: false, canvasContextAttributes: { antialias: true } });
        this.map.addControl(new NavigationControl({ showCompass: true }), 'top-right');
        this.map.addControl(new ScaleControl({ maxWidth: 140, unit: 'metric' }), 'bottom-left');
        this.map.on('error', e => onError(e.error.message));
        this.map.on('load', () => {
            this.ready = true;
            this.map.addSource('historical', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
            const ordinary=['all',['==',['geometry-type'],'Polygon'],['!', ['in',['get','portrayal'],['literal',['land-reconstruction','ice-reconstruction']]]]];
            for(const [name,color,stroke] of [['land-reconstruction','#d8cba9','#87764e'],['ice-reconstruction','#e8f2fa','#6a8fa7']]) {
                const filter=['==',['get','portrayal'],name];
                this.map.addLayer({id:name,type:'fill',source:'historical',filter,paint:{'fill-color':color,'fill-opacity':0.78}});
                this.map.addLayer({id:name+'-edge',type:'line',source:'historical',filter,paint:{'line-color':stroke,'line-width':1.5,'line-dasharray':[3,2]}});
            }
            this.map.addLayer({ id: 'areas', type: 'fill', source: 'historical', filter: ordinary, paint: { 'fill-color': '#009e98', 'fill-opacity': 0.28 } });
            this.map.addLayer({ id: 'outlines', type: 'line', source: 'historical', filter: ordinary, paint: { 'line-color': '#00726d', 'line-width': 2 } });
            this.map.addLayer({ id: 'connections', type: 'line', source: 'historical', filter: ['all',['==', ['geometry-type'], 'LineString'],['!=',['get','portrayal'],'migration']], paint: { 'line-color': '#9e613f', 'line-width': 2.5, 'line-dasharray': [2, 2] } });
            for(const variant of [1,2]) {
                const style=routeStyle(variant);
                this.map.addLayer({id:'migration-'+variant,type:'line',source:'historical',filter:['all',['==',['get','portrayal'],'migration'],variant===2?['==',['get','variant'],2]:['!=',['get','variant'],2]],paint:{'line-color':style.color,'line-width':2.6,'line-dasharray':style.dash.map(x=>x/2.6)}});
                const canvas=document.createElement('canvas');canvas.width=24;canvas.height=24;
                const ctx=canvas.getContext('2d');ctx.beginPath();ctx.moveTo(4,5);ctx.lineTo(19,12);ctx.lineTo(4,19);ctx.lineTo(8,12);ctx.closePath();ctx.fillStyle=style.color;ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke();
                this.map.addImage('route-arrow-'+variant,ctx.getImageData(0,0,24,24));
            }
            this.map.addLayer({ id: 'places', type: 'circle', source: 'historical', filter: ['==', ['geometry-type'], 'Point'], paint: { 'circle-radius': 6, 'circle-color': '#006f6b', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2 } });
            for (const layer of selectionLayers()) this.map.addLayer(layer);
            this.map.addSource('directions',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
            this.map.addLayer({id:'route-directions',type:'symbol',source:'directions',layout:{'symbol-placement':'line','symbol-spacing':100,'icon-image':['case',['==',['get','variant'],2],'route-arrow-2','route-arrow-1'],'icon-size':0.75,'icon-rotation-alignment':'map','icon-keep-upright':false,'icon-allow-overlap':true,'icon-ignore-placement':true}});
            if (this.pending)
                this.setFeatures(this.pending, this.selected);
        });
        const hitLayers=['places','areas','connections','migration-1','migration-2','route-directions','land-reconstruction','ice-reconstruction'];
        this.map.on('click', e => { if (!this.ready)
            return; const hits = this.map.queryRenderedFeatures(e.point, { layers: hitLayers }); const ids = [...new Set(hits.map(h => String(h.properties.recordId)))]; if (ids.length)
            onSelect(ids); });
        this.map.on('mousemove', e => { if (this.ready)
            this.map.getCanvas().style.cursor = this.map.queryRenderedFeatures(e.point, { layers: hitLayers }).length ? 'pointer' : ''; });
        this.map.on('moveend', () => { if (!this.setting)
            this.onCamera(this.camera()); });
        this.map.on('zoomend', () => { const c = this.camera(); if (c.metersPerPixel < 200)
            this.setCamera({ ...c, metersPerPixel: 200 }); });
    }
    zoom(c) { return Math.log2(CIRCUMFERENCE * Math.cos(c.latitude * Math.PI / 180) / (512 * c.metersPerPixel)); }
    camera() { const c = this.map.getCenter(); return { longitude: ((c.lng + 180) % 360 + 360) % 360 - 180, latitude: Math.max(-85, Math.min(85, c.lat)), metersPerPixel: Math.max(200, CIRCUMFERENCE * Math.cos(c.lat * Math.PI / 180) / (512 * 2 ** this.map.getZoom())), bearing: this.map.getBearing(), pitch: this.map.getPitch() }; }
    setCamera(c) { this.setting = true; this.map.jumpTo({ center: [c.longitude, c.latitude], zoom: this.zoom(c), bearing: c.bearing ?? 0, pitch: c.pitch ?? 0 }); this.setting = false; }
    setFeatures(f, selected) { this.pending = f; this.selected = selected; if (!this.ready)
        return; this.map.getSource('historical').setData(f);
        this.map.getSource('directions').setData({type:'FeatureCollection',features:f.features.flatMap(feature=>directedLines(feature).map(coordinates=>({type:'Feature',geometry:{type:'LineString',coordinates},properties:feature.properties})))});
        for (const layer of selectionLayers(selected)) this.map.setFilter(layer.id,layer.filter); }
    resize() { const previous = this.setting; this.setting = true; try { this.map.resize(); } finally { this.setting = previous; } }
}
