// Epoch days remain integers outside the much narrower JavaScript Date range.
export const MIN_YEAR = -1000000;
export const MAX_YEAR = 2100;
export const BP_REFERENCE_YEAR = 1950;
export const MAX_BP = BP_REFERENCE_YEAR - MIN_YEAR;
export const DEEP_TIME_YEAR = -10000;
export const isDeepYear = year => year < DEEP_TIME_YEAR;
export function yearFromBP(age) {
    if (!Number.isSafeInteger(age) || age < 0 || age > MAX_BP) throw new Error('TIME_AGE: invalid years BP');
    return BP_REFERENCE_YEAR - age;
}
export function daysInMonth(year, month) {
    return [31, year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 0;
}
export function epochDay(d) {
    if (![d.year, d.month, d.day].every(Number.isInteger) || d.year < MIN_YEAR || d.year > MAX_YEAR || d.day < 1 || d.day > daysInMonth(d.year, d.month))
        throw new Error('TIME_CALENDAR: invalid supported calendar date');
    const y = d.year - (d.month <= 2 ? 1 : 0);
    const era = Math.floor(y / 400), yoe = y - era * 400;
    const doy = Math.floor((153 * (d.month + (d.month > 2 ? -3 : 9)) + 2) / 5) + d.day - 1;
    return era * 146097 + yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy - 719468;
}
export function calendarDate(day) {
    if (!Number.isInteger(day))
        throw new Error('TIME_DAY: integer required');
    const z = day + 719468, era = Math.floor(z / 146097), doe = z - era * 146097;
    const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
    const y = yoe + era * 400, doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
    const mp = Math.floor((5 * doy + 2) / 153), month = mp + (mp < 10 ? 3 : -9);
    return { year: y + (month <= 2 ? 1 : 0), month, day: doy - Math.floor((153 * mp + 2) / 5) + 1 };
}
export function estimateRange(e) {
    if (e.basis === 'years-before') {
        if (e.referenceYear !== BP_REFERENCE_YEAR || e.older < e.younger) throw new Error('TIME_AGE: invalid reference or age order');
        const from = yearRange(yearFromBP(e.older)).from, to = yearRange(yearFromBP(e.younger)).to;
        if (e.precision !== 'year' || !['exact','approximate','uncertain'].includes(e.qualifier)) throw new Error('TIME_AGE: invalid precision or qualifier');
        if (e.qualifier === 'exact' && e.older !== e.younger) throw new Error('TIME_EXACT: age bounds disagree');
        if (e.central !== undefined && (!Number.isSafeInteger(e.central) || e.central < e.younger || e.central > e.older)) throw new Error('TIME_AGE: central estimate is outside its bounds');
        if (e.uncertaintySigma !== undefined && (![1,2,3].includes(e.uncertaintySigma) || e.central === undefined || e.older-e.central !== e.central-e.younger || e.older === e.younger)) throw new Error('TIME_AGE: sigma requires symmetric nonzero bounds and a central estimate');
        return {from,to};
    }
    const from = epochDay(e.earliest), last = epochDay(e.latest);
    if (from > last)
        throw new Error('TIME_ORDER: earliest is later than latest');
    const a = e.earliest, b = e.latest;
    if (e.precision === 'year' && (a.month !== 1 || a.day !== 1 || b.month !== 12 || b.day !== 31))
        throw new Error('TIME_PRECISION: use complete years');
    if (e.precision === 'month' && (a.day !== 1 || b.day !== daysInMonth(b.year, b.month)))
        throw new Error('TIME_PRECISION: use complete months');
    if (e.qualifier === 'exact' && (e.precision === 'year' ? a.year !== b.year : e.precision === 'month' ? a.year !== b.year || a.month !== b.month : from !== last))
        throw new Error('TIME_EXACT: bounds disagree at the stated precision');
    return { from, to: last + 1 };
}
export function normalizeTime(t) {
    if (t.kind === 'unknown')
        return { possible: null, certain: null, kind: t.kind, partial: false };
    if (t.kind === 'instant') {
        const r = estimateRange(t.at);
        return { possible: r, certain: r.to - r.from === 1 ? r : null, kind: t.kind, partial: false };
    }
    if (t.kind === 'before') {
        const bound = estimateRange(t.bound);
        // The domain edge is only a query clip, never an asserted earliest date.
        return {possible:{from:yearRange(MIN_YEAR).from,to:bound.to},certain:null,kind:t.kind,partial:true,openStart:true,bound};
    }
    if (t.kind !== 'interval') throw new Error('TIME_KIND: unsupported time kind');
    const a = t.start ? estimateRange(t.start) : null, b = t.end ? estimateRange(t.end) : null;
    if (!a || !b)
        return { possible: null, certain: null, kind: t.kind, partial: true };
    if (a.from >= b.to)
        throw new Error('TIME_INTERVAL_ORDER: no possible start before end');
    const core = { from: a.to - 1, to: b.from + 1 };
    return { possible: { from: a.from, to: b.to }, certain: core.from < core.to ? core : null, kind: t.kind, partial: false };
}
export function yearRange(year) {
    return { from: epochDay({ year, month: 1, day: 1 }), to: epochDay({ year, month: 12, day: 31 }) + 1 };
}
export function matchesTime(t, q, mode = 'overlap') {
    if (t.openStart && mode === 'contained') return false;
    const p = t.possible;
    return !!p && (mode === 'contained' ? p.from >= q.from && p.to <= q.to : p.from < q.to && q.from < p.to);
}
export function utcDate(day) { return new globalThis.Date(day * 86400000); }
export function formatYear(year, lang = 'de') {
    return `${year <= 0 ? 1 - year : year} ${lang.startsWith('de') ? year <= 0 ? 'v. Chr.' : 'n. Chr.' : year <= 0 ? 'BCE' : 'CE'}`;
}
const number = (n, lang) => new Intl.NumberFormat(lang === 'de' ? 'de-DE' : 'en-GB').format(n);
export function formatDisplayYear(year, lang = 'de') {
    return isDeepYear(year) ? `${number(BP_REFERENCE_YEAR-year,lang)} ${lang === 'de' ? 'Jahre BP' : 'years BP'}` : formatYear(year,lang);
}
export function formatRange(range, lang = 'de') {
    const a = calendarDate(range.from).year, b = calendarDate(range.to-1).year;
    if (a === b) return formatDisplayYear(a,lang);
    if (isDeepYear(a) && isDeepYear(b)) return `${number(BP_REFERENCE_YEAR-a,lang)}–${number(BP_REFERENCE_YEAR-b,lang)} ${lang === 'de' ? 'Jahre BP' : 'years BP'}`;
    return `${formatDisplayYear(a,lang)} – ${formatDisplayYear(b,lang)}`;
}
export function formatTime(t, lang = 'de', useOriginal = true) {
    if (t.kind === 'unknown')
        return lang === 'de' ? 'Undatiert' : 'Undated';
    const fmt = (e) => {
        if (!e)
            return '?';
        if (e.basis === 'years-before') {
            if (!useOriginal) return formatRange(estimateRange(e),lang);
            const n = value => number(value,lang), prefix = e.qualifier === 'exact' ? '' : (lang === 'de' ? 'ca. ' : 'c. ');
            const age = e.central !== undefined && e.older-e.central === e.central-e.younger && e.older !== e.younger ? `${n(e.central)} ± ${n(e.older-e.central)}` : e.older === e.younger ? n(e.older) : `${n(e.older)}–${n(e.younger)}`;
            return `${prefix}${age} ${lang === 'de' ? 'Jahre BP' : 'years BP'}${e.uncertaintySigma ? ` (${e.uncertaintySigma}σ)` : ''}`;
        }
        if (useOriginal && e.original) {
            const calendar = e.original.calendar === 'julian' ? (lang === 'de' ? 'julianisch' : 'Julian') : e.original.calendar;
            return `${e.original.text} (${calendar})`;
        }
        const a = e.earliest, b = e.latest;
        const day = (d) => e.precision === 'day' ? `${d.day}.${d.month}. ${formatYear(d.year, lang)}` : e.precision === 'month' ? `${d.month}. ${formatYear(d.year, lang)}` : formatYear(d.year, lang);
        const same = e.precision === 'year' ? a.year === b.year : e.precision === 'month' ? a.year === b.year && a.month === b.month : epochDay(a) === epochDay(b);
        return `${e.qualifier === 'approximate' ? (lang === 'de' ? 'um ' : 'c. ') : e.qualifier === 'uncertain' ? '≈ ' : ''}${day(a)}${same ? '' : ` – ${day(b)}`}`;
    };
    if (t.kind === 'before') return `${lang === 'de' ? 'Älter als die Datierungsgrenze: ' : 'Older than the dating boundary: '}${fmt(t.bound)} · ${lang === 'de' ? 'ältere Grenze offen' : 'older limit unknown'}`;
    return t.kind === 'instant' ? fmt(t.at) : `${fmt(t.start)} – ${fmt(t.end)}${t.endMeaning === 'last-attested' ? (lang === 'de' ? ' · zuletzt belegt' : ' · last attested') : ''}`;
}
