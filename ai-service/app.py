import asyncio
import os
from collections import defaultdict, deque
from time import monotonic
from typing import Literal

import httpx
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field, field_validator

from workflow import build_graph, model_chain

OLLAMA_URL = os.getenv('OLLAMA_BASE_URL', 'http://127.0.0.1:11434')
MODEL = os.getenv('OLLAMA_MODEL', 'llama3.2:3b')
app = FastAPI(title='Portfolio AI · LangChain + LangGraph', docs_url=None, redoc_url=None)
graph = build_graph(model_chain(OLLAMA_URL, MODEL))
slots = asyncio.Semaphore(2)
requests_by_client: dict[str, deque] = defaultdict(deque)


class Question(BaseModel):
    question: str = Field(min_length=1, max_length=600)
    limit: int = Field(default=3, ge=1, le=4)
    mode: Literal['model', 'retrieval'] = 'model'

    @field_validator('question')
    @classmethod
    def non_blank(cls, value):
        if not value.strip():
            raise ValueError('Question must not be blank')
        return value.strip()


@app.middleware('http')
async def limit_body(request: Request, call_next):
    # Read at most 8 KiB before JSON parsing, including chunked requests.
    if request.method == 'POST':
        body = bytearray()
        async for chunk in request.stream():
            body.extend(chunk)
            if len(body) > 8192:
                from fastapi.responses import JSONResponse
                return JSONResponse({'detail': 'Request too large.'}, status_code=413)
        request._body = bytes(body)
    return await call_next(request)


@app.get('/api/ai/status')
async def status():
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            response = await client.get(OLLAMA_URL + '/api/tags')
            response.raise_for_status()
            names = {m['name'] for m in response.json().get('models', [])}
        ready = MODEL in names
    except (httpx.HTTPError, ValueError, KeyError):
        ready = False
    return {'model': MODEL, 'ready': ready, 'retrieval_ready': True,
            'frameworks': ['LangChain', 'LangGraph'], 'provider': 'Ollama'}


@app.post('/api/ai/ask')
async def ask(body: Question, request: Request):
    now = monotonic()
    # Single-process local demo limiter; never trust arbitrary X-Forwarded-For.
    for key in list(requests_by_client):
        if not requests_by_client[key] or now - requests_by_client[key][-1] >= 60:
            del requests_by_client[key]
    key = request.client.host if request.client else 'unknown'
    history = requests_by_client[key]
    while history and now-history[0] >= 60:
        history.popleft()
    if len(history) >= 10:
        raise HTTPException(429, 'Too many questions. Wait a minute and retry.')
    history.append(now)
    try:
        await asyncio.wait_for(slots.acquire(), timeout=0.2)
    except TimeoutError:
        raise HTTPException(429, 'The assistant is busy. Please retry shortly.')
    try:
        result = await asyncio.wait_for(graph.ainvoke({**body.model_dump(), 'trace': []}), timeout=100)
        return {'status': result['status'], 'message': result['message'], 'claims': result['claims'],
                'sources': [{'id': d.metadata['id'], 'title': d.metadata['title'], 'text': d.page_content,
                             'matching_terms': d.metadata['matching_terms']} for d in result['documents']],
                'trace': result['trace'], 'prompt': result['prompt'], 'model': MODEL if body.mode == 'model' else None}
    except TimeoutError:
        raise HTTPException(504, 'The model took too long. Try a shorter question or retrieval mode.')
    except Exception:
        # Do not return provider internals, URLs, prompts or tokens to the browser.
        raise HTTPException(503, 'Model unavailable or response invalid. Start Ollama, pull the configured model, or use retrieval mode.')
    finally:
        slots.release()
