import {getBatch} from '@/db/batches';
export const runtime='nodejs';
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){const b=getBatch((await params).id);return b?Response.json(b):Response.json({error:'Batch not found'},{status:404});}
