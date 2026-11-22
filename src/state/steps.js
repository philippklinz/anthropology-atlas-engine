import { normalizeTime } from '../domain/time.js';
export function chapterStepState(state, chapter, id) {
    const step=id ? chapter.steps?.find(item=>item.id===id) : undefined;
    if(id && !step) throw new Error('URL_STEP: chapter step unavailable');
    const initial=step?.state ?? chapter.initialState;
    const time=normalizeTime(initial.time).possible;
    if(!time) throw new Error('CHAPTER_STEP_TIME: a step needs a bounded viewing window');
    return {...state,view:'chapter',id:chapter.id,chapter:chapter.id,step:id||undefined,
        time,camera:initial.camera,layers:initial.layers,types:[],searchScope:'selection'};
}
