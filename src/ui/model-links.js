import { localized } from '../query/query.js';
import { encodeState, target } from '../state/state.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function chapterModelIds(chapter, index) {
    const ids = [...new Set([...(chapter.focusIds ?? []), ...(chapter.recordIds ?? [])])];
    return ids.filter(id => index.records[id]?.kind === 'asset' && index.records[id].assetType === 'model');
}

export function chapterModelLinks(state, chapter, index) {
    const ids = chapterModelIds(chapter, index);
    if (!ids.length) return '';
    const de = state.language === 'de';
    return `<section class="chapter-models" aria-label="${de ? '3D im Kapitel' : '3D in this chapter'}"><h2>${de ? '3D im Kapitel' : '3D in this chapter'}</h2>${ids.map(id => {
        const name = localized(index.records[id].labels, state.language) || id;
        const url = encodeState(target(state, 'model', id));
        return `<a class="model-card" href="${esc(url)}"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10"/></svg><span><strong>${esc(name)}</strong><span class="model-card-action">${de ? 'Modell öffnen · drehen & zoomen' : 'Open model · rotate & zoom'}</span></span></a>`;
    }).join('')}</section>`;
}
