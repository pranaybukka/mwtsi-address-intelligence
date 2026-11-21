export function checkLocalMutation(request:Request){const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)throw Error('Cross-origin request rejected');}
export function apiError(error:unknown,status=400){return Response.json({error:error instanceof Error?error.message:'Request failed'},{status});}
