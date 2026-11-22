from pathlib import Path
from copy import deepcopy
import calendar
import json
import re
import struct
import subprocess
from jsonschema import Draft202012Validator, FormatChecker

ENGINE=Path(__file__).resolve().parents[2]
ROOT=ENGINE.parent
FIXTURE=ENGINE/'fixtures/reference-package'
SCHEMAS=ENGINE/'schemas/0.1.0'
schemas={p.name:json.loads(p.read_text()) for p in SCHEMAS.glob('*.schema.json')}
for s in schemas.values(): Draft202012Validator.check_schema(s)
validators={name:Draft202012Validator(s,format_checker=FormatChecker()) for name,s in schemas.items()}
vocab=json.loads((SCHEMAS/'vocabulary.json').read_text())
records={}
paths={}
for path in sorted(FIXTURE.rglob('*.json')):
    value=json.loads(path.read_text())
    if path.name=='dataset.json':
        validators['dataset.schema.json'].validate(value)
        continue
    validators['record.schema.json'].validate(value)
    assert value['id'] not in records, ('duplicate ID',value['id'])
    records[value['id']]=value;paths[value['id']]=path

def epoch_day(d):
    y,m,day=d['year'],d['month'],d['day']
    if not (-10000<=y<=2100 and 1<=m<=12 and 1<=day<=calendar.monthrange(y,m)[1]):
        raise ValueError('TIME_CALENDAR')
    y-=1 if m<=2 else 0
    era=y//400
    yoe=y-era*400
    doy=(153*(m+(-3 if m>2 else 9))+2)//5+day-1
    doe=yoe*365+yoe//4-yoe//100+doy
    return era*146097+doe-719468

def check_estimate(e):
    lo,hi=e['earliest'],e['latest']
    if epoch_day(lo)>epoch_day(hi):raise ValueError('TIME_ORDER')
    precision=e['precision']
    if precision=='year':
        if (lo['month'],lo['day'])!=(1,1) or (hi['month'],hi['day'])!=(12,31):raise ValueError('TIME_PRECISION')
        if e['qualifier']=='exact' and lo['year']!=hi['year']:raise ValueError('TIME_EXACT')
    if precision=='month':
        if lo['day']!=1 or hi['day']!=calendar.monthrange(hi['year'],hi['month'])[1]:raise ValueError('TIME_PRECISION')
        if e['qualifier']=='exact' and (lo['year'],lo['month'])!=(hi['year'],hi['month']):raise ValueError('TIME_EXACT')
    if precision=='day' and e['qualifier']=='exact' and lo!=hi:raise ValueError('TIME_EXACT')

def scan_times(x):
    if isinstance(x,dict):
        if {'earliest','latest','precision','qualifier'}<=x.keys():check_estimate(x)
        if x.get('kind')=='interval' and 'start' in x and 'end' in x and x['start'] is not None and x['end'] is not None:
            if epoch_day(x['start']['earliest'])>epoch_day(x['end']['latest']):raise ValueError('TIME_INTERVAL_ORDER')
        for value in x.values():scan_times(value)
    elif isinstance(x,list):
        for value in x:scan_times(value)

REF_KEYS={'sourceId','subjectId','objectId','entityId','geometryId','placeId','parentEventId','scriptId','fontAssetId','assetId','anchorGeometryId','interpretationId','assertionId'}
REF_LISTS={'assetIds','entityIds','scopeIds','placeIds','focusIds','memberIds','recordIds','entryChapterIds','selectedIds','dependencies'}
def refs(x):
    result=[]
    if isinstance(x,dict):
        for key,value in x.items():
            if key in REF_KEYS:result.append(value)
            elif key in REF_LISTS:result.extend(value)
            else:result.extend(refs(value))
    elif isinstance(x,list):
        for value in x:result.extend(refs(value))
    return result

def check_record(v, registry):
    scan_times(v)
    for ident in refs(v):
        if ident not in registry:raise ValueError('REF_MISSING')
    if v['kind']=='assertion':
        rule=vocab['predicates'][v['predicate']]
        if registry[v['subjectId']]['entityType'] not in rule['subjectTypes'] or registry[v['objectId']]['entityType'] not in rule['objectTypes']:raise ValueError('RELATION_TYPES')
        if rule['symmetric'] and v['subjectId']>=v['objectId']:raise ValueError('RELATION_DIRECTION')
    if v['kind']=='event':
        allowed=vocab['eventRoles'][v['eventType']]
        if any(p['role'] not in allowed for p in v['participants']):raise ValueError('EVENT_ROLE')

