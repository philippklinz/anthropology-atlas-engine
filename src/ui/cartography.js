import { localized } from '../query/query.js';
import { encodeState } from '../state/state.js';
import { chapterStepState } from '../state/steps.js';
import { formatTime, matchesTime, yearRange } from '../domain/time.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const layerLabels={migrations:['Wanderungsrekonstruktionen','Migration reconstructions'],landscapes:['Damals: Land und Eis','Past land and ice']};
export function renderMapContext(element, state, chapter, features, provider, commit) {
    const de=state.language==='de', steps=chapter.steps??[];
    const special=features.features.some(f=>f.properties.portrayal!=='ordinary');
    element.hidden=!steps.length && !special;
    if(element.hidden) {element.replaceChildren();return;}
    const landscapes=[...new Set(features.features.filter(f=>['land-reconstruction','ice-reconstruction'].includes(f.properties.portrayal)).map(f=>f.properties.recordId))];
    element.innerHTML=`${steps.length?`<div class="map-step"><label for="chapter-step">${de?'Kapitel erkunden':'Explore this chapter'}</label><select id="chapter-step"><option value="">${de?'Gesamtübersicht':'Overview'}</option>${steps.map(step=>`<option value="${esc(step.id)}" ${state.step===step.id?'selected':''}>${esc(localized(step.labels,state.language)||step.textAnchor)}</option>`).join('')}</select></div>`:''}<details class="map-key"><summary>${de?'Kartenlegende':'Map legend'}</summary><ul><li><i class="key-point"></i>${de?'Punkt: belegter Fundort':'Point: evidence at a findsite'}</li><li><i class="key-route"></i>${de?'Pfeile: rekonstruierte Richtung':'Arrows: reconstructed direction'}</li><li><i class="key-land"></i>${de?'Ocker: damaliges Land, schematisch':'Ochre: past land, schematic'}</li>${features.features.some(f=>f.properties.portrayal==='ice-reconstruction')?`<li><i class="key-ice"></i>${de?'Blau: rekonstruierte Eisfläche':'Blue: reconstructed ice extent'}</li>`:''}</ul><p>${de?'Pfeilbreite und Abstände stehen nicht für Menschenzahl oder Geschwindigkeit.':'Arrow width and spacing do not encode population or speed.'}</p>${landscapes.length?`<p>${de?'Gezeigte Landschaftsstände:':'Visible landscape snapshots:'}</p><ul>${landscapes.map(id=>`<li><a href="${esc(encodeState({...state,view:'assertion',id}))}">${esc(formatTime(provider.times[id].display,state.language))}</a></li>`).join('')}</ul>`:`<p>${de?'Für die gewählte Zeit ist hier kein Landschaftsstand eingeblendet.':'No landscape snapshot is shown for the selected time.'}</p>`}</details>`;
    const select=element.querySelector('select');
    if(select) select.onchange=()=>commit(chapterStepState(state,chapter,select.value));
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
