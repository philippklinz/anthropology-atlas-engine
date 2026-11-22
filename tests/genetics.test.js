import test,{assert} from './harness.js';
import {loadFixture} from '../tools/workspace.js';
import {validate} from '../tools/validate.js';
import {buildContent} from '../tools/build.js';

async function geneticFixture(){
    const work=await loadFixture();
    const citation={sourceId:'source:demo-notes',role:'supports',locator:'Synthetic genetic evidence, test only'};
    const base={schemaVersion:'0.1.0',editorial:{status:'draft'},synthetic:true,sourceRefs:[citation]};
    const records=[
        ['entities/specimens/demo-sample-a.json',{...base,kind:'entity',id:'specimen:demo-sample-a',entityType:'specimen',labels:{en:'Synthetic individual A'}}],
        ['entities/specimens/demo-sample-b.json',{...base,kind:'entity',id:'specimen:demo-sample-b',entityType:'specimen',labels:{en:'Synthetic individual B'}}],
        ['entities/taxa/demo-lineage.json',{...base,kind:'entity',id:'taxon:demo-lineage',entityType:'taxon',labels:{en:'Synthetic lineage'}}]
    ];
    const claim={...base,kind:'assertion',time:{kind:'unknown'},epistemic:{status:'inferred',note:{en:'Synthetic inference, not historical evidence'}},note:{en:'The sampled individual is the endpoint; no migration or ethnic identity is inferred.'}};
    records.push(['assertions/has-genetic-ancestry-from/demo-ancestry.json',{...claim,id:'assertion:demo-ancestry',predicate:'has-genetic-ancestry-from',subjectId:'specimen:demo-sample-a',objectId:'taxon:demo-lineage'}]);
    records.push(['assertions/genetically-related-to/demo-kinship.json',{...claim,id:'assertion:demo-kinship',predicate:'genetically-related-to',subjectId:'specimen:demo-sample-a',objectId:'specimen:demo-sample-b'}]);
    for(const [path,record] of records)work.set(path,JSON.stringify(record));
    const path='packages/demo-core/manifest.json',pack=JSON.parse(await work.readFile(path,'utf8'));
    pack.recordIds.push(...records.map(([,r])=>r.id));pack.recordIds.sort();work.set(path,JSON.stringify(pack));
    return work;
}
test('Genetic assertions preserve directed ancestry, symmetric kinship and capability gating',async()=>{
    const work=await geneticFixture();assert.deepEqual((await validate(work,'fixture')).issues.filter(i=>i.severity==='error'),[]);
    const result=await buildContent(work,'fixture','0'.repeat(40));assert.ok(result.catalog.requiredCapabilities.includes('genetic-relationships'));
    const relations=JSON.parse(await result.files.readFile(result.catalog.entrypoints.relations,'utf8')).items;
    assert.ok(relations['specimen:demo-sample-a'].some(e=>e.id==='assertion:demo-kinship'&&e.symmetric));
    assert.ok(relations['specimen:demo-sample-b'].some(e=>e.id==='assertion:demo-kinship'&&e.symmetric));
});
test('Genetic evidence rejects language ancestry, reversed kinship, missing citations and invented routes',async()=>{
    for(const [path,mutate,code] of [
        ['has-genetic-ancestry-from/demo-ancestry',r=>r.objectId='language:demo-language','RELATION_TYPES'],
        ['genetically-related-to/demo-kinship',r=>[r.subjectId,r.objectId]=[r.objectId,r.subjectId],'RELATION_DIRECTION'],
        ['genetically-related-to/demo-kinship',r=>r.sourceRefs=[],'GENETIC_EVIDENCE'],
        ['genetically-related-to/demo-kinship',r=>delete r.note,'GENETIC_EVIDENCE'],
        ['genetically-related-to/demo-kinship',r=>r.spatial=[{geometryId:'geometry:demo-connection',role:'route'}],'GENETIC_SPATIAL']
    ]){
        const work=await geneticFixture(),file='assertions/'+path+'.json',record=JSON.parse(await work.readFile(file,'utf8'));mutate(record);work.set(file,JSON.stringify(record));
        assert.ok((await validate(work,'fixture')).issues.some(i=>i.code===code),code);
    }
});