def check_packages(registry):
    packages={k:v for k,v in registry.items() if v['kind']=='package'}
    owners={}
    for pk,p in packages.items():
        for ident in p['recordIds']:
            if ident in owners:raise ValueError('PACKAGE_DUPLICATE_OWNER')
            if ident not in registry or registry[ident]['kind']=='package':raise ValueError('PACKAGE_MEMBER')
            owners[ident]=pk
    if set(owners)!=set(registry)-set(packages):raise ValueError('PACKAGE_ORPHAN')
    def closure(pk,active=None):
        active=set() if active is None else active
        if pk in active:raise ValueError('PACKAGE_CYCLE')
        if pk not in packages:raise ValueError('PACKAGE_DEPENDENCY')
        result={pk}
        for dep in packages[pk]['dependencies']:result|=closure(dep,active|{pk})
        return result
    for pk,p in packages.items():
        package_ids=closure(pk)
        visible=set(package_ids)
        for ident in package_ids:visible.update(packages[ident]['recordIds'])
        for recordid in p['recordIds']+[pk]:
            if set(refs(registry[recordid]))-visible:raise ValueError('PACKAGE_MISSING_DEPENDENCY')

def check_geo(feature):
    geom=feature['geometry'];typ=geom['type'];c=geom['coordinates']
    def positions(value):
        if value and isinstance(value[0],(int,float)):yield value
        else:
            for item in value:yield from positions(item)
    for pos in positions(c):
        if len(pos)!=2 or not -180<=pos[0]<=180 or not -90<=pos[1]<=90:raise ValueError('GEO_COORDINATE')
    polys=[c] if typ=='Polygon' else c if typ=='MultiPolygon' else []
    for poly in polys:
        for ring in poly:
            if len(ring)<4 or ring[0]!=ring[-1]:raise ValueError('GEO_RING')
            if sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(ring,ring[1:]))==0:raise ValueError('GEO_DEGENERATE')
    lines=[c] if typ=='LineString' else c if typ=='MultiLineString' else []
    for line in lines:
        if len(line)<2:raise ValueError('GEO_LINE')
        if any(abs(a[0]-b[0])>180 for a,b in zip(line,line[1:])):raise ValueError('GEO_DATELINE')

for ident,v in records.items():
    check_record(v,records)
    p=paths[ident];slug=ident.split(':',1)[1]
    if v['kind']=='entity':expected=f'entities/{vocab["entityDirectories"][v["entityType"]]}/{slug}.json'
    elif v['kind']=='assertion':expected=f'assertions/{v["predicate"]}/{slug}.json'
    elif v['kind']=='event':expected=f'events/{v["eventType"]}/{slug}.json'
    elif v['kind'] in ('source','interpretation'):expected=f'{v["kind"]}s/{slug}.json'
    else:expected=None
    if expected:assert p.relative_to(FIXTURE).as_posix()==expected
    files=[]
    if 'file' in v:files.append(v['file'])
    if 'textFiles' in v:files.extend(v['textFiles'].values())
    for filename in files:
        payload=(p.parent/filename).resolve()
        assert payload.is_relative_to(FIXTURE) and payload.is_file(),('payload',ident,filename)
    if v['kind']=='geometry':
        feature=json.loads((p.parent/v['file']).read_text())
        assert feature['id']==ident and feature['geometry']['type']==v['geometryType']
        check_geo(feature)
    if v['kind']=='chapter':
        for choice in v.get('interpretationChoices',[]):assert choice['assertionId'] in records[choice['interpretationId']]['memberIds']
check_packages(records)

checks=[]
def negative(name, fn):
    try:fn()
    except Exception as err:
        # Test functions raise on rejection; record the explicit class, not its stack.
        checks.append({'case':name,'result':'rejected','exception':type(err).__name__})
    else:raise AssertionError('Negative case accepted: '+name)

def bad_schema(name,recordid,mutator):
    v=deepcopy(records[recordid]);mutator(v)
    negative(name,lambda:validators['record.schema.json'].validate(v))
bad_schema('Unbekanntes Feld','place:demo-port-a',lambda v:v.update(unexpected=True))
bad_schema('Falscher Entitäts-Namespace','place:demo-port-a',lambda v:v.update(id='script:demo-port-a'))
bad_schema('Review ohne tatsächliche Prüfmetadaten','place:demo-port-a',lambda v:v.update(editorial={'status':'reviewed'}))
bad_schema('Pfad verlässt Paket','asset:demo-symbol',lambda v:v.update(file='../outside.glb'))
bad_schema('Modell ohne Modellmetadaten','asset:demo-symbol',lambda v:v.pop('model'))
bad_schema('Ressource ohne Rechte','asset:demo-symbol',lambda v:v.pop('rights'))
bad_schema('Doppelte Paket-ID in Mitgliedsliste','package:demo-reuse',lambda v:v['recordIds'].append(v['recordIds'][0]))
v=deepcopy(records['assertion:demo-script-descent']);v['objectId']='language:demo-language'
negative('Schriftentwicklung auf Sprache',lambda:check_record(v,records))
v=deepcopy(records['assertion:demo-trade']);v['subjectId'],v['objectId']=v['objectId'],v['subjectId']
negative('Symmetrische Kante in falscher Richtung',lambda:check_record(v,records))
v=deepcopy(records['assertion:demo-trade']);v['sourceRefs'][0]['sourceId']='source:missing'
negative('Fehlende Quelle',lambda:check_record(v,records))
negative('Ungültiger Schalttag 1900',lambda:epoch_day({'year':1900,'month':2,'day':29}))
e={'earliest':{'year':1300,'month':2,'day':1},'latest':{'year':1300,'month':12,'day':31},'precision':'year','qualifier':'exact'}
negative('Jahrespräzision ohne ganze Jahresgrenzen',lambda:check_estimate(e))
v=deepcopy(records['assertion:demo-trade']);v['time']['start']['earliest']['year']=1400;v['time']['start']['latest']['year']=1400
negative('Beginn nach Ende',lambda:check_record(v,records))
r=deepcopy(records);r['package:demo-core']['dependencies']=['package:demo-reuse']
negative('Paketzyklus',lambda:check_packages(r))
r=deepcopy(records);r['package:demo-reuse']['recordIds'].append('place:demo-port-a')
negative('Doppeltes Eigentümerpaket',lambda:check_packages(r))
r=deepcopy(records);r['package:demo-reuse']['dependencies']=[]
negative('Fehlende transitive Paketabhängigkeit',lambda:check_packages(r))
geo={'type':'Feature','geometry':{'type':'Polygon','coordinates':[[[0,0],[1,0],[1,1],[0,1]]]},'properties':{}}
negative('Offener Polygonring',lambda:check_geo(geo))
geo={'type':'Feature','geometry':{'type':'LineString','coordinates':[[179,10],[-179,10]]},'properties':{}}
negative('Ungeteilte Linie am Antimeridian',lambda:check_geo(geo))

