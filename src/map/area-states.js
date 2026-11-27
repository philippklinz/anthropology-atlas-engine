// A short dissolve is a display effect between consecutive dated views. A gap,
// a seek, or a different subject/predicate never creates a connecting shape.
export const dissolveDuration = 180;

// Geometry IDs identify immutable payloads in a release. Ad hoc features may
// lack IDs (for example in renderer fixtures), so compare their shapes directly.
export function mapFeatureKey(collection) {
    return JSON.stringify(collection.features.map(feature => [feature.properties, feature.properties.geometryId ? null : feature.geometry]));
}

export function areaDissolve(previous, current) {
    if (!Number.isInteger(previous?.year) || !Number.isInteger(current.year) ||
        Math.abs(previous.year - current.year) !== 1) return null;

    const area = feature => feature.properties.portrayal === 'dated-area';
    const series = feature => {
        const {areaSubject, layer, role, variant} = feature.properties;
        return [areaSubject, layer, role, variant].join('/');
    };
    const shape = feature => series(feature) + '/' + feature.properties.geometryId;
    const before = previous.features.filter(area), after = current.features.filter(area);
    const beforeIds = new Set(before.map(shape)), afterIds = new Set(after.map(shape));
    const removed = before.filter(feature => !afterIds.has(shape(feature)));
    const added = after.filter(feature => !beforeIds.has(shape(feature)));
    const addedSeries = new Set(added.map(series)), removedSeries = new Set(removed.map(series));
    const entering = new Set(added.filter(feature => removedSeries.has(series(feature))));
    const leaving = removed.filter(feature => addedSeries.has(series(feature)));
    if (!leaving.length) return null;

    const tagged = (feature, dissolve) => ({...feature, properties: {...feature.properties, dissolve}});
    return [
        ...leaving.map(feature => tagged(feature, 'out')),
        ...current.features.map(feature => entering.has(feature) ? tagged(feature, 'in') : feature)
    ];
}
