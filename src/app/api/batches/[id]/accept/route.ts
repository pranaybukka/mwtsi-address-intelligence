import {acceptPendingBatch} from '@/db/batches';
import {apiError,checkLocalMutation} from '@/lib/api';
export const runtime='nodejs';
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){try{checkLocalMutation(req);const body=await req.json() as {reviewer:string;reason:string;selection:{id:string;version:number}[]};if(typeof body.reviewer!=='string'||typeof body.reason!=='string')throw Error('Reviewer and reason required');return Response.json(acceptPendingBatch((await params).id,body.selection,body.reviewer,body.reason));}catch(e){return apiError(e,e instanceof Error&&e.message.startsWith('CONFLICT')?409:400);}}
