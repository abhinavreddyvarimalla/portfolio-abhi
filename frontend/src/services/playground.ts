export type Endpoint = 'list' | 'one' | 'create';
export interface ApiResult { status: number; label: string; data: unknown }
export const endpoints: Record<Endpoint,{method:string;route:string;label:string;inputLabel:string;initial:string;placeholder:string}> = {
  list:{method:'GET',route:'/api/products',label:'List products',inputLabel:'Query · optional name filter',initial:'',placeholder:'e.g. keyboard'},
  one:{method:'GET',route:'/api/products/{id}',label:'Find by ID',inputLabel:'Product ID · try 1 or 999',initial:'1',placeholder:'Enter a numeric ID'},
  create:{method:'POST',route:'/api/products',label:'Create product',inputLabel:'JSON body · name required; price must be positive',initial:'{\n  "name": "Desk mat",\n  "price": 24.5\n}',placeholder:'Enter JSON'}
};
const items=[{id:1,name:'Mechanical keyboard',price:89,inStock:true},{id:2,name:'Studio headphones',price:129,inStock:true},{id:3,name:'Desk light',price:45,inStock:false}];
const bad=(error:string):ApiResult=>({status:400,label:'Bad Request',data:{error}});
export function simulateRequest(endpoint:Endpoint, raw:string):ApiResult {
  const input=raw.trim();
  if(endpoint==='list')return {status:200,label:'OK',data:{items:items.filter(p=>p.name.toLowerCase().includes(input.toLowerCase()))}};
  if(endpoint==='one'){
    if(!/^[1-9]\d*$/.test(input)||!Number.isSafeInteger(Number(input)))return bad('ID must be a positive safe integer');
    const product=items.find(p=>p.id===Number(input));
    return product?{status:200,label:'OK',data:product}:{status:404,label:'Not Found',data:{error:'Product not found',id:input}};
  }
  let body:unknown;
  try{body=JSON.parse(input);}catch{return bad('Invalid JSON body');}
  if(!body||typeof body!=='object'||Array.isArray(body))return bad('Expected a JSON object');
  const record=body as Record<string,unknown>;
  if(typeof record.name!=='string'||!record.name.trim()||typeof record.price!=='number'||!Number.isFinite(record.price)||record.price<=0)return bad('Name must be non-blank and price must be a positive number');
  return {status:201,label:'Created',data:{id:'demo-only',name:record.name.trim(),price:record.price,persisted:false}};
}
