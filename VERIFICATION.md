# Verification for the LangChain / LangGraph edition

Verified in the authoring environment:

- React TypeScript check and Vite production build pass.
- Seven existing frontend tests pass.
- Twenty-one Python tests pass. These exercise the actual LangGraph graph and LangChain retriever, with controlled model doubles for generation. Cases cover ranking examples, no-evidence abstention, explicit retrieval-only mode, citation rejection, model failure, request validation, body size, and rate limiting.
- HTTP smoke check passes through Vite `/api/ai/ask` to FastAPI, returning a real LangChain retrieval result and the LangGraph retrieve/preview trace.
- Compose YAML and port/volume declarations checked statically.

Not verified here:

- Live Ollama model inference and answer quality: no model was downloaded or run in the authoring environment. Run the setup guide on your personal laptop to verify those.
- Docker image builds and multi-container startup: Docker engine unavailable here.
- Browser visual and interaction checks: Playwright browser download failed in this environment. Check desktop/mobile layout after opening the site locally.
- Public deployment: nothing has been pushed or deployed.

Reference validation only checks that citation IDs belong to retrieved documents. It is not a semantic fact-checker or an evaluation of model accuracy.
