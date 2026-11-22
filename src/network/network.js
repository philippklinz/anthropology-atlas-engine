import { Network } from '../../vendor/vis/network.mjs';
import { localized } from '../query/query.js';
import { eventRoleLabels } from '../i18n/messages.js';
import { filters } from '../state/state.js';
import vocabulary from '../../schemas/0.1.0/vocabulary.json' with { type: 'json' };
export async function showNetwork(container, p, s, focus, select) {
    const relations = (await p.relations(focus, filters(s))).items;
    const ids = [...new Set([focus, ...relations.flatMap(r => [r.from, r.to])])].slice(0, 60);
    const labels = vocabulary.predicates;
    const net = new Network(container, { nodes: ids.map(id => ({ id, label: localized(p.index.records[id]?.labels, s.language) || id, shape: 'dot', size: id === focus ? 23 : 14, color: { background: id === focus ? '#009e98' : '#ffffff', border: '#006f6b' }, font: { face: 'Liberation Sans', size: 16, color: '#202325' } })), edges: relations.filter(r => ids.includes(r.from) && ids.includes(r.to)).map((r, i) => ({ id: String(i), from: r.from, to: r.to, label: localized(labels[r.predicate]?.labels, s.language) || eventRoleLabels[r.predicate]?.[s.language === 'de' ? 0 : 1] || r.predicate, arrows: r.symmetric ? '' : 'to', color: '#77928b', font: { size: 13, face: 'Liberation Sans', background: '#f3f2ef' }, smooth: { enabled: true, type: 'dynamic', roundness: 0.2 } })) }, { layout: { randomSeed: 5 }, physics: { stabilization: { iterations: 160 } }, interaction: { hover: false, navigationButtons: false, keyboard: true }, edges: { width: 1.5 } });
    net.once('stabilizationIterationsDone', () => net.setOptions({ physics: false }));
    const visibleRelations = relations.filter(r => ids.includes(r.from) && ids.includes(r.to));
    net.on('click', (e) => { if (e.nodes.length)
        select(String(e.nodes[0]));
    else if (e.edges.length)
        select(visibleRelations[Number(e.edges[0])].id); });
    return net;
}
