import test, {assert} from './harness.js';
import {StaticProvider} from '../src/catalog/provider.js';
import {defaultState, filters} from '../src/state/state.js';
import {renderMapContext} from '../src/ui/cartography.js';
import {areaDissolve} from '../src/map/area-states.js';
import {SvgGlobe} from '../src/map/svg-globe.js';
import {buildContent} from '../tools/build.js';
import {loadFixture} from '../tools/workspace.js';

test('A dated extent retains its source, subject style and current-year link in an existing catalogue', async () => {
    const config = await fetch('../atlas.config.json').then(r => r.json());
    config.content = config.demo;
    const provider = await StaticProvider.open(config, new URL('../', location.href));
    const chapter = await provider.getRecord(provider.catalog.entrypoints.defaultChapterId);
    const state = defaultState(chapter, provider.sourceKey, provider.catalog.dataReleaseId);
    const context = document.createElement('div');
    const display = async year => {
        const view = {...state, time:{year}};
        const features = await provider.features(undefined, filters(view));
        renderMapContext(context, view, chapter, features, provider, () => {});
        return features.features.find(f => f.properties.portrayal === 'dated-area');
    };
    const first = (await display(1295)).properties;
    assert.equal(first.areaSubject, 'polity:demo-realm');
    assert.ok(first.approximateExtent);
    assert.ok(provider.records.get(first.recordId).sourceRefs.length);
    const details = context.querySelector('details');
    details.open = true;
    const sourceDetail = context.querySelector('[data-area]');
    await display(1296);
    assert.equal(sourceDetail, context.querySelector('[data-area]'));
    assert.ok(sourceDetail.href.includes('at=1296'));
    assert.ok(sourceDetail.href.includes(encodeURIComponent(first.recordId)));
    assert.equal(await display(1302), undefined);
    assert.ok(context.querySelector('details').open);
    assert.ok(!context.querySelector('[data-area]'));
    // This older published chapter has no explicit recordIds. Its outgoing
    // references include the first extent, while the later one is out of scope.
    assert.ok(!provider.belongs('assertion:demo-control-b', state.chapters));
    assert.equal(await display(1305), undefined);
});

test('Selected chapters share a year while an approximate observation keeps its evidence, window and own map style', async () => {
    const workspace = await loadFixture();
    const read = async path => JSON.parse(await workspace.readFile(path, 'utf8'));
    const sample = await read('assertions/controls/demo-control-a.json');
    const observation = {...sample, id:'assertion:demo-regional-observation', predicate:'attested-at',
        subjectId:'community:demo-merchants', spatial:[{geometryId:'geometry:demo-area-b', role:'uncertainty-area'}],
        time:{kind:'instant', at:{earliest:{year:1295,month:1,day:1}, latest:{year:1297,month:12,day:31},
            qualifier:'approximate', precision:'year'}}};
    workspace.set('assertions/attested-at/demo-regional-observation.json', JSON.stringify(observation));
    const chapterPath = 'chapters/demo-reuse/chapter.json', packagePath = 'packages/demo-reuse/manifest.json';
    for (const path of [chapterPath, packagePath]) {
        const record = await read(path);
        record.recordIds.push(observation.id);
        workspace.set(path, JSON.stringify(record));
    }
    const built = await buildContent(workspace, 'fixture', '0'.repeat(40));
    const provider = new StaticProvider();
    provider.catalog = built.catalog;
    provider.bytes = path => built.files.readFile(path);
    provider.json = async path => JSON.parse(await built.files.readFile(path, 'utf8'));
    await provider.ensureAtlas();
    const first = await provider.getRecord('chapter:demo-overview');
    const state = defaultState(first, 'synthetic', built.catalog.dataReleaseId, 'en');
    state.layers.push('attested-at');
    const areas = async (chapters,year) => {
        const cursor = {...state, chapters, time:{year}};
        const collection = await provider.features(undefined, filters(cursor));
        return {cursor, collection, snapshots:collection.features.filter(f => f.properties.portrayal === 'dated-area')};
    };
    const both = [first.id, 'chapter:demo-reuse'];
    const frame = await areas(both, 1295);
    const {properties} = frame.snapshots.find(f => f.properties.recordId === observation.id);
    assert.equal(properties.role, 'uncertainty-area');
    assert.ok(properties.approximateExtent);
    assert.ok(Number.isInteger(properties.areaIndex));
    const extent = frame.snapshots.find(f => f.properties.layer === 'controls');
    assert.ok(properties.areaIndex !== extent.properties.areaIndex);
    const key = document.createElement('div');
    renderMapContext(key, frame.cursor, first, frame.collection, provider, () => {});
    const row = key.querySelector('[data-area="' + observation.id + '"]').closest('li');
    assert.ok(row.querySelector('.approximate-location'));
    assert.ok(row.textContent.includes('Dating window'));
    assert.ok(row.textContent.includes('Approximate location'));
    assert.ok(row.querySelector('a').href.includes('at=1295'));
    for (const [chapters, year] of [[both,1298],[[first.id],1295]]) {
        const result = await areas(chapters,year);
        assert.ok(result.snapshots.every(f => f.properties.recordId !== observation.id));
        assert.ok(result.snapshots.some(f => f.properties.layer === 'controls'));
    }
    const later = await areas(both, 1305);
    const successor = later.snapshots.find(f => f.properties.recordId === 'assertion:demo-control-b');
    assert.equal(successor.properties.areaIndex, extent.properties.areaIndex);
});

