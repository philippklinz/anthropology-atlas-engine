import test from 'node:test';
import assert from 'node:assert/strict';
import { cp,mkdtemp,readFile,writeFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join,resolve } from 'node:path';
import { validate } from '../../tools/validate.ts';
import { validateGeometry } from '../../tools/geometry.ts';
import { buildContent } from '../../tools/build.ts';
import { StaticProvider } from '../../src/catalog/provider.ts';
import { defaultState,filters } from '../../src/state/state.ts';
import { createServer } from 'node:http';
const fixture=resolve('fixtures/reference-package');
test('Fixture resolves all records and is explicitly rejected for a historical release',async()=>{const good=await validate(fixture,'fixture');assert.deepEqual(good.issues.filter(x=>x.severity==='error'),[]);assert.equal(good.records.size,39);const release=await validate(fixture,'release');assert.ok(release.issues.some(x=>x.code==='RELEASE_SYNTHETIC'));});
test('Invalid genealogy, dates, references, package ownership and citations report rule codes',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'atlas-negative-'));await cp(fixture,dir,{recursive:true});
  const change=async(path:string,fn:(v:any)=>void)=>{const full=join(dir,path),v=JSON.parse(await readFile(full,'utf8'));fn(v);await writeFile(full,JSON.stringify(v));};
  await change('assertions/script-derived-from/demo-script-descent.json',r=>r.objectId='language:demo-language');
  await change('assertions/trades-with/demo-trade.json',r=>{r.sourceRefs[0].appliesTo=['/no-such-field'];r.time.start.earliest={year:1900,month:2,day:29};});
  await change('packages/demo-core/manifest.json',r=>r.dependencies=['package:demo-reuse']);
  await change('packages/demo-reuse/manifest.json',r=>r.recordIds.push('place:demo-port-a'));
  const result=await validate(dir,'fixture');const codes=new Set(result.issues.map(x=>x.code));for(const code of ['RELATION_TYPES','SOURCE_POINTER','TIME_CALENDAR','PACKAGE_CYCLE','PACKAGE_DUPLICATE_OWNER'])assert.ok(codes.has(code),code);
  await rm(dir,{recursive:true,force:true});
});
test('Topology rejects self intersections, external holes, degeneracy and uncut dateline',()=>{
  const feature=(coordinates:number[][][],type='Polygon')=>({type:'Feature',id:'geometry:test',properties:{},geometry:{type,coordinates}});
  for(const rings of [[[[0,0],[2,2],[0,2],[2,0],[0,0]]],[[[0,0],[4,0],[4,4],[0,4],[0,0]],[[8,8],[9,8],[9,9],[8,9],[8,8]]],[[[0,0],[1,0],[2,0],[0,0]]],[[[179,0],[-179,0],[-179,1],[179,1],[179,0]]]])assert.throws(()=>validateGeometry(feature(rings) as any,'geometry:test','Polygon'));
});
test('Compiled indices load by HTTP, include incoming edges, preserve gaps and detect tampering',async()=>{
  const out=await mkdtemp(join(tmpdir(),'atlas-build-'));const catalog=await buildContent(fixture,out,'fixture','0'.repeat(40));
  const server=createServer(async(req,res)=>{try{res.setHeader('Access-Control-Allow-Origin','*');res.end(await readFile(join(out,new URL(req.url!,'http://local').pathname)));}catch{res.statusCode=404;res.end();}});
  await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const address=server.address() as {port:number};
  try{
    const base=new URL(`http://127.0.0.1:${address.port}/`),config={configVersion:'1',instanceId:'test',defaultLanguage:'de',content:{mode:'http',catalogUrl:new URL('catalog.json',base).href,updatePolicy:'on-reload'}};
    const p=await StaticProvider.open(config,new URL('http://different-origin.example/'));const ch=await p.getRecord(catalog.entrypoints.defaultChapterId);assert.equal(ch.kind,'chapter');if(ch.kind!=='chapter')return;
    const s=defaultState(ch,p.sourceKey,catalog.dataReleaseId),f=filters(s);
    assert.ok((await p.relations('place:demo-port-b',f)).items.some(r=>r.id==='assertion:demo-trade'));
    assert.ok((await p.features(undefined,f)).features.some(x=>x.properties?.recordId==='assertion:demo-control-a'));
    assert.equal((await p.features(undefined,filters({...s,time:{year:1302}}))).features.some(x=>x.properties?.layer==='controls'),false);
    const file=catalog.files.find(x=>x.role==='search')!;await writeFile(join(out,file.path),'tampered');await assert.rejects(()=>p.bytes(file.path),/CONTENT_(SIZE|HASH)/);
  }finally{await new Promise<void>(r=>server.close(()=>r()));await rm(out,{recursive:true,force:true});}
});
