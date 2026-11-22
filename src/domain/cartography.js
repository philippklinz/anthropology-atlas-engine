// Historical meaning is classified before either renderer receives the geometry.
export const landscapeRoles = ['land-reconstruction', 'ice-reconstruction'];
export function mapLayer(record, spatial) {
    if (landscapeRoles.includes(spatial.role)) return 'landscapes';
    if (record.kind === 'event' && record.eventType === 'migration') return 'migrations';
    return record.kind === 'assertion' ? record.predicate : 'events';
}
export function mapPortrayal(record, spatial) {
    if (landscapeRoles.includes(spatial.role)) return spatial.role;
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
