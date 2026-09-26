import {test} from 'node:test';
import assert from 'node:assert/strict';
import {requestProduct} from '../src/services/productApi.ts';
test('client encodes search and preserves server errors',async()=>{
 const original=globalThis.fetch;
 try{
  let requested='';
  globalThis.fetch=async(input)=>{requested=String(input);return new Response(JSON.stringify({items:[]}),{status:200,headers:{'Content-Type':'application/json'}});};
  await requestProduct('list','lamp & stand',new AbortController().signal);
  assert.equal(requested,'/api/products?name=lamp%20%26%20stand');
  globalThis.fetch=async()=>new Response(JSON.stringify({message:'Product not found'}),{status:404,headers:{'Content-Type':'application/json'}});
  const missing=await requestProduct('one','999',new AbortController().signal);
  assert.equal(missing.status,404);assert.deepEqual(missing.data,{message:'Product not found'});
 }finally{globalThis.fetch=original;}
});
test('POST sends raw input for server-side validation',async()=>{
 const original=globalThis.fetch;
 try{
  globalThis.fetch=async(_url,init)=>{assert.equal(init?.method,'POST');assert.equal(init?.body,'{broken');return new Response('{"message":"Malformed JSON"}',{status:400,headers:{'Content-Type':'application/json'}});};
  assert.equal((await requestProduct('create','{broken',new AbortController().signal)).status,400);
 }finally{globalThis.fetch=original;}
});
test('connection and proxy errors never fall back to mock data',async()=>{
 const original=globalThis.fetch;
 try{
  globalThis.fetch=async()=>new Response('Proxy failure',{status:500,headers:{'Content-Type':'text/plain'}});
  await assert.rejects(requestProduct('list','',new AbortController().signal),/did not return JSON/);
  globalThis.fetch=async()=>{throw new TypeError('Failed to fetch');};
  await assert.rejects(requestProduct('list','',new AbortController().signal),/Failed to fetch/);
 }finally{globalThis.fetch=original;}
});
