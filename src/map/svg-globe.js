import { geoOrthographic, geoPath } from '../../vendor/geo/geo.js';
import { directedLines } from '../domain/cartography.js';
import { featureStyle, paintOrder, routeStyle } from './portrayal.js';
import { areaDissolve, dissolveDuration, mapFeatureKey } from './area-states.js';
const SVG = 'http://www.w3.org/2000/svg';
let nextPattern = 0;
// d3's spherical polygon convention is clockwise; GeoJSON uses counterclockwise.
function sphericalFeature(feature) {
    const f = structuredClone(feature), g = f.geometry;
    const rewind = (rings) => rings.forEach((r, i) => { const a = r.slice(1).reduce((sum, p, j) => sum + r[j][0] * p[1] - p[0] * r[j][1], 0); if ((a > 0) === (i === 0))
        r.reverse(); });
    if (g.type === 'Polygon')
        rewind(g.coordinates);
    if (g.type === 'MultiPolygon')
        g.coordinates.forEach(rewind);
    return f;
}
export class SvgGlobe {
    container;
    svg;
    projection;
    current;
    land = [];
    features = [];
    collection;
    dissolveTimer;
    dissolveStart;
    hatchId = 'atlas-area-hatch-' + ++nextPattern;
    selected;
    observer;
    timer;
    start;
    moved = false;
    constructor(container, camera, onCamera, onSelect) {
        this.container = container;
        container.replaceChildren();
        this.current = camera;
        this.projection = geoOrthographic();
        this.svg = document.createElementNS(SVG, 'svg');
        this.svg.setAttribute('role', 'img');
        this.svg.setAttribute('aria-label', 'Globe · SVG fallback');
        this.svg.classList.add('svg-globe');
        this.svg.tabIndex = 0;
        container.append(this.svg);
        const note = document.createElement('span');
        note.className = 'renderer-note';
        note.textContent = 'SVG · WebGL2 unavailable';
        container.append(note);
        this.observer = new ResizeObserver(() => this.draw());
        this.observer.observe(container);
        void fetch(new URL('basemap/land.geojson', document.baseURI)).then(r => r.json()).then((f) => { this.land = f.features.map(sphericalFeature); this.draw(); }).catch(() => { note.textContent = 'Basemap unavailable'; });
        this.svg.addEventListener('pointerdown', e => { if (e.button !== 0)
            return; clearTimeout(this.timer); this.start = { x: e.clientX, y: e.clientY, camera: { ...this.current } }; this.moved = false; this.svg.setPointerCapture(e.pointerId); });
        this.svg.addEventListener('pointermove', e => { if (!this.start)
            return; const dx = e.clientX - this.start.x, dy = e.clientY - this.start.y; if (Math.abs(dx) + Math.abs(dy) < 3)
            return; this.moved = true; const factor = 90 / this.projection.scale(); this.current = { ...this.current, longitude: ((this.start.camera.longitude - dx * factor + 180) % 360 + 360) % 360 - 180, latitude: Math.max(-85, Math.min(85, this.start.camera.latitude + dy * factor)) }; this.draw(); });
        this.svg.addEventListener('pointerup', e => { const started = this.start; this.start = undefined; if (started && this.moved)
            onCamera(this.camera());
        else {
            const hits = document.elementsFromPoint(e.clientX, e.clientY).filter(el => el.hasAttribute('data-record-id')).map(el => el.getAttribute('data-record-id'));
            if (hits.length)
                onSelect([...new Set(hits)]);
        } });
        this.svg.addEventListener('pointercancel', () => { if (this.start) {
            this.current = this.start.camera;
            this.start = undefined;
            this.draw();
        } });
        this.svg.addEventListener('wheel', e => { e.preventDefault(); this.current = { ...this.current, metersPerPixel: Math.max(200, Math.min(150000, this.current.metersPerPixel * Math.exp(e.deltaY * 0.001))) }; this.draw(); clearTimeout(this.timer); this.timer = setTimeout(() => onCamera(this.camera()), 180); }, { passive: false });
        this.svg.addEventListener('keydown', e => { const key = e.key; if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '-'].includes(key)) {
            e.preventDefault();
            const c = { ...this.current };
            if (key === 'ArrowLeft')
                c.longitude -= 10;
            if (key === 'ArrowRight')
                c.longitude += 10;
            if (key === 'ArrowUp')
                c.latitude = Math.min(85, c.latitude + 10);
            if (key === 'ArrowDown')
                c.latitude = Math.max(-85, c.latitude - 10);
            if (key === '+')
                c.metersPerPixel = Math.max(200, c.metersPerPixel / 1.4);
            if (key === '-')
                c.metersPerPixel = Math.min(150000, c.metersPerPixel * 1.4);
            c.longitude = ((c.longitude + 180) % 360 + 360) % 360 - 180;
            this.current = c;
            this.draw();
            onCamera(this.camera());
        } });
        this.draw();
    }
    camera() { return { ...this.current }; }
    setCamera(c) { clearTimeout(this.timer); this.current = c; this.draw(); }
    setFeatures(f, selected) {
        const previous = this.collection, key = mapFeatureKey(f), previousSelection = this.selected;
        this.collection = f;
        this.selected = selected;
        if (this.featureKey === key) {
            if (selected !== previousSelection) this.draw();
            return;
        }
        this.featureKey = key;
        clearTimeout(this.dissolveTimer);
        const transition = !matchMedia('(prefers-reduced-motion: reduce)').matches && areaDissolve(previous, f);
        this.dissolveStart = performance.now();
        this.features = (transition || f.features).map(sphericalFeature).sort((a,b) => paintOrder(a) - paintOrder(b));
        this.draw();
        if (transition) this.dissolveTimer = setTimeout(() => {
            this.features = this.features.filter(feature => feature.properties.dissolve !== 'out');
            this.draw();
        }, dissolveDuration);
    }
    resize() { this.draw(); }
    draw() {
        const w = this.container.clientWidth, h = this.container.clientHeight;
        if (!w || !h)
            return;
        this.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        this.projection.translate([w / 2, h / 2]).scale(6371008.8 / this.current.metersPerPixel).rotate([-this.current.longitude, -this.current.latitude, -(this.current.bearing ?? 0)]).clipAngle(90);
        const path = geoPath(this.projection), fragment = document.createDocumentFragment();
        const defs = document.createElementNS(SVG, 'defs');
        defs.innerHTML = `<pattern id="${this.hatchId}" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M-2 2L2 -2 M0 8L8 0 M6 10L10 6" fill="none" stroke="#314c45" stroke-opacity=".36" stroke-width="1"/></pattern>`;
        fragment.append(defs);
        const add = (d, fill, stroke, width = 1, recordId, dashed = false, parent = fragment) => { if (!d)
            return; const el = document.createElementNS(SVG, 'path'); el.setAttribute('d', d); el.setAttribute('fill', fill); el.setAttribute('stroke', stroke); el.setAttribute('stroke-width', String(width)); if (dashed)
            el.setAttribute('stroke-dasharray', Array.isArray(dashed)?dashed.join(' '):'5 4'); if (recordId) {
            el.dataset.recordId = recordId;
            el.style.cursor = 'pointer';
        } parent.append(el); return el; };
        add(path({ type: 'Sphere' }), '#cbded7', '#9fbdb0');
        for (const f of this.land)
            add(path(f), '#f5f3ea', '#a6bbb0', 0.7);
        for (const f of this.features) {
            const area = ['Polygon', 'MultiPolygon'].includes(f.geometry.type), point = f.geometry.type.includes('Point'), id = String(f.properties?.recordId), selected = id === this.selected;
            path.pointRadius(selected ? 8 : 5);
            const style=featureStyle(f);
            if (f.properties?.portrayal === 'dated-area') {
                const group = document.createElementNS(SVG, 'g');
                const d = path(f), fade = f.properties.dissolve, hitId = fade === 'out' ? undefined : id;
                fragment.append(group);
                if (fade === 'out') group.style.pointerEvents = 'none';
                const shape = add(d, style.fill, style.stroke, style.width, hitId, style.dash, group);
                shape?.setAttribute('fill-opacity', style.fillOpacity);
                if (style.hatched) add(d, `url(#${this.hatchId})`, 'none', 0, hitId, false, group);
                if (fade && performance.now() - this.dissolveStart < dissolveDuration)
                    group.animate(fade === 'in' ? [{opacity:0}, {opacity:1}] : [{opacity:1}, {opacity:0}],
                        {duration:dissolveDuration, delay:this.dissolveStart - performance.now(), fill:'both'});
            } else {
                add(path(f),style.fill,selected?'#202325':style.stroke,selected?3:style.width,id,style.dash);
            }
        }
        for (const f of this.features.filter(f=>f.properties?.dissolve !== 'out' && String(f.properties?.recordId)===this.selected)) {
            const point=f.geometry.type.includes('Point'), area=f.geometry.type.includes('Polygon');
            const id=String(f.properties.recordId);
            path.pointRadius(13);
            add(path(f),point?'#fff4db':'none','#ffffff',point?4:8,id);
            path.pointRadius(9);
            add(path(f),point?'#d67a2c':area?'#d67a2c44':'none','#87451c',point?2:4,id);
        }
        // Sample the already horizon-clipped SVG path, so arrows cannot leak
        // from the far side of the globe or jump between clipped components.
        for(const f of this.features) for(const coordinates of directedLines(f)) {
            const d=path({type:'LineString',coordinates});if(!d)continue;
            const measure=document.createElementNS(SVG,'path');measure.setAttribute('d',d);
            const length=measure.getTotalLength();if(length<24)continue;
            const count=Math.max(1,Math.floor(length/90));
            for(let i=0;i<count;i++){
                const position=length*(i+0.5)/count;
                const a=measure.getPointAtLength(Math.max(0,position-2)),b=measure.getPointAtLength(Math.min(length,position+2));
                if(Math.hypot(b.x-a.x,b.y-a.y)>10)continue;
                const p=measure.getPointAtLength(position),angle=Math.atan2(b.y-a.y,b.x-a.x),c=Math.cos(angle),s=Math.sin(angle);
                const points=[[7,0],[-5,-4],[-3,0],[-5,4]].map(([x,y])=>[p.x+x*c-y*s,p.y+x*s+y*c]);
                add('M'+points.map(v=>v.join(',')).join('L')+'Z',routeStyle(f.properties.variant).color,'white',0.7,String(f.properties.recordId));
                fragment.lastChild.setAttribute('data-direction-arrow','true');
            }
        }
        this.svg.replaceChildren(fragment);
    }
}
