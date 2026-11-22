import test,{assert} from './harness.js';
import {sha256,sha256Portable} from '../src/domain/hash.js';
import {validate} from '../tools/validate.js';
import {validateGeometry} from '../tools/geometry.js';
import {buildContent} from '../tools/build.js';
import {Workspace,loadFixture} from '../tools/workspace.js';
import {StaticProvider,resolveConfig} from '../src/catalog/provider.js';
import {defaultState,filters,encodeState,decodeState,normalizeState} from '../src/state/state.js';
import {emptyContext} from '../src/state/empty.js';
import {setWorkerUrl,setWorkerCount,getGlobalDispatcher} from '../vendor/maplibre/maplibre-gl.mjs';
let fixture;
test('SHA-256 works with WebCrypto and on HTTP LAN hosts',async()=>{
  for(const [input,expected] of [['','e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],['abc','ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],['a'.repeat(1000000),'cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0']]){assert.equal(sha256Portable(input),expected);assert.equal(await sha256(input),expected)}
});
test('Default config selects content/main; another branch and local HTTP source resolve',async()=>{
  const c=await fetch('../atlas.config.json').then(r=>r.json()),base=new URL('../',location.href);
  assert.equal(resolveConfig(c,base).catalogURL.href,'https://raw.githubusercontent.com/philippklinz/anthropology-atlas-content/main/published/catalog.json');
  c.content.branch='feature/research';assert.ok(resolveConfig(c,base).catalogURL.href.includes('feature%2Fresearch/'));
  c.content={mode:'http',catalogUrl:'http://localhost:8080/anthropology-atlas-content/published/catalog.json',updatePolicy:'on-reload'};
  assert.equal(resolveConfig(c,base).catalogURL.hostname,'localhost');
});
test('Fixture validates 39 records; synthetic content cannot become a historical release',async()=>{
  fixture=await loadFixture();const good=await validate(fixture,'fixture');assert.deepEqual(good.issues.filter(x=>x.severity==='error'),[]);assert.equal(good.records.size,39);
  const release=await validate(fixture,'release');assert.ok(release.issues.some(x=>x.code==='RELEASE_SYNTHETIC'));
});
test('Wrong genealogy, dates, citations, cycles and duplicate owners retain semantic errors',async()=>{
  const work=fixture.clone();const change=async(path,fn)=>{const r=JSON.parse(await work.readFile(path,'utf8'));fn(r);work.set(path,JSON.stringify(r))};
  await change('assertions/script-derived-from/demo-script-descent.json',r=>r.objectId='language:demo-language');
  await change('assertions/trades-with/demo-trade.json',r=>{r.sourceRefs[0].appliesTo=['/no-such-field'];r.time.start.earliest={year:1900,month:2,day:29}});
  await change('packages/demo-core/manifest.json',r=>r.dependencies=['package:demo-reuse']);
  await change('packages/demo-reuse/manifest.json',r=>r.recordIds.push('place:demo-port-a'));
  const codes=new Set((await validate(work,'fixture')).issues.map(x=>x.code));for(const code of ['RELATION_TYPES','SOURCE_POINTER','TIME_CALENDAR','PACKAGE_CYCLE','PACKAGE_DUPLICATE_OWNER'])assert.ok(codes.has(code),code);
});
test('Topology rejects bow-ties, external holes, degeneracy and uncut dateline',()=>{
  for(const rings of [[[[0,0],[2,2],[0,2],[2,0],[0,0]]],[[[0,0],[4,0],[4,4],[0,4],[0,0]],[[8,8],[9,8],[9,9],[8,9],[8,8]]],[[[0,0],[1,0],[2,0],[0,0]]],[[[179,0],[-179,0],[-179,1],[179,1],[179,0]]]])assert.throws(()=>validateGeometry({type:'Feature',id:'geometry:test',properties:{},geometry:{type:'Polygon',coordinates:rings}},'geometry:test','Polygon'));
});
test('Browser compiler exports reproducible catalogues, payload hashes and ZIP bytes',async()=>{
  const a=await buildContent(fixture,'fixture','0'.repeat(40)),b=await buildContent(fixture,'fixture','0'.repeat(40));
  assert.deepEqual(a.catalog,b.catalog);
  for(const file of a.catalog.files){const bytes=await a.files.readFile(file.path);assert.equal(bytes.length,file.bytes);assert.equal(await sha256(bytes),file.sha256)}
  const zipped=new Workspace();zipped.set('dataset.json',await fixture.readFile('dataset.json'));assert.equal(await Workspace.fromZip(zipped.zip()).readFile('dataset.json','utf8'),await fixture.readFile('dataset.json','utf8'));
  assert.throws(()=>zipped.set('../escape.json','x'));
});
test('Empty draft is valid and navigable; empty historical release is rejected',async()=>{
  const work=new Workspace();work.set('dataset.json',JSON.stringify({schemaVersion:'0.1.0',defaultLanguage:'de',defaultRecordLicense:'GPL-2.0',packageIds:[]}));
  const result=await buildContent(work,'draft','a'.repeat(40));assert.equal(result.catalog.entrypoints.defaultChapterId,null);assert.deepEqual(result.catalog.languages,['de']);
  const state=defaultState(emptyContext,'s','r');assert.deepEqual(decodeState(encodeState(state),state).state,normalizeState(state));
  await assert.rejects(()=>buildContent(work,'release','a'.repeat(40)),/RELEASE_EMPTY/);
});
test('Static HTTP catalog preserves incoming edges, territorial gaps and integrity failures',async()=>{
  const c=await fetch('../atlas.config.json').then(r=>r.json());c.content=c.demo;const p=await StaticProvider.open(c,new URL('../',location.href));
  const ch=await p.getRecord(p.catalog.entrypoints.defaultChapterId),s=defaultState(ch,p.sourceKey,p.catalog.dataReleaseId),f=filters(s);
  assert.ok((await p.relations('place:demo-port-b',f)).items.some(r=>r.id==='assertion:demo-trade'));
  assert.ok((await p.features(undefined,f)).features.some(x=>x.properties.recordId==='assertion:demo-control-a'));
  assert.equal((await p.features(undefined,filters({...s,time:{year:1302}}))).features.some(x=>x.properties.layer==='controls'),false);
  const file=p.catalog.files.find(x=>x.role==='search');file.sha256='0'.repeat(64);await assert.rejects(()=>p.bytes(file.path),/CONTENT_HASH/);
});
test('Local MapLibre worker starts and processes the actual land GeoJSON without WebGL',async()=>{
  setWorkerCount(1);setWorkerUrl(new URL('../vendor/maplibre/maplibre-gl-worker.mjs',import.meta.url).href);
  const dispatcher=getGlobalDispatcher();let timeout;
  try{await Promise.race([(async()=>{await dispatcher.broadcast('SL',[]);const data=await fetch('../basemap/land.geojson').then(r=>r.json());assert.ok(data.features.length>0);const results=await dispatcher.broadcast('LD',{type:'geojson',source:'land-test',geojsonVtOptions:{},data});assert.equal(results.length,1);assert.ok(!results[0].abandoned)})(),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('MapLibre worker timeout')),15000)})]);}finally{clearTimeout(timeout);}
});

