import {spawnSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
const raw=(process.env.API_ORIGIN||'').trim();
let origin='';
if(raw){
 const url=new URL(raw);
 if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash){
  throw new Error('API_ORIGIN must be an HTTPS origin such as https://portfolio-api.onrender.com, with no path or credentials.');
 }
 origin=url.origin;
}
const result=spawnSync('npm',['run','build'],{stdio:'inherit',env:{...process.env,VITE_PUBLIC_SITE:'true',VITE_API_CONNECTED:String(Boolean(origin))}});
if(result.error)throw result.error;
if(result.status!==0)process.exit(result.status??1);
const rules=[];
if(origin)rules.push(`/api/products ${origin}/api/products 200!`, `/api/products/* ${origin}/api/products/:splat 200!`);
rules.push('/* /index.html 200');
writeFileSync('dist/_redirects',rules.join('\n')+'\n');
console.log(origin?'Product API proxy configured.':'Frontend-only deployment: API playground hidden until API_ORIGIN is configured.');
