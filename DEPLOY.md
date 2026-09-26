# First public deployment

This setup hosts the React UI on Netlify, Spring Boot on Render, and PostgreSQL on Neon. Hosted AI inference is not configured: the public site uses the browser-only retrieval demo. Local development still exposes the LangChain/LangGraph assistant normally.

## 1. Upload these production changes to your repository

Upload the updated frontend folder, backend application.yml, root netlify.toml and this guide from the ZIP. Upload source only, not node_modules/dist/target. netlify.toml must be at the repository root. Existing local startup commands still work.

## 2. Create the database

Create a Free project at https://neon.com. Open Connect and obtain a direct PostgreSQL connection's host, database name, user and password. Keep the password private; it goes only into Render environment variables. Use the direct hostname rather than a pooled hostname for this small app and Flyway migration setup.

## 3. Create the backend

At https://render.com, create a Web Service from abhinavreddyvarimalla/portfolio-abhi:

- Runtime: Docker
- Root directory: backend
- Dockerfile path: ./Dockerfile
- Instance: Free (confirm the selected plan before creation)
- Health check path: /actuator/health

Set these environment variables:

| Name | Value |
| --- | --- |
| SERVER_ADDRESS | 0.0.0.0 |
| DB_URL | jdbc:postgresql://YOUR_NEON_HOST:5432/YOUR_DATABASE?sslmode=require |
| DB_USER | Your Neon database user |
| DB_PASSWORD | Your Neon password, entered as a secret |
| JAVA_TOOL_OPTIONS | -XX:MaxRAMPercentage=65.0 |

Replace the placeholder host/database with Neon values. Do not paste a psql shell command or a postgresql:// URL into DB_URL: Spring needs the JDBC prefix. Credentials are separate variables; do not put them into git. Render's PORT variable is supported by the updated application.yml.

Deploy and wait for the health endpoint to return {"status":"UP"}. Save the HTTPS service origin, e.g. https://your-portfolio-api.onrender.com. Free service cold starts can cause an initial API request to time out; wait for it to wake and retry. The sample API permits public product creation; use demonstration data only, and add authentication/rate limits before treating it as a production data service.

## 4. Deploy the frontend

At https://app.netlify.com, add a project from GitHub and select this repository. The root netlify.toml provides:

- Base directory: frontend
- Build command: node scripts/netlify-build.mjs
- Publish directory: dist (relative to the base)

Add a build environment variable API_ORIGIN with the Render HTTPS origin. No /api suffix, credentials, or query parameters. Deploy. The build writes the correct same-origin proxy routes into dist/_redirects; no CORS wildcard is needed.

You can deploy before the backend is ready by leaving API_ORIGIN unset. The public UI will hide the product playground. Add API_ORIGIN and redeploy when Render is ready. A changed environment variable takes effect after a new build.

## 5. Verify

- Open the Netlify URL and test navigation, project filters, resume download, mobile layout and the browser-only AI demo.
- If API_ORIGIN is configured, run List products and Find by ID in the API playground.
- An API error after idle can be the Render cold start; open its health URL, wait, then retry.
- LangGraph model inference remains a local feature. There is no public Ollama endpoint in this deployment.

No hosting accounts or live deployments were created by the assistant. Builds are verified locally; cloud startup still needs verification in your accounts. Read the provider's current free-plan limits before creating resources; don't select paid instances for this first deployment.

References:
- https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/
- https://docs.netlify.com/build/configure-builds/file-based-configuration/
- https://render.com/docs/web-services
- https://render.com/docs/docker
- https://neon.com/docs/connect/connect-from-any-app
