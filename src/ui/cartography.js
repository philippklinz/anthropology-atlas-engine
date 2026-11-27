import { areaColor } from '../map/portrayal.js';
import { isAreaAssertion } from '../domain/cartography.js';
import vocabulary from '../../schemas/0.1.0/vocabulary.json' with {type:'json'};
import { localized } from '../query/query.js';
import { encodeState } from '../state/state.js';
import { chapterStepState } from '../state/steps.js';
import { calendarDate, formatTime, matchesTime, yearRange } from '../domain/time.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const renderedContexts = new WeakMap();
export const layerLabels={migrations:['Wanderungsrekonstruktionen','Migration reconstructions'],landscapes:['Damals: Land und Eis','Past land and ice']};
function areaLegend(state, collection, provider) {
    const de = state.language === 'de';
    const shown = new Map();
    for (const {properties} of collection.features) {
        if (properties.portrayal === 'dated-area')
            shown.set([properties.recordId, properties.role, properties.approximateExtent].join('/'), properties);
    }
    if (!shown.size) return `<p>${de ? 'Für diese Auswahl und Zeit ist keine belegte Fläche eingeblendet.' : 'No dated area is shown for this selection and time.'}</p>`;

    const entityLabel = id => localized(provider.index.records[id]?.labels, state.language) || id;
    const rows = [...shown.values()].map(area => {
        const record = provider.records.get(area.recordId);
        const relation = localized(vocabulary.predicates[record.predicate]?.labels, state.language);
        const detail = encodeState({...state, view:'assertion', id:record.id});
        const alternative = area.variant ? ' · ' + (de ? 'Variante ' : 'Alternative ') + String.fromCharCode(64 + area.variant) : '';
        const locality = area.role === 'uncertainty-area';
        const spatialLabel = locality ? (de ? 'Ungefährer Belegort' : 'Approximate location') : (de ? 'Ausdehnung' : 'Extent');
        const time = record.time;
        const range = provider.times[record.id].possible;
        const datingWindow = time.kind === 'instant' && calendarDate(range.from).year !== calendarDate(range.to - 1).year;
        const date = (datingWindow ? (de ? 'Datierungsfenster ' : 'Dating window ') : '') + formatTime(time, state.language);
        return `<li><i aria-hidden="true" class="area-swatch${area.approximateExtent ? ' approximate' : ''}${locality ? ' approximate-location' : ''}" style="--area-color:${areaColor(area.areaIndex)}"></i><span>
            <a href="${esc(detail)}" data-area="${esc(record.id)}">${esc(entityLabel(record.subjectId) + ' · ' + relation + ' · ' + entityLabel(record.objectId))}</a>
            <small>${esc(spatialLabel + ' · ' + date + alternative)}</small></span></li>`;
    }).join('');
    const uncertain = [...shown.values()].some(area => area.role === 'extent' && area.approximateExtent);
    const localities = [...shown.values()].some(area => area.role === 'uncertainty-area');
    return `<ul class="dated-areas-key">${rows}</ul>
        ${uncertain ? `<p>${de ? 'Schraffierte Flächen mit gestricheltem Rand zeigen eine ungefähr rekonstruierte Ausdehnung.' : 'Hatching with a dashed outline marks an approximate reconstruction of an extent.'}</p>` : ''}
        ${localities ? `<p>${de ? 'Ein punktierter Rand umgibt den ungefähren Ort, an dem eine Quelle etwas belegt.' : 'A dotted outline surrounds the approximate location of the evidence.'}</p>` : ''}
        ${collection.year === null && shown.size > 1 ? `<p>${de ? 'Hier erscheinen Belege aus dem gesamten Zeitraum. Mit dem Jahresregler lassen sie sich zeitlich einordnen.' : 'This overview includes evidence from the whole period. Use the year slider to explore it through time.'}</p>` : ''}`;
}

