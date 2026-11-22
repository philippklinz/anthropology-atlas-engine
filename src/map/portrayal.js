export function routeStyle(variant = 0) {
    return variant === 2 ? {color:'#6d5185', dash:[2,5]} : {color:'#985322', dash:[8,4]};
}
export function featureStyle(f) {
    const p=f.properties ?? {}, area=f.geometry.type.includes('Polygon'), point=f.geometry.type.includes('Point');
    if(p.portrayal === 'land-reconstruction') return {fill:'#d8cba9cc',stroke:'#87764e',width:1.3,dash:[5,3]};
    if(p.portrayal === 'ice-reconstruction') return {fill:'#e8f2fadd',stroke:'#6a8fa7',width:1.3,dash:[3,3]};
    if(p.portrayal === 'uncertainty-area') return {fill:'#aa785522',stroke:'#985322',width:1.5,dash:[3,4]};
    if(p.portrayal === 'migration') {const r=routeStyle(p.variant); return {fill:'none',stroke:r.color,width:2.6,dash:r.dash};}
    return {fill:area?'#009e9844':point?'#006f6b':'none',stroke:point?'white':area?'#00766d':'#9e613f',width:point?2:1.8,dash:!area&&!point?[5,4]:undefined};
}
export function paintOrder(f) {return ['land-reconstruction','ice-reconstruction'].includes(f.properties?.portrayal)?0:f.geometry.type.includes('Polygon')?1:f.geometry.type.includes('Line')?2:3;}
