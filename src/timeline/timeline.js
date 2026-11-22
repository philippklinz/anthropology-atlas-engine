import { chronological } from '../query/chapters.js';
import vocabulary from '../../schemas/0.1.0/vocabulary.json' with { type: 'json' };
import { localized } from '../query/query.js';
import { Timeline } from '../../vendor/vis/timeline.mjs';
import moment from '../../vendor/moment/moment.js';
import { utcDate, formatYear, calendarDate, yearRange } from '../domain/time.js';
function windowFor(state) {
    if ('year' in state.time) return { from: yearRange(Math.max(-10000, state.time.year - 15)).from, to: yearRange(Math.min(2100, state.time.year + 15)).to };
    const pad = Math.max(30, Math.ceil((state.time.to - state.time.from) * 0.12));
    return { from: Math.max(yearRange(-10000).from, state.time.from - pad), to: Math.min(yearRange(2100).to, state.time.to + pad) };
}
function axisFormat(language) {
    const months = language === 'de' ? ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'] : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return {
        minorLabels: (date, scale) => {
            const d = moment.utc(date);
            if (scale === 'year') return formatYear(d.year(), language);
            if (scale === 'month') return months[d.month()];
            if (['day','weekday','week'].includes(scale)) return `${d.date()}.${d.month()+1}.`;
            return d.format('HH:mm');
        },
        majorLabels: (date, scale) => scale === 'year' ? '' : formatYear(moment.utc(date).year(), language)
    };
}
export class AtlasTimeline {
    timeline;
    provider;
    language;
    groups(state) {
        if (!state.chapters || state.chapters.length < 2) return null;
        return chronological(this.provider.index.chapters.filter(c=>state.chapters.includes(c.id))).map((c,index)=>{
            const el=document.createElement('span');el.textContent=localized(c.labels,state.language);
            return {id:c.id,content:el.innerHTML,order:index};
        });
    }
    items(state) {
        const language = state.language;
        const labels = vocabulary.predicates;
        return Object.entries(this.provider.times).flatMap(([id, t]) => {
            if (!t.possible || (this.provider.belongs && !this.provider.belongs(id,state.chapters)))
                return [];
            const span = t.possible, el = document.createElement('span'), meta = this.provider.index.records[id];
            el.textContent = localized(meta?.labels, language) || localized(labels[meta?.type ?? '']?.labels, language) || id;
            const group = state.chapters?.length > 1 ? chronological(this.provider.chaptersFor(id,state.chapters))[0]?.id : undefined;
            return [{ id, ...(group ? {group} : {}), content: el.innerHTML, start: utcDate(span.from), ...(t.kind === 'interval' ? { end: utcDate(span.to), type: 'range' } : { type: 'point' }), className: !t.certain ? 'uncertain' : '' }];
        });
    }
    constructor(container, provider, state, onSelect, onYear) {
        const year = 'year' in state.time ? state.time.year : calendarDate(state.time.from).year;
        this.provider = provider;
        this.language = state.language;
        this.scope = JSON.stringify([state.chapters ?? [state.chapter],state.time]);
        const data = this.items(state), window = windowFor(state);
        const options = { height: '100%', rtl: false, showCurrentTime: false, stack: true, zoomable: true, moveable: true, selectable: true, editable: false, verticalScroll: true, start: utcDate(yearRange(Math.max(-10000, year - 15)).from), end: utcDate(yearRange(Math.min(2100, year + 15)).to), min: utcDate(yearRange(-10000).from), max: utcDate(yearRange(2100).to), moment: (d) => moment.utc(d), format: { minorLabels: { year: 'Y' }, majorLabels: { year: '' } }, tooltip: { followMouse: false }, showTooltips: false };
        // Function labels receive Moment values; custom BCE/CE labels avoid a visible year zero.
        options.format = axisFormat(state.language);
        options.start = utcDate(window.from);
        options.end = utcDate(window.to);
        this.timeline = new Timeline(container, data, options);
        this.timeline.setGroups(this.groups(state));
        this.timeline.addCustomTime(utcDate('year' in state.time ? yearRange(year).from : state.time.from), 'cursor');
        this.timeline.setCustomTimeTitle(formatYear(year, state.language), 'cursor');
        this.timeline.on('select', e => { if (e.items.length)
            onSelect(String(e.items[0])); });
        this.timeline.on('timechanged', e => onYear(e.time.getUTCFullYear()));
    }
    update(s) {
        const scope=JSON.stringify([s.chapters ?? [s.chapter],s.time]);
        if (this.language !== s.language || this.scope !== scope) { this.timeline.setItems(this.items(s)); this.timeline.setGroups(this.groups(s)); }
        this.language = s.language;
        const y = 'year' in s.time ? s.time.year : calendarDate(s.time.from).year;
        const current = utcDate('year' in s.time ? yearRange(y).from : s.time.from);
        this.timeline.setCustomTime(current,'cursor');
        this.timeline.setCustomTimeTitle(formatYear(y,s.language),'cursor');
        this.timeline.setOptions({format:axisFormat(s.language)});
        const win=this.timeline.getWindow();
        if (this.scope !== scope || current < win.start || current > win.end) this.timeline.setWindow(utcDate(windowFor(s).from),utcDate(windowFor(s).to),{animation:false});
        this.scope=scope;
        this.timeline.setSelection(s.id && this.provider.times[s.id]?.possible ? [s.id] : []);
    }
    resize() { this.timeline.redraw(); }
    destroy() { this.timeline.destroy(); }
}
