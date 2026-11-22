const singles = new Set(['sourceId', 'subjectId', 'objectId', 'entityId', 'geometryId', 'placeId', 'parentEventId', 'scriptId', 'fontAssetId', 'assetId', 'anchorGeometryId', 'interpretationId', 'assertionId', 'recordId']);
const lists = new Set(['assetIds', 'entityIds', 'scopeIds', 'placeIds', 'focusIds', 'memberIds', 'recordIds', 'entryChapterIds', 'selectedIds', 'dependencies']);
export function references(value, path = '') {
    if (Array.isArray(value))
        return value.flatMap((v, i) => references(v, `${path}/${i}`));
    if (!value || typeof value !== 'object')
        return [];
    return Object.entries(value).flatMap(([k, v]) => singles.has(k) ? [{ id: String(v), path: `${path}/${k}` }] : lists.has(k) && Array.isArray(v) ? v.map((id, i) => ({ id: String(id), path: `${path}/${k}/${i}` })) : references(v, `${path}/${k}`));
}
export function walk(value, visit, path = '') {
    if (Array.isArray(value))
        value.forEach((v, i) => walk(v, visit, `${path}/${i}`));
    else if (value && typeof value === 'object') {
        visit(value, path);
        for (const [k, v] of Object.entries(value))
            walk(v, visit, `${path}/${k}`);
    }
}
export function resolvePointer(value, pointer) {
    if (pointer === '')
        return true;
    if (!pointer.startsWith('/') || /~(?![01])/u.test(pointer))
        return false;
    let current = value;
    for (const part of pointer.slice(1).split('/').map(p => p.replace(/~1/g, '/').replace(/~0/g, '~'))) {
        if (!current || typeof current !== 'object' || !Object.hasOwn(current, part))
            return false;
        current = current[part];
    }
    return true;
}
