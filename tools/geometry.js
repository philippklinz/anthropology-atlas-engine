import {GeoJSONReader, IsValidOp} from '../vendor/topology/topology.js';
export function positions(c) {
    if (!Array.isArray(c) || !c.length)
        throw new Error('GEO_COORDINATES: nonempty coordinates required');
    if (typeof c[0] === 'number')
        return [c];
    return c.flatMap(positions);
}
export function geometryBBox(g) {
    if (g.type === 'GeometryCollection')
        throw new Error('GEO_TYPE: collections unsupported');
    const p = positions(g.coordinates);
    return p.reduce((b, c) => [Math.min(b[0], c[0]), Math.min(b[1], c[1]), Math.max(b[2], c[0]), Math.max(b[3], c[1])], [180, 90, -180, -90]);
}
export function validateGeometry(f, id, type) {
    if (f.type !== 'Feature' || f.id !== id || f.geometry?.type !== type || 'crs' in f || 'crs' in f.geometry)
        throw new Error('GEO_ID_TYPE: feature ID, type or CRS mismatch');
    if (Object.keys(f.properties ?? {}).length)
        throw new Error('GEO_PROPERTIES: historical facts belong in metadata');
    const g = f.geometry;
    if (g.type === 'GeometryCollection')
        throw new Error('GEO_TYPE: collection unsupported');
    for (const p of positions(g.coordinates))
        if (p.length !== 2 || !p.every(Number.isFinite) || Math.abs(p[0]) > 180 || Math.abs(p[1]) > 90)
            throw new Error('GEO_COORDINATES: use finite longitude, latitude');
    const line = (p, ring = false) => {
        if (p.length < (ring ? 4 : 2))
            throw new Error('GEO_VERTICES: insufficient vertices');
        if (ring && p[0].some((v, i) => v !== p.at(-1)[i]))
            throw new Error('GEO_RING: ring is not closed');
        for (let i = 1; i < p.length; i++)
            if (Math.abs(p[i][0] - p[i - 1][0]) > 180)
                throw new Error('GEO_DATELINE: split segments at the antimeridian before import');
    };
    if (g.type === 'LineString')
        line(g.coordinates);
    if (g.type === 'MultiLineString')
        g.coordinates.forEach(p => line(p));
    if (g.type === 'Polygon')
        g.coordinates.forEach(p => line(p, true));
    if (g.type === 'MultiPolygon')
        g.coordinates.forEach(p => p.forEach(r => line(r, true)));
    const geom = new GeoJSONReader().read(g);
    const valid = new IsValidOp(geom);
    if (!valid.isValid())
        throw new Error('GEO_TOPOLOGY: ' + valid.getValidationError());
    if ((g.type === 'Polygon' || g.type === 'MultiPolygon') && geom.getArea() <= 0)
        throw new Error('GEO_AREA: zero area');
}
export function normalizeWinding(f) {
    const result = structuredClone(f), g = result.geometry;
    const polygon = (rings) => rings.forEach((r, i) => {
        const area = r.slice(1).reduce((a, p, j) => a + r[j][0] * p[1] - p[0] * r[j][1], 0);
        if ((area > 0) !== (i === 0))
            r.reverse();
    });
    if (g.type === 'Polygon')
        polygon(g.coordinates);
    if (g.type === 'MultiPolygon')
        g.coordinates.forEach(polygon);
    return result;
}
