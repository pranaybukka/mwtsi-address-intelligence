import {getBatch} from '@/db/batches';
import {exportWorkbook} from '@/lib/excel/export';
import {isExportMode} from '@/lib/export-options';
import {apiError} from '@/lib/api';
import {filterAndSortGroups,GroupSort} from '@/lib/source';
export const runtime='nodejs';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const batch=getBatch((await params).id);if(!batch)return Response.json({error:'Batch not found'},{status:404});
 const query=new URL(request.url).searchParams;const mode=query.get('mode')||'full';if(!isExportMode(mode))return Response.json({error:'Choose full or source-hybrid export mode'},{status:400});const sort=query.get('groupSort')||'original';
 if(!['original','asc','desc'].includes(sort)||query.has('group')&&query.get('groupMissing')==='1')return Response.json({error:'Invalid Group selection or sort order'},{status:400});
 const filter=query.get('groupMissing')==='1'?'blank':query.has('group')?`value:${query.get('group')}`:'all';
 const records=filterAndSortGroups(batch.records,filter,sort as GroupSort);if(!records.length)return Response.json({error:'No records match the selected Group'},{status:400});
 const selection=filter==='all'?'All groups':filter==='blank'?'No group':filter.slice(6);
 try{return new Response(new Uint8Array(await exportWorkbook({...batch,records},`Group: ${selection}; sort: ${sort}`,mode)),{headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':`attachment; filename="${mode==='full'?'hybrid-address-results.xlsx':'hybrid-address-source-hybrid.xlsx'}"`,'Cache-Control':'no-store'}});}catch(error){return apiError(error);}
}