export function renderMapContext(element, state, chapter, collection, provider, commit) {
    const de = state.language === 'de', steps = chapter.steps ?? [];
    const features = collection.features;
    const hasRole = role => provider.spatial.some(entry => entry.role === role && provider.belongs(entry.recordId, state.chapters));
    const hasAreas = provider.spatial.some(entry => isAreaAssertion(provider.index.records[entry.recordId], entry) && provider.belongs(entry.recordId, state.chapters));
    const landscapeFeatures = features.filter(f => ['land-reconstruction','ice-reconstruction'].includes(f.properties.portrayal));
    const landscapes = [...new Set(landscapeFeatures.map(f => f.properties.recordId))];
    const hasLandscape = hasRole('land-reconstruction') || hasRole('ice-reconstruction');
    const special = features.some(f => f.properties.portrayal !== 'ordinary');
    element.hidden = !steps.length && !hasAreas && !hasLandscape && !special;
    if (element.hidden) { renderedContexts.delete(element); element.replaceChildren(); return; }
    const points = features.some(f => f.geometry.type.includes('Point'));
    const routes = features.some(f => f.properties.direction);
    // An ordinary point or line may leave the map without changing any legend item.
    const signature = JSON.stringify([chapter.id, state.language, state.step, collection.year === null, hasAreas, hasLandscape,
        points, routes, landscapeFeatures.map(f => [f.properties.recordId, f.properties.portrayal]),
        features.filter(f => f.properties.portrayal === 'dated-area').map(f => [f.properties.recordId, f.properties.geometryId, f.properties.variant])]);
    const previous = renderedContexts.get(element);
    const bindStep = () => {
        const select = element.querySelector('select');
        if (select) select.onchange = () => commit(chapterStepState(state, chapter, select.value));
        return select;
    };
    if (previous?.provider === provider && previous.signature === signature) {
        for (const link of element.querySelectorAll('[data-area]')) link.href = encodeState({...state, view:'assertion', id:link.dataset.area});
        bindStep();
        return;
    }
    renderedContexts.set(element, {provider, signature});

    const items = [];
    const key = (style, label) => items.push(`<li><i aria-hidden="true" class="${style}"></i>${label}</li>`);
    if (points) key('key-point', de ? 'Markierter Ort' : 'Marked location');
    if (routes) key('key-route', de ? 'Pfeile zeigen die rekonstruierte Richtung' : 'Arrows indicate a reconstructed direction');
    if (features.some(f => f.properties.portrayal === 'land-reconstruction')) key('key-land', de ? 'Rekonstruierte Landfläche' : 'Reconstructed land');
    if (features.some(f => f.properties.portrayal === 'ice-reconstruction')) key('key-ice', de ? 'Rekonstruierte Eisfläche' : 'Reconstructed ice');

    const oldKey = element.querySelector('details');
    const open = oldKey?.open, scroll = oldKey?.scrollTop ?? 0;
    const active = element.contains(document.activeElement) ? document.activeElement : null;
    const chooseStep = steps.length ? `<div class="map-step"><label for="chapter-step">${de ? 'Kapitel erkunden' : 'Explore this chapter'}</label><select id="chapter-step">
        <option value="">${de ? 'Gesamtübersicht' : 'Overview'}</option>
        ${steps.map(step => `<option value="${esc(step.id)}" ${state.step === step.id ? 'selected' : ''}>${esc(localized(step.labels, state.language) || step.textAnchor)}</option>`).join('')}</select></div>` : '';
    const landscapeLinks = landscapes.map(id => `<li><a data-area="${esc(id)}" href="${esc(encodeState({...state, view:'assertion',id}))}">${esc(formatTime(provider.times[id].display, state.language))}</a></li>`).join('');
    element.innerHTML = `${chooseStep}<details class="map-key"${open ? ' open' : ''}><summary>${de ? 'Kartenlegende' : 'Map legend'}</summary>
        ${hasAreas ? areaLegend(state, collection, provider) : ''}
        ${items.length ? '<ul>' + items.join('') + '</ul>' : ''}
        ${routes ? `<p>${de ? 'Pfeilbreite und Abstände stehen nicht für Menschenzahl oder Geschwindigkeit.' : 'Arrow width and spacing do not encode population or speed.'}</p>` : ''}
        ${landscapeLinks ? `<p>${de ? 'Gezeigte Landschaftsstände' : 'Visible landscape snapshots'}</p><ul>${landscapeLinks}</ul>` : hasLandscape ? `<p>${de ? 'Für die gewählte Zeit ist hier kein Landschaftsstand eingeblendet.' : 'No landscape snapshot is shown for the selected time.'}</p>` : ''}</details>`;
    const select = bindStep();
    element.querySelector('details').scrollTop = scroll;
    if (active) {
        const replacement = active.matches('select') ? select : active.dataset.area ? [...element.querySelectorAll('[data-area]')].find(a => a.dataset.area === active.dataset.area) : null;
        (replacement ?? element.querySelector('summary')).focus({preventScroll:true});
    }
}
export function interpretationPanel(state, groups, label, times) {
    const de=state.language==='de';
    const range='year' in state.time?yearRange(state.time.year):state.time;
    groups=groups.filter(group=>group.memberIds.some(id=>times[id]&&matchesTime(times[id],range,state.mode)));
    if(!groups.length)return '';
    return `<section class="route-choices" aria-label="${de?'Wege und Deutungen vergleichen':'Compare routes and interpretations'}"><h2>${de?'Wege und Deutungen':'Routes and interpretations'}</h2>${groups.map(group=>{
        const choice=state.interpretations[group.id];
        const options=[{id:'',label:de?'Varianten vergleichen':'Compare alternatives'},...group.memberIds.map((id,i)=>({id,label:String.fromCharCode(65+i)+' · '+label(id,state.language)}))];
        return `<fieldset><legend>${esc(localized(group.question,state.language))}</legend><div class="variant-options">${options.map(option=>{const interpretations={...state.interpretations};if(option.id)interpretations[group.id]=option.id;else delete interpretations[group.id];return `<a class="${choice===option.id||!choice&&!option.id?'active':''}" ${choice===option.id||!choice&&!option.id?'aria-current="true"':''} href="${esc(encodeState({...state,interpretations}))}">${esc(option.label)}</a>`;}).join('')}</div><p>${esc(localized(group.explanation,state.language))}</p>${!choice?`<p class="comparison-note">${de?'Vergleich alternativer Erklärungen · keine gemeinsame Reiseroute. A: lange Striche · B: kurze Striche.':'Comparing alternative explanations, not a combined journey. A: long dashes · B: short dashes.'}</p>`:''}<ul>${group.memberIds.map((id,i)=>`<li><span class="variant-swatch variant-${i+1}"></span><a href="${esc(encodeState({...state,view:id.startsWith('event:')?'event':'assertion',id}))}">${String.fromCharCode(65+i)} · ${esc(label(id,state.language))}</a><small>${esc(times[id]?.display?formatTime(times[id].display,state.language):'')}</small></li>`).join('')}</ul></fieldset>`;
    }).join('')}</section>`;
}
