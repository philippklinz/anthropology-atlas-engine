import { normalizeTime } from '../domain/time.js';
import { references } from '../domain/references.js';
import { localized, textKey } from './query.js';
export function chapterRange(chapter) { return normalizeTime(chapter.initialState.time).possible; }
export function chronological(chapters) { return [...chapters].sort((a,b) => (chapterRange(a)?.from ?? Infinity) - (chapterRange(b)?.from ?? Infinity) || a.id.localeCompare(b.id)); }
// Only old catalogues lack explicit membership. Their fallback follows outgoing
// references from the chapter; it never expands packages or incoming neighbours.
export async function legacyMembers(chapter, getRecord) {
    const found = new Set([chapter.id]);
    async function visit(id) {
        if (found.has(id)) return;
        const r = await getRecord(id);
        if (r.kind === 'package' || r.kind === 'chapter') return;
        found.add(id);
        for (const ref of references(r)) await visit(ref.id);
    }
    for (const ref of references(chapter)) await visit(ref.id);
    return [...found];
}
export class ChapterSearch {
    constructor(chapters) {
        this.chapters = chronological(chapters);
        this.byId = new Map(this.chapters.map(c => [c.id,c]));
        this.documents = this.chapters.map(chapter => {
            const d = chapter.discovery ?? {}, facets = ['periods','regions','topics'].flatMap(k => d[k] ?? []);
            const title = textKey(Object.values(chapter.labels).join(' '));
            const terms = chapter.searchTerms ?? [];
            return {chapter, title, terms, haystack: textKey([title, ...Object.values(d.summary ?? {}), ...facets.flatMap(f => Object.values(f.labels)), ...terms].join(' ')), range: chapterRange(chapter)};
        });
        this.facets = Object.fromEntries(['periods','regions','topics'].map(key => {
            const entries = new Map();
            for (const c of this.chapters) for (const f of c.discovery?.[key] ?? []) {
                const item = entries.get(f.id) ?? {...f, count: 0}; item.count++; entries.set(f.id,item);
            }
            return [key,[...entries.values()]];
        }));
    }
    query(filters = {}, pageSize = 24) {
        const tokens = textKey(filters.query ?? '').split(/\s+/u).filter(Boolean);
        const result = [];
        for (const d of this.documents) {
            const c = d.chapter;
            if (['period','region','topic'].some(k => filters[k] && !(c.discovery?.[k+'s'] ?? []).some(x => x.id === filters[k]))) continue;
            if (filters.from !== undefined && (!d.range || d.range.to <= filters.from)) continue;
            if (filters.to !== undefined && (!d.range || d.range.from >= filters.to)) continue;
            if (!tokens.every(token => d.haystack.includes(token))) continue;
            const titleMatch = tokens.every(token => d.title.includes(token));
            const matchedTerm = tokens.length && !titleMatch ? d.terms.find(term => tokens.some(token => textKey(term).includes(token))) : undefined;
            result.push({chapter:c, matchedTerm, score: tokens.length && titleMatch ? 2 : 1});
        }
        // Stable sorting retains chronological order within a relevance rank.
        if (tokens.length) result.sort((a,b) => b.score-a.score);
        const pages = Math.max(1, Math.ceil(result.length/pageSize));
        const page = Math.min(pages-1, Math.max(0, filters.page ?? 0));
        return {items:result.slice(page*pageSize,(page+1)*pageSize),total:result.length,page,pages};
    }
}
export function openChapters(s, chapters) {
    const selected = chronological(chapters.filter(c => s.chapters.includes(c.id)));
    if (!selected.length) return {...s, view:'explore', id:undefined, chapter:''};
    const focused = selected.find(c => c.id === s.chapter) ?? selected[0];
    const ranges = selected.map(chapterRange).filter(Boolean);
    return {...s, view:'chapter',id:focused.id,chapter:focused.id,step:undefined,types:[],query:'',
        time: ranges.length ? {from:Math.min(...ranges.map(r=>r.from)),to:Math.max(...ranges.map(r=>r.to))} : s.time,
        camera:selected.length === 1 ? focused.initialState.camera : {longitude:-20,latitude:20,metersPerPixel:30000,bearing:0,pitch:0},
        layers:[...new Set(selected.flatMap(c=>[...c.initialState.layers,'events','located-at']))],
        interpretations:Object.assign({},...selected.map(c=>Object.fromEntries((c.interpretationChoices??[]).map(x=>[x.interpretationId,(x.recordId ?? x.assertionId)]))))};
}
