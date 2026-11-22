import { Map as GlobeMap, NavigationControl, ScaleControl } from 'maplibre-gl';
import type { GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Camera } from '../domain/records.ts';
import type { FeatureCollection } from 'geojson';
const CIRCUMFERENCE=40075016.686;
export class AtlasMap {
  map:GlobeMap;ready=false;setting=false;pending?:FeatureCollection;selected?:string;onCamera:(camera:Camera)=>void;
  constructor(container:HTMLElement,camera:Camera,onCamera:AtlasMap['onCamera'],onSelect:(ids:string[])=>void,onError:(message:string)=>void){
    this.onCamera=onCamera;
    this.map=new GlobeMap({container,style:{version:8,projection:{type:'globe'},sources:{land:{type:'geojson',data:new URL('basemap/land.geojson',document.baseURI).href}},layers:[{id:'ocean',type:'background',paint:{'background-color':'#d8e6e2'}},{id:'land',type:'fill',source:'land',paint:{'fill-color':'#f5f3ea'}},{id:'coast',type:'line',source:'land',paint:{'line-color':'#a0b5ad','line-width':0.8}}]},center:[camera.longitude,camera.latitude],zoom:this.zoom(camera),bearing:camera.bearing??0,pitch:camera.pitch??0,maxPitch:60,attributionControl:false,canvasContextAttributes:{antialias:true}});
    this.map.addControl(new NavigationControl({showCompass:true}),'top-right');this.map.addControl(new ScaleControl({maxWidth:140,unit:'metric'}),'bottom-left');
    this.map.on('error',e=>onError(e.error.message));
    this.map.on('load',()=>{
      this.ready=true;this.map.addSource('historical',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
      this.map.addLayer({id:'areas',type:'fill',source:'historical',filter:['==',['geometry-type'],'Polygon'],paint:{'fill-color':'#009e98','fill-opacity':0.28}});
      this.map.addLayer({id:'outlines',type:'line',source:'historical',filter:['==',['geometry-type'],'Polygon'],paint:{'line-color':'#00726d','line-width':2}});
      this.map.addLayer({id:'connections',type:'line',source:'historical',filter:['==',['geometry-type'],'LineString'],paint:{'line-color':'#9e613f','line-width':2.5,'line-dasharray':[2,2]}});
      this.map.addLayer({id:'places',type:'circle',source:'historical',filter:['==',['geometry-type'],'Point'],paint:{'circle-radius':6,'circle-color':'#006f6b','circle-stroke-color':'#ffffff','circle-stroke-width':2}});
      this.map.addLayer({id:'selection',type:'line',source:'historical',filter:['==',['get','recordId'],''],paint:{'line-color':'#202325','line-width':4}});
      if(this.pending)this.setFeatures(this.pending,this.selected);
    });
    this.map.on('click',e=>{if(!this.ready)return;const hits=this.map.queryRenderedFeatures(e.point,{layers:['places','areas','connections']});const ids=[...new Set(hits.map(h=>String(h.properties.recordId)))];if(ids.length)onSelect(ids);});
    this.map.on('mousemove',e=>{if(this.ready)this.map.getCanvas().style.cursor=this.map.queryRenderedFeatures(e.point,{layers:['places','areas','connections']}).length?'pointer':'';});
    this.map.on('moveend',()=>{if(!this.setting)this.onCamera(this.camera());});
    this.map.on('zoomend',()=>{const c=this.camera();if(c.metersPerPixel<200)this.setCamera({...c,metersPerPixel:200});});
  }
  zoom(c:Camera):number{return Math.log2(CIRCUMFERENCE*Math.cos(c.latitude*Math.PI/180)/(512*c.metersPerPixel));}
  camera():Camera{const c=this.map.getCenter();return {longitude:((c.lng+180)%360+360)%360-180,latitude:Math.max(-85,Math.min(85,c.lat)),metersPerPixel:Math.max(200,CIRCUMFERENCE*Math.cos(c.lat*Math.PI/180)/(512*2**this.map.getZoom())),bearing:this.map.getBearing(),pitch:this.map.getPitch()};}
  setCamera(c:Camera){this.setting=true;this.map.jumpTo({center:[c.longitude,c.latitude],zoom:this.zoom(c),bearing:c.bearing??0,pitch:c.pitch??0});this.setting=false;}
  setFeatures(f:FeatureCollection,selected?:string){this.pending=f;this.selected=selected;if(!this.ready)return;(this.map.getSource('historical') as GeoJSONSource).setData(f);this.map.setFilter('selection',['==',['get','recordId'],selected??'']);}
  resize(){this.map.resize();}
}
