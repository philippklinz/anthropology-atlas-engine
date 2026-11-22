import { chronological } from '../query/chapters.js';
import vocabulary from '../../schemas/0.1.0/vocabulary.json' with { type: 'json' };
import { localized } from '../query/query.js';
import { Timeline } from '../../vendor/vis/timeline.mjs';
import moment from '../../vendor/moment/moment.js';
import { formatYear, formatDisplayYear, formatTime, formatRange, calendarDate, yearRange, MIN_YEAR, MAX_YEAR, DEEP_TIME_YEAR, BP_REFERENCE_YEAR, isDeepYear } from '../domain/time.js';
import { timelineProjection } from './projection.js';
function windowFor(state, projection) {
    const min = projection.deep ? MIN_YEAR : DEEP_TIME_YEAR;
    if ('year' in state.time) { const pad = isDeepYear(state.time.year) ? 10000 : 15; return { from: yearRange(Math.max(min, state.time.year - pad)).from, to: yearRange(Math.min(MAX_YEAR, state.time.year + pad)).to }; }
    const pad = Math.max(30, Math.ceil((state.time.to - state.time.from) * 0.12));
    return { from: Math.max(yearRange(min).from, state.time.from - pad), to: Math.min(yearRange(MAX_YEAR).to, state.time.to + pad) };
}
function axisFormat(language, projection) {
    const months = language === 'de' ? ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'] : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return {
        minorLabels: (date, scale) => {
            if (projection.deep) {
                const year = calendarDate(projection.fromDate(Number(date))).year;
                const step = scale === 'year' ? 1000 : scale === 'month' ? 100 : 1;
                const rounded = isDeepYear(year) ? BP_REFERENCE_YEAR-Math.round((BP_REFERENCE_YEAR-year)/step)*step : year;
                // BP is explained above the axis; repeating its unit on every tick
                // makes long six-digit age labels collide.
                return isDeepYear(rounded) ? new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-GB').format(BP_REFERENCE_YEAR-rounded) : formatYear(rounded,language);
            }
            const d = moment.utc(date);
            if (scale === 'year') return formatYear(d.year(), language);
            if (scale === 'month') return months[d.month()];
            if (['day','weekday','week'].includes(scale)) return `${d.date()}.${d.month()+1}.`;
            return d.format('HH:mm');
        },
        majorLabels: (date, scale) => projection.deep || scale === 'year' ? '' : formatYear(moment.utc(date).year(), language)
    };
}
export class AtlasTimeline {
    timeline;
    provider;
    language;
    projectionFor(state) {
        // Items remain available outside the time filter. Their dates also determine
        // the projection, so selecting a recent cursor cannot overflow Date.
        const deepItem = Object.entries(this.provider.times).some(([id,t]) => t.possible &&
            (!this.provider.belongs || this.provider.belongs(id,state.chapters)) &&
            isDeepYear(calendarDate(t.possible.from).year));
        return timelineProjection(deepItem ? {year:MIN_YEAR} : state.time);
    }
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
            const relation = this.assertions.get(id);
            if (relation) el.textContent = `${localized(this.provider.index.records[relation.from]?.labels,language)} · ${localized(labels[relation.predicate]?.labels,language)} · ${localized(this.provider.index.records[relation.to]?.labels,language)}`;
            const group = state.chapters?.length > 1 ? chronological(this.provider.chaptersFor(id,state.chapters))[0]?.id : undefined;
            const uncertainty = t.kind === 'instant' && span.to-span.from > 1;
            const title = document.createElement('span');
            title.textContent = `${t.display ? formatTime(t.display,language) : formatRange(span,language)}${uncertainty ? (language === 'de' ? ' · Datierungsbereich, keine Dauer' : ' · Dating range, not a duration') : ''}`;
            if (t.openStart) el.textContent = '‹ '+el.textContent;
            return [{ id, ...(group ? {group} : {}), content: el.innerHTML, title:title.innerHTML, start: this.projection.toDate(span.from), ...(t.kind === 'interval' || uncertainty || t.openStart ? { end: this.projection.toDate(span.to), type: 'range' } : { type: 'point' }), className: [!t.certain ? 'uncertain' : '',uncertainty ? 'uncertain-instant' : '', t.openStart ? 'open-start' : ''].filter(Boolean).join(' ') }];
        });
    }
    constructor(container, provider, state, onSelect, onYear) {
        const year = 'year' in state.time ? state.time.year : calendarDate(state.time.from).year;
        this.provider = provider;
        this.assertions = new Map(Object.values(provider.edges ?? {}).flat().filter(e=>!e.event).map(e=>[e.id,e]));
        this.projection = this.projectionFor(state);
        this.language = state.language;
        this.scope = JSON.stringify([state.chapters ?? [state.chapter],state.time]);
        const data = this.items(state), window = windowFor(state,this.projection);
        const options = { height: '100%', rtl: false, showCurrentTime: false, stack: true, zoomable: true, moveable: true, selectable: true, editable: false, verticalScroll: true, min: this.projection.min, max: this.projection.max, zoomMin:this.projection.zoomMin, moment: (d) => moment.utc(d), tooltip: { followMouse: false }, showTooltips: true };
        // Function labels receive Moment values; custom BCE/CE labels avoid a visible year zero.
        options.format = axisFormat(state.language,this.projection);
        options.start = this.projection.toDate(window.from);
        options.end = this.projection.toDate(window.to);
        this.timeline = new Timeline(container, data, options);
        this.timeline.setGroups(this.groups(state));
        this.timeline.addCustomTime(this.projection.toDate('year' in state.time ? yearRange(year).from : state.time.from), 'cursor');
        this.timeline.setCustomTimeTitle(formatDisplayYear(year, state.language), 'cursor');
        this.timeline.on('select', e => { if (e.items.length)
            onSelect(String(e.items[0])); });
        this.timeline.on('timechanged', e => onYear(calendarDate(this.projection.fromDate(e.time)).year));
    }
    update(s) {
        const scope=JSON.stringify([s.chapters ?? [s.chapter],s.time]);
        const next = this.projectionFor(s), changed = next.deep !== this.projection.deep;
        this.projection = next;
        this.timeline.setOptions({min:next.min,max:next.max,zoomMin:next.zoomMin,format:axisFormat(s.language,next)});
        if (changed || this.language !== s.language || this.scope !== scope) { this.timeline.setItems(this.items(s)); this.timeline.setGroups(this.groups(s)); }
        this.language = s.language;
        const y = 'year' in s.time ? s.time.year : calendarDate(s.time.from).year;
        const current = next.toDate('year' in s.time ? yearRange(y).from : s.time.from);
        this.timeline.setCustomTime(current,'cursor');
        this.timeline.setCustomTimeTitle(formatDisplayYear(y,s.language),'cursor');
        const win=this.timeline.getWindow();
        if (changed || this.scope !== scope || current < win.start || current > win.end) this.timeline.setWindow(next.toDate(windowFor(s,next).from),next.toDate(windowFor(s,next).to),{animation:false});
        this.scope=scope;
        this.timeline.setSelection(s.id && this.provider.times[s.id]?.possible ? [s.id] : []);
    }
    resize() { this.timeline.redraw(); }
    destroy() { this.timeline.destroy(); }
}
