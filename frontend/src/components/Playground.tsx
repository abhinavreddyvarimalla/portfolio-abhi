import {useState,useRef,useEffect} from 'react';
import {endpoints,type Endpoint,type ApiResult} from '../services/playground';
import {requestProduct} from '../services/productApi';
export default function Playground(){
 const [endpoint,setEndpoint]=useState<Endpoint>('list');
 const [input,setInput]=useState('');
 const [result,setResult]=useState<ApiResult|null>(null);
 const [pending,setPending]=useState(false);
 const controller=useRef<AbortController|null>(null);
 const [error,setError]=useState<string|null>(null);
 useEffect(()=>()=>controller.current?.abort(),[]);
 function select(key:Endpoint){controller.current?.abort();controller.current=null;setPending(false);setEndpoint(key);setInput(endpoints[key].initial);setResult(null);setError(null);}
 async function run(){
   controller.current?.abort();
   const current=new AbortController();controller.current=current;
   setPending(true);setResult(null);setError(null);
   const timeout=setTimeout(()=>current.abort(new DOMException('Request timed out','TimeoutError')),10000);
   try{const result=await requestProduct(endpoint,input,current.signal);if(controller.current===current)setResult(result);}
   catch(error){if(controller.current===current)setError(current.signal.aborted?'Request timed out. Check the backend and retry.':error instanceof Error?error.message:'Unable to reach the API.');}
   finally{clearTimeout(timeout);if(controller.current===current){setPending(false);controller.current=null;}}
 }
 const config=endpoints[endpoint];
 return <section className="lab" id="lab"><div className="eyebrow-row"><p className="eyebrow">● 02 / THE PLAYGROUND</p><span className="badge">LIVE API</span></div><div className="heading"><h2>Don’t just read.<br/><em>Send a request.</em></h2><p>A little window into backend thinking.<br/>Explore requests, validation, and errors.<br/>Backed by Spring Boot & PostgreSQL.</p></div><div className="console"><aside><small>COLLECTION / PRODUCT API</small>{(Object.keys(endpoints) as Endpoint[]).map(key=><button key={key} className={key===endpoint?'active':''} aria-pressed={key===endpoint} onClick={()=>select(key)}><b>{endpoints[key].method}</b> {endpoints[key].label}</button>)}<div className="note">↳ LOCAL BACKEND<p>Real API requests.<br/>Created products are saved.</p></div></aside><div><div className="request"><b>{config.method}</b><code>{config.route}</code><button className="button" onClick={run} disabled={pending}>{pending?'Running…':'Run request ▶'}</button></div><div className="input"><label htmlFor="payload">{config.inputLabel}</label><textarea id="payload" rows={3} spellCheck={false} value={input} onChange={e=>setInput(e.target.value)} placeholder={config.placeholder}/></div><div className="response-head"><span>Response</span><span id="status" role="status">{pending?'Sending request…':error?'Connection error':result?`${result.status} ${result.label}`:'Ready to run'}</span></div><pre aria-label="API response">{error?error:result?JSON.stringify(result.data,null,2):'// Choose an endpoint, then run a request.'}</pre><div className="console-footer">application/json <span>SPRING BOOT · PERSISTENT DATA</span></div></div></div></section>;
}
