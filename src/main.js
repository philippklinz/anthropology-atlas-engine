import { StaticProvider } from './catalog/provider.js';
import { emptyContext } from './state/empty.js';
import { Router } from './state/router.js';
import { defaultState, encodeState, target, filters } from './state/state.js';
import { localized } from './query/query.js';
import { formatTime, formatYear, calendarDate } from './domain/time.js';
import { messages, typeLabels } from './i18n/messages.js';
import { AtlasMap } from './map/map.js';
import { SvgGlobe } from './map/svg-globe.js';
import { AtlasTimeline } from './timeline/timeline.js';
import vocabulary from '../schemas/0.1.0/vocabulary.json' with {type:'json'};
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (name) => { const paths = { globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6h14M5 18h14"/>', network: '<circle cx="5" cy="6" r="3"/><circle cx="18" cy="5" r="3"/><circle cx="13" cy="19" r="3"/><path d="m8 6 7-1M7 8l5 8m5-8-3 8"/>', search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>', book: '<path d="M3 4h6l3 2 3-2h6v15h-6l-3 2-3-2H3zM12 6v15"/>', cube: '<path d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10"/>' }; return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5">${paths[name] ?? paths.book}</svg>`; };
document.querySelector('a.skip')?.addEventListener('click', e => { e.preventDefault(); $('main').focus(); });
const root = $('app');
root.innerHTML = `<div class="atlas-shell"><aside id="sidebar" aria-label="Navigation"></aside><header id="topbar"></header><main id="main" tabindex="-1"><div class="stage"><div id="map"></div><div id="network" hidden></div><div id="model" hidden></div><div id="page" hidden></div><div id="map-tools"></div><div id="map-notice" hidden></div><div id="map-caption"></div></div><aside id="detail" aria-label="Details"></aside></main><footer id="timebar"></footer><div id="announcer" role="status" aria-live="polite" class="sr-only"></div></div>`;
let provider, router, map, timeline, network, disposeModel, generation = 0, hasDemo = false;
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
function viewFor(id) { const kind = provider.index.records[id]?.kind; return kind === 'asset' ? 'model' : kind === 'source' ? 'source' : kind === 'assertion' ? 'assertion' : kind === 'event' ? 'event' : kind === 'chapter' ? 'chapter' : 'entity'; }
function href(s, id, view) { return encodeState(target(s, view ?? viewFor(id), id)); }
function link(s, id, text, view) { return `<a href="${esc(href(s, id, view))}">${esc(text ?? label(id, s.language))}</a>`; }
function recordList(s, ids) { return `<ul class="record-list">${ids.map(id => `<li>${link(s, id)}<span>${esc(typeLabels[provider.index.records[id]?.type ?? '']?.[s.language === 'de' ? 0 : 1] ?? typeLabels[provider.index.records[id]?.kind ?? '']?.[s.language === 'de' ? 0 : 1] ?? '')}</span></li>`).join('')}</ul>`; }
function setError(error) { const msg = error instanceof Error ? error.message : String(error); $('page').hidden = false; $('page').innerHTML = `<div class="reading"><p class="eyebrow">Atlas</p><h1>Diese Ansicht ist nicht verfügbar / View unavailable</h1><p>${esc(msg)}</p><a href="#/v1/map">Zum Atlas / Return to atlas</a><button id="retry">Neu laden / Reload</button></div>`; $('retry').onclick = () => location.reload(); $('announcer').textContent = msg; }
function formYear(s, year) { if (Number.isInteger(year) && year >= -10000 && year <= 2100)
    router.commit({ ...s, time: { year } }); }
function chapterState(ch, s) { return { ...defaultState(ch, s.sourceKey, s.release, s.language), camera: ch.initialState.camera }; }
function renderControls(s, ch) {
    const m = messages[s.language], url = (view, id) => esc(encodeState(target(s, view, id)));
    const allLayers = [...new Set([...provider.spatial.map(x => provider.index.records[x.recordId]?.kind === 'event' ? 'events' : provider.index.records[x.recordId]?.type ?? ''), 'events'])].filter(Boolean);
    const choices = provider.index.chapters.map(c => `<a class="chapter-link ${s.chapter === c.id ? 'active' : ''}" href="${esc(encodeState(chapterState(c, s)))}">${icon('book')}<span>${esc(localized(c.labels, s.language))}</span></a>`).join('');
    $('sidebar').innerHTML = `<a class="brand" href="${url('map')}">${icon('globe')}<span>ANTHROPOLOGY<br><strong>ATLAS</strong></span></a><p class="brand-subtitle">${m.subtitle}</p><div class="nav-section"><span class="eyebrow">${m.chapters}</span>${choices}</div><div class="nav-section"><span class="eyebrow">${m.layers}</span><form id="layers-form">${allLayers.map(l => `<label class="layer"><input type="checkbox" name="layer" value="${esc(l)}" ${s.layers.includes(l) ? 'checked' : ''}><span class="layer-mark ${l === 'events' ? 'event' : l === 'trades-with' ? 'trade' : ''}"></span>${esc(l === 'events' ? (s.language === 'de' ? 'Reisen und Ereignisse' : 'Journeys and events') : localized(pred[l]?.labels, s.language) || l)}</label>`).join('')}</form></div><nav class="secondary-nav"><a href="${url('search')}">${icon('search')}${m.showAll}</a><a href="${url('about')}">${m.about}</a><a href="${url('licenses')}">${m.licenses}</a></nav><div class="sidebar-bottom"><span class="version">ENGINE 0.1.0-dev.2</span><span>${isDemo() ? m.demo : esc(provider.catalog.dataReleaseId)}</span></div>`;
    $('topbar').innerHTML = `<button id="menu-button" class="icon-button" aria-label="${m.navigation}">☰</button><div class="top-title"><span class="eyebrow">${m.explore}</span><strong>${esc(localized(ch.labels, s.language))}</strong></div><form id="search-form" role="search"><label class="sr-only" for="search-input">${m.search}</label>${icon('search')}<input id="search-input" name="q" value="${esc(s.query)}" placeholder="${m.search}"><button type="submit" aria-label="${m.searchButton}">${icon('search')}</button></form><nav class="language"><a href="${esc(encodeState({ ...s, language: 'de' }))}" ${s.language === 'de' ? 'aria-current="true"' : ''}>DE</a><a href="${esc(encodeState({ ...s, language: 'en' }))}" ${s.language === 'en' ? 'aria-current="true"' : ''}>EN</a></nav>`;
    const focus = s.id && ['entity', 'network'].includes(s.view) ? s.id : ch.focusIds.find(id => provider.index.records[id]?.kind === 'entity');
    $('map-tools').innerHTML = `<div class="view-tabs"><a class="${s.view !== 'network' && s.view !== 'model' ? 'active' : ''}" href="${url('map')}">${icon('globe')}${m.map}</a><a class="${s.view === 'network' ? 'active' : ''}" href="${url('network', focus)}">${icon('network')}${m.network}</a></div><div class="view-actions"><button id="world">${m.world}</button><button id="reset">${m.reset}</button><button id="copy" aria-label="${m.copy}">${icon('book')} <span>${m.copy}</span></button></div>`;
    $('map-caption').innerHTML = `<span>${m.basemap}</span><span>${m.globeHint}</span>`;
    $('layers-form').onchange = () => router.commit({ ...s, layers: [...$('layers-form').querySelectorAll('input:checked')].map(e => e.value) });
    $('search-form').onsubmit = e => { e.preventDefault(); router.commit({ ...s, view: 'search', id: undefined, query: $('search-input').value }); };
    $('menu-button').onclick = () => $('sidebar').classList.toggle('open');
    $('world').onclick = () => router.commit({ ...s, view: 'map', id: undefined, camera: { longitude: 4, latitude: 35, metersPerPixel: 50000, bearing: 0, pitch: 0 } });
    $('reset').onclick = () => router.commit(chapterState(ch, s));
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
        $('timebar').innerHTML = '<div id="time-controls"></div><div id="timeline"></div>';
        timeline = new AtlasTimeline($('timeline'), provider, s, id => router.commit(target(router.state, viewFor(id), id)), year => formYear(router.state, year));
    }
    $('time-controls').innerHTML = `<div><span class="eyebrow">${m.time}</span><strong class="current-year">${esc('year' in s.time ? formatYear(year, s.language) : m.range)}</strong></div><form id="year-form"><button type="button" id="previous" aria-label="${m.previous}">−</button><label class="sr-only" for="year">${m.year}</label><input id="year" type="number" min="1" max="10001" value="${year <= 0 ? 1 - year : year}" required><label class="sr-only" for="era">Era</label><select id="era"><option value="ce" ${year > 0 ? 'selected' : ''}>${m.ce}</option><option value="bce" ${year <= 0 ? 'selected' : ''}>${m.bce}</option></select><button type="submit">${m.apply}</button><button type="button" id="next" aria-label="${m.next}">+</button></form><p>${m.gap}</p>`;
    $('year-form').onsubmit = e => { e.preventDefault(); const y = Number($('year').value); formYear(s, $('era').value === 'bce' ? 1 - y : y); };
    $('previous').onclick = () => formYear(s, year - 1);
    $('next').onclick = () => formYear(s, year + 1);
    timeline.update(s);
}
function prose(text) { return text.split(/\n\s*\n/).map(p => p.startsWith('# ') ? `<h2>${esc(p.slice(2))}</h2>` : p.startsWith('## ') ? `<h3>${esc(p.slice(3))}</h3>` : `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join(''); }
async function detail(s, ch, ids) {
    const m = messages[s.language], r = s.id ? await provider.getRecord(s.id) : ch;
    const common = isDemo() ? `<p class="badge">${m.demo}</p>` : '';
    if (!ch.id && !s.id) return emptyDetail(s);
    if (r.kind === 'chapter') {
        const file = r.textFiles[s.language] ?? Object.values(r.textFiles)[0], text = new TextDecoder().decode(await provider.bytes(file));
        return `${common}<h1>${esc(localized(r.labels, s.language))}</h1><p class="lede">${s.language === 'de' ? 'Wie verbinden sich Orte, Menschen und Wissen über Raum und Zeit?' : 'How do places, people and knowledge connect across space and time?'}</p><div class="chapter-text">${prose(text)}</div><h2>${m.explore}</h2>${recordList(s, r.focusIds)}<h2>${m.results} <span class="count">${ids.length}</span></h2>${recordList(s, ids)}${isDemo() ? `<div class="note">${m.demoText}</div>` : ''}`;
    }
    let body = '';
    if ('time' in r)
        body += `<p class="date-label">${esc(formatTime(r.time, s.language))}</p>`;
    if ('summary' in r)
        body += `<p class="lede">${esc(localized(r.summary, s.language))}</p>`;
    if (r.kind === 'assertion')
        body += `<div class="relationship">${link(s, r.subjectId)}<span>${esc(localized(pred[r.predicate]?.labels, s.language))}</span>${link(s, r.objectId)}</div><p class="note">${r.epistemic.status === 'attested' ? m.attested : m.uncertain}</p>`;
    if (r.kind === 'event')
        body += `<h2>${m.relations}</h2>${recordList(s, r.participants.map(p => p.entityId))}${r.note ? `<p>${esc(localized(r.note, s.language))}</p>` : ''}`;
    if (r.kind === 'entity') {
        const edges = (await provider.relations(r.id, filters(s))).items;
        body += `<a class="action-link" href="${esc(href(s, r.id, 'network'))}">${icon('network')}${m.network}</a><h2>${m.relations}</h2>${recordList(s, [...new Set(edges.map(e => e.id))])}`;
        for (const sample of r.samples ?? [])
            body += `<div class="script-sample"><bdi lang="${esc(sample.languageTag)}" dir="${sample.direction ?? 'auto'}">${esc(sample.text)}</bdi>${sample.transliteration ? `<p>${esc(sample.transliteration)}</p>` : ''}</div>`;
        for (const asset of r.assetIds ?? [])
            body += `<p>${link(s, asset, m.viewModel, 'model')}</p>`;
    }
    if (r.kind === 'asset')
        body += `<p class="lede">${esc(localized(r.alt, s.language))}</p><p>${esc(r.model?.representation === 'symbol' ? m.modelSymbol : r.model?.representation ?? r.assetType)}</p><p class="note">${esc(r.rights.attribution)}</p>`;
    if (r.kind === 'source') {
        body += `<p>${esc((r.creators ?? []).join(', '))}</p><p>${esc(r.published ?? '')} ${esc(r.publisher ?? '')}</p>`;
        if (r.url && /^https?:\/\//.test(r.url))
            body += `<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${m.viewSource}</a>`;
        if (r.bibliographicNote)
            body += `<p>${esc(r.bibliographicNote)}</p>`;
    }
    body += `<h2>${m.sources}</h2>`;
    body += r.sourceRefs.length ? `<ul class="citations">${r.sourceRefs.map(c => `<li>${link(s, c.sourceId)}<p>${esc(c.locator ?? '')} ${esc(c.role)}</p></li>`).join('')}</ul>` : `<p class="muted">${m.noSources}</p>`;
    if (ids.length)
        body += `<h2>${m.results}</h2>${recordList(s, ids)}`;
    return `<a class="back-link" href="${esc(encodeState(target(s, 'map')))}">${m.close}</a>${common}<span class="eyebrow">${esc(typeLabels[r.kind === 'entity' ? r.entityType : r.kind]?.[s.language === 'de' ? 0 : 1] ?? r.kind)}</span><h1>${esc(label(r.id, s.language))}</h1>${body}<details class="metadata"><summary>${m.details}</summary><code>${esc(r.id)}</code><p>${esc(r.editorial.status)}</p><a href="${esc(href(s, r.id))}">${m.copy}</a></details>`;
}
async function render(s, warnings) {
    const current = ++generation, active = () => current === generation, m = messages[s.language];
    try {
        document.documentElement.lang = s.language;
        const chapter = !s.chapter && isEmpty() ? emptyContext : await provider.getRecord(s.chapter);
        if (chapter.kind !== 'chapter')
            throw new Error('URL_CHAPTER: chapter required');
        if (s.step && !chapter.steps?.some(step => step.id === s.step))
            throw new Error('URL_STEP: chapter step unavailable');
        if (s.id) {
            const r = await provider.getRecord(s.id);
            const expected = { chapter: 'chapter', assertion: 'assertion', event: 'event', source: 'source', model: 'asset' };
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
        document.title = `${s.id ? label(s.id, s.language) : m[s.view === 'search' ? 'search' : s.view === 'licenses' ? 'licenses' : s.view === 'about' ? 'about' : 'atlas']} · ${m.atlas}`;
        network?.destroy();
        network = undefined;
        disposeModel?.();
        disposeModel = undefined;
        $('map').hidden = s.view === 'network' || s.view === 'model' || ['search', 'about', 'licenses'].includes(s.view);
        $('network').hidden = s.view !== 'network';
        $('model').hidden = s.view !== 'model';
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
            const dispose = await showModel($('model'), bytes);
            if (!active()) {
                dispose();
                return;
            }
            disposeModel = dispose;
        }
        if (s.view === 'search') {
            const result = await provider.search(s.query, filters(s), s.language);
            if (!active())
                return;
            $('page').innerHTML = `<div class="reading"><p class="eyebrow">${m.search}</p><h1>${esc(s.query || m.showAll)}</h1><p>${result.items.length} ${m.results}</p>${result.items.length ? recordList(s, result.items.map(x => x.id)) : `<p>${m.noResults}</p>`}${result.nextCursor ? `<button id="more">${m.more}</button>` : ''}</div>`;
            let cursor = result.nextCursor;
            if (cursor)
                $('more').onclick = async () => { if (!cursor)
                    return; const button = $('more'); button.disabled = true; try {
                    const next = await provider.search(s.query, filters(s), s.language, cursor);
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
            $('page').innerHTML = `<div class="reading"><p class="eyebrow">${m.about}</p><h1>${m.subtitle}</h1><p class="lede">${s.language === 'de' ? 'Ein offener Atlas für Geschichte, Gesellschaften und ihre Verbindungen.' : 'An open atlas of history, societies and their connections.'}</p>${isDemo() ? `<p>${m.demoText}</p>` : ''}<h2>${m.sourceVersion}</h2><code>${esc(provider.catalog.dataReleaseId)}</code><p>${provider.catalog.files.length} ${s.language === 'de' ? 'Dateien mit SHA-256-Prüfsummen' : 'files with SHA-256 checksums'}</p><h2>${m.engineVersion}</h2><p>0.1.0-dev.2 · MapLibre GL JS · vis.js · Three.js</p><a href="${esc(encodeState(target(s, 'licenses')))}">${m.licenses}</a></div>`;
        if (s.view === 'licenses') {
            const text = await fetch(new URL('licenses/THIRD_PARTY_NOTICES.md', document.baseURI)).then(r => r.text());
            if (!active())
                return;
            $('page').innerHTML = `<div class="reading"><p class="eyebrow">${m.licenses}</p><h1>Open Source</h1>${prose(text)}<p><a href="licenses/project.txt" target="_blank">GNU GPL v2</a></p></div>`;
        }
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
    provider = await StaticProvider.open(config, new URL('./', document.baseURI));
    const chapter = isEmpty() ? emptyContext : await provider.getRecord(provider.catalog.entrypoints.defaultChapterId);
    if (chapter.kind !== 'chapter')
        throw new Error('Default chapter is not a chapter');
    router = new Router(defaultState(chapter, provider.sourceKey, provider.catalog.dataReleaseId, provider.config.defaultLanguage), (s, w) => { void render(s, w); }, setError, provider.index.chapters);
}
catch (e) {
    setError(e);
}
