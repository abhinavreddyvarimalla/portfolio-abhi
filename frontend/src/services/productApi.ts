import type {Endpoint,ApiResult} from './playground';
// Same-origin /api goes through Vite's proxy in development.
// No silent mock fallback: connection failures must remain visible.
export async function requestProduct(endpoint:Endpoint,input:string,signal:AbortSignal):Promise<ApiResult>{
 const value=input.trim();
 const url=endpoint==='list'?`/api/products?name=${encodeURIComponent(value)}`:endpoint==='one'?`/api/products/${encodeURIComponent(value||'invalid')}`:'/api/products';
 const response=await fetch(url,{method:endpoint==='create'?'POST':'GET',signal,headers:endpoint==='create'?{'Content-Type':'application/json'}:{Accept:'application/json'},...(endpoint==='create'?{body:input}:{})});
 const type=response.headers.get('content-type')??'';
 if(!type.includes('json'))throw new Error('The API did not return JSON. Check that Spring Boot is running on port 8080.');
 const data:unknown=await response.json();
 const names:Record<number,string>={200:'OK',201:'Created',400:'Bad Request',404:'Not Found',500:'Internal Server Error',503:'Service Unavailable'};
 return {status:response.status,label:names[response.status]??response.statusText,data};
}
