import { useEffect,useRef } from 'react';
import type { Panel } from '../types';
import PanelContent from './PanelContent';
export default function Modal({panel,onClose}:{panel:Panel;onClose:()=>void}){
const ref=useRef<HTMLDialogElement>(null);
useEffect(()=>{const dialog=ref.current!;const previous=document.activeElement as HTMLElement|null;dialog.showModal();const overflow=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{dialog.close();document.body.style.overflow=overflow;previous?.focus();};},[]);
return <dialog ref={ref} aria-labelledby="modal-title" onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onClose();}}}><div className="modal-bar"><small>AV / EXPLORER</small><button className="circle" onClick={onClose} aria-label="Close dialog">×</button></div><div onClick={e=>{if((e.target as HTMLElement).closest('.command-link'))onClose();}}><PanelContent panel={panel}/></div></dialog>;
}
