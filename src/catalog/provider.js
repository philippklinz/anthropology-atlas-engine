import { Ajv2020, addFormats } from '../../vendor/validation/validation.js';
import configSchema from '../../schemas/0.1.0/config.schema.json' with { type: 'json' };
import catalogSchema from '../../schemas/0.1.0/catalog.schema.json' with { type: 'json' };
import recordSchema from '../../schemas/0.1.0/record.schema.json' with { type: 'json' };
import { contentURL } from '../domain/paths.js';
import { bboxOverlap, rankSearch, temporalMatch, matchesTypes } from '../query/query.js';
const ajv = new Ajv2020({ strict: false });
addFormats(ajv);
const validConfig = ajv.compile(configSchema), validCatalog = ajv.compile(catalogSchema), validRecord = ajv.compile(recordSchema);
export {sha256 as digest} from '../domain/hash.js';
import {sha256 as digest} from '../domain/hash.js';
export function resolveConfig(value, appBase) {
    if (!validConfig(value))
        throw new Error('CONFIG_INVALID: ' + ajv.errorsText(validConfig.errors));
    const config = value, c = config.content;
    const url = c.mode === 'github-raw' ? new URL(`https://raw.githubusercontent.com/${c.owner}/${c.repository}/${encodeURIComponent(c.commit ?? c.branch)}/${c.catalogPath}`) : c.mode === 'bundled' ? contentURL(c.catalogUrl, appBase) : new URL(c.catalogUrl);
    if (url.username || url.password || !['http:', 'https:'].includes(url.protocol))
        throw new Error('CONFIG_URL: unsupported URL');
    return { config, catalogURL: url };
}
async function fetchBytes(url, expected) {
    let response;
    try {
        response = await fetch(url, { credentials: 'omit', redirect: 'error', cache: 'no-cache' });
    }
    catch {
        throw new Error('CONTENT_NETWORK: could not fetch ' + url.pathname + ' (connection or CORS)');
    }
    if (!response.ok)
        throw new Error(`CONTENT_HTTP_${response.status}: ${url.pathname}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (expected?.bytes !== undefined && expected.bytes !== bytes.length)
        throw new Error('CONTENT_SIZE: ' + url.pathname);
    if (expected?.sha256 && await digest(bytes) !== expected.sha256)
        throw new Error('CONTENT_HASH: ' + url.pathname);
    if (new TextDecoder().decode(bytes.subarray(0, 50)).startsWith('version https://git-lfs.github.com/spec/v1'))
        throw new Error('CONTENT_LFS: pointer instead of payload');
    return bytes;
}
export class StaticProvider {
    config;
    catalog;
    catalogURL;
    sourceKey = '';
    index;
    times = {};
    spatial = [];
    edges = {};
    cache = new Map();
    records = new Map();
    static async open(value, base) {
        const p = new StaticProvider(), resolved = resolveConfig(value, base);
        p.config = resolved.config;
        p.catalogURL = resolved.catalogURL;
        const bytes = await fetchBytes(p.catalogURL, { sha256: p.config.content.expectedCatalogSha256 });
        const parsed = JSON.parse(new TextDecoder().decode(bytes));
        if (!validCatalog(parsed))
            throw new Error('CATALOG_VERSION: unsupported or invalid catalog');
        p.catalog = parsed;
        const paths = new Set();
        for (const f of p.catalog.files) {
            contentURL(f.path, p.catalogURL);
            if (paths.has(f.path))
                throw new Error('CATALOG_DUPLICATE: ' + f.path);
            paths.add(f.path);
        }
        if (p.catalog.requiredCapabilities.some(c => !['geo-basic', 'historical-time', 'network-basic', 'model-viewer', 'script-samples'].includes(c)))
            throw new Error('CAPABILITY_UNSUPPORTED');
        p.sourceKey = p.config.instanceId + '-' + (await digest(new TextEncoder().encode(p.catalogURL.href))).slice(0, 12);
        const e = p.catalog.entrypoints;
        p.index = await p.json(e.recordIndex);
        if (!p.index.records || !Array.isArray(p.index.chapters))
            throw new Error('INDEX_RECORDS: invalid record index');
        [p.times, p.spatial, p.edges] = await Promise.all([p.items(e.time), p.items(e.spatial), p.items(e.relations)]);
        return p;
    }
    async bytes(path) {
        const f = this.catalog.files.find(f => f.path === path);
        if (!f)
            throw new Error('CONTENT_UNDECLARED: ' + path);
        if (!this.cache.has(path))
            this.cache.set(path, fetchBytes(contentURL(path, this.catalogURL), f).catch(e => { this.cache.delete(path); throw e; }));
        return this.cache.get(path);
    }
    async json(path) {
        const value = JSON.parse(new TextDecoder().decode(await this.bytes(path)));
        if (value.indexVersion !== '1' || value.dataReleaseId !== this.catalog.dataReleaseId)
            throw new Error('INDEX_REVISION: ' + path);
        return value;
    }
    async items(path) { return (await this.json(path)).items; }
    getReleaseInfo() { return this.catalog; }
    async getRecord(id) {
        if (!this.records.has(id)) {
            const location = this.index.records[id];
            if (!location)
                throw new Error('RECORD_MISSING: ' + id);
            const chunk = await this.json(location.path);
            for (const [key, value] of Object.entries(chunk.records ?? {})) {
                if (!validRecord(value) || value.id !== key || this.index.records[key]?.path !== location.path)
                    throw new Error('RECORD_INVALID: ' + key);
                this.records.set(key, value);
            }
        }
        const r = this.records.get(id);
        if (!r)
            throw new Error('RECORD_MISSING: ' + id);
        return r;
    }
    include(id, f) {
        const meta = this.index.records[id];
        if (!meta)
            return false;
        return (!f.packages.length || f.packages.includes(meta.packageId)) && matchesTypes(meta, f.types) && temporalMatch(id, this.times, f);
    }
    page(items, cursor) { const offset = cursor ? Number(cursor) : 0; if (!Number.isInteger(offset) || offset < 0)
        throw new Error('CURSOR_INVALID'); return { dataReleaseId: this.catalog.dataReleaseId, items: items.slice(offset, offset + 60), ...(items.length > offset + 60 ? { nextCursor: String(offset + 60) } : {}) }; }
    async search(query, f, language, cursor) {
        const path = this.catalog.entrypoints.search[language] ?? Object.values(this.catalog.entrypoints.search)[0];
        const docs = await this.items(path);
        return this.page(rankSearch(docs.filter(d => this.include(d.id, f)), query, language), cursor);
    }
    async relations(id, f, cursor) {
        const edges = (this.edges[id] ?? []).filter(r => this.include(r.id, f));
        const meta = this.index.records[id];
        // Places and waypoints are explicit event references, not new historical assertions.
        // Older catalogues indexed participants only, so derive these edges at query time.
        const events = meta?.kind === 'event' ? [id] : meta?.kind === 'entity' && meta.type === 'place'
            ? Object.keys(this.index.records).filter(key => this.index.records[key].kind === 'event') : [];
        for (const eventId of events) {
            if (!this.include(eventId, f)) continue;
            const event = await this.getRecord(eventId);
            const locations = new Map((event.placeIds ?? []).map(place => [place, 'event-location']));
            for (const waypoint of event.waypoints ?? []) if (waypoint.placeId && !locations.has(waypoint.placeId)) locations.set(waypoint.placeId, 'waypoint');
            for (const [place, predicate] of locations) {
                if (id !== eventId && id !== place) continue;
                if (!edges.some(e => e.id === eventId && e.from === eventId && e.to === place && e.predicate === predicate))
                    edges.push({ id: eventId, from: eventId, to: place, predicate, symmetric: false, event: true });
            }
        }
        return this.page(edges, cursor);
    }
    async features(viewport, f) {
        const features = [];
        const excluded = new Set();
        for (const [groupId, chosen] of Object.entries(f.interpretations)) {
            const group = await this.getRecord(groupId);
            if (group.kind !== 'interpretation' || !group.memberIds.includes(chosen))
                throw new Error('INTERPRETATION_INVALID: ' + groupId);
            for (const id of group.memberIds)
                if (id !== chosen)
                    excluded.add(id);
        }
        for (const s of this.spatial) {
            if (excluded.has(s.recordId) || !this.include(s.recordId, f) || !this.times[s.recordId]?.possible || viewport && !bboxOverlap(s.bbox, viewport))
                continue;
            const r = await this.getRecord(s.recordId);
            const layer = r.kind === 'assertion' ? r.predicate : 'events';
            if (!f.layers.includes(layer))
                continue;
            const geometry = JSON.parse(new TextDecoder().decode(await this.bytes(s.path)));
            features.push({ ...geometry, id: s.recordId, properties: { recordId: s.recordId, geometryId: s.geometryId, role: s.role, layer, uncertain: !this.times[s.recordId].certain || 'epistemic' in r && r.epistemic.status !== 'attested' } });
        }
        return { type: 'FeatureCollection', features };
    }
}
