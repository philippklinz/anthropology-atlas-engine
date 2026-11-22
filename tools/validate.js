import { dirname, join, relative, resolve, sep } from './paths.js';
import { Ajv2020, addFormats } from '../vendor/validation/validation.js';
import { walk, references, resolvePointer } from '../src/domain/references.js';
import { normalizeTime, estimateRange } from '../src/domain/time.js';
import { safeRelative } from '../src/domain/paths.js';
import { validateGeometry } from './geometry.js';
import { validateGLB, validateImage } from './assets.js';
import { landscapeRoles } from '../src/domain/cartography.js';
const schemas = new URL('../schemas/0.1.0/', import.meta.url);
async function schema(name){const r=await fetch(new URL(name,schemas));if(!r.ok)throw new Error('SCHEMA_HTTP: '+r.status);return r.json();}
export async function makeValidators() {
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    addFormats(ajv);
    const read = async (name) => ajv.compile(await schema(name+'.schema.json'));
    return { record: await read('record'), dataset: await read('dataset'), catalog: await read('catalog'), config: await read('config') };
}
export function canonicalPath(r, v) {
    const slug = r.id.split(':')[1];
    switch (r.kind) {
        case 'entity': return `entities/${v.entityDirectories[r.entityType]}/${slug}.json`;
        case 'assertion': return `assertions/${r.predicate}/${slug}.json`;
        case 'event': return `events/${r.eventType}/${slug}.json`;
        case 'geometry': return `geometries/${r.geometryType.includes('Point') ? 'points' : r.geometryType.includes('Line') ? 'lines' : 'areas'}/${slug}/geometry.json`;
        case 'asset': return `assets/${r.assetType === 'image' ? 'images' : r.assetType === 'model' ? 'models' : r.assetType === 'font' ? 'fonts' : 'documents'}/${slug}/asset.json`;
        case 'chapter': return `chapters/${slug}/chapter.json`;
        case 'package': return `packages/${slug}/manifest.json`;
        default: return `${r.kind === 'source' ? 'sources' : 'interpretations'}/${slug}.json`;
    }
}
export async function validate(workspace, profile) {
    if(!['draft','fixture','release'].includes(profile))throw new Error('PROFILE_INVALID');
    const root='', vs=await makeValidators(), readFile=workspace.readFile.bind(workspace), readdir=workspace.readdir.bind(workspace), realpath=workspace.realpath.bind(workspace);
    const vocabulary=await schema('vocabulary.json');
    const issues = [], records = new Map(), paths = new Map(), owners = new Map(), payloads = new Map();
    const issue = (code, file, message, id, severity = 'error') => issues.push({ severity, code, file, id, message });
    const dataset = JSON.parse(await readFile(join(root, 'dataset.json'), 'utf8'));
    if (!vs.dataset(dataset))
        issue('STRUCTURE', 'dataset.json', vs.dataset.errors?.map(e => `${e.instancePath} ${e.message}`).join('; ') ?? 'Invalid dataset');
    if (profile === 'release' && dataset.packageIds?.length === 0)
        issue('RELEASE_EMPTY', 'dataset.json', 'Historical releases require at least one package');
    const dirs = ['entities', 'assertions', 'events', 'geometries', 'sources', 'interpretations', 'assets', 'chapters', 'packages'];
    const scan = async (dir) => {
        const items = await readdir(join(root, dir), { withFileTypes: true }).catch(() => []);
        for (const ent of items) {
            const path = dir + '/' + ent.name;
            if (ent.isSymbolicLink()) {
                issue('PATH_SYMLINK', path, 'Symlinks are not allowed in source records');
                continue;
            }
            if (ent.isDirectory()) {
                await scan(path);
                continue;
            }
            if (!path.endsWith('.json'))
                continue;
            let value;
            try {
                value = JSON.parse(await readFile(join(root, path), 'utf8'));
            }
            catch (e) {
                issue('JSON', path, String(e));
                continue;
            }
            if (!vs.record(value)) {
                issue('STRUCTURE', path, vs.record.errors?.filter(e => !e.keyword.startsWith('if')).slice(0, 12).map(e => `${e.instancePath} ${e.message}`).join('; ') ?? 'Invalid record');
                continue;
            }
            const r = value;
            if (records.has(r.id)) {
                issue('ID_DUPLICATE', path, 'ID already defined at ' + paths.get(r.id), r.id);
                continue;
            }
            records.set(r.id, r);
            paths.set(r.id, path);
            if (path !== canonicalPath(r, vocabulary))
                issue('PATH_CANONICAL', path, 'Expected ' + canonicalPath(r, vocabulary), r.id);
        }
    };
    for (const dir of dirs)
        await scan(dir);
    const check = (r, fn) => { try {
        fn();
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        issue(msg.split(':')[0], paths.get(r.id), msg, r.id);
    } };
    const loadPayload = async (r, file) => {
        if (!safeRelative(file))
            throw new Error('PATH_UNSAFE: ' + file);
        const absolute = resolve(root, dirname(paths.get(r.id)), file), actual = await realpath(absolute);
        if (!actual.startsWith(root + sep) || actual !== absolute)
            throw new Error('PATH_ESCAPE: payload escapes root or uses symlink');
        const bytes = await readFile(actual), path = relative(root, actual).split(sep).join('/');
        if (new TextDecoder().decode(bytes.subarray(0, 50)).startsWith('version https://git-lfs.github.com/spec/v1'))
            throw new Error('ASSET_LFS: Git LFS pointer is not a payload');
        payloads.set(path, bytes);
        return bytes;
    };
    for (const r of records.values()) {
        const fail = (code, msg) => issue(code, paths.get(r.id), msg, r.id);
        for (const ref of references(r))
            if (!records.has(ref.id))
                fail('REF_MISSING', `${ref.path}: ${ref.id}`);
        walk(r, (value, path) => check(r, () => {
            if ('earliest' in value && 'latest' in value || value.basis === 'years-before')
                estimateRange(value);
            if (value.kind === 'instant' || value.kind === 'interval' || value.kind === 'unknown' || value.kind === 'before')
                normalizeTime(value);
            if (typeof value.sourceId === 'string') {
                if (records.get(value.sourceId)?.kind !== 'source')
                    throw new Error('SOURCE_TYPE: ' + value.sourceId);
                for (const p of (value.appliesTo ?? []))
                    if (!resolvePointer(r, p))
                        throw new Error('SOURCE_POINTER: ' + p);
            }
            if ('geometryId' in value) {
                const g = records.get(String(value.geometryId));
                if (g?.kind !== 'geometry')
                    throw new Error('SPATIAL_TYPE: geometry expected');
                const role = String(value.role ?? 'location');
                if (['extent','uncertainty-area',...landscapeRoles].includes(role) && !g.geometryType.includes('Polygon') || ['route', 'connection'].includes(role) && !g.geometryType.includes('Line'))
                    throw new Error('SPATIAL_ROLE: geometry does not match ' + role);
                if (value.direction && (role !== 'route' || r.kind !== 'event' || !['migration','journey','campaign'].includes(r.eventType)))
                    throw new Error('ROUTE_DIRECTION: direction requires an explicitly authored movement route');
                if (landscapeRoles.includes(role) && (r.kind !== 'assertion' || r.predicate !== 'extent-of' || r.time.kind !== 'instant'))
                    throw new Error('LANDSCAPE_SNAPSHOT: land and ice reconstructions require a dated extent-of snapshot');
            }
        }));
        if (r.kind === 'assertion')
            check(r, () => {
                const rule = vocabulary.predicates[r.predicate], a = records.get(r.subjectId), b = records.get(r.objectId);
                if (a?.kind !== 'entity' || b?.kind !== 'entity' || !rule.subjectTypes.includes(a.entityType) || !rule.objectTypes.includes(b.entityType))
                    throw new Error('RELATION_TYPES: incompatible endpoints');
                if (rule.symmetric && r.subjectId >= r.objectId)
                    throw new Error('RELATION_DIRECTION: symmetric endpoints must be sorted');
                if (['has-genetic-ancestry-from','genetically-related-to'].includes(r.predicate)) {
                    if (!r.note || !r.sourceRefs.some(ref => ref.role === 'supports' && ref.locator?.trim()))
                        throw new Error('GENETIC_EVIDENCE: explain the genetic inference and cite its specific evidence');
                    if (r.spatial?.some(s => s.role !== 'connection'))
                        throw new Error('GENETIC_SPATIAL: genetic relationships may have a connection, never a migration route or territorial extent');
                }
                if (r.predicate === 'extent-of' && !r.spatial?.some(s => ['extent',...landscapeRoles].includes(s.role)))
                    throw new Error('SPATIAL_REQUIRED: extent-of requires an extent');
                if (r.spatial?.some(s=>landscapeRoles.includes(s.role)) && !r.sourceRefs.some(c=>['supports','derivation'].includes(c.role)&&c.locator?.trim()))
                    throw new Error('LANDSCAPE_EVIDENCE: cite the dated reconstruction');
            });
        if (r.kind === 'event') {
            if (r.spatial?.some(s=>s.direction) && (!r.note || !r.sourceRefs.some(c=>['supports','derivation'].includes(c.role)&&c.locator?.trim())))
                fail('ROUTE_EVIDENCE','Explain and cite the route direction, even for a draft');
            if (r.eventType === 'other' && !r.note)
                fail('EVENT_NOTE', 'Other events need an explanation');
            for (const p of r.participants)
                if (!vocabulary.eventRoles[r.eventType].includes(p.role) || records.get(p.entityId)?.kind !== 'entity')
                    fail('EVENT_ROLE', `Invalid participant ${p.entityId}: ${p.role}`);
            const seen = new Set([r.id]);
            let parent = r.parentEventId;
            while (parent) {
                if (seen.has(parent)) {
                    fail('EVENT_CYCLE', 'Cyclic parent events');
                    break;
                }
                seen.add(parent);
                const next = records.get(parent);
                if (next?.kind !== 'event') {
                    fail('EVENT_PARENT', 'Parent must be an event');
                    break;
                }
                parent = next.parentEventId;
            }
        }
        if (r.kind === 'chapter') {
            if (r.recordIds) {
                const members = new Set(r.recordIds);
                for (const id of r.focusIds) if (!members.has(id)) fail('CHAPTER_FOCUS', 'Focus is outside explicit chapter membership: ' + id);
                for (const id of r.recordIds) {
                    const member = records.get(id);
                    if (['chapter', 'package'].includes(member?.kind)) fail('CHAPTER_MEMBER', 'Membership must contain content records, not chapters or packages: ' + id);
                    for (const ref of references(member)) if (!members.has(ref.id)) fail('CHAPTER_REFERENCE', 'Chapter member references an object outside its membership: ' + ref.id);
                }
                for (const ref of references({...r, recordIds: []})) if (!members.has(ref.id)) fail('CHAPTER_REFERENCE', 'Chapter reference outside membership: ' + ref.id);
            }
            if (r.discovery && !r.recordIds) fail('CHAPTER_MEMBERSHIP', 'Discoverable chapters require explicit recordIds');
            for (const c of r.interpretationChoices ?? []) {
                const group = records.get(c.interpretationId);
                if (group?.kind !== 'interpretation' || !group.memberIds.includes(c.recordId ?? c.assertionId))
                    fail('INTERPRETATION_CHOICE', 'Choice must be a member of its interpretation');
            }
            if (new Set((r.steps??[]).map(s=>s.id)).size !== (r.steps??[]).length) fail('CHAPTER_STEP','Step IDs must be unique');
            for (const p of r.modelPlacements ?? []) {
                const a = records.get(p.assetId), g = records.get(p.anchorGeometryId);
                if (a?.kind !== 'asset' || a.assetType !== 'model' || g?.kind !== 'geometry' || g.geometryType !== 'Point')
                    fail('PLACEMENT_TYPE', 'Model placements require a model asset and point anchor');
            }
        }
        if (r.kind === 'interpretation' && r.memberIds.some(id => {
            const member=records.get(id); return member?.kind !== 'assertion' && !(member?.kind === 'event' && member.eventType === 'migration');
        })) fail('INTERPRETATION_MEMBER', 'Interpretations contain assertions or explicitly reconstructed migration events');
        if (profile === 'fixture' && !r.synthetic)
            fail('FIXTURE_MARKER', 'Every fixture record must be explicitly synthetic');
        if (profile === 'release') {
            if (r.synthetic || r.kind === 'source' && r.sourceType === 'synthetic')
                fail('RELEASE_SYNTHETIC', 'Synthetic records cannot enter historical releases');
            if (r.editorial.status !== 'reviewed')
                fail('RELEASE_REVIEW', 'Record has not been reviewed');
            if (/TBD|unknown/i.test(r.recordLicense ?? dataset.defaultRecordLicense))
                fail('RELEASE_LICENSE', 'Record license is not resolved');
            if ((r.kind === 'geometry' || r.kind === 'asset') && /TBD|unknown/i.test(r.rights.license))
                fail('RELEASE_RIGHTS', 'Payload license is not resolved');
            if (['assertion', 'event', 'geometry'].includes(r.kind) && !r.sourceRefs.some(c => ['supports', 'derivation'].includes(c.role) && !!c.locator?.trim()))
                fail('SOURCE_SUPPORT', 'A supporting citation with locator is required');
        }
        try {
            if (r.kind === 'geometry')
                validateGeometry(JSON.parse(new TextDecoder().decode(await loadPayload(r, r.file))), r.id, r.geometryType);
            if (r.kind === 'asset') {
                const bytes = await loadPayload(r, r.file);
                if (r.assetType === 'model')
                    validateGLB(bytes);
                if (r.assetType === 'image') validateImage(bytes, r.mediaType);
                if (r.mediaType === 'image/svg+xml' || r.mediaType === 'text/html')
                    fail('ASSET_ACTIVE', 'Active formats are not supported');
                if (r.model?.previewFile)
                    await loadPayload(r, r.model.previewFile);
            }
            if (r.kind === 'chapter')
                for (const file of Object.values(r.textFiles))
                    await loadPayload(r, file);
        }
        catch (e) {
            fail(e.message.split(':')[0], String(e));
        }
    }
    const packages = new Map([...records].filter((p) => p[1].kind === 'package'));
    for (const [id, p] of packages)
        for (const member of p.recordIds) {
            if (owners.has(member))
                issue('PACKAGE_DUPLICATE_OWNER', paths.get(id), member, id);
            if (records.get(member)?.kind === 'package')
                issue('PACKAGE_MEMBER', paths.get(id), 'Manifest cannot own a package', id);
            owners.set(member, id);
        }
    for (const r of records.values())
        if (r.kind !== 'package' && !owners.has(r.id))
            issue('PACKAGE_ORPHAN', paths.get(r.id), 'Record has no owner package', r.id);
    const closure = (id, active = new Set()) => {
        if (active.has(id))
            throw new Error('PACKAGE_CYCLE: ' + id);
        const p = packages.get(id);
        if (!p)
            throw new Error('PACKAGE_DEPENDENCY: ' + id);
        const all = new Set([id]);
        for (const dep of p.dependencies)
            for (const x of closure(dep, new Set([...active, id])))
                all.add(x);
        return all;
    };
    for (const [id, p] of packages)
        check(p, () => {
            const visible = closure(id);
            for (const pk of [...visible])
                for (const member of packages.get(pk).recordIds)
                    visible.add(member);
            for (const member of [id, ...p.recordIds])
                for (const ref of references(records.get(member)))
                    if (!visible.has(ref.id))
                        throw new Error('PACKAGE_MISSING_DEPENDENCY: ' + ref.id);
            for (const ch of p.entryChapterIds)
                if (records.get(ch)?.kind !== 'chapter')
                    throw new Error('PACKAGE_CHAPTER: ' + ch);
        });
    for (const id of dataset.packageIds ?? [])
        if (!packages.has(id))
            issue('DATASET_PACKAGE', 'dataset.json', 'Missing ' + id);
    if (profile === 'fixture')
        issue('SYNTHETIC_DATASET', 'dataset.json', 'Technical fixture; no historical claims were reviewed', undefined, 'warning');
    return { root, profile, issues, records, paths, owners, dataset, vocabulary, payloads };
}
