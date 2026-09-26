import { defineConfig } from 'vite';
const proxy = {
  '/api/ai': { target: 'http://127.0.0.1:8001', changeOrigin: true, timeout: 120000, proxyTimeout: 120000 },
  '/api': { target: 'http://127.0.0.1:8080', changeOrigin: true },
};
export default defineConfig({base:'./',server:{host:'127.0.0.1',port:5173,strictPort:true,proxy},preview:{host:'127.0.0.1',port:5173,strictPort:true,proxy}});
