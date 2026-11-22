import test,{assert} from './harness.js';
import {epochDay,calendarDate,yearRange,yearFromBP,normalizeTime,estimateRange,matchesTime,formatTime,formatRange,MIN_YEAR,MAX_YEAR} from '../src/domain/time.js';
import {timelineProjection} from '../src/timeline/projection.js';
import {defaultState,encodeState,decodeState,normalizeState} from '../src/state/state.js';
import {emptyContext} from '../src/state/empty.js';
import {makeValidators,validate} from '../tools/validate.js';
import {loadFixture} from '../tools/workspace.js';
import {validateImage} from '../tools/assets.js';
import {AtlasTimeline} from '../src/timeline/timeline.js';
import {buildContent} from '../tools/build.js';
const age=(older,younger=older)=>({basis:'years-before',referenceYear:1950,older,younger,precision:'year',qualifier:older===younger?'exact':'approximate'});

test('Deep time keeps integer days outside Date and uses a fixed BP reference',()=>{
    for(const year of [MIN_YEAR,-600000,-300000,-10001,0,99,MAX_YEAR]) {
        const date={year,month:12,day:31}; assert.deepEqual(calendarDate(epochDay(date)),date);
    }
    const range=estimateRange(age(420000,380000));
    assert.equal(calendarDate(range.from).year,-418050);
    assert.equal(formatRange(range,'de'),'420.000–380.000 Jahre BP');
    assert.ok(formatTime({kind:'instant',at:{...age(420000,380000),central:400000,uncertaintySigma:1}},'en').includes('400,000 ± 20,000'));
    for(const bad of [{...age(1),referenceYear:2026},age(10,20),age(1001951),{...age(5),central:9},{...age(10,5),central:8,uncertaintySigma:2}]) assert.throws(()=>estimateRange(bad));
    assert.throws(()=>yearFromBP(-1));
});
test('An older-than boundary is one-sided evidence, not a fabricated finite duration',()=>{
    const before=normalizeTime({kind:'before',bound:age(260000,240000)});
    assert.ok(before.openStart);assert.equal(before.certain,null);
    assert.ok(matchesTime(before,yearRange(yearFromBP(400000))));
    assert.ok(!matchesTime(before,yearRange(yearFromBP(200000))));
    assert.ok(!matchesTime(before,{from:yearRange(MIN_YEAR).from,to:yearRange(MAX_YEAR).to},'contained'));
    assert.equal(normalizeTime({kind:'interval',start:age(400000),end:null,endMeaning:'last-attested'}).possible,null);
});
test('Linear timeline projection roundtrips million-year dates and normal voyage dates',()=>{
    const deep=timelineProjection({year:yearFromBP(400000)}),calendar=timelineProjection({year:1500});
    assert.ok(deep.deep);assert.ok(!calendar.deep);
    for(const year of [MIN_YEAR,yearFromBP(400000),yearFromBP(200000),0,1500,MAX_YEAR]) {
        const day=yearRange(year).from,projected=deep.toDate(day);
        assert.ok(Number.isFinite(+projected));assert.equal(deep.fromDate(projected),day);
    }
    assert.equal(calendar.toDate(yearRange(42).from).getUTCFullYear(),42);
    assert.equal(+deep.toDate(200)-+deep.toDate(100),+deep.toDate(100)-+deep.toDate(0));
});
test('Deep chapter links restore BP filtering, scope and image targets without stored state',()=>{
    const chapter=structuredClone(emptyContext);chapter.id='chapter:deep-fixture';
    chapter.initialState.time={kind:'interval',start:age(500000),end:age(200000),endMeaning:'ended'};
    const defaults=defaultState(chapter,'s','r');
    const state={...defaults,view:'image',id:'asset:example',browse:{scale:'bp',from:yearFromBP(420000),to:yearFromBP(210000)}};
    assert.deepEqual(decodeState(encodeState(state),defaults,[chapter]).state,normalizeState(state));
    assert.throws(()=>decodeState('#/v1/explore?browse-scale=unknown',defaults),/URL_BROWSE/);
});
test('Authoring schemas and semantic checks accept ages and reject contradictory age estimates',async()=>{
    const work=await loadFixture(),path='events/journey/demo-journey.json',record=JSON.parse(await work.readFile(path,'utf8'));
    record.time={kind:'before',bound:age(260000,240000)};work.set(path,JSON.stringify(record));
    assert.deepEqual((await validate(work,'fixture')).issues.filter(i=>i.severity==='error'),[]);
    assert.ok((await buildContent(work,'fixture','0'.repeat(40))).catalog.requiredCapabilities.includes('deep-time'));
    record.time.bound.central=280000;work.set(path,JSON.stringify(record));
    assert.ok((await validate(work,'fixture')).issues.some(i=>i.code==='TIME_AGE'));
    const validators=await makeValidators();
    const specimen={schemaVersion:'0.1.0',kind:'entity',id:'specimen:sample',entityType:'specimen',labels:{en:'Synthetic specimen'},editorial:{status:'draft'},sourceRefs:[]};
    assert.ok(validators.record(specimen));assert.ok(!validators.record({...specimen,id:'person:sample'}));
    assert.throws(()=>validateImage(new TextEncoder().encode('<svg onload="bad()"/>'),'image/png'),/ASSET_IMAGE/);
});
test('Deep timeline renders dating envelopes, open starts, selection and calendar switching',()=>{
    const box=document.createElement('div');box.style.cssText='height:260px;width:1000px';document.body.append(box);
    const time={kind:'instant',at:age(420000,380000)},open={kind:'before',bound:age(260000,240000)};
    const p={times:{'event:sample':{...normalizeTime(time),display:time},'event:open':{...normalizeTime(open),display:open}},index:{records:{'event:sample':{labels:{en:'Synthetic evidence'}},'event:open':{labels:{en:'Synthetic bound'}}}}};
    const s={language:'en',chapter:'chapter:sample',id:'event:sample',time:{from:yearRange(yearFromBP(500000)).from,to:yearRange(yearFromBP(200000)).to}};
    const timeline=new AtlasTimeline(box,p,s,()=>{},()=>{});
    try {
        const items=timeline.items(s);assert.equal(items[0].type,'range');assert.ok(items[0].className.includes('uncertain-instant'));
        assert.ok(items[1].className.includes('open-start'));assert.ok(+items[0].end>+items[0].start);
        assert.ok(Number.isFinite(+timeline.timeline.getWindow().start));
        timeline.update({...s,time:{year:1500}});assert.ok(timeline.projection.deep);
        assert.ok(timeline.items(s).every(item=>Number.isFinite(+item.start)));
        p.belongs=()=>false;
        timeline.update({...s,time:{year:1500}});assert.ok(!timeline.projection.deep);
        p.belongs=()=>true;
        timeline.update(s);assert.ok(timeline.projection.deep);
        assert.deepEqual(timeline.timeline.getSelection(),['event:sample']);
    } finally {timeline.destroy();box.remove();}
});
