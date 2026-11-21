import {getRecord,saveReviewed} from '@/db/batches';
import {reviewRecord} from '@/lib/review';
import {reference} from '@/lib/reference/sqlite';
import {apiError,checkLocalMutation} from '@/lib/api';
import {ReviewEvent,StructuredAddress} from '@/lib/domain';
export const runtime='nodejs';
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){try{checkLocalMutation(req);const r=getRecord((await params).id);if(!r)return Response.json({error:'Record not found'},{status:404});const body=await req.json() as {action:ReviewEvent['action'];reviewer:string;reason:string;edits?:Partial<StructuredAddress>;version:number};if(body.version!==r.version)throw Error('CONFLICT: Record changed; reload');if(typeof body.reviewer!=='string'||typeof body.reason!=='string')throw Error('Reviewer and reason required');const next=reviewRecord(r,body.action,body.reviewer,body.reason,body.edits,reference);saveReviewed(next,body.version);return Response.json(next);}catch(e){return apiError(e,e instanceof Error&&e.message.startsWith('CONFLICT')?409:400);}}
