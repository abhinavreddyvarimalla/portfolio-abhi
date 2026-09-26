import { useState, useEffect } from 'react';
import type { Panel } from './types';
import { Header, Hero, EngineeringFocus, Toolkit, Experience, About, Contact, Footer } from './components/Sections';
import Projects from './components/Projects';
import AiPlayground from './components/AiStudio';
import Playground from './components/Playground';
import Modal from './components/Modal';
export default function App(){
const [panel,setPanel]=useState<Panel|null>(null);
useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setPanel(p=>p?null:'commands');}};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);},[]);
return <><a className="skip-link" href="#main">Skip to content</a><Header onOpen={setPanel}/><main id="main"><Hero onOpen={setPanel}/><Toolkit/><EngineeringFocus onOpen={setPanel}/><Projects onOpen={setPanel}/><AiPlayground/><Playground/><Experience/><About onOpen={setPanel}/><Contact onOpen={setPanel}/></main><Footer/>{panel&&<Modal panel={panel} onClose={()=>setPanel(null)}/>}</>;
}
