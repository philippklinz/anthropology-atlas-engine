import { openChapters } from '../query/chapters.js';
import { encodeState } from '../state/state.js';
import { chapterStepState } from '../state/steps.js';

export function escapeHTML(value) {
    const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(value ?? '').replace(/[&<>"']/g, character => entities[character]);
}

function chapterHref(id, step, state, chapters) {
    const chapter = chapters.find(item => item.id === id);
    if (!chapter || (step && !chapter.steps?.some(item => item.id === step))) return null;
    const next = { ...state, view: 'chapter', chapter: id, id, step: undefined, detail: 'overview', query: '', types: [], searchScope: 'selection' };
    const selection = state.chapters.length <= 1
        ? openChapters({ ...next, chapters: [id] }, [chapter])
        : { ...next, chapters: [...new Set([...state.chapters, id])] };
    return encodeState(step ? chapterStepState(selection, chapter, step) : selection);
}

export function chapterProse(text, state, chapters) {
    function inline(paragraph) {
        return escapeHTML(paragraph)
            .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\[([^\]\n]+)\]\((chapter:[a-z0-9]+(?:-[a-z0-9]+)*)(?:#([a-z0-9]+(?:-[a-z0-9]+)*))?\)/g, (_match, label, id, step) => {
                const href = chapterHref(id, step, state, chapters);
                return href ? `<a href="${escapeHTML(href)}"${step ? ' data-reading-station' : ''}>${label}</a>` : label;
            })
            .replace(/\n/g, '<br>');
    }
    return text.split(/\n\s*\n/).map(paragraph => {
        if (paragraph.startsWith('# ')) return `<h2>${escapeHTML(paragraph.slice(2))}</h2>`;
        if (paragraph.startsWith('## ')) {
            const heading = paragraph.slice(3);
            const anchor = heading.match(/ \{#([a-z0-9]+(?:-[a-z0-9]+)*)\}$/);
            if (anchor) return `<h3 id="reading-${anchor[1]}" tabindex="-1">${escapeHTML(heading.slice(0, anchor.index))}</h3>`;
            return `<h3>${escapeHTML(heading)}</h3>`;
        }
        return `<p>${inline(paragraph)}</p>`;
    }).join('');
}
