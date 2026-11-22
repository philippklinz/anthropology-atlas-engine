import { matchesTypes } from '../query/query.js';
// Directory scope follows the selected chapters, independent of map time.
export const categories = [
    { key: 'people', types: ['person'], labels: ['Personen', 'People'] },
    { key: 'communities', types: ['community'], labels: ['Völker & Gemeinschaften', 'Peoples & communities'] },
    { key: 'events', types: ['event'], labels: ['Ereignisse & Reisen', 'Events & journeys'] },
    { key: 'places', types: ['place', 'region'], labels: ['Orte & Regionen', 'Places & regions'] },
    { key: 'polities', types: ['polity'], labels: ['Reiche & Staaten', 'Polities & states'] },
    { key: 'organizations', types: ['organization'], labels: ['Organisationen', 'Organizations'] },
    { key: 'languages', types: ['language', 'language-family'], labels: ['Sprachen & Sprachfamilien', 'Languages & families'] },
    { key: 'scripts', types: ['script'], labels: ['Schriften', 'Scripts'] },
    { key: 'technologies', types: ['technology'], labels: ['Technik & Erfindungen', 'Technology & inventions'] },
    { key: 'artifacts', types: ['artifact', 'asset'], labels: ['Gegenstände & Exponate', 'Artifacts & exhibits'] },
    { key: 'commodities', types: ['commodity'], labels: ['Handelsgüter', 'Commodities'] },
    { key: 'religions', types: ['religion'], labels: ['Religionen', 'Religions'] },
    { key: 'periods', types: ['period'], labels: ['Epochen', 'Periods'] },
    { key: 'concepts', types: ['concept'], labels: ['Begriffe', 'Concepts'] },
    { key: 'assertions', types: ['assertion', 'interpretation'], labels: ['Aussagen & Deutungen', 'Assertions & interpretations'] },
    { key: 'sources', types: ['source'], labels: ['Quellen', 'Sources'] }
];
export const directoryTypes = ['entity', 'event', 'assertion', 'interpretation', 'asset', 'source', 'chapter'];
export function categoryCounts(records) {
    return categories.map(category => ({ ...category, count: Object.values(records).filter(meta => matchesTypes(meta, category.types)).length }));
}
export function activeCategory(types) {
    return categories.find(c => c.types.length === types.length && c.types.every(t => types.includes(t)));
}
export function directoryState(state, types = directoryTypes) {
    return { ...state, view: 'search', id: undefined, step: undefined, query: '', types, packages: [], spatialFilter: undefined, searchScope: 'chapters' };
}
