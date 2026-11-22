import { ChapterSearch, chronological, openChapters } from './query/chapters.js';
import { renderExplorer } from './ui/explorer.js';
import { imageURL } from './ui/images.js';
import { AtlasLayout } from './ui/layout.js';
import { StaticProvider } from './catalog/provider.js';
import { categoryCounts, activeCategory, directoryState } from './ui/directory.js';
import { emptyContext } from './state/empty.js';
import { Router } from './state/router.js';
import { defaultState, encodeState, target, filters, searchFilters } from './state/state.js';
import { localized } from './query/query.js';
import { formatTime, formatDisplayYear, formatRange, calendarDate, isDeepYear, MIN_YEAR, MAX_YEAR, BP_REFERENCE_YEAR, MAX_BP, yearFromBP } from './domain/time.js';
import { messages, typeLabels, eventRoleLabels } from './i18n/messages.js';
import { AtlasMap } from './map/map.js';
import { SvgGlobe } from './map/svg-globe.js';
import { AtlasTimeline } from './timeline/timeline.js';
import vocabulary from '../schemas/0.1.0/vocabulary.json' with {type:'json'};
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (name) => { const paths = { globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6h14M5 18h14"/>', network: '<circle cx="5" cy="6" r="3"/><circle cx="18" cy="5" r="3"/><circle cx="13" cy="19" r="3"/><path d="m8 6 7-1M7 8l5 8m5-8-3 8"/>', search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>', book: '<path d="M3 4h6l3 2 3-2h6v15h-6l-3 2-3-2H3zM12 6v15"/>', cube: '<path d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10"/>' }; return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5">${paths[name] ?? paths.book}</svg>`; };
document.querySelector('a.skip')?.addEventListener('click', e => { e.preventDefault(); ($('explorer').hidden ? $('main') : $('explore-main')).focus(); });
const root = $('app');
root.innerHTML = `<section id="explorer" hidden aria-label="Kapitel / Chapters"></section><div class="atlas-shell"><button id="menu-backdrop" tabindex="-1" hidden></button><aside id="sidebar" aria-label="Navigation" aria-hidden="true" inert></aside><header id="topbar"></header><main id="main" tabindex="-1"><div class="stage"><div id="map"></div><div id="network" hidden></div><div id="model" hidden></div><div id="page" hidden></div><div id="map-tools"></div><div id="map-notice" hidden></div><div id="map-caption"></div></div><aside id="detail" aria-label="Details"></aside></main><footer id="timebar"></footer><div id="announcer" role="status" aria-live="polite" class="sr-only"></div></div>`;
let provider, discovery, router, map, timeline, network, disposeModel, generation = 0, hasDemo = false;
const layout = new AtlasLayout(document.querySelector('.atlas-shell'), () => { if (!$('map').hidden) map?.resize(); timeline?.resize(); });
const isEmpty = () => provider.catalog.entrypoints.defaultChapterId === null;
const isDemo = () => provider.catalog.dataReleaseId.startsWith('fixture-');
const pred = vocabulary.predicates;
function label(id, lang) {
    const meta = provider.index.records[id];
    if (!meta)
        return id;
    const record = provider.records.get(id);
    if (record?.kind === 'assertion')
        return `${label(record.subjectId, lang)} · ${localized(pred[record.predicate]?.labels, lang)} · ${label(record.objectId, lang)}`;
    return localized(meta.labels, lang) || localized(pred[meta.type ?? '']?.labels, lang) || id;
}
function viewFor(id) { const kind = provider.index.records[id]?.kind; return kind === 'asset' ? (provider.index.records[id]?.assetType === 'image' || provider.records.get(id)?.assetType === 'image' ? 'image' : 'model') : kind === 'source' ? 'source' : kind === 'assertion' ? 'assertion' : kind === 'event' ? 'event' : kind === 'chapter' ? 'chapter' : 'entity'; }
function href(s, id, view) { return encodeState(target(s, view ?? viewFor(id), id)); }
function link(s, id, text, view) { return `<a href="${esc(href(s, id, view))}">${esc(text ?? label(id, s.language))}</a>`; }
function chapterBadges(s,id) { return `<span class="chapter-badges">${chronological(provider.chaptersFor(id,s.chapters)).map(ch=>`<a class="chapter-badge" href="${esc(encodeState(chapterState(ch,s)))}">${esc(localized(ch.labels,s.language).split(' · ')[0])}</a>`).join('')}</span>`; }
function recordList(s, ids) { return `<ul class="record-list">${ids.map(id => `<li>${link(s, id)}<span>${esc(typeLabels[provider.index.records[id]?.type ?? '']?.[s.language === 'de' ? 0 : 1] ?? typeLabels[provider.index.records[id]?.kind ?? '']?.[s.language === 'de' ? 0 : 1] ?? '')}</span>${chapterBadges(s,id)}</li>`).join('')}</ul>`; }
function setError(error) { document.querySelector('.atlas-shell').inert = false; $('explorer').hidden = true; document.querySelector('.atlas-shell').hidden = false; const msg = error instanceof Error ? error.message : String(error); $('page').hidden = false; $('page').innerHTML = `<div class="reading"><p class="eyebrow">Atlas</p><h1>Diese Ansicht ist nicht verfügbar / View unavailable</h1><p>${esc(msg)}</p><a href="#/v1/map">Zum Atlas / Return to atlas</a><button id="retry">Neu laden / Reload</button></div>`; $('retry').onclick = () => location.reload(); $('announcer').textContent = msg; }
function formYear(s, year) { if (Number.isInteger(year) && year >= MIN_YEAR && year <= MAX_YEAR)
    router.commit({ ...s, time: { year } }); }
function chapterState(ch, s) { return { ...s, view:'chapter', id:ch.id, chapter:ch.id, step:undefined, types:[], searchScope:'selection' }; }
function renderControls(s, ch) {
    const m = messages[s.language], url = (view, id) => esc(encodeState(target(s, view, id)));
    const allLayers = [...new Set([...provider.spatial.filter(x=>provider.belongs(x.recordId,s.chapters)).map(x => provider.index.records[x.recordId]?.kind === 'event' ? 'events' : provider.index.records[x.recordId]?.type ?? ''), 'events'])].filter(Boolean);
    const directory = categoryCounts(provider.scopedRecords(s.chapters)), category = s.view === 'search' ? activeCategory(s.types) : undefined;
    const entry = c => `<a class="directory-link ${category?.key === c.key ? 'active' : ''}" ${category?.key === c.key ? 'aria-current="page"' : ''} href="${esc(encodeState(directoryState(s, c.types)))}"><span>${esc(c.labels[s.language === 'de' ? 0 : 1])}</span><span class="directory-count">${c.count}</span></a>`;
    const directoryNav = `<nav class="nav-section directory" aria-label="${m.directory}"><span class="eyebrow">${m.directory}</span>${directory.filter(c => c.count > 0).map(entry).join('')}<details ${category && !directory.find(c => c.key === category.key)?.count ? 'open' : ''}><summary>${m.moreCategories}</summary>${directory.filter(c => c.count === 0).map(entry).join('')}<p class="nav-hint">${m.emptyCategories}</p></details></nav>`;
    const choices = chronological(provider.index.chapters.filter(c=>s.chapters.includes(c.id))).map(c => `<a class="chapter-link ${s.chapter === c.id ? 'active' : ''}" href="${esc(encodeState(chapterState(c, s)))}">${icon('book')}<span>${esc(localized(c.labels, s.language))}</span></a>`).join('');
    $('sidebar').innerHTML = `<div class="sidebar-heading"><button id="menu-close" class="icon-button" aria-label="${m.closeNavigation}">×</button><a class="brand" href="${url('map')}">${icon('globe')}<span>ANTHROPOLOGY<br><strong>ATLAS</strong></span></a></div><p class="brand-subtitle">${m.subtitle}</p><div class="nav-section"><div class="selection-heading"><span class="eyebrow">${s.language === 'de' ? 'Ausgewählte Kapitel' : 'Selected chapters'}</span><span class="selection-count">${s.chapters.length}</span></div>${choices}<a class="edit-selection" href="${url('explore')}">${s.language === 'de' ? 'Auswahl bearbeiten' : 'Edit selection'}</a></div>${directoryNav}<div class="nav-section"><span class="eyebrow">${m.layers}</span><form id="layers-form">${allLayers.map(l => `<label class="layer"><input type="checkbox" name="layer" value="${esc(l)}" ${s.layers.includes(l) ? 'checked' : ''}><span class="layer-mark ${l === 'events' ? 'event' : l === 'trades-with' ? 'trade' : ''}"></span>${esc(l === 'events' ? (s.language === 'de' ? 'Reisen und Ereignisse' : 'Journeys and events') : localized(pred[l]?.labels, s.language) || l)}</label>`).join('')}</form></div><nav class="secondary-nav"><a href="${esc(encodeState(directoryState(s)))}">${icon('search')}${m.showAll}</a><a href="${url('about')}">${m.about}</a><a href="${url('licenses')}">${m.licenses}</a></nav><div class="sidebar-bottom"><span class="version">ENGINE 0.1.0-dev.6</span><span>${isDemo() ? m.demo : esc(provider.catalog.dataReleaseId)}</span></div>`;
    $('topbar').innerHTML = `<button id="menu-button" class="icon-button" aria-label="${m.openNavigation}" aria-controls="sidebar" aria-expanded="false"><span aria-hidden="true">☰</span><span class="menu-label">${m.menu}</span></button><div class="top-title"><span class="eyebrow">${m.explore}</span><strong>${esc(localized(ch.labels, s.language))}</strong></div><form id="search-form" role="search"><label class="sr-only" for="search-input">${m.search}</label>${icon('search')}<input id="search-input" name="q" value="${esc(s.query)}" placeholder="${m.search}"><button type="submit" aria-label="${m.searchButton}">${icon('search')}</button></form><nav class="language"><a href="${esc(encodeState({ ...s, language: 'de' }))}" ${s.language === 'de' ? 'aria-current="true"' : ''}>DE</a><a href="${esc(encodeState({ ...s, language: 'en' }))}" ${s.language === 'en' ? 'aria-current="true"' : ''}>EN</a></nav>`;
    const focus = s.id && ['entity', 'event', 'network'].includes(s.view) ? s.id : ch.focusIds.find(id => provider.index.records[id]?.kind === 'entity');
    $('map-tools').innerHTML = `<div class="view-tabs"><a class="${!['network','model','image'].includes(s.view) ? 'active' : ''}" href="${url('map')}">${icon('globe')}${m.map}</a><a class="${s.view === 'network' ? 'active' : ''}" href="${url('network', focus)}">${icon('network')}${m.network}</a></div><div class="view-actions"><button id="world">${m.world}</button><button id="reset">${s.language === 'de' ? 'Auswahlansicht' : 'Selection view'}</button><button id="copy" aria-label="${m.copy}">${icon('book')} <span>${m.copy}</span></button></div>`;
    $('map-caption').innerHTML = `<span>${m.basemap}</span><span>${m.globeHint}</span>`;
    $('layers-form').onchange = () => router.commit({ ...s, layers: [...$('layers-form').querySelectorAll('input:checked')].map(e => e.value) });
    $('search-form').onsubmit = e => { e.preventDefault(); router.commit({ ...directoryState(s), query: $('search-input').value }); };
    $('world').onclick = () => router.commit({ ...s, view: 'map', id: undefined, camera: { longitude: 4, latitude: 35, metersPerPixel: 50000, bearing: 0, pitch: 0 } });
    $('reset').onclick = () => router.commit(openChapters(s,provider.index.chapters));
    $('copy').onclick = async () => { router.commitPreview(); try {
        await navigator.clipboard.writeText(location.href);
        $('announcer').textContent = m.copied;
        $('copy').textContent = m.copied;
    }
    catch {
        $('announcer').textContent = s.language === 'de' ? 'Bitte die URL aus der Adresszeile kopieren.' : 'Copy the URL from the address bar.';
    } };
    const year = 'year' in s.time ? s.time.year : calendarDate(s.time.from).year;
    if (!timeline) {
        $('timebar').innerHTML = '<div id="timeline-resizer" role="separator" aria-orientation="horizontal" aria-controls="timeline" tabindex="0"><span></span></div><div id="time-controls"></div><div id="timeline"></div>';
        timeline = new AtlasTimeline($('timeline'), provider, s, id => router.commit(target(router.state, viewFor(id), id)), year => formYear(router.state, year));
    }
    const deep = isDeepYear(year), step = deep ? 1000 : 1;
    const ageHint = s.language === 'de' ? 'BP = Jahre vor 1950 · Schraffur: Datierungsbereich, keine Dauer · ‹: ältere Grenze offen' : 'BP = years before 1950 · Hatching: dating range, not duration · ‹: older limit unknown';
    $('time-controls').innerHTML = `<div><span class="eyebrow">${m.time}</span><strong class="current-year">${esc('year' in s.time ? formatDisplayYear(year,s.language) : formatRange(s.time,s.language))}</strong></div><button class="selection-time-reset" id="selection-time">${s.language==='de'?'Gesamter Zeitraum':'Full date range'}</button><form id="year-form"><button type="button" id="previous" aria-label="${deep ? (s.language==='de'?'1.000 Jahre früher':'1,000 years earlier') : m.previous}">−</button><label class="sr-only" for="year">${m.year}</label><input id="year" type="number" min="1" max="${MAX_BP}" value="${deep ? BP_REFERENCE_YEAR-year : year <= 0 ? 1-year : year}" required><label class="sr-only" for="era">Era</label><select id="era"><option value="bp" ${deep?'selected':''}>${s.language==='de'?'Jahre BP':'years BP'}</option><option value="ce" ${!deep && year>0?'selected':''}>${m.ce}</option><option value="bce" ${!deep && year<=0?'selected':''}>${m.bce}</option></select><button type="submit">${m.apply}</button><button type="button" id="next" aria-label="${deep ? (s.language==='de'?'1.000 Jahre später':'1,000 years later') : m.next}">+</button></form><p class="time-hint">${deep ? ageHint : m.gap}</p>`;
    $('selection-time').onclick = () => router.commit({...s,time:openChapters(s,provider.index.chapters).time});
    const eraBounds = () => { const era=$('era').value; $('year').min=era==='bp'?'0':'1'; $('year').max=String(era==='bp'?MAX_BP:era==='bce'?1-MIN_YEAR:MAX_YEAR); };
    $('era').onchange = eraBounds; eraBounds();
    $('year-form').onsubmit = e => { e.preventDefault(); const y = Number($('year').value); formYear(s, $('era').value === 'bp' ? yearFromBP(y) : $('era').value === 'bce' ? 1-y : y); };
    $('previous').onclick = () => formYear(s, year-step);
    $('next').onclick = () => formYear(s, year+step);
    $('menu-backdrop').setAttribute('aria-label', m.closeNavigation);
    layout.sync(m);
    timeline.update(s);
}
function prose(text) { return text.split(/\n\s*\n/).map(p => p.startsWith('# ') ? `<h2>${esc(p.slice(2))}</h2>` : p.startsWith('## ') ? `<h3>${esc(p.slice(3))}</h3>` : `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join(''); }

function citations(s, r) {
    const m = messages[s.language];
    if (r.kind === 'source' && !r.sourceRefs.length) return '';
    return `<h2>${m.sources}</h2>` + (r.sourceRefs.length ? `<ul class="citations">${r.sourceRefs.map(c => `<li>${link(s, c.sourceId)}<p>${esc(c.locator ?? '')}</p>${c.note ? `<p>${esc(localized(c.note, s.language))}</p>` : ''}</li>`).join('')}</ul>` : `<p class="muted">${m.noSources}</p>`);
}
async function locationLink(s, record) {
    let spatial = record.spatial ?? [];
    if (record.kind === 'entity' && record.entityType === 'place') {
        for (const item of provider.spatial.filter(x=>provider.belongs(x.recordId,s.chapters))) {
            const event = await provider.getRecord(item.recordId);
            if (event.kind === 'event' && event.placeIds?.includes(record.id)) { spatial = event.spatial ?? []; break; }
        }
    }
    const spot = spatial.find(x => ['location','findspot'].includes(x.role));
    if (!spot) return '';
    const geometry = await provider.getRecord(spot.geometryId);
    if (geometry.kind !== 'geometry' || geometry.geometryType !== 'Point') return '';
    const feature = JSON.parse(new TextDecoder().decode(await provider.bytes(geometry.file)));
    const [longitude, latitude] = feature.geometry.coordinates;
    const dest = { ...target(s, viewFor(record.id), record.id), camera: { longitude, latitude, metersPerPixel: 3000, bearing: 0, pitch: 0 } };
    return `<p><a class="action-link" href="${esc(encodeState(dest))}">${icon('globe')}${messages[s.language].showOnMap}</a></p>`;
}

function rightsLabel(rights) {
    const code=esc(rights.license);
    return rights.license === 'CC-BY-SA-2.0' ? `<a href="https://creativecommons.org/licenses/by-sa/2.0/" target="_blank" rel="noopener noreferrer">${code}</a>` : code;
}
async function figure(s, asset, full=false) {
    const url = await imageURL(provider,asset);
    const image = `<img src="${esc(url)}" alt="${esc(localized(asset.alt,s.language))}">`;
    return `<figure class="content-image ${full?'full-image':''}">${full ? image : `<a href="${esc(href(s,asset.id,'image'))}" aria-label="${esc(localized(asset.labels,s.language))}">${image}</a>`}<figcaption><span>${esc(localized(asset.alt,s.language))}</span><small>${esc(asset.rights.attribution)} · ${rightsLabel(asset.rights)}</small></figcaption></figure>`;
}

async function detail(s, ch, ids) {
    const m = messages[s.language], r = s.id ? await provider.getRecord(s.id) : ch;
    const common = isDemo() ? `<p class="badge">${m.demo}</p><p><a href="./">${s.language === 'de' ? 'Zu den historischen Inhalten' : 'Open historical content'}</a></p>` : r.editorial?.status === 'draft' ? `<p class="badge">${m.researchDraft}</p>` : '';
    if (!ch.id && !s.id) return emptyDetail(s);
    if (r.kind === 'chapter') {
        const file = r.textFiles[s.language] ?? Object.values(r.textFiles)[0], text = new TextDecoder().decode(await provider.bytes(file));
        const sections = text.split(/\n\s*\n/);
        const intro = sections.splice(0, /^#\s/.test(sections[0]) ? 2 : 1).join('\n\n');
        const heroId = r.focusIds.find(id=>provider.index.records[id]?.assetType === 'image');
        const hero = heroId ? await figure(s,await provider.getRecord(heroId)) : ''; 
        return `${common}<h1>${esc(localized(r.labels, s.language))}</h1><div class="chapter-text intro">${prose(intro)}</div>${hero}<h2>${m.explore}</h2>${recordList(s, r.focusIds)}<div class="chapter-text">${prose(sections.join('\n\n'))}</div><details class="metadata"><summary>${m.results} · ${ids.length}</summary>${recordList(s, ids)}</details>${citations(s, r)}${isDemo() ? `<div class="note">${m.demoText}</div>` : ''}`;
    }
    let body = '';
    if ('time' in r)
        body += `<p class="date-label">${esc(formatTime(r.time, s.language))}</p>`;
    if ('summary' in r)
        body += `<p class="lede">${esc(localized(r.summary, s.language))}</p>`;
    if (r.kind === 'assertion')
        body += `<div class="relationship">${link(s, r.subjectId)}<span>${esc(localized(pred[r.predicate]?.labels, s.language))}</span>${link(s, r.objectId)}</div><p class="note">${r.epistemic.status === 'attested' ? m.attested : m.uncertain}</p>`;
    if (r.kind === 'event') {
        body += `${r.note ? `<p class="lede">${esc(localized(r.note, s.language))}</p>` : ''}<h2>${m.participants}</h2>${`<ul class="record-list">${r.participants.map(p => `<li>${link(s, p.entityId)}<span>${esc(eventRoleLabels[p.role]?.[s.language === 'de' ? 0 : 1] ?? p.role)}</span></li>`).join('')}</ul>`}`;
        if (r.waypoints?.length) body += `<h2>${m.stations}</h2><ol class="waypoints">${r.waypoints.map(w => `<li>${w.placeId ? link(s, w.placeId) : link(s, w.geometryId)}<span class="date-label">${esc(formatTime(w.time, s.language))}</span></li>`).join('')}</ol>`;
        if (r.parentEventId) body += `<p>${m.partOfJourney}: ${link(s, r.parentEventId)}</p>`;
    }
    const mapLink = await locationLink(s, r);
    if (mapLink) body += mapLink;
    if (r.kind === 'entity') {
        const edges = (await provider.relations(r.id, filters(s))).items;
        body += `<a class="action-link" href="${esc(href(s, r.id, 'network'))}">${icon('network')}${m.network}</a><h2>${m.relations}</h2>${recordList(s, [...new Set(edges.map(e => e.id))])}`;
        for (const sample of r.samples ?? [])
            body += `<div class="script-sample"><bdi lang="${esc(sample.languageTag)}" dir="${sample.direction ?? 'auto'}">${esc(sample.text)}</bdi>${sample.transliteration ? `<p>${esc(sample.transliteration)}</p>` : ''}</div>`;
        for (const id of r.assetIds ?? []) {
            const asset=await provider.getRecord(id);
            body += asset.assetType === 'image' ? await figure(s,asset) : `<p>${link(s,id,m.viewModel,'model')}</p>`;
        }
    }
    if (r.kind === 'asset')
        body += `<p class="lede">${esc(localized(r.alt, s.language))}</p><p>${esc(r.model?.representation === 'symbol' ? m.modelSymbol : r.model?.representation ?? (r.assetType === 'image' ? (s.language === 'de' ? 'Abbildung' : 'Illustration') : r.assetType))}</p><p class="note">${esc(r.rights.attribution)}</p>`;
    if (r.kind === 'source') {
        body += `<p>${esc((r.creators ?? []).join(', '))}</p><p>${esc(r.published ?? '')} ${esc(r.publisher ?? '')}</p>`;
        if (r.url && /^https?:\/\//.test(r.url))
            body += `<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${m.viewSource}</a>`;
        if (r.bibliographicNote)
            body += `<p>${esc(r.bibliographicNote)}</p>`;
    }
    body += citations(s, r);

    return `<a class="back-link" href="${esc(encodeState(target(s, 'map')))}">${m.close}</a>${common}<span class="eyebrow">${esc(typeLabels[r.kind === 'entity' ? r.entityType : r.kind]?.[s.language === 'de' ? 0 : 1] ?? r.kind)}</span><h1>${esc(label(r.id, s.language))}</h1>${chapterBadges(s,r.id)}${body}<details class="metadata"><summary>${m.details}</summary><code>${esc(r.id)}</code><p>${esc(r.editorial.status)}</p>${r.editorial.note ? `<p>${esc(localized(r.editorial.note, s.language))}</p>` : ''}${'time' in r ? `<p>${m.normalizedTime}: ${esc(formatTime(r.time, s.language, false))}</p>` : ''}<a href="${esc(href(s, r.id))}">${m.copy}</a></details>`;
}
async function render(s, warnings) {
    const current = ++generation, active = () => current === generation, m = messages[s.language];
    try {
        document.documentElement.lang = s.language;
        const exploring = s.view === 'explore';
        $('explorer').hidden = !exploring;
        const shell=document.querySelector('.atlas-shell');
        shell.hidden = exploring;
        shell.inert = !exploring;
        shell.setAttribute('aria-busy',String(!exploring));
        if (exploring) {
            layout.setOpen(false,false);
            renderExplorer($('explorer'),s,discovery,next=>router.commit(next));
            document.title = (s.language==='de'?'Geschichte erkunden':'Explore history')+' · '+m.atlas;
            return;
        }
        await provider.ensureAtlas();
        if (!active()) return;
        const chapter = !s.chapter && isEmpty() ? emptyContext : await provider.getRecord(s.chapter);
        if (chapter.kind !== 'chapter')
            throw new Error('URL_CHAPTER: chapter required');
        if (s.step && !chapter.steps?.some(step => step.id === s.step))
            throw new Error('URL_STEP: chapter step unavailable');
        if (s.id) {
            const r = await provider.getRecord(s.id);
            const expected = { chapter: 'chapter', assertion: 'assertion', event: 'event', source: 'source', model: 'asset', image: 'asset' };
            if (expected[s.view] && r.kind !== expected[s.view])
                throw new Error('URL_TARGET: wrong record type');
            if (r.editorial.status === 'withdrawn')
                throw new Error('RECORD_WITHDRAWN: ' + r.id);
        }
        if (!active())
            return;
        renderControls(s, chapter);
        document.querySelector('.atlas-shell').classList.toggle('empty-catalog', isEmpty());
        const features = await provider.features(s.spatialFilter, filters(s));
        if (!active())
            return;
        const ids = [...new Set(features.features.map(f => String(f.properties?.recordId)))];
        const content = await detail(s, chapter, ids);
        if (!active())
            return;
        $('detail').innerHTML = content;
        $('detail').scrollTop = 0;
        document.title = `${s.id ? label(s.id, s.language) : (s.view === 'search' && activeCategory(s.types)?.labels[s.language === 'de' ? 0 : 1]) || m[s.view === 'search' ? 'search' : s.view === 'licenses' ? 'licenses' : s.view === 'about' ? 'about' : 'atlas']} · ${m.atlas}`;
        network?.destroy();
        network = undefined;
        disposeModel?.();
        disposeModel = undefined;
        $('map').hidden = ['network','model','image'].includes(s.view) || ['search', 'about', 'licenses'].includes(s.view);
        $('network').hidden = s.view !== 'network';
        $('model').hidden = !['model','image'].includes(s.view);
        $('page').hidden = !['search', 'about', 'licenses'].includes(s.view);
        $('map-caption').hidden = $('map').hidden;
        $('map-notice').hidden = $('map').hidden || ids.length > 0 || isEmpty();
        $('map-notice').innerHTML = `<strong>${m.empty}</strong><p>${m.emptyHint}</p>`;
        if (!map) {
            try {
                map = new AtlasMap($('map'), s.camera, camera => router?.commit({ ...router.state, camera }), picked => { if (picked.length === 1)
                    router.commit(target(router.state, viewFor(picked[0]), picked[0]));
                else {
                    $('detail').innerHTML = `<h1>${m.results}</h1>${recordList(router.state, picked)}`;
                } }, message => { $('announcer').textContent = message; });
            }
            catch (error) {
                console.warn('MapLibre unavailable; using SVG globe', String(error));
                map = new SvgGlobe($('map'), s.camera, camera => router.commit({ ...router.state, camera }), ids => router.commit(target(router.state, viewFor(ids[0]), ids[0])));
            }
        }
        map?.setCamera(s.camera);
        map?.setFeatures(features, s.id);
        if (!$('map').hidden)
            map?.resize();
        if (s.view === 'network') {
            const focus = s.id ?? chapter.focusIds.find(id => provider.index.records[id]?.kind === 'entity') ?? chapter.focusIds[0];
            const { showNetwork } = await import('./network/network.js');
            if (!active())
                return;
            const n = await showNetwork($('network'), provider, s, focus, id => router.commit(target(router.state, viewFor(id), id)));
            if (!active()) {
                n.destroy();
                return;
            }
            network = n;
        }
        if (s.view === 'model') {
            const r = await provider.getRecord(s.id);
            if (r.kind !== 'asset' || r.assetType !== 'model')
                throw new Error('MODEL_TYPE: model expected');
            const [{ showModel }, bytes] = await Promise.all([import('./models/viewer.js'), provider.bytes(r.file)]);
            if (!active())
                return;
            $('model').replaceChildren();
            const dispose = await showModel($('model'), bytes);
            if (!active()) {
                dispose();
                return;
            }
            disposeModel = dispose;
        }
        if (s.view === 'image') {
            const asset = await provider.getRecord(s.id), html = await figure(s,asset,true);
            if (!active()) return;
            $('model').innerHTML = html;
        }
        if (s.view === 'search') {
            const result = await provider.search(s.query, searchFilters(s), s.language);
            if (!active())
                return;
            const category = activeCategory(s.types);
            $('page').innerHTML = `<div class="reading"><p class="eyebrow">${m.directory}</p><h1>${esc(s.query || category?.labels[s.language === 'de' ? 0 : 1] || m.showAll)}</h1><p class="muted">${s.language==='de'?'Ausgewählte Kapitel · unabhängig von der Kartenzeit':'Selected chapters · independent of map time'}</p><p>${result.total} ${m.results}</p>${result.items.length ? recordList(s, result.items.map(x => x.id)) : `<p>${m.noResults}</p><p class="muted">${m.emptyCategories}</p>`}${result.nextCursor ? `<button id="more">${m.more}</button>` : ''}</div>`;
            let cursor = result.nextCursor;
            if (cursor)
                $('more').onclick = async () => { if (!cursor)
                    return; const button = $('more'); button.disabled = true; try {
                    const next = await provider.search(s.query, searchFilters(s), s.language, cursor);
                    if (active()) {
                        button.insertAdjacentHTML('beforebegin', recordList(s, next.items.map(x => x.id)));
                        cursor = next.nextCursor;
                        if (!cursor)
                            button.remove();
                    }
                }
                catch (e) {
                    if (active())
                        setError(e);
                }
                finally {
                    button.disabled = false;
                } };
        }
        if (s.view === 'about')
            $('page').innerHTML = `<div class="reading"><p class="eyebrow">${m.about}</p><h1>${m.subtitle}</h1><p class="lede">${s.language === 'de' ? 'Ein offener Atlas für Geschichte, Gesellschaften und ihre Verbindungen.' : 'An open atlas of history, societies and their connections.'}</p>${isDemo() ? `<p>${m.demoText}</p>` : ''}<h2>${m.sourceVersion}</h2><code>${esc(provider.catalog.dataReleaseId)}</code><p>${provider.catalog.files.length} ${s.language === 'de' ? 'Dateien mit SHA-256-Prüfsummen' : 'files with SHA-256 checksums'}</p><h2>${m.engineVersion}</h2><p>0.1.0-dev.6 · MapLibre GL JS · vis.js · Three.js</p><a href="${esc(encodeState(target(s, 'licenses')))}">${m.licenses}</a></div>`;
        if (s.view === 'licenses') {
            const text = await fetch(new URL('licenses/THIRD_PARTY_NOTICES.md', document.baseURI)).then(r => r.text());
            const rights = await provider.items(provider.catalog.licenseInventory);
            const inventory = rights.map(r=>`<li><strong>${esc(label(r.id,s.language))}</strong><br>${esc(r.attribution)} · ${rightsLabel(r)}${r.sourceUrl && /^https?:\/\//.test(r.sourceUrl) ? ` · <a href="${esc(r.sourceUrl)}" target="_blank" rel="noopener noreferrer">${m.viewSource}</a>` : ''}</li>`).join('');
            if (!active())
                return;
            $('page').innerHTML = `<div class="reading"><p class="eyebrow">${m.licenses}</p><h1>Open Source</h1>${prose(text)}<p><a href="licenses/project.txt" target="_blank">GNU GPL v2</a></p><h2>${s.language === 'de' ? 'Inhalte und Abbildungen' : 'Content and illustrations'}</h2><ul class="license-inventory">${inventory}</ul></div>`;
        }
        if (active()) { shell.inert = false; shell.setAttribute('aria-busy','false'); }
        if (active())
            $('announcer').textContent = warnings.length ? `${warnings.join(', ')} · ${m.reset}` : document.title;
    }
    catch (e) {
        if (active())
            setError(e);
    }
}
function emptyDetail(s) {
    const de=s.language==='de';
    return `<h1>${de?'Der Atlas beginnt hier':'The atlas starts here'}</h1><p class="lede">${de?'Die Inhaltsquelle ist verbunden. Sie enthält noch keine veröffentlichten Kapitel.':'The content source is connected. It has no published chapters yet.'}</p><p>${de?'Hier können nach und nach belegte Orte, Personen, Sprachen und ihre Verbindungen entstehen.':'Documented places, people, languages and their connections can grow here.'}</p>${hasDemo?`<p><a class="action-link" href="?demo=1">${de?'Technikdemo mit fiktiven Inhalten öffnen':'Open technical demo with fictional content'}</a></p>`:''}<p><a href="./authoring.html">${de?'Inhalte prüfen und veröffentlichen':'Validate and publish content'}</a></p><details class="metadata"><summary>${de?'Verbundene Inhaltsquelle':'Connected content source'}</summary><a href="${esc(provider.catalogURL.href)}">${esc(provider.catalogURL.href)}</a><p>${de?'Einstellbar in':'Configured in'} <code>atlas.config.json</code></p></details>`;
}
try {
    const config = await fetch(new URL('atlas.config.json', document.baseURI), { cache: 'no-cache' }).then(r => { if (!r.ok)
        throw new Error('CONFIG_HTTP: ' + r.status); return r.json(); });
    hasDemo = !!config.demo;
    if (new URLSearchParams(location.search).get('demo') === '1') {
        if (!config.demo) throw new Error('CONFIG_DEMO: no demo configured');
        config.content = config.demo;
    }
    provider = await StaticProvider.open(config, new URL('./', document.baseURI), {catalogOnly:true});
    discovery = new ChapterSearch(provider.discovery);
    const chapter = isEmpty() ? emptyContext : provider.discovery.find(c=>c.id===provider.catalog.entrypoints.defaultChapterId);
    if (chapter.kind !== 'chapter')
        throw new Error('Default chapter is not a chapter');
    const defaults = defaultState(chapter, provider.sourceKey, provider.catalog.dataReleaseId, provider.config.defaultLanguage);
    if (!isEmpty()) Object.assign(defaults,{view:'explore',id:undefined,chapters:[]});
    router = new Router(defaults, (s, w) => { void render(s, w); }, setError, provider.index.chapters);
}
catch (e) {
    setError(e);
}
