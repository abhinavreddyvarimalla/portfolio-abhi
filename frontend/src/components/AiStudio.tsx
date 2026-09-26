import {useEffect,useRef,useState} from 'react';
import AiPlayground from './AiPlayground';
type Result={status:string;message:string;model:string|null;claims:{text:string;source_ids:string[]}[];sources:{id:string;title:string;text:string;matching_terms:string[]}[];trace:{node:string;duration_ms:number;detail:string}[];prompt:string};
const examples=['How does the Go project handle failures?','What AI experience does Abhinav have?','How does this portfolio use LangChain and LangGraph?'];
const names:Record<string,string>={retrieve:'Retrieve sources',generate:'Generate answer',check_references:'Check reference IDs',abstain:'Abstain',preview:'Return evidence'};
export default function AiStudio(){
 const [view,setView]=useState<'assistant'|'local'>(import.meta.env.VITE_PUBLIC_SITE === 'true' ? 'local' : 'assistant');
 return <section id="ai-lab" className="ai-studio"><p className="eyebrow">AI ENGINEERING / EXPLORE THE IMPLEMENTATION</p><div className="heading"><h2>Ask. Retrieve.<br /><em>Reason with context.</em></h2><p>LangChain + LangGraph + Ollama<br />Local model assistant + browser retrieval demo.<br />Explore the evidence behind the answers.</p></div><div className="filters" role="group" aria-label="AI experience">{import.meta.env.VITE_PUBLIC_SITE !== 'true' && <button className={view==='assistant'?'active':''} aria-pressed={view==='assistant'} onClick={()=>setView('assistant')}>LangGraph assistant</button>}<button className={view==='local'?'active':''} aria-pressed={view==='local'} onClick={()=>setView('local')}>Browser-only retrieval demo</button></div>{view==='assistant'?<Assistant/>:<AiPlayground/>}</section>;
}
function Assistant(){
 const [question,setQuestion]=useState(examples[0]);
 const [mode,setMode]=useState<'model'|'retrieval'>('model');
 const [health,setHealth]=useState<{ready:boolean;model:string}|null>(null);
 const [healthText,setHealthText]=useState('Checking the AI service…');
 const [result,setResult]=useState<Result|null>(null);
 const [pending,setPending]=useState(false);
 const [error,setError]=useState('');
 const active=useRef<AbortController|null>(null);
 const statusRequest=useRef<AbortController|null>(null);
 const [lastQuestion,setLastQuestion]=useState('');
 async function check(){
  statusRequest.current?.abort();const controller=new AbortController();statusRequest.current=controller;
  const timer=setTimeout(()=>controller.abort(),5000);
  setHealthText('Checking the AI service…');
  try{const response=await fetch('/api/ai/status',{signal:controller.signal});if(!response.ok)throw new Error();const body=await response.json();if(typeof body.ready!=='boolean'||typeof body.model!=='string')throw new Error();if(statusRequest.current!==controller)return;setHealth(body);setHealthText(body.ready?'Local model available':'AI service connected · model not downloaded or unavailable');}
  catch{if(statusRequest.current===controller){setHealth(null);setHealthText('AI service offline · browser-only demo is available');}}
  finally{clearTimeout(timer);}
 }
 useEffect(()=>{void check();return()=>{active.current?.abort();statusRequest.current?.abort();statusRequest.current=null;};},[]);
 async function submit(e:React.FormEvent){
  e.preventDefault();if(!question.trim()||pending)return;
  const controller=new AbortController();active.current=controller;
  const timer=setTimeout(()=>controller.abort(),110000);
  setPending(true);setError('');setResult(null);setLastQuestion(question.trim());
  try{
   const response=await fetch('/api/ai/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:question.trim(),mode,limit:3}),signal:controller.signal});
   if(!(response.headers.get('content-type')||'').includes('application/json'))throw new Error('AI service unavailable. Start the AI containers or choose the browser-only demo.');
   const body=await response.json();
   if(!response.ok)throw new Error(typeof body.detail==='string'?body.detail:'The request was rejected. Check the question and retry.');
   if(!Array.isArray(body.claims)||!Array.isArray(body.sources)||!Array.isArray(body.trace))throw new Error('Unexpected response from the AI service.');
   if(active.current===controller)setResult(body);
  }catch(err){if(active.current===controller)setError(controller.signal.aborted?'Request stopped or timed out. Try retrieval mode if the local model is slow.':err instanceof Error?err.message:'Could not reach the AI service.');}
  finally{clearTimeout(timer);if(active.current===controller){setPending(false);active.current=null;}}
 }
 return <div className="ai-console"><div className="ai-console-bar"><span>✳ &nbsp; PORTFOLIO / RAG WORKFLOW</span><span className="badge">LANGCHAIN + LANGGRAPH</span></div><div className="ai-layout"><div className="ai-controls"><p className="ai-health" role="status">{healthText}</p><button className="outline" onClick={()=>void check()}>Check connection</button><div className="ai-examples">{examples.map(q=><button key={q} disabled={pending} onClick={()=>setQuestion(q)}>{q} ↗</button>)}</div><form onSubmit={submit}><label htmlFor="assistant-mode">Execution mode</label><select id="assistant-mode" value={mode} disabled={pending} onChange={e=>{setMode(e.target.value as 'model'|'retrieval');setResult(null);setError('');}}><option value="model">Generate with local model</option><option value="retrieval">LangGraph retrieval only · no model call</option></select><label htmlFor="assistant-question">Ask about my work</label><textarea id="assistant-question" maxLength={600} rows={4} required value={question} disabled={pending} onChange={e=>setQuestion(e.target.value)}/><button className="button" disabled={pending||!question.trim()} type="submit">{pending?'Running workflow…':mode==='model'?'Ask the assistant ↗':'Run retrieval ↗'}</button>{pending&&<button className="outline" type="button" onClick={()=>active.current?.abort()}>Stop waiting</button>}</form><p className="ai-disclosure">{health?.model?`Model: ${health.model}. `:''}The local setup sends your question to your AI service and Ollama. It does not call a paid cloud API. A CPU-only model may take a while.</p><p className="ai-disclosure">Setup instructions are included in AI-START-HERE.md.</p></div><div className="ai-results" aria-busy={pending}><p className="eyebrow">ANSWER / SOURCES / EXECUTION</p>{error&&<p className="notice" role="alert">{error}</p>}{pending&&<p role="status">Running the server workflow. Completed steps and their timings will appear when it returns.</p>}{!result&&!pending&&!error&&<div className="ai-empty"><h3>Evidence before answers.</h3><p>Choose a question to see a generated answer, linked source passages, and the steps LangGraph actually executed.</p><div className="ai-trace"><span>RETRIEVE</span><span>GENERATE OR ABSTAIN</span><span>CHECK REFERENCES</span></div><p className="ai-disclosure">Retrieval uses lexical matching over curated portfolio passages. Citation checks verify source IDs, not the truth of every generated claim. CrewAI is not used in this implementation.</p></div>}{result&&<><p className="ai-query">{lastQuestion}</p><div className="ai-answer" aria-live="polite">{result.claims.length?<ul>{result.claims.map((c,i)=><li key={i}>{c.text} <span>{c.source_ids.map(id=><a key={id} href={`#ai-source-${id}`} className="ai-citation">[{id}]</a>)}</span></li>)}</ul>:<h3>{result.status==='retrieval_only'?'Retrieved evidence':'No answer generated'}</h3>}<p className="ai-disclosure">{result.message}</p></div><details open className="ai-execution"><summary>Executed workflow · {result.trace.length} steps</summary><ol>{result.trace.map(t=><li key={t.node}><strong>{names[t.node]||t.node}</strong><small>{t.duration_ms} ms</small><p>{t.detail}</p></li>)}</ol></details><h3>Source passages</h3>{result.sources.map(s=><article className="evidence-card" id={`ai-source-${s.id}`} key={s.id}><small>{s.id} · Matching terms: {s.matching_terms.join(', ')}</small><h3>{s.title}</h3><p>{s.text}</p></article>)}<details><summary>Inspect the prompt</summary><pre className="ai-prompt">{result.prompt}</pre></details></>}</div></div></div>;
}
