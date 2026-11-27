import { openChapters } from '../query/chapters.js';
import { encodeState } from '../state/state.js';

export function escapeHTML(value) {
    const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(value ?? '').replace(/[&<>"']/g, character => entities[character]);
}

function chapterHref(id, state, chapters) {
    const chapter = chapters.find(item => item.id === id);
    if (!chapter) return null;
    const next = { ...state, view: 'chapter', chapter: id, id, step: undefined, detail: 'overview', query: '', types: [], searchScope: 'selection' };
    if (state.chapters.length <= 1) return encodeState(openChapters({ ...next, chapters: [id] }, [chapter]));
    return encodeState({ ...next, chapters: [...new Set([...state.chapters, id])] });
}

export function chapterProse(text, state, chapters) {
    function inline(paragraph) {
        return escapeHTML(paragraph)
            .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\[([^\]\n]+)\]\((chapter:[a-z0-9]+(?:-[a-z0-9]+)*)\)/g, (_match, label, id) => {
                const href = chapterHref(id, state, chapters);
                return href ? `<a href="${escapeHTML(href)}">${label}</a>` : label;
            })
            .replace(/\n/g, '<br>');
    }
    return text.split(/\n\s*\n/).map(paragraph => {
        if (paragraph.startsWith('# ')) return `<h2>${escapeHTML(paragraph.slice(2))}</h2>`;
        if (paragraph.startsWith('## ')) return `<h3>${escapeHTML(paragraph.slice(3))}</h3>`;
        return `<p>${inline(paragraph)}</p>`;
    }).join('');
}
