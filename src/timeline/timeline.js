import vocabulary from '../../schemas/0.1.0/vocabulary.json' with { type: 'json' };
import { localized } from '../query/query.js';
import { Timeline } from '../../vendor/vis/timeline.mjs';
import moment from '../../vendor/moment/moment.js';
import { utcDate, formatYear, calendarDate, yearRange } from '../domain/time.js';
export class AtlasTimeline {
    timeline;
    provider;
    language;
    items(language) {
        const labels = vocabulary.predicates;
        return Object.entries(this.provider.times).flatMap(([id, t]) => {
            if (!t.possible)
                return [];
            const span = t.possible, el = document.createElement('span'), meta = this.provider.index.records[id];
            el.textContent = localized(meta?.labels, language) || localized(labels[meta?.type ?? '']?.labels, language) || id;
            return [{ id, content: el.innerHTML, start: utcDate(span.from), ...(t.kind === 'interval' ? { end: utcDate(span.to), type: 'range' } : { type: 'point' }), className: !t.certain ? 'uncertain' : '' }];
        });
    }
    constructor(container, provider, state, onSelect, onYear) {
        const year = 'year' in state.time ? state.time.year : calendarDate(state.time.from).year;
        this.provider = provider;
        this.language = state.language;
        const data = this.items(state.language);
        const options = { height: 142, rtl: false, showCurrentTime: false, stack: true, zoomable: true, moveable: true, selectable: true, editable: false, verticalScroll: true, start: utcDate(yearRange(Math.max(-10000, year - 15)).from), end: utcDate(yearRange(Math.min(2100, year + 15)).to), min: utcDate(yearRange(-10000).from), max: utcDate(yearRange(2100).to), moment: (d) => moment.utc(d), format: { minorLabels: { year: 'Y' }, majorLabels: { year: '' } }, tooltip: { followMouse: false }, showTooltips: false };
        // Function labels receive Moment values; custom BCE/CE labels avoid a visible year zero.
        options.format = { minorLabels: (date) => formatYear(moment.utc(date).year(), state.language), majorLabels: () => '' };
        this.timeline = new Timeline(container, data, options);
        this.timeline.addCustomTime(utcDate(yearRange(year).from), 'cursor');
        this.timeline.setCustomTimeTitle(formatYear(year, state.language), 'cursor');
        this.timeline.on('select', e => { if (e.items.length)
            onSelect(String(e.items[0])); });
        this.timeline.on('timechanged', e => onYear(e.time.getUTCFullYear()));
    }
    update(s) { if (this.language !== s.language) {
        this.language = s.language;
        this.timeline.setItems(this.items(s.language));
    } const y = 'year' in s.time ? s.time.year : calendarDate(s.time.from).year; this.timeline.setCustomTime(utcDate(yearRange(y).from), 'cursor'); this.timeline.setCustomTimeTitle(formatYear(y, s.language), 'cursor'); this.timeline.setOptions({ format: { minorLabels: (date) => formatYear(moment.utc(date).year(), s.language), majorLabels: () => '' } }); const win = this.timeline.getWindow(); const current = utcDate(yearRange(y).from); if (current < win.start || current > win.end)
        this.timeline.setWindow(utcDate(yearRange(Math.max(-10000, y - 15)).from), utcDate(yearRange(Math.min(2100, y + 15)).to), { animation: false }); }
    destroy() { this.timeline.destroy(); }
}
