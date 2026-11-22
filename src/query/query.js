import { matchesTime } from '../domain/time.js';
export function textKey(s) { return s.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase().trim(); }
export function localized(labels, language, fallback = 'de') { return labels?.[language] ?? labels?.[language.split('-')[0]] ?? labels?.[fallback] ?? Object.values(labels ?? {})[0] ?? ''; }
export function matchesTypes(meta, types) { return !types.length || types.includes(meta.type) || types.includes(meta.kind); }
export function temporalMatch(id, times, f) { const t = times[id]; return f.allTime || !t || (!t.possible ? f.includeUndated : matchesTime(t, f.range, f.mode)); }
export function rankSearch(docs, query, lang) {
    const q = textKey(query);
    return docs.flatMap(d => {
        const names = Object.values(d.labels).map(textKey), aliases = d.aliases.map(textKey);
        let score = 0, reason = 'text';
        if (!q)
            score = 1;
        else if (textKey(d.id) === q) {
            score = 100;
            reason = 'id';
        }
        else if (names.includes(q)) {
            score = 90;
            reason = 'name';
        }
        else if (names.some(n => n.includes(q))) {
            score = 70;
            reason = 'name';
        }
        else if (aliases.some(n => n.includes(q))) {
            score = 50;
            reason = 'alias';
        }
        else if (textKey(d.text).includes(q))
            score = 20;
        if (!score)
            return [];
        return [{ id: d.id, label: localized(d.labels, lang) || d.id, type: d.type, score, reason }];
    }).sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
}
export function bboxOverlap(a, b) {
    const split = (r) => r[0] <= r[2] ? [r] : [[r[0], r[1], 180, r[3]], [-180, r[1], r[2], r[3]]];
    return split(a).some(x => split(b).some(y => x[0] <= y[2] && y[0] <= x[2] && x[1] <= y[3] && y[1] <= x[3]));
}
