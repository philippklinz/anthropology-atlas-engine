import test,{assert} from './harness.js';
import {loadFixture} from '../tools/workspace.js';
import {validate} from '../tools/validate.js';
import {buildContent} from '../tools/build.js';
import {StaticProvider} from '../src/catalog/provider.js';
import {defaultState,encodeState,decodeState,normalizeState,filters} from '../src/state/state.js';
import {chapterStepState} from '../src/state/steps.js';
import {directedLines} from '../src/domain/cartography.js';
import {SvgGlobe} from '../src/map/svg-globe.js';
const at=year=>({earliest:{year,month:1,day:1},latest:{year,month:1,day:1},precision:'day',qualifier:'exact'});
const instant=year=>({kind:'instant',at:at(year)});
const chapterPath='chapters/demo-overview/chapter.json';
async function migrationFixture(){
 const work=await loadFixture();
 const base={schemaVersion:'0.1.0',editorial:{status:'draft'},synthetic:true,sourceRefs:[{sourceId:'source:demo-notes',role:'supports',locator:'Synthetic movement and landscape test, not historical evidence'}]};
 const entries=[];
 for(const suffix of ['a','b']) entries.push([`events/migration/demo-route-${suffix}.json`,{...base,kind:'event',id:`event:demo-route-${suffix}`,eventType:'migration',labels:{en:'Synthetic route '+suffix},time:instant(1295),epistemic:{status:'hypothetical',note:{en:'Synthetic route hypothesis.'}},participants:[{entityId:'region:demo-estuary',role:'participant'}],note:{en:'Schematic reconstruction; vertices are not dated stops.'},spatial:[{geometryId:'geometry:demo-connection',role:'route',direction:'forward'}]}]);
 entries.push(['interpretations/demo-routes.json',{...base,kind:'interpretation',id:'interpretation:demo-routes',question:{en:'Which synthetic route?'},memberIds:['event:demo-route-a','event:demo-route-b'],explanation:{en:'Competing explanations.'}}]);
 entries.push(['entities/regions/demo-land.json',{...base,kind:'entity',id:'region:demo-land',entityType:'region',labels:{en:'Synthetic exposed land'}}]);
 entries.push(['assertions/extent-of/demo-land.json',{...base,kind:'assertion',id:'assertion:demo-land',predicate:'extent-of',subjectId:'region:demo-land',objectId:'region:demo-estuary',time:instant(1295),epistemic:{status:'inferred',note:{en:'Synthetic dated snapshot.'}},spatial:[{geometryId:'geometry:demo-area-a',role:'land-reconstruction'}]}]);
 // Evidence retains its own identity and visibility when an alternative changes.
 const evidence=JSON.parse(await work.readFile('events/journey/demo-journey.json','utf8'));
 evidence.id='event:demo-evidence';evidence.eventType='attestation';evidence.participants=[{entityId:'person:demo-traveller',role:'attested-entity'}];delete evidence.waypoints;evidence.time=instant(1295);
 entries.push(['events/attestation/demo-evidence.json',evidence]);
 for(const [path,record] of entries)work.set(path,JSON.stringify(record));
 const packPath='packages/demo-core/manifest.json',pack=JSON.parse(await work.readFile(packPath,'utf8'));
 pack.recordIds.push(...entries.map(([,r])=>r.id));work.set(packPath,JSON.stringify(pack));
 const ch=JSON.parse(await work.readFile(chapterPath,'utf8'));
 ch.recordIds.push(...entries.map(([,r])=>r.id));
 ch.focusIds.push('interpretation:demo-routes','assertion:demo-land','event:demo-evidence');
 ch.initialState.layers.push('migrations','landscapes');
 ch.interpretationChoices=[{interpretationId:'interpretation:demo-routes',recordId:'event:demo-route-a',reason:{en:'Explicit synthetic default.'}}];
 ch.steps=[{id:'snapshot',textAnchor:'snapshot',labels:{en:'Snapshot'},summary:{en:'A dated model.'},state:{...ch.initialState,time:instant(1295)}},{id:'gap',textAnchor:'gap',labels:{en:'No snapshot'},state:{...ch.initialState,time:instant(1296)}}];
 work.set(chapterPath,JSON.stringify(ch));return {work,ch};
}
async function compiledProvider(work){
 const result=await buildContent(work,'fixture','0'.repeat(40));
 const p=new StaticProvider();p.catalog=result.catalog;
 p.bytes=path=>result.files.readFile(path);p.json=async path=>JSON.parse(await result.files.readFile(path,'utf8'));
 await p.ensureAtlas();return {p,result};
}
test('Migration contract compiles event alternatives, explicit direction, snapshots and discovery steps',async()=>{
 const {work}=await migrationFixture();assert.deepEqual((await validate(work,'fixture')).issues.filter(i=>i.severity==='error'),[]);
 const {p,result}=await compiledProvider(work);assert.ok(result.catalog.requiredCapabilities.includes('migration-maps'));
 assert.equal(p.spatial.find(s=>s.recordId==='event:demo-route-a').direction,'forward');
 const discovery=await p.items(result.catalog.entrypoints.discovery),ch=discovery.find(c=>c.id==='chapter:demo-overview');
 assert.equal(ch.steps[1].id,'gap');assert.equal(ch.interpretationChoices[0].recordId,'event:demo-route-a');
});
test('Migration validation rejects invented direction, undated landscapes and unsupported choices',async()=>{
 for(const [file,mutate,code] of [
 ['events/migration/demo-route-a.json',r=>r.spatial[0].role='connection','ROUTE_DIRECTION'],
 ['events/migration/demo-route-a.json',r=>delete r.note,'ROUTE_EVIDENCE'],
 ['assertions/extent-of/demo-land.json',r=>r.time={kind:'interval',start:at(1295),end:at(1296),endMeaning:'ended'},'LANDSCAPE_SNAPSHOT'],
 ['assertions/extent-of/demo-land.json',r=>r.sourceRefs=[],'LANDSCAPE_EVIDENCE'],
 ['interpretations/demo-routes.json',r=>r.memberIds[0]='event:demo-journey','INTERPRETATION_MEMBER'],
 [chapterPath,r=>r.steps.push(r.steps[0]),'CHAPTER_STEP'],
 [chapterPath,r=>r.steps[0].assetId='asset:demo-model','CHAPTER_STEP_ASSET']
 ]){const {work}=await migrationFixture();const r=JSON.parse(await work.readFile(file,'utf8'));mutate(r);work.set(file,JSON.stringify(r));assert.ok((await validate(work,'fixture')).issues.some(i=>i.code===code),code);}
});
test('Selecting a route preserves independent evidence; snapshots never fill temporal gaps',async()=>{
 const {work,ch}=await migrationFixture(),{p}=await compiledProvider(work),s=defaultState(ch,'s','r');
 const ids=async state=>(await p.features(undefined,filters(state))).features.map(f=>f.properties.recordId);
 let visible=await ids(s);assert.ok(visible.includes('event:demo-route-a'));assert.ok(!visible.includes('event:demo-route-b'));assert.ok(visible.includes('event:demo-evidence'));assert.ok(visible.includes('assertion:demo-land'));
 visible=await ids({...s,interpretations:{'interpretation:demo-routes':'event:demo-route-b'}});assert.ok(!visible.includes('event:demo-route-a'));assert.ok(visible.includes('event:demo-route-b'));assert.ok(visible.includes('event:demo-evidence'));
 visible=await ids({...s,interpretations:{}});assert.ok(visible.includes('event:demo-route-a')&&visible.includes('event:demo-route-b'));
 assert.ok(!(await ids(chapterStepState(s,ch,'gap'))).includes('assertion:demo-land'));
 assert.ok(!(await ids({...s,layers:['events']})).includes('event:demo-route-a'));
 await assert.rejects(()=>ids({...s,interpretations:{'interpretation:demo-routes':'event:missing'}}),/INTERPRETATION_INVALID/);
});
test('Step links and explicit comparison survive reload despite chapter defaults',async()=>{
 const {ch}=await migrationFixture(),s=defaultState(ch,'s','r');
 const compare={...chapterStepState(s,ch,'gap'),interpretations:{}};
 assert.deepEqual(decodeState(encodeState(compare),s,[ch]).state,normalizeState(compare));
 const short=decodeState('#/v1/chapter/chapter%3Ademo-overview?step=gap',s,[ch]).state;
 assert.deepEqual(short.time,chapterStepState(s,ch,'gap').time);
 assert.deepEqual(short.layers,[...ch.steps[1].state.layers].sort());
 assert.throws(()=>decodeState('#/v1/chapter/chapter%3Ademo-overview?step=missing',s,[ch]),/URL_STEP/);
});
test('Multipart directions stay local to their component and never bridge the dateline',()=>{
 const f={properties:{role:'route',direction:'forward'},geometry:{type:'MultiLineString',coordinates:[[[170,60],[180,60]],[[-180,60],[-165,60]]]}};
 assert.deepEqual(directedLines(f),f.geometry.coordinates);
 f.properties.direction='reverse';assert.deepEqual(directedLines(f),f.geometry.coordinates.map(l=>[...l].reverse()));
 f.properties.direction='both';assert.equal(directedLines(f).length,4);
 delete f.properties.direction;assert.deepEqual(directedLines(f),[]);
});
test('SVG direction arrows are clickable, follow reverse direction and disappear behind the globe',()=>{
 const box=document.createElement('div');box.style.cssText='width:700px;height:450px';document.body.append(box);
 const camera={longitude:0,latitude:0,metersPerPixel:30000,bearing:0,pitch:0};
 const globe=new SvgGlobe(box,camera,()=>{},()=>{});
 const feature={type:'Feature',properties:{recordId:'event:test',role:'route',direction:'forward',portrayal:'migration',variant:1},geometry:{type:'LineString',coordinates:[[-30,0],[30,0]]}};
 try {
  globe.setFeatures({features:[feature]},'event:test');
  const arrow=box.querySelector('[data-direction-arrow]');assert.ok(arrow);assert.equal(arrow.dataset.recordId,'event:test');const forward=arrow.getAttribute('d');
  feature.properties.direction='reverse';globe.setFeatures({features:[feature]});assert.ok(box.querySelector('[data-direction-arrow]').getAttribute('d')!==forward);
  globe.setCamera({...camera,longitude:180});assert.equal(box.querySelectorAll('[data-direction-arrow]').length,0);
 } finally {globe.observer.disconnect();box.remove()}
});
