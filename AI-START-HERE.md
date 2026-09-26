# Portfolio AI: LangChain + LangGraph

This edition implements a real framework workflow, with a local Ollama model option. No API key or paid model subscription is needed for local inference. Model download, RAM and CPU usage depend on your laptop. A hosted website cannot access the Ollama model running on your laptop.

## Update your working Windows project

1. Stop the frontend terminal with Ctrl+C.
2. Back up any edits you made to the project.
3. From this ZIP, copy **frontend**, **ai-service**, **compose.yaml**, and this guide into your existing project folder. Replace the matching source files. The backend source is unchanged. Keep using the same project folder name so Docker Compose selects your existing database volume.
4. Copy the updated `.github` folder if you want CI to test the Python service too.
5. Open Docker Desktop and wait for its engine to run.

From the root folder containing compose.yaml:

```powershell
docker compose --profile ai up --build -d
docker compose exec ollama ollama pull llama3.2:3b
```

The first command starts the original API/database plus the new Python AI service and Ollama. The second downloads the model once into a named volume. No separate Python or Ollama Windows installation is required with this Docker setup. The default container runs the model on CPU; GPU acceleration is not configured.

Then, in the frontend folder:

```powershell
npm.cmd install
npm.cmd run dev
```

Open the printed localhost URL, choose **AI lab**, then **Check connection**. Select a sample question and click **Ask the assistant**. The first model response may be slow while the model loads. If the laptop runs out of memory or inference times out, use retrieval-only mode.

## Three honest execution modes

- **LangGraph assistant / Generate with local model**: Python service retrieves sources using a LangChain retriever, sends a grounded prompt to ChatOllama, parses a structured response, and checks reference IDs through LangGraph nodes.
- **LangGraph assistant / Retrieval only**: executes the Python LangGraph retrieval and preview nodes without calling a model. Useful before downloading the model.
- **Browser-only retrieval demo**: the earlier five-passage keyword demo, working entirely in React. This does not execute Python, LangChain, LangGraph or a model.

Failures never silently turn into simulated generated answers. The trace shows completed server nodes with measured timings after the request returns, not a live stream or the model's private reasoning.

## Architecture

React calls `/api/ai/*`. Vite proxies that path to the FastAPI service on localhost:8001. Other `/api/*` calls still go to Spring Boot on localhost:8080. FastAPI reaches Ollama over Docker's internal network. Ollama has no published host port. PostgreSQL remains used by the product API, not the AI assistant.

LangGraph routes:

- retrieve → generate → check_references → end
- retrieve → abstain → end, when nothing matches
- retrieve → preview → end, in retrieval-only mode

LangChain provides Document, BaseRetriever, ChatPromptTemplate, runnable composition, ChatOllama, and structured output. This is a bounded workflow, not a tool-using autonomous agent or multi-agent team. CrewAI, embeddings, a vector database, persistent chat memory, and web browsing are not implemented.

`ai-service/corpus.json` is the curated source of truth for the server assistant. Ranking uses weighted lexical overlap, favoring topic keywords and passage titles. It is not semantic vector search. Keyword retrieval can miss paraphrases and retrieve irrelevant passages.

Generated claims contain source IDs. Invalid IDs cause the entire answer to be withheld. A valid ID only confirms that the source was retrieved; it does NOT prove that a claim follows from the text. Inspect sources before relying on an answer. The model can still hallucinate, follow adversarial questions, or abstain unnecessarily. Do not advertise factual accuracy without a separate evaluation.

## Troubleshooting

```powershell
docker compose --profile ai ps
docker compose logs --tail 60 ai
docker compose logs --tail 60 ollama
docker compose exec ollama ollama list
```

- Model unavailable: ensure the pull command completed and `llama3.2:3b` appears in the list; check the connection again.
- AI service unavailable: inspect the ai container logs, then retry `docker compose --profile ai up --build -d`.
- All API calls returning the wrong response: restart Vite after copying the new vite.config.ts. The `/api/ai` route must appear before `/api`.
- Timeout or memory pressure: use retrieval-only mode. You may optionally pull `llama3.2:1b`, set `OLLAMA_MODEL=llama3.2:1b` in a root `.env`, then recreate the ai service. Smaller models can produce poorer answers.
- 429: there are two execution slots and a limit of ten questions per client per minute. Behind the local proxy, all visitors may share one rate bucket.
- Stop waiting cancels the browser request; model execution may continue until completion or the server timeout.

To stop the containers without deleting data or downloaded models:

```powershell
docker compose --profile ai stop
```

Do not use `down -v` unless you intend to delete the named database and model volumes.

## Tests and verification

For contributors running Python 3.12 locally:

```powershell
cd ai-service
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m pytest -q
```

`requirements.txt` locks the dependency versions used by the verified test environment. `requirements.in` documents intended direct dependency ranges. GitHub Actions runs the Python tests without downloading an LLM. Those tests exercise real LangGraph routing with controlled model doubles; they do not measure model accuracy.

The service has question/body limits, model timeouts and in-process concurrency/rate limits. These are local demo protections. It has no authentication, shared distributed limiter or public quota system.

## Deploying later

Keep the browser-only demo available when publishing the static frontend. Vite's development proxy is not a Netlify production proxy. Hosting generated answers requires a reachable Python service, model runtime, production API routing, authentication/abuse controls and a compute budget. This local Ollama setup is NOT a promise that a small free cloud instance can host the model. No cloud service or paid account has been created.

## References

- https://reference.langchain.com/python/langchain-ollama/chat_models/ChatOllama/with_structured_output
- https://reference.langchain.com/python/langgraph/graph/state/StateGraph
- https://docs.ollama.com/docker
- https://ollama.com/library/llama3.2
