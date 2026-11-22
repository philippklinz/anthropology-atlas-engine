export const selectionFilter = (id,type) => ['all',['==',['get','recordId'],id??''],['==',['geometry-type'],type]];
export function selectionLayers(id) {
    const base = (name,type,geometry,paint) => ({id:name,type,source:'historical',filter:selectionFilter(id,geometry),paint});
    return [
        base('selection-area','fill','Polygon',{'fill-color':'#d67a2c','fill-opacity':0.3}),
        base('selection-line-halo','line','LineString',{'line-color':'#fff4db','line-width':8}),
        base('selection-line','line','LineString',{'line-color':'#87451c','line-width':4}),
        base('selection-outline','line','Polygon',{'line-color':'#87451c','line-width':4}),
        base('selection-point-halo','circle','Point',{'circle-radius':13,'circle-color':'#fff4db','circle-stroke-color':'#ffffff','circle-stroke-width':3}),
        base('selection-point','circle','Point',{'circle-radius':9,'circle-color':'#d67a2c','circle-stroke-color':'#87451c','circle-stroke-width':2})
    ];
}
