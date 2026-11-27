// Historical meaning is classified before either renderer receives the geometry.
export const landscapeRoles = ['land-reconstruction', 'ice-reconstruction'];
export function isAreaAssertion(record, spatial) {
    return record?.kind === 'assertion' && (spatial.role === 'extent' || spatial.role === 'uncertainty-area');
}
export function mapLayer(record, spatial) {
    if (landscapeRoles.includes(spatial.role)) return 'landscapes';
    // The published record index exposes eventType/predicate as a single type.
    if (record.kind === 'event' && (record.eventType ?? record.type) === 'migration') return 'migrations';
    return record.kind === 'assertion' ? (record.predicate ?? record.type) : 'events';
}
export function mapPortrayal(record, spatial) {
    if (landscapeRoles.includes(spatial.role)) return spatial.role;
    if (isAreaAssertion(record, spatial)) return 'dated-area';
    if (record.eventType === 'migration' && spatial.role === 'route') return 'migration';
    if (spatial.role === 'uncertainty-area') return 'uncertainty-area';
    return 'ordinary';
}
export function excludedVariants(groups, choices) {
    const excluded = new Set();
    for (const [id, chosen] of Object.entries(choices)) {
        const group = groups.find(g => g.id === id);
        if (!group || !group.memberIds.includes(chosen)) throw new Error('INTERPRETATION_INVALID: ' + id);
        for (const member of group.memberIds) if (member !== chosen) excluded.add(member);
    }
    return excluded;
}
// In multi-part routes, each component keeps its authored coordinate direction.
// Dateline splitting does not create a new historical route or a new date.
export function directedLines(feature) {
    const g = feature.geometry;
    if (feature.properties?.role !== 'route' || !feature.properties.direction) return [];
    const lines = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : [];
    const direction = feature.properties.direction;
    return lines.flatMap(line => direction === 'both' ? [line, [...line].reverse()] : [direction === 'reverse' ? [...line].reverse() : line]);
}