async function layoutFixture(storage) {
  const {AtlasLayout}=await import('../src/ui/layout.js');
  const shell=document.createElement('div');
  shell.style.cssText='height:600px;width:900px;position:relative';
  shell.innerHTML='<button id="menu-backdrop" hidden></button><aside id="sidebar"><button id="menu-close">Close</button><a href="#fixture">Chapter</a></aside><header id="topbar" style="height:66px"><button id="menu-button">Menu</button></header><main id="main"></main><footer id="timebar"><div id="timeline-resizer" tabindex="0"></div><div id="time-controls" style="height:76px"></div><div id="timeline"></div></footer>';
  document.body.append(shell);
  const controller=new AtlasLayout(shell,()=>{},storage);
  controller.sync({openNavigation:'Open',closeNavigation:'Close',resizeTimeline:'Height',resizeTimelineHint:'Drag'});
  controller.apply();
  return {shell,controller,get:id=>shell.querySelector('#'+id),destroy:()=>{controller.destroy();shell.remove()}};
}
test('Drawer controls hide inactive navigation, contain focus and preserve modified link clicks',async()=>{
  const f=await layoutFixture({getItem:()=>null,setItem:()=>{}});
  try {
    assert.ok(f.get('sidebar').inert);
    f.get('menu-button').click();
    assert.equal(f.get('menu-button').getAttribute('aria-expanded'),'true');
    assert.equal(f.get('sidebar').getAttribute('aria-modal'),'true');
    assert.ok(f.get('main').inert);assert.equal(document.activeElement,f.get('menu-close'));
    f.get('menu-close').dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true}));
    assert.equal(document.activeElement,f.get('sidebar').querySelector('a'));
    const anchor=f.get('sidebar').querySelector('a');
    anchor.addEventListener('click',e=>e.preventDefault());
    anchor.dispatchEvent(new MouseEvent('click',{button:0,ctrlKey:true,bubbles:true,cancelable:true}));
    assert.ok(f.controller.open);
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
    assert.ok(!f.controller.open);assert.ok(!f.get('main').inert);assert.equal(document.activeElement,f.get('menu-button'));
    f.get('menu-button').click();f.get('menu-backdrop').click();assert.ok(!f.controller.open);
    f.get('menu-button').click();anchor.click();assert.ok(!f.controller.open);
  } finally {f.destroy()}
});
test('Timeline panel keyboard resize is bounded, persistent and independent of navigation history',async()=>{
  let saved=null;
  const f=await layoutFixture({getItem:()=>null,setItem:(key,value)=>{saved=value}}),before=location.href;
  try {
    const grip=f.get('timeline-resizer'),initial=f.controller.actualHeight;
    grip.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp',bubbles:true,cancelable:true}));
    assert.equal(f.controller.actualHeight,initial+24);assert.equal(Number(saved),initial+24);
    grip.dispatchEvent(new KeyboardEvent('keydown',{key:'End',bubbles:true,cancelable:true}));
    assert.equal(f.controller.actualHeight,354);
    f.shell.style.height='420px';f.controller.apply();assert.equal(f.controller.actualHeight,174);
    f.shell.style.height='800px';f.controller.apply();assert.equal(f.controller.actualHeight,354);
    grip.dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true,cancelable:true}));
    assert.equal(f.controller.actualHeight,170);assert.equal(grip.getAttribute('aria-valuenow'),'170');
    assert.equal(location.href,before);
  } finally {f.destroy()}
  const blocked=await layoutFixture({getItem:()=>{throw Error('blocked')},setItem:()=>{throw Error('blocked')}});
  try {blocked.controller.save();assert.ok(blocked.controller.actualHeight>0)} finally {blocked.destroy()}
});
test('Switching chapter resets the timeline window even when the new dates fit inside the old view',async()=>{
  const {AtlasTimeline}=await import('../src/timeline/timeline.js');
  const {yearRange}=await import('../src/domain/time.js');
  const box=document.createElement('div');box.style.cssText='height:200px;width:900px';document.body.append(box);
  const p={times:{},index:{records:{}}};
  const a={language:'de',chapter:'chapter:wide-fixture',time:{from:yearRange(1300).from,to:yearRange(1350).to}};
  const b={...a,chapter:'chapter:narrow-fixture',time:{from:yearRange(1320).from,to:yearRange(1321).to}};
  const t=new AtlasTimeline(box,p,a,()=>{},()=>{});
  try {
    const wide=t.timeline.getWindow();t.update(b);const narrow=t.timeline.getWindow();
    assert.ok(narrow.end-narrow.start<(wide.end-wide.start)/5);
    box.style.height='340px';t.resize();assert.equal(box.querySelector('.vis-timeline').style.height,'100%');
  } finally {t.destroy();box.remove()}
});

