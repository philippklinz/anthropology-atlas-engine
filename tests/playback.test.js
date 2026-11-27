import test, { assert } from './harness.js';
import { nextPlaybackYear, playbackWindow, YearPlayback } from '../src/state/playback.js';
import { yearRange } from '../src/domain/time.js';
import { TimeControls } from '../src/ui/time-controls.js';

const estimate = year => ({
    earliest: { year, month: 1, day: 1 }, latest: { year, month: 12, day: 31 }, precision: 'year', qualifier: 'exact'
});
const chapter = (id, start, end) => ({ id, initialState: { time: end === undefined
    ? {kind: 'instant', at: estimate(start)}
    : {kind: 'interval', start: estimate(start), end: estimate(end)}
} });
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

test('One chapter clock spans the selection, preserves single-year stops and supports old point-date chapters', () => {
    const chapters = [chapter('a', -200000, -100000), chapter('b', 1598, 1605), chapter('c', 1600)];
    chapters[0].steps = [{state: {time: {kind: 'instant', at: estimate(-140000)}}}];
    const dates = { a: {possible: yearRange(-150000)}, b: {possible: yearRange(1600)}, c: {possible: yearRange(1710)} };
    const belongs = (record, selection) => selection.includes(record);
    const state = {chapters: ['a', 'b'], time: {year: -180000}};
    const range = playbackWindow(chapters, dates, state, belongs);
    assert.equal(range.min, -200000); assert.equal(range.max, 1605);
    assert.equal(nextPlaybackYear(-150001, range), -150000);
    assert.equal(nextPlaybackYear(-150000, range), -149999);
    assert.equal(nextPlaybackYear(-140001, range), -140000);
    assert.equal(nextPlaybackYear(1599, range), 1600);
    assert.equal(nextPlaybackYear(1600, range), 1601);
    const old = playbackWindow(chapters, dates, {chapters: ['c'], time: {year: 1600}}, belongs);
    assert.deepEqual([old.min, old.max], [1600, 1710]);
    assert.equal(playbackWindow([], {}, {chapters: [], time: {year: 1}}, belongs), null);
});

test('The opt-in clock waits for each frame, cancels pending work, reaches the end and starts over', async () => {
    const frames = [], range = {min: 1599, max: 1602, stops: []};
    let release, finishes = 0;
    const clock = new YearPlayback(year => {
        frames.push(year);
        if (year === 1600 && !release) return new Promise(resolve => {release = resolve;});
    }, () => finishes++, error => { throw error; }, 1);
    assert.deepEqual(frames, []);
    clock.start(1600, range);
    assert.deepEqual(frames, [1600]);
    clock.cancel(); release(); await wait(12);
    assert.equal(finishes, 0); assert.deepEqual(frames, [1600]);
    await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(Error('playback did not finish')), 2000);
        clock.onFinish = () => {finishes++; clearTimeout(timer); resolve();};
        clock.start(1602, range);
    });
    assert.deepEqual(frames, [1600,1599,1600,1601,1602]); assert.equal(finishes, 1);
    assert.equal(clock.playing, false);
});

test('Year scrubbing previews before committing and presents accessible BCE/CE labels in both languages', () => {
    const container = document.createElement('div');
    const preview = []; let commits = 0, discards = 0;
    const controls = new TimeControls(container, {
        preview: async year => { preview.push(year); controls.showYear(year); },
        apply: () => {}, finish: () => commits++, discard: () => discards++, reset: () => {}, error: e => {throw e;}
    });
    const range = {min: -1, max: 3, stops: []};
    controls.update({language: 'de', time: {year: 0}}, range, true);
    const slider = container.querySelector('#year-scrubber'), play = container.querySelector('#time-play');
    assert.equal(slider.getAttribute('aria-valuetext'), '1 v. Chr.');
    slider.value = 1; slider.dispatchEvent(new Event('input'));
    assert.deepEqual(preview, [1]); assert.equal(commits, 0); assert.equal(slider.getAttribute('aria-valuetext'), '1 n. Chr.');
    slider.dispatchEvent(new Event('change')); assert.equal(commits, 1);
    slider.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowRight'}));
    for (const value of [2,3]) {
        slider.value = value;
        slider.dispatchEvent(new Event('input')); slider.dispatchEvent(new Event('change'));
    }
    assert.equal(commits, 1);
    slider.dispatchEvent(new KeyboardEvent('keyup', {key:'ArrowRight'})); assert.equal(commits, 2);
    slider.dispatchEvent(new Event('pointercancel')); assert.equal(discards, 1);
    controls.update({language: 'en', time: {year: 1}}, range, true);
    assert.equal(play.ariaLabel, 'Play through time'); assert.equal(slider.getAttribute('aria-valuetext'), '1 CE');
    controls.input.value = '3'; play.click();
    assert.equal(preview.at(-1), 3); controls.cancel();
    controls.update({language: 'en', time: {year: 1}}, range, false);
    assert.ok(container.querySelector('#playback-controls').hidden);
});

test('Pausing a year cursor preserves the reader’s zoomed timeline window', async () => {
    const { AtlasTimeline } = await import('../src/timeline/timeline.js');
    const state = {language:'de', chapter:'chapter:transport', time:{from:yearRange(-50).from, to:yearRange(150).to}};
    const container = document.createElement('div');
    container.style.cssText = 'width:700px;height:180px'; document.body.append(container);
    const timeline = new AtlasTimeline(container, {times:{}, index:{records:{}}}, state, () => {}, () => {});
    try {
        const from = timeline.projection.toDate(yearRange(5).from), to = timeline.projection.toDate(yearRange(50).to);
        timeline.timeline.setWindow(from, to, {animation:false});
        timeline.previewYear(10);
        timeline.update({...state,time:{year:10}});
        const window = timeline.timeline.getWindow();
        assert.equal(+window.start, +from); assert.equal(+window.end, +to);
        timeline.previewYear(-950000);
        assert.ok(timeline.projection.deep);
        assert.ok(Number.isFinite(+timeline.timeline.getCustomTime('cursor')));
    } finally { timeline.destroy(); container.remove(); }
});
