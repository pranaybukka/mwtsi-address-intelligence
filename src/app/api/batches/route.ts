import {NextRequest} from 'next/server';
import {createBatch,listBatches} from '@/db/batches';
import {importWorkbook,UPLOAD_LIMIT} from '@/lib/excel/import';
import {apiError,checkLocalMutation} from '@/lib/api';
export const runtime='nodejs';
export async function GET(){return Response.json(listBatches());}
export async function POST(req:NextRequest){try{checkLocalMutation(req);if(Number(req.headers.get('content-length'))>UPLOAD_LIMIT+1024*1024)throw Error('Upload exceeds 20 MB');const data=await req.formData();const file=data.get('file');if(!(file instanceof File))throw Error('Choose an Excel file');if(file.size>UPLOAD_LIMIT)throw Error('Upload exceeds 20 MB');const rows=await importWorkbook(Buffer.from(await file.arrayBuffer()),file.name);return Response.json(createBatch(file.name.replace(/[^\p{L}\p{N} ._-]/gu,'_').slice(0,200),rows));}catch(e){return apiError(e);}}