config=json.loads((ENGINE/'docs/deployment-http.example.json').read_text())
validators['config.schema.json'].validate(config)
raw={'configVersion':'1','instanceId':'contract-test','defaultLanguage':'de','content':{'mode':'github-raw','owner':'example','repository':'anthropology-atlas-content','commit':'a'*40,'catalogPath':'published/catalog.json','expectedCatalogSha256':'b'*64,'updatePolicy':'pinned'}}
validators['config.schema.json'].validate(raw)
bundled={'configVersion':'1','instanceId':'contract-test','defaultLanguage':'de','content':{'mode':'bundled','catalogUrl':'./content/catalog.json','expectedCatalogSha256':'b'*64,'updatePolicy':'pinned'}}
validators['config.schema.json'].validate(bundled)
c=deepcopy(raw);c['content']['commit']='main'
negative('Beweglicher Branch statt Raw-Commit',lambda:validators['config.schema.json'].validate(c))
c=deepcopy(raw);c['content']['token']='not-a-real-token'
negative('Token in Browserkonfiguration',lambda:validators['config.schema.json'].validate(c))
c=deepcopy(config);c['content']['updatePolicy']='pinned'
negative('Fixierter HTTP-Stand ohne Kataloghash',lambda:validators['config.schema.json'].validate(c))
c=deepcopy(bundled);c['content']['catalogUrl']='https://content.example.org/catalog.json'
negative('Remote-URL im gebündelten Profil',lambda:validators['config.schema.json'].validate(c))

vectors=[{'year':y,'month':m,'day':d} for y,m,d in [(-10000,1,1),(-43,3,15),(-1,12,31),(0,1,1),(0,2,29),(0,12,31),(1,1,1),(99,1,1),(100,1,1),(1900,3,1),(1970,1,1),(2000,2,29),(2100,12,31)]]
script='const a=JSON.parse(process.argv[1]); process.stdout.write(JSON.stringify(a.map(x=>{let d=new Date(0); d.setUTCHours(0,0,0,0); d.setUTCFullYear(x.year,x.month-1,x.day); return d.valueOf()/86400000;})));'
js=json.loads(subprocess.check_output(['node','-e',script,json.dumps(vectors)],text=True))
py=[epoch_day(v) for v in vectors]
assert js==py,(js,py)
assert epoch_day({'year':1,'month':1,'day':1})-epoch_day({'year':0,'month':12,'day':31})==1
assert epoch_day({'year':1970,'month':1,'day':1})==0

glb=(FIXTURE/'assets/models/demo-symbol/model.glb').read_bytes()
magic,version,length=struct.unpack('<4sII',glb[:12]);assert (magic,version,length)==(b'glTF',2,len(glb))
jlen,jtyp=struct.unpack('<I4s',glb[12:20]);assert jtyp==b'JSON'
gltf=json.loads(glb[20:20+jlen]);assert gltf['asset']['version']=='2.0'
assert all('uri' not in b for b in gltf['buffers'])
assert not gltf.get('images')

report={'schemas_checked':len(schemas),'records_schema_valid':len(records),'package_count':2,'payloads_present':True,'references_resolved':True,'negative_cases':checks,'date_vectors':len(vectors),'date_vector_epoch_days':py,'glb_structure_checked':True,'historical_release_eligible':False,'unperformed':['Production semantic validator','Full polygon topology validation','Browser rendering and accessibility','GitHub Raw CORS/MIME/rate-limit integration','Live MariaDB','Historical source review','Actual compiled content index compatibility','Offline production build']}
dump_path=ENGINE/'tests/contract/spec-check-results.json';dump_path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ['negative_cases','date_vector_epoch_days','unperformed']}))
print('Negative cases rejected:',len(checks))
