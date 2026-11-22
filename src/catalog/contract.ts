import type { AtlasRecord, Chapter, Entity, Camera } from '../domain/records.ts';
import type { DayRange, TemporalExtent } from '../domain/time.ts';
import type { Feature, FeatureCollection } from 'geojson';
export type FileEntry={path:string; role:string; bytes:number; mediaType:string; sha256:string};
export type Catalog={catalogVersion:'1';schemaVersion:'0.1.0';indexVersion:'1';dataReleaseId:string;sourceRevision:string;compilerVersion:string;packages:string[];languages:string[];requiredCapabilities:string[];files:FileEntry[];entrypoints:{recordIndex:string;search:Record<string,string>;time:string;relations:string;spatial:string;defaultChapterId:string};licenseInventory:string};
export type ContentConfig={mode:'bundled'|'http';catalogUrl:string;expectedCatalogSha256?:string;updatePolicy:'pinned'|'on-reload'}|{mode:'github-raw';owner:string;repository:string;commit:string;catalogPath:string;expectedCatalogSha256:string;updatePolicy:'pinned'};
export type AtlasConfig={configVersion:'1';instanceId:string;defaultLanguage:string;content:ContentConfig};
export type RecordIndex={indexVersion:'1';dataReleaseId:string;records:Record<string,{path:string;packageId:string;kind:AtlasRecord['kind'];type?:string;labels:Record<string,string>}>;chapters:Chapter[]};
export type Relation={id:string;from:string;to:string;predicate:string;symmetric:boolean;event?:boolean};
export type IndexEnvelope<T>={indexVersion:'1';dataReleaseId:string;items:T};
export type SearchDocument={id:string;labels:Record<string,string>;aliases:string[];text:string;type:string};
export type SpatialEntry={recordId:string;geometryId:string;path:string;role:string;bbox:[number,number,number,number]};
export type Filters={range:DayRange;mode:'overlap'|'contained';includeUndated:boolean;layers:string[];types:string[];packages:string[];interpretations:Record<string,string>};
export type SearchHit={id:string;label:string;type:string;score:number;reason:'id'|'name'|'alias'|'text'};
export type Page<T>={dataReleaseId:string;items:T[];nextCursor?:string};
export interface AtlasDataProvider {
  getRecord(id:string):Promise<AtlasRecord>;
  search(query:string,filters:Filters,language:string,cursor?:string):Promise<Page<SearchHit>>;
  relations(id:string,filters:Filters,cursor?:string):Promise<Page<Relation>>;
  features(viewport:[number,number,number,number]|undefined,filters:Filters):Promise<FeatureCollection>;
  getReleaseInfo():Catalog;
}
export type { AtlasRecord, Chapter, Entity, Camera, Feature, FeatureCollection, TemporalExtent };
