import type { Camera, Chapter } from '../domain/records.ts';
import { epochDay, yearRange, normalizeTime, calendarDate } from '../domain/time.ts';
import type { Filters } from '../catalog/contract.ts';
export const views=['map','chapter','entity','assertion','event','source','network','model','search','about','licenses'] as const;
export type View=typeof views[number];
export type TimeSelection={year:number}|{from:number;to:number};
export type AtlasState={version:1;view:View;id?:string;language:'de'|'en';sourceKey:string;release:string;chapter:string;step?:string;time:TimeSelection;camera:Camera;layers:string[];types:string[];packages:string[];mode:'overlap'|'contained';includeUndated:boolean;interpretations:Record<string,string>;query:string;expanded:string[];selection:string[];detail:string;spatialFilter?:[number,number,number,number]};
export const uniq=(a:string[])=>[...new Set(a)].sort();
export function defaultState(chapter:Chapter,sourceKey:string,release:string,language='de'):AtlasState{
  const t=normalizeTime(chapter.initialState.time),year=t.possible?calendarDate(t.possible.from).year:1;
  return {version:1,view:'chapter',id:chapter.id,language:language==='en'?'en':'de',sourceKey,release,chapter:chapter.id,time:{year},camera:chapter.initialState.camera,layers:uniq([...chapter.initialState.layers,'located-at','events']),types:[],packages:[],mode:'overlap',includeUndated:false,interpretations:Object.fromEntries((chapter.interpretationChoices??[]).map(c=>[c.interpretationId,c.assertionId])),query:'',expanded:[],selection:[],detail:'overview'};
}
export function filters(s:AtlasState):Filters{return {range:'year' in s.time?yearRange(s.time.year):s.time,mode:s.mode,includeUndated:s.includeUndated,layers:s.layers,types:s.types,packages:s.packages,interpretations:s.interpretations};}
export function normalizeState(s:AtlasState):AtlasState{
  const r=structuredClone(s);r.layers=uniq(r.layers);r.types=uniq(r.types);r.packages=uniq(r.packages);r.expanded=uniq(r.expanded);r.selection=uniq(r.selection);
  r.interpretations=Object.fromEntries(Object.entries(r.interpretations).sort(([a],[b])=>a.localeCompare(b)));
  if(r.id===undefined)delete r.id;if(r.step===undefined)delete r.step;if(r.spatialFilter===undefined)delete r.spatialFilter;
  const round=(v:number,n:number)=>Number(v.toFixed(n));
  r.camera={longitude:round(r.camera.longitude,6),latitude:round(r.camera.latitude,6),metersPerPixel:round(r.camera.metersPerPixel,3),bearing:round(r.camera.bearing??0,3),pitch:round(r.camera.pitch??0,3)};
  return r;
}
export function encodeState(input:AtlasState):string{
  const s=normalizeState(input),q=new URLSearchParams();
  q.set('lang',s.language);q.set('source',s.sourceKey);q.set('release',s.release);q.set('chapter',s.chapter);
  if('year' in s.time)q.set('at',String(s.time.year));else q.set('range',`${s.time.from},${s.time.to}`);
  q.set('camera',[s.camera.longitude,s.camera.latitude,s.camera.metersPerPixel,s.camera.bearing,s.camera.pitch].join(','));
  for(const key of ['layers','types','packages','expanded','selection'] as const)q.set(key,s[key].join(','));
  q.set('mode',s.mode);q.set('undated',s.includeUndated?'1':'0');q.set('detail',s.detail);
  if(s.step)q.set('step',s.step);if(s.query)q.set('q',s.query);
  if(Object.keys(s.interpretations).length)q.set('interpretations',JSON.stringify(s.interpretations));
  if(s.spatialFilter)q.set('bbox',s.spatialFilter.join(','));
  return `#/v1/${s.view}${s.id?'/'+encodeURIComponent(s.id):''}?${q}`;
}
export function decodeState(hash:string,defaults:AtlasState,chapters:Chapter[]=[]):{state:AtlasState;warnings:string[]}{
  if(!hash||hash==='#'||hash==='#/')return {state:normalizeState(defaults),warnings:[]};
  const [route,query='']=hash.slice(1).split('?');const parts=route.split('/');
  if(parts[1]!=='v1'||!views.includes(parts[2] as View)||parts.length>4)throw new Error('URL_ROUTE: unsupported route');
  const q=new URLSearchParams(query),warnings:string[]=[];
  const chapterId=q.get('chapter')??(parts[2]==='chapter'&&parts[3]?decodeURIComponent(parts[3]):defaults.chapter);
  const chapter=chapters.find(c=>c.id===chapterId);
  const s=chapter?defaultState(chapter,defaults.sourceKey,defaults.release,defaults.language):structuredClone(defaults);
  s.view=parts[2] as View;s.id=parts[3]?decodeURIComponent(parts[3]):undefined;
  const required=['chapter','entity','assertion','event','source','model'];
  if(required.includes(s.view)&&!s.id)throw new Error('URL_TARGET: missing record ID');
  if(s.id&&!/^[a-z]+(?:-[a-z]+)*:[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s.id))throw new Error('URL_TARGET: malformed record ID');
  for(const key of ['source','release'])if(q.has(key)&&q.get(key)!==(key==='source'?defaults.sourceKey:defaults.release))throw new Error('URL_RELEASE: requested source or release is unavailable');
  if(q.has('lang')){if(!['de','en'].includes(q.get('lang')!))throw new Error('URL_LANGUAGE: unsupported language');s.language=q.get('lang') as 'de'|'en';}
  s.chapter=q.get('chapter')??(s.view==='chapter'?s.id!:s.chapter);s.step=q.get('step')??undefined;
  if(s.view==='chapter'&&s.chapter!==s.id)throw new Error('URL_TARGET: conflicting chapter');
  if(q.has('at')&&q.has('range'))throw new Error('URL_TIME: choose a cursor or range');
  if(q.has('at')){const y=Number(q.get('at'));if(!/^-?\d+$/.test(q.get('at')!))throw new Error('URL_TIME: invalid year');yearRange(y);s.time={year:y};}
  if(q.has('range')){const [from,to,...rest]=q.get('range')!.split(',').map(Number);if(rest.length||![from,to].every(Number.isInteger)||from>=to||from<epochDay({year:-10000,month:1,day:1})||to>epochDay({year:2100,month:12,day:31})+1)throw new Error('URL_TIME: invalid range');s.time={from,to};}
  if(q.has('camera')){const a=q.get('camera')!.split(',').map(Number);if(a.length===5&&a.every(Number.isFinite)&&Math.abs(a[0])<=180&&Math.abs(a[1])<=85&&a[2]>=200&&a[2]<=1000000&&Math.abs(a[3])<=360&&a[4]>=0&&a[4]<=60)s.camera={longitude:a[0],latitude:a[1],metersPerPixel:a[2],bearing:a[3],pitch:a[4]};else warnings.push('URL_CAMERA');}
  for(const key of ['layers','types','packages','expanded','selection'] as const)if(q.has(key))s[key]=q.get(key)!.split(',').filter(Boolean);
  if(q.has('mode')){if(!['overlap','contained'].includes(q.get('mode')!))throw new Error('URL_FILTER: invalid time mode');s.mode=q.get('mode') as typeof s.mode;}
  s.includeUndated=q.get('undated')==='1';s.query=q.get('q')??'';s.detail=q.get('detail')??'overview';
  if(q.has('interpretations')){const v=JSON.parse(q.get('interpretations')!);if(!v||Array.isArray(v)||typeof v!=='object'||Object.values(v).some(x=>typeof x!=='string'))throw new Error('URL_INTERPRETATION: invalid choices');s.interpretations=v;}
  if(q.has('bbox')){const v=q.get('bbox')!.split(',').map(Number);if(v.length!==4||!v.every(Number.isFinite)||Math.abs(v[0])>180||Math.abs(v[2])>180||Math.abs(v[1])>90||Math.abs(v[3])>90||v[1]>v[3])throw new Error('URL_SPACE: invalid bounding box');s.spatialFilter=v as [number,number,number,number];}
  return {state:normalizeState(s),warnings};
}
export function target(s:AtlasState,view:View,id?:string):AtlasState{return {...s,view,id};}