test('Relative local-clone profile loads an empty published catalogue',async()=>{
  const c={configVersion:'1',instanceId:'local-clone-test',defaultLanguage:'de',content:{mode:'bundled',catalogUrl:'./empty-content/catalog.json',updatePolicy:'on-reload'}};
  const p=await StaticProvider.open(c,new URL('./',location.href));assert.equal(p.catalog.entrypoints.defaultChapterId,null);assert.deepEqual(p.index.chapters,[]);assert.equal(Object.keys(p.index.records).length,0);
});

test('Directory categories count record kinds and search across years without hiding relationships',async()=>{
  const {categoryCounts,directoryState}=await import('../src/ui/directory.js');
  const {searchFilters,target}=await import('../src/state/state.js');
  const config=await fetch('../atlas.config.json').then(r=>r.json());config.content=config.demo;
  const p=await StaticProvider.open(config,new URL('../',location.href));
  const chapter=await p.getRecord(p.catalog.entrypoints.defaultChapterId);
  const s=defaultState(chapter,p.sourceKey,p.catalog.dataReleaseId);
  const counts=categoryCounts(p.index.records);
  const placeEdges=(await p.relations('place:demo-port-a',filters(s))).items;
  assert.ok(placeEdges.some(e=>e.event && e.predicate==='event-location' && e.to==='place:demo-port-a'));
  const journey=structuredClone(await p.getRecord('event:demo-journey'));delete journey.placeIds;p.records.set(journey.id,journey);
  const waypointEdges=(await p.relations(journey.id,filters(s))).items.filter(e=>e.predicate==='waypoint');
  assert.deepEqual(waypointEdges.map(e=>e.to).sort(),['place:demo-port-a','place:demo-port-b']);
  assert.equal(counts.find(c=>c.key==='events').count,1);
  assert.equal(counts.find(c=>c.key==='people').count,1);
  const browse=directoryState({...s,time:{year:2000}},['event']);
  const decoded=decodeState(encodeState(browse),s,p.index.chapters).state;
  assert.deepEqual(decoded,normalizeState(browse));
  assert.equal((await p.search('',searchFilters(decoded),'de')).items.length,1);
  assert.equal((await p.search('',filters(decoded),'de')).items.length,0);
  const person=target(directoryState(s,['person']),'entity','person:demo-traveller');
  assert.deepEqual(person.types,[]);
  assert.ok((await p.relations(person.id,filters(person))).items.length>0);
  assert.throws(()=>decodeState('#/v1/search?scope=surprise',s),/URL_FILTER/);
});
test('Chapter intervals survive navigation and original calendar dates remain visible',async()=>{
  const {formatTime,normalizeTime}=await import('../src/domain/time.js');
  const date=(year,month,day)=>({earliest:{year,month,day},latest:{year,month,day},precision:'day',qualifier:'exact'});
  const ch=structuredClone(emptyContext);ch.id='chapter:sample';ch.initialState.time={kind:'interval',start:date(1500,1,1),end:date(1503,12,31),endMeaning:'ended'};
  const s=defaultState(ch,'s','r');assert.deepEqual(s.time,normalizeTime(ch.initialState.time).possible);
  assert.deepEqual(decodeState(encodeState(s),s,[ch]).state,normalizeState(s));
  const instant={kind:'instant',at:{...date(1500,3,20),original:{text:'10.3.1500',calendar:'julian',conversionNote:'+10 days'}}};
  assert.equal(formatTime(instant,'de'),'10.3.1500 (julianisch)');
  assert.equal(formatTime(instant,'en'),'10.3.1500 (Julian)');
  assert.equal(formatTime(instant,'de',false),'20.3. 1500 n. Chr.');
});
