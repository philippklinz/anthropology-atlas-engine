import test,{assert} from './harness.js';
import {ChapterSearch,openChapters,chronological,legacyMembers} from '../src/query/chapters.js';
import {defaultState,normalizeState,encodeState,decodeState,filters,searchFilters,target} from '../src/state/state.js';
import {directoryState,categoryCounts} from '../src/ui/directory.js';
import {StaticProvider} from '../src/catalog/provider.js';
import {selectionLayers} from '../src/map/selection.js';
import {yearRange,normalizeTime} from '../src/domain/time.js';
import {emptyContext} from '../src/state/empty.js';
import {chapterModelIds,chapterModelLinks} from '../src/ui/model-links.js';
import {buildContent} from '../tools/build.js';
import {loadFixture} from '../tools/workspace.js';
import {validate} from '../tools/validate.js';
const at=y=>({earliest:{year:y,month:1,day:1},latest:{year:y,month:1,day:1},precision:'day',qualifier:'exact'});
const make=(id,year,labels,terms=[])=>({...structuredClone(emptyContext),id,labels,initialState:{...structuredClone(emptyContext.initialState),time:{kind:'interval',start:at(year),end:at(year+1),endMeaning:'ended'}},discovery:{summary:{de:'Fiktive Prüfdaten'},periods:[{id:year<1500?'early':'late',labels:{de:year<1500?'Früher':'Später'}}],regions:[{id:'islands',labels:{de:'Inseln'}}],topics:[]},searchTerms:terms});
const a=make('chapter:alpha',1400,{de:'Erste Reise',en:'First voyage'},['Person Álvarez','Mündung']),b=make('chapter:beta',1600,{de:'Zweite Reise',en:'Second voyage'},['Person Zwei']);
test('Chapter model links stay scoped, include non-focus exhibits and preserve navigable view state',()=>{
 const chapter={...a,focusIds:['asset:one','asset:image'],recordIds:['asset:one','asset:two','asset:image','person:one']};
 const model=labels=>({kind:'asset',assetType:'model',labels});
 const index={records:{'asset:one':model({de:'Erstes Modell',en:'First <model>'}),'asset:two':model({de:'Zweites Modell',en:'Second model'}),'asset:other':model({en:'Another chapter'}),'asset:image':{kind:'asset',assetType:'image'},'person:one':{kind:'entity'}}};
 assert.deepEqual(chapterModelIds(chapter,index),['asset:one','asset:two']);
 const state={...defaultState(a,'source','release','en'),chapters:[a.id,b.id],view:'event',id:'event:one',time:{year:1402}};
 const container=document.createElement('div');container.innerHTML=chapterModelLinks(state,chapter,index);
 const links=[...container.querySelectorAll('a')];assert.equal(links.length,2);
 assert.ok(links[0].textContent.includes('First <model>'));assert.equal(container.querySelector('model'),null);
 for(const [i,link] of links.entries()) {
  const decoded=decodeState(link.getAttribute('href'),defaultState(a,'source','release'),[a,b]).state;
  assert.equal(decoded.view,'model');assert.equal(decoded.id,['asset:one','asset:two'][i]);
  assert.equal(decoded.language,'en');assert.deepEqual(decoded.chapters,state.chapters);
  assert.deepEqual(decoded.time,state.time);assert.deepEqual(decoded.camera,state.camera);
 }
 assert.equal(chapterModelLinks(state,b,index),'');
});
test('Chapter discovery finds names and accents, intersects facets and dates, and bounds pages',()=>{
 const search=new ChapterSearch([b,a]);
 assert.deepEqual(search.query().items.map(x=>x.chapter.id),[a.id,b.id]);
 assert.equal(search.query({query:'alvarez'}).items[0].matchedTerm,'Person Álvarez');
 assert.equal(search.query({query:'mundung',region:'islands',period:'early'}).total,1);
 assert.equal(search.query({query:'alvarez',period:'late'}).total,0);
 assert.equal(search.query({from:yearRange(1500).from}).items[0].chapter.id,b.id);
 assert.equal(search.query({to:yearRange(1399).to}).total,0);
 assert.equal(search.query({page:999},1).page,1);
});
test('Selection URLs roundtrip, legacy chapter links select one, focus never changes the selected set',()=>{
 const initial=defaultState(a,'source','release');
 const s={...initial,view:'explore',id:undefined,chapters:[b.id,a.id],browse:{query:'Mündung & море',period:'early',from:0,to:1800,page:2}};
 assert.deepEqual(decodeState(encodeState(s),initial,[a,b]).state,normalizeState(s));
 const old=decodeState('#/v1/chapter/chapter%3Abeta',initial,[a,b]).state;
 assert.deepEqual(old.chapters,[b.id]);assert.equal(old.chapter,b.id);
 const opened=openChapters(s,[b,a]);assert.deepEqual(opened.time,{from:normalizeTime(a.initialState.time).possible.from,to:normalizeTime(b.initialState.time).possible.to});
 const focus=target(opened,'chapter',b.id);assert.deepEqual(focus.chapters,opened.chapters);assert.equal(focus.chapter,b.id);assert.deepEqual(focus.time,opened.time);
 assert.throws(()=>decodeState('#/v1/map?chapter=chapter:alpha&chapters=chapter:beta',initial,[a,b]),/URL_CHAPTER/);
 assert.throws(()=>decodeState('#/v1/explore?chapters=chapter:missing',initial,[a,b]),/URL_CHAPTER/);
 assert.throws(()=>decodeState('#/v1/explore?browse-from=10&browse-to=0',initial,[a,b]),/URL_BROWSE/);
});
test('Scoped directory deduplicates shared objects, keeps all dates and excludes unrelated members',()=>{
 const p=new StaticProvider();p.index={records:{'person:one':{kind:'entity',type:'person'},'person:two':{kind:'entity',type:'person'},'place:shared':{kind:'entity',type:'place'},'event:one':{kind:'event',type:'journey'}},chapters:[a,b]};
 p.memberships=new Map([[a.id,new Set(['person:one','place:shared','event:one'])],[b.id,new Set(['person:two','place:shared'])]]);
 p.times={'event:one':normalizeTime(a.initialState.time)};
 const s=defaultState(a,'s','r');assert.equal(categoryCounts(p.scopedRecords(s.chapters)).find(x=>x.key==='people').count,1);
 assert.equal(categoryCounts(p.scopedRecords([a.id,b.id])).find(x=>x.key==='places').count,1);
 assert.deepEqual(p.chaptersFor('place:shared',[a.id,b.id]).map(c=>c.id),[a.id,b.id]);
 assert.equal(Object.keys(p.scopedRecords([])).length,0);
 const directory=directoryState({...s,time:{year:2000}},['event']);
 assert.ok(p.include('event:one',searchFilters(directory)));assert.ok(!p.include('event:one',filters(directory)));assert.ok(!p.include('person:two',searchFilters(directoryState(s,['person']))));
 assert.deepEqual(target(directory,'event','event:one').types,[]);
});
test('Legacy membership follows outgoing references without importing incoming events or dependencies',async()=>{
 const records={'person:one':{id:'person:one',kind:'entity',sourceRefs:[{sourceId:'source:one'}]},'source:one':{kind:'source'},'event:other':{kind:'event',participants:[{entityId:'person:one'}]}};
 const ids=await legacyMembers({id:'chapter:old',focusIds:['person:one']},async id=>records[id]);
 assert.deepEqual(ids.sort(),['chapter:old','person:one','source:one']);
});
test('Chapter compiler publishes discovery and inverse memberships; missing scope references fail validation',async()=>{
 const work=await loadFixture(),out=await buildContent(work,'fixture','0'.repeat(40));
 const read=path=>JSON.parse(new TextDecoder().decode(out.files.files.get('/'+path)));
 const discovery=read(out.catalog.entrypoints.discovery).items;
 assert.equal(discovery.length,2);assert.ok(discovery[0].searchTerms.length>0);assert.equal(discovery[0].recordIds,undefined);
 const index=read(out.catalog.entrypoints.recordIndex);assert.equal(index.records['person:demo-traveller'].chapterIds.length,2);
 const path='chapters/demo-overview/chapter.json',ch=JSON.parse(await work.readFile(path,'utf8'));ch.recordIds=ch.recordIds.filter(id=>id!=='person:demo-traveller');work.set(path,JSON.stringify(ch));
 const result=await validate(work,'fixture');assert.ok(result.issues.some(i=>['CHAPTER_FOCUS','CHAPTER_REFERENCE'].includes(i.code)));
});
test('Point selection uses circle overlays; line and area highlights remain separate',()=>{
 const layers=selectionLayers('event:chosen'),point=layers.find(l=>l.id==='selection-point');
 assert.equal(point.type,'circle');assert.ok(point.paint['circle-radius']>6);
 assert.deepEqual(point.filter,['all',['==',['get','recordId'],'event:chosen'],['==',['geometry-type'],'Point']]);
 assert.ok(layers.some(l=>l.id==='selection-line'&&l.type==='line'));
});
test('10000 discovery records retain chronological pagination and multiple-word matching',()=>{
 const records=Array.from({length:10000},(_,i)=>make('chapter:load-'+i,1000+i%900,{de:'Testkapitel '+i},['Ort '+(i%40)]));
 const search=new ChapterSearch(records),result=search.query({query:'testkapitel ort',page:1});
 assert.equal(result.total,10000);assert.equal(result.items.length,24);assert.equal(result.pages,417);
 assert.ok(result.items.every(x=>x.chapter.id.startsWith('chapter:load-')));
});
test('Browser history restores repeated back, new navigation and forward without skipping an earlier URL',async()=>{
 const {Router}=await import('../src/state/router.js');
 const original=location.href,initial=defaultState(a,'history-test','fixture');
 history.replaceState(null,'',encodeState(initial));
 let error;const router=new Router(initial,()=>{},e=>{error=e},[a,b]);
 const travel=direction=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('History event timeout')),3000);addEventListener('popstate',()=>{clearTimeout(timer);setTimeout(resolve,0)},{once:true});history[direction]();});
 try {
  router.commit(target(initial,'entity','person:one'));await travel('back');assert.equal(router.state.view,'chapter');
  router.commit(directoryState(router.state,['person']));await travel('back');assert.equal(router.state.view,'chapter');
  await travel('forward');assert.equal(router.state.view,'search');assert.deepEqual(router.state.chapters,[a.id]);assert.equal(error,undefined);
 } finally {router.destroy();history.replaceState(null,'',original)}
});
