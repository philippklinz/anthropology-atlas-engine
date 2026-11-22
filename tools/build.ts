import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, extname, join, posix, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import type { AtlasRecord, Package, Chapter } from '../src/domain/records.ts';
import type { Catalog, FileEntry, RecordIndex, Relation, SearchDocument, SpatialEntry } from '../src/catalog/contract.ts';
import { normalizeTime } from '../src/domain/time.ts';
import { geometryBBox, normalizeWinding } from './geometry.ts';
import { validate, makeValidators } from './validate.ts';
import type { Profile, Validation } from './validate.ts';
export const COMPILER_VERSION='0.1.0-dev.1';
export const sha256=(b:Uint8Array|string)=>createHash('sha256').update(b).digest('hex');
export function report(v:Validation){return {profile:v.profile,records:v.records.size,errors:v.issues.filter(x=>x.severity==='error').length,warnings:v.issues.filter(x=>x.severity==='warning').length,issues:v.issues};}
export async function buildContent(root:string,out:string,profile:Profile,sourceRevision:string):Promise<Catalog>{
  if(!/^[a-f0-9]{40}$/.test(sourceRevision))throw new Error('BUILD_REVISION: provide the full source Git commit');
  if(profile!=='fixture'&&/^0+$/.test(sourceRevision))throw new Error('BUILD_REVISION: uncommitted-fixture sentinel is not allowed');
  const v=await validate(root,profile),r=report(v);
  if(r.errors)throw new Error(JSON.stringify(r,null,2));
  const output=resolve(out),source=resolve(root);
  if(output===source)throw new Error('BUILD_OUTPUT: output must not be the source root');
  const selected=new Set<string>();
  function include(id:string){if(selected.has(id))return;selected.add(id);const p=v.records.get(id) as Package;for(const dep of p.dependencies)include(dep);}
  v.dataset.packageIds.forEach(include);
  const ids=new Set([...selected]);for(const pk of selected)for(const id of (v.records.get(pk) as Package).recordIds)ids.add(id);
  const originals=[...ids].sort().map(id=>v.records.get(id)!);
  const inputFingerprint=sha256(JSON.stringify(originals)+[...v.payloads].sort(([a],[b])=>a.localeCompare(b)).map(([p,b])=>p+sha256(b)).join('')+COMPILER_VERSION+sourceRevision+profile);
  const dataReleaseId=`${profile}-${inputFingerprint.slice(0,20)}`;
  const packages=[...selected].sort(),langs=[...new Set(packages.flatMap(p=>(v.records.get(p) as Package).languages))].sort();
  const caps=[...new Set(packages.flatMap(p=>(v.records.get(p) as Package).requiredCapabilities))].sort();
  const chapters=originals.filter((r):r is Chapter=>r.kind==='chapter');
  if(!chapters.length)throw new Error('BUILD_EMPTY: add a package with an entry chapter before publishing');
  await mkdir(output,{recursive:true});const files:FileEntry[]=[];
  const emit=async(role:string,label:string,bytes:Uint8Array|string,mediaType='application/json',extension='.json')=>{
    const body=typeof bytes==='string'?new TextEncoder().encode(bytes):bytes,hash=sha256(body),path=`files/${label}-${hash.slice(0,24)}${extension}`;
    if(!files.some(f=>f.path===path)){await mkdir(join(output,'files'),{recursive:true});await writeFile(join(output,path),body);files.push({path,role,bytes:body.length,mediaType,sha256:hash});}
    return path;
  };
  const json=async(role:string,label:string,value:unknown)=>emit(role,label,JSON.stringify(value)+'\n');
  const payloadPaths=new Map<string,string>();
  const payload=async(rec:AtlasRecord,file:string,role:string,mime:string)=>{
    const src=posix.join(posix.dirname(v.paths.get(rec.id)!),file),bytes=v.payloads.get(src);
    if(!bytes)throw new Error('BUILD_PAYLOAD: '+src);
    const key=role+':'+src;if(payloadPaths.has(key))return payloadPaths.get(key)!;
    const body=role==='geometry'?JSON.stringify(normalizeWinding(JSON.parse(new TextDecoder().decode(bytes))))+'\n':bytes;
    const path=await emit(role,role,body,mime,extname(file));payloadPaths.set(key,path);return path;
  };
  const compiled:AtlasRecord[]=[];
  for(const original of originals){
    const copy=structuredClone(original);
    if(copy.kind==='geometry')copy.file=await payload(original,copy.file,'geometry','application/geo+json');
    if(copy.kind==='asset'){
      copy.file=await payload(original,copy.file,'asset',copy.mediaType);
      if(copy.model?.previewFile)copy.model.previewFile=await payload(original,copy.model.previewFile,'asset','image/png');
    }
    if(copy.kind==='chapter')for(const lang of Object.keys(copy.textFiles))copy.textFiles[lang]=await payload(original,copy.textFiles[lang],'text','text/markdown');
    compiled.push(copy);
  }
  const registry=new Map(compiled.map(r=>[r.id,r]));
  const index:RecordIndex={indexVersion:'1',dataReleaseId,records:{},chapters:compiled.filter((r):r is Chapter=>r.kind==='chapter')};
  for(const pk of packages){
    const chunk=compiled.filter(r=>r.id===pk||v.owners.get(r.id)===pk);
    const path=await json('records',pk.split(':')[1],{indexVersion:'1',dataReleaseId,records:Object.fromEntries(chunk.map(r=>[r.id,r]))});
    for(const r of chunk)index.records[r.id]={path,packageId:v.owners.get(r.id)??r.id,kind:r.kind,type:r.kind==='entity'?r.entityType:r.kind==='assertion'?r.predicate:r.kind==='event'?r.eventType:r.kind,labels:'labels' in r?r.labels:r.kind==='source'?{[v.dataset.defaultLanguage]:r.title}:r.kind==='interpretation'?r.question:{}};
  }
  const times:Record<string,ReturnType<typeof normalizeTime>>={},edges:Relation[]=[],spatial:SpatialEntry[]=[],search:SearchDocument[]=[];
  for(const r of compiled){
    if('time' in r)times[r.id]=normalizeTime(r.time);
    if(r.kind==='assertion')edges.push({id:r.id,from:r.subjectId,to:r.objectId,predicate:r.predicate,symmetric:v.vocabulary.predicates[r.predicate].symmetric});
    if(r.kind==='event')for(const p of r.participants)edges.push({id:r.id,from:r.id,to:p.entityId,predicate:p.role,symmetric:false,event:true});
    if(r.kind==='assertion'||r.kind==='event')for(const s of r.spatial??[]){const g=registry.get(s.geometryId);if(g?.kind==='geometry'){const src=posix.join(posix.dirname(v.paths.get(g.id)!),(v.records.get(g.id) as typeof g).file);const f=JSON.parse(new TextDecoder().decode(v.payloads.get(src)!));spatial.push({recordId:r.id,geometryId:g.id,path:g.file,role:s.role,bbox:geometryBBox(f.geometry)});}}
    const labels=index.records[r.id].labels;
    search.push({id:r.id,labels,aliases:r.kind==='entity'?(r.names??[]).map(n=>n.text):[],text:'summary' in r?Object.values(r.summary??{}).join(' '):r.kind==='source'?r.title:'',type:index.records[r.id].type!});
  }
  const relations:Record<string,Relation[]>={};
  for(const edge of edges)for(const id of new Set([edge.from,edge.to]))(relations[id]??=[]).push(edge);
  const wrap=(items:unknown)=>({indexVersion:'1',dataReleaseId,items});
  const recordIndex=await json('record-index','record-index',index);
  const searches:Record<string,string>={};for(const lang of langs)searches[lang]=await json('search','search-'+lang,wrap(search));
  const time=await json('time','time',wrap(times)),relationPath=await json('relations','relations',wrap(relations)),spatialPath=await json('spatial','spatial',wrap(spatial));
  const licenseInventory=await json('licenses','licenses',wrap(compiled.filter(r=>r.kind==='geometry'||r.kind==='asset').map(r=>({id:r.id,...(r.kind==='geometry'||r.kind==='asset'?r.rights:{})}))));
  const catalog:Catalog={catalogVersion:'1',schemaVersion:'0.1.0',indexVersion:'1',dataReleaseId,sourceRevision,compilerVersion:COMPILER_VERSION,packages,languages:langs,requiredCapabilities:caps,files:files.sort((a,b)=>a.path.localeCompare(b.path)),entrypoints:{recordIndex,search:searches,time,relations:relationPath,spatial:spatialPath,defaultChapterId:chapters[0].id},licenseInventory};
  const validators=await makeValidators();if(!validators.catalog(catalog))throw new Error('BUILD_CATALOG: '+JSON.stringify(validators.catalog.errors));
  await writeFile(join(output,'catalog.json'),JSON.stringify(catalog,null,2)+'\n');
  await writeFile(join(output,'validation.json'),JSON.stringify(report(v),null,2)+'\n');
  return catalog;
}
