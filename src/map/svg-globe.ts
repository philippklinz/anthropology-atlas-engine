import { geoOrthographic,geoPath } from 'd3-geo';
import type { GeoProjection } from 'd3-geo';
import type { FeatureCollection,Feature,Position,Polygon,MultiPolygon } from 'geojson';
import type { Camera } from '../domain/records.ts';
const SVG='http://www.w3.org/2000/svg';
// d3's spherical polygon convention is clockwise; GeoJSON uses counterclockwise.
function sphericalFeature(feature:Feature):Feature{
  const f=structuredClone(feature),g=f.geometry;
  const rewind=(rings:Position[][])=>rings.forEach((r,i)=>{const a=r.slice(1).reduce((sum,p,j)=>sum+r[j][0]*p[1]-p[0]*r[j][1],0);if((a>0)===(i===0))r.reverse();});
  if(g.type==='Polygon')rewind(g.coordinates);if(g.type==='MultiPolygon')g.coordinates.forEach(rewind);return f;
}
export class SvgGlobe {
  container:HTMLElement;svg:SVGSVGElement;projection:GeoProjection;current:Camera;land:Feature[]=[];features:Feature[]=[];selected?:string;observer:ResizeObserver;timer?:ReturnType<typeof setTimeout>;start?:{x:number;y:number;camera:Camera};moved=false;
  constructor(container:HTMLElement,camera:Camera,onCamera:(c:Camera)=>void,onSelect:(ids:string[])=>void){
    this.container=container;container.replaceChildren();this.current=camera;this.projection=geoOrthographic();
    this.svg=document.createElementNS(SVG,'svg');this.svg.setAttribute('role','img');this.svg.setAttribute('aria-label','Globe · SVG fallback');this.svg.classList.add('svg-globe');this.svg.tabIndex=0;container.append(this.svg);
    const note=document.createElement('span');note.className='renderer-note';note.textContent='SVG · WebGL2 unavailable';container.append(note);
    this.observer=new ResizeObserver(()=>this.draw());this.observer.observe(container);
    void fetch(new URL('basemap/land.geojson',document.baseURI)).then(r=>r.json()).then((f:FeatureCollection)=>{this.land=f.features.map(sphericalFeature);this.draw();}).catch(()=>{note.textContent='Basemap unavailable';});
    this.svg.addEventListener('pointerdown',e=>{if(e.button!==0)return;clearTimeout(this.timer);this.start={x:e.clientX,y:e.clientY,camera:{...this.current}};this.moved=false;this.svg.setPointerCapture(e.pointerId);});
    this.svg.addEventListener('pointermove',e=>{if(!this.start)return;const dx=e.clientX-this.start.x,dy=e.clientY-this.start.y;if(Math.abs(dx)+Math.abs(dy)<3)return;this.moved=true;const factor=90/this.projection.scale();this.current={...this.current,longitude:((this.start.camera.longitude-dx*factor+180)%360+360)%360-180,latitude:Math.max(-85,Math.min(85,this.start.camera.latitude+dy*factor))};this.draw();});
    this.svg.addEventListener('pointerup',e=>{const started=this.start;this.start=undefined;if(started&&this.moved)onCamera(this.camera());else{const hits=document.elementsFromPoint(e.clientX,e.clientY).filter(el=>el.hasAttribute('data-record-id')).map(el=>el.getAttribute('data-record-id')!);if(hits.length)onSelect([...new Set(hits)]);}});
    this.svg.addEventListener('pointercancel',()=>{if(this.start){this.current=this.start.camera;this.start=undefined;this.draw();}});
    this.svg.addEventListener('wheel',e=>{e.preventDefault();this.current={...this.current,metersPerPixel:Math.max(200,Math.min(150000,this.current.metersPerPixel*Math.exp(e.deltaY*0.001)))};this.draw();clearTimeout(this.timer);this.timer=setTimeout(()=>onCamera(this.camera()),180);},{passive:false});
    this.svg.addEventListener('keydown',e=>{const key=e.key;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(key)){e.preventDefault();const c={...this.current};if(key==='ArrowLeft')c.longitude-=10;if(key==='ArrowRight')c.longitude+=10;if(key==='ArrowUp')c.latitude=Math.min(85,c.latitude+10);if(key==='ArrowDown')c.latitude=Math.max(-85,c.latitude-10);if(key==='+')c.metersPerPixel=Math.max(200,c.metersPerPixel/1.4);if(key==='-')c.metersPerPixel=Math.min(150000,c.metersPerPixel*1.4);c.longitude=((c.longitude+180)%360+360)%360-180;this.current=c;this.draw();onCamera(this.camera());}});
    this.draw();
  }
  camera(){return {...this.current};}
  setCamera(c:Camera){clearTimeout(this.timer);this.current=c;this.draw();}
  setFeatures(f:FeatureCollection,selected?:string){this.features=f.features.map(sphericalFeature);this.selected=selected;this.draw();}
  resize(){this.draw();}
  draw(){
    const w=this.container.clientWidth,h=this.container.clientHeight;if(!w||!h)return;
    this.svg.setAttribute('viewBox',`0 0 ${w} ${h}`);this.projection.translate([w/2,h/2]).scale(6371008.8/this.current.metersPerPixel).rotate([-this.current.longitude,-this.current.latitude,-(this.current.bearing??0)]).clipAngle(90);
    const path=geoPath(this.projection),fragment=document.createDocumentFragment();
    const add=(d:string|null,fill:string,stroke:string,width=1,recordId?:string,dashed=false)=>{if(!d)return;const el=document.createElementNS(SVG,'path');el.setAttribute('d',d);el.setAttribute('fill',fill);el.setAttribute('stroke',stroke);el.setAttribute('stroke-width',String(width));if(dashed)el.setAttribute('stroke-dasharray','5 4');if(recordId){el.dataset.recordId=recordId;el.style.cursor='pointer';}fragment.append(el);};
    add(path({type:'Sphere'}),'#cbded7','#9fbdb0');
    for(const f of this.land)add(path(f),'#f5f3ea','#a6bbb0',0.7);
    for(const f of this.features){const area=['Polygon','MultiPolygon'].includes(f.geometry.type),point=f.geometry.type.includes('Point'),id=String(f.properties?.recordId),selected=id===this.selected;path.pointRadius(selected?8:5);add(path(f),area?'#009e9844':point?'#006f6b':'none',selected?'#202325':point?'white':area?'#00766d':'#9e613f',selected?3:point?2:1.8,id,!area&&!point);}
    this.svg.replaceChildren(fragment);
  }
}