const square = (x, y, size) => [[x,y],[x+size,y],[x+size,y+size],[x,y+size],[x,y]];
function area(name, subject, rings) {
    return {type:'Feature', geometry:{type:'MultiPolygon', coordinates:rings.map(ring => [ring])},
        properties:{recordId:'assertion:'+name, geometryId:'geometry:'+name, portrayal:'dated-area', role:'extent', layer:'attested-at',
            areaSubject:'community:'+subject, areaIndex:subject === 'a' ? 0 : 1, approximateExtent:true, variant:0}};
}
const frame = (year, ...features) => ({type:'FeatureCollection', year, features});

test('A dissolve keeps the authored shape and only replaces related consecutive states', () => {
    const a = area('first','a',[square(0,0,3)]), b = area('second','a',[square(0,0,2),square(4,4,1)]);
    const other = area('other','b',[square(1,1,2)]);
    const visible = areaDissolve(frame(40,a,other), frame(41,b,other));
    assert.deepEqual(visible.map(f => f.properties.dissolve), ['out','in',undefined]);
    assert.equal(visible[1].geometry, b.geometry);
    assert.equal(visible[2], other);
    assert.equal(areaDissolve(frame(40,a), frame(42,b)), null);
    assert.equal(areaDissolve(frame(40,a), frame(41)), null);
    assert.equal(areaDissolve(frame(40,a), frame(41,other)), null);
    assert.equal(areaDissolve(frame(null,a), frame(41,b)), null);
    assert.equal(areaDissolve(frame(40,a), frame(41,{...b, properties:{...b.properties, layer:'controls'}})), null);
    assert.equal(areaDissolve(frame(40,a), frame(41,{...b, properties:{...b.properties, role:'uncertainty-area'}})), null);
});

test('SVG exposes both overlapping statements, hatched multipart geometry and an empty evidentiary gap', () => {
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;inset:0 auto auto 0;width:400px;height:300px;z-index:10000';
    document.body.append(container);
    let hits = [];
    const globe = new SvgGlobe(container, {longitude:0,latitude:0,metersPerPixel:8000}, () => {}, ids => {hits=ids;});
    const a = area('first','a',[square(-4,-4,8),square(9,3,2)]), b = area('other','b',[square(-2,-2,4)]);
    try {
        globe.setFeatures(frame(41,a,b));
        assert.ok(container.querySelector('path[fill^="url("]'));
        const svg = container.querySelector('svg'), bounds = svg.getBoundingClientRect();
        svg.dispatchEvent(new PointerEvent('pointerup', {clientX:bounds.x+bounds.width/2,clientY:bounds.y+bounds.height/2}));
        assert.deepEqual(hits.sort(), ['assertion:first','assertion:other']);
        globe.setFeatures(frame(42));
        assert.equal(container.querySelectorAll('[data-record-id]').length, 0);
    } finally {globe.observer.disconnect(); container.remove();}
});
