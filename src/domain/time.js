export const MIN_YEAR = -10000;
export const MAX_YEAR = 2100;
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
    const p = t.possible;
    return !!p && (mode === 'contained' ? p.from >= q.from && p.to <= q.to : p.from < q.to && q.from < p.to);
}
export function utcDate(day) { return new globalThis.Date(day * 86400000); }
export function formatYear(year, lang = 'de') {
    return `${year <= 0 ? 1 - year : year} ${lang.startsWith('de') ? year <= 0 ? 'v. Chr.' : 'n. Chr.' : year <= 0 ? 'BCE' : 'CE'}`;
}
export function formatTime(t, lang = 'de') {
    if (t.kind === 'unknown')
        return lang === 'de' ? 'Undatiert' : 'Undated';
    const fmt = (e) => {
        if (!e)
            return '?';
        const a = e.earliest, b = e.latest;
        const day = (d) => e.precision === 'day' ? `${d.day}.${d.month}. ${formatYear(d.year, lang)}` : e.precision === 'month' ? `${d.month}. ${formatYear(d.year, lang)}` : formatYear(d.year, lang);
        const same = e.precision === 'year' ? a.year === b.year : e.precision === 'month' ? a.year === b.year && a.month === b.month : epochDay(a) === epochDay(b);
        return `${e.qualifier === 'approximate' ? (lang === 'de' ? 'um ' : 'c. ') : e.qualifier === 'uncertain' ? '≈ ' : ''}${day(a)}${same ? '' : ` – ${day(b)}`}`;
    };
    return t.kind === 'instant' ? fmt(t.at) : `${fmt(t.start)} – ${fmt(t.end)}${t.endMeaning === 'last-attested' ? (lang === 'de' ? ' · zuletzt belegt' : ' · last attested') : ''}`;
}
