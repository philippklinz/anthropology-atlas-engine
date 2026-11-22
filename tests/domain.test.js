import test, {assert} from './harness.js';
import { epochDay, calendarDate, normalizeTime, estimateRange, yearRange, formatYear, matchesTime } from '../src/domain/time.js';
import { defaultState, encodeState, decodeState, normalizeState } from '../src/state/state.js';
import { resolveConfig } from '../src/catalog/provider.js';
import { bboxOverlap } from '../src/query/query.js';
const date = (year, month = 1, day = 1) => ({ year, month, day });
const exact = (year) => ({ earliest: date(year), latest: date(year), precision: 'day', qualifier: 'exact' });
test('Gregorian arithmetic across BCE, year zero, 1–99 CE and leap centuries', () => {
    for (const [y, m, d] of [[-10000, 1, 1], [-43, 3, 15], [-1, 12, 31], [0, 2, 29], [0, 12, 31], [1, 1, 1], [99, 1, 1], [1900, 3, 1], [1970, 1, 1], [2000, 2, 29], [2100, 12, 31]]) {
        const value = date(y, m, d), js = new Date(0);
        js.setUTCHours(0, 0, 0, 0);
        js.setUTCFullYear(y, m - 1, d);
        assert.equal(epochDay(value), js.getTime() / 86400000);
        assert.deepEqual(calendarDate(epochDay(value)), value);
    }
    assert.equal(epochDay(date(1)) - epochDay(date(0, 12, 31)), 1);
    assert.equal(formatYear(0, 'en'), '1 BCE');
    assert.equal(formatYear(1, 'en'), '1 CE');
    assert.throws(() => epochDay(date(1900, 2, 29)));
});
test('Uncertain instants remain instants; open intervals are not infinite', () => {
    const year = { earliest: date(1300), latest: date(1300, 12, 31), precision: 'year', qualifier: 'exact' };
    const t = normalizeTime({ kind: 'instant', at: year });
    assert.equal(t.kind, 'instant');
    assert.equal(t.certain, null);
    assert.ok(matchesTime(t, yearRange(1300)));
    assert.ok(!matchesTime(t, yearRange(1301)));
    const open = normalizeTime({ kind: 'interval', start: exact(1200), end: null, endMeaning: 'last-attested' });
    assert.equal(open.possible, null);
    assert.equal(matchesTime(open, yearRange(2026)), false);
    assert.throws(() => estimateRange({ ...year, earliest: date(1300, 2, 1) }));
    assert.throws(() => normalizeTime({ kind: 'interval', start: exact(1400), end: exact(1300), endMeaning: 'ended' }));
});
test('Overlapping uncertain bounds can validly have no certain core', () => {
    const spread = { earliest: date(1300), latest: date(1310), precision: 'day', qualifier: 'uncertain' };
    const t = normalizeTime({ kind: 'interval', start: spread, end: spread, endMeaning: 'ended' });
    assert.ok(t.possible);
    assert.equal(t.certain, null);
});
const chapter = await fetch(new URL('../fixtures/reference-package/chapters/demo-overview/chapter.json', import.meta.url)).then(r=>r.json());
test('Complete URL restores context without session storage', () => {
    const s = { ...defaultState(chapter, 'source-one', 'release-one'), view: 'model', id: 'asset:demo-symbol', time: { year: 0 }, language: 'en', query: 'Mündung & שלום', expanded: ['place:z', 'place:a'], types: ['script'], selection: ['language:a'], detail: 'sources', spatialFilter: [170, -20, -170, 30] };
    assert.deepEqual(decodeState(encodeState(s), defaultState(chapter, 'source-one', 'release-one')).state, normalizeState(s));
    assert.equal(decodeState('#/v1/entity/place%3Ademo-port-a?at=0', defaultState(chapter, 's', 'r')).state.id, 'place:demo-port-a');
});
test('Invalid route, time, source or release fail; optional bad camera is reported', () => {
    const s = defaultState(chapter, 's', 'r');
    for (const url of ['#/v2/map', '#/v1/entity', '#/v1/map?at=NaN', '#/v1/map?at=2200', '#/v1/map?release=other', '#/v1/map?source=evil', '#/v1/map?range=10,2'])
        assert.throws(() => decodeState(url, s), url);
    assert.deepEqual(decodeState('#/v1/map?camera=bad', s).warnings, ['URL_CAMERA']);
});
test('Provider profiles share one catalog; reject traversal, invalid commits and credentials', () => {
    const common = { configVersion: '1', instanceId: 'test', defaultLanguage: 'de' }, hash = 'a'.repeat(64), base = new URL('https://atlas.example/project/');
    assert.equal(resolveConfig({ ...common, content: { mode: 'bundled', catalogUrl: 'content/catalog.json', expectedCatalogSha256: hash, updatePolicy: 'pinned' } }, base).catalogURL.href, 'https://atlas.example/project/content/catalog.json');
    assert.equal(resolveConfig({ ...common, content: { mode: 'http', catalogUrl: 'https://content.example/test/catalog.json', updatePolicy: 'on-reload' } }, base).catalogURL.origin, 'https://content.example');
    const raw = { mode: 'github-raw', owner: 'philippklinz', repository: 'anthropology-atlas-content', commit: 'b'.repeat(40), catalogPath: 'published/catalog.json', expectedCatalogSha256: hash, updatePolicy: 'pinned' };
    assert.ok(resolveConfig({ ...common, content: raw }, base).catalogURL.pathname.includes(raw.commit));
    for (const content of [{ ...raw, commit: 'main' }, { ...raw, token: 'invalid' }, { ...raw, catalogPath: '../catalog.json' }])
        assert.throws(() => resolveConfig({ ...common, content }, base));
});
test('Dateline query windows split instead of spanning the wrong hemisphere', () => { assert.ok(bboxOverlap([170, -10, -170, 10], [175, -5, 179, 5])); assert.ok(bboxOverlap([170, -10, -170, 10], [-179, -5, -175, 5])); assert.equal(bboxOverlap([170, -10, -170, 10], [-10, -5, 10, 5]), false); });
test('Short chapter links resolve that chapter defaults before explicit URL overrides', () => {
    const other = structuredClone(chapter);
    other.id = 'chapter:another';
    other.initialState.camera.longitude = 52;
    other.initialState.time = { kind: 'instant', at: exact(45) };
    const base = defaultState(chapter, 's', 'r');
    const state = decodeState('#/v1/chapter/chapter%3Aanother', base, [chapter, other]).state;
    assert.equal(state.camera.longitude, 52);
    assert.deepEqual(state.time, { year: 45 });
    assert.deepEqual(decodeState('#/v1/chapter/chapter%3Aanother?at=0', base, [chapter, other]).state.time, { year: 0 });
});
