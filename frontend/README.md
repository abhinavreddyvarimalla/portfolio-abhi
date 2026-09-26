# Portfolio frontend — connected edition

See ../README.md for complete Windows and Docker instructions.

Run `npm.cmd ci` then `npm.cmd run dev`. Spring Boot must be running on localhost:8080; Vite forwards /api requests to it. The frontend runs on localhost:5173.

The approved React design and résumé content are unchanged. The playground now uses src/services/productApi.ts and persists successful creations through the backend. Its loading, cancellation, timeout, and connection-error states never silently use simulated data. The original simulator is retained only for unit tests and endpoint metadata.

Run `npm.cmd test` for tests and `npm.cmd run build` for type checking and the production bundle. A production host must forward /api to the backend; a static upload alone will not supply an API.

No deployment, authentication, admin UI, or GitHub push has been performed.
