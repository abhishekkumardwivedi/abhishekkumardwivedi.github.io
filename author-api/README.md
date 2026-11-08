# Private authoring API

This Worker provides GitHub OAuth login and a server-side publishing API for the Astro/Starlight site.

## Security model

- GitHub OAuth authenticates the person signing in.
- The Worker checks the immutable GitHub numeric user ID in `GITHUB_ALLOWED_USER_ID`; other accounts are rejected.
- A short-lived, HMAC-signed one-hour session token is returned to the author page in the URL fragment. The page removes the fragment immediately and keeps the token in session storage; it is never sent as a URL query or referrer.
- Every publishing request is independently authenticated by the Worker.
- The repository write token exists only as a Cloudflare secret and must be a fine-grained token scoped to this one repository with Contents: Read and write. It is never exposed to browser code.
- CORS is restricted to the GitHub Pages origin.

## One-time setup

### 1. Create a GitHub OAuth App

In GitHub: Settings → Developer settings → OAuth Apps → New OAuth App.

- Application name: Personal Knowledge Hub Authoring
- Homepage URL: `https://abhishekkumardwivedi.github.io`
- Authorization callback URL: `https://<your-worker-name>.<your-cloudflare-subdomain>.workers.dev/auth/callback`

Copy the Client ID. Generate a Client Secret.

### 2. Create a fine-grained repository token

Create a fine-grained personal access token restricted to:

- Repository: `abhishekkumardwivedi/abhishekkumardwivedi.github.io`
- Repository permissions: Contents — Read and write
- Metadata — read (automatically granted)

Set an expiry and rotate it periodically.

### 3. Install and configure Wrangler

From this directory:

```sh
npm install --save-dev wrangler
npx wrangler login
```

Set secrets (Wrangler prompts for each value):

```sh
npx wrangler secret put GITHUB_OAUTH_CLIENT_ID
npx wrangler secret put GITHUB_OAUTH_CLIENT_SECRET
npx wrangler secret put GITHUB_CONTENTS_TOKEN
npx wrangler secret put SESSION_SECRET
```

Use a long random value (at least 32 random bytes) for `SESSION_SECRET`.

The allowed GitHub numeric user ID is configured in `wrangler.toml` as `6102130`. This is the repository owner's immutable account ID. The Worker rejects every other GitHub account.

### 4. Deploy the Worker

```sh
npx wrangler deploy
```

Copy the deployed `workers.dev` URL.

### 5. Connect the static author page

Edit `src/config/author.ts` in the site repository and set `AUTHOR_API_BASE` to the deployed Worker URL, for example:

```ts
export const AUTHOR_API_BASE = 'https://private-knowledge-hub-author-api.<your-subdomain>.workers.dev';
```

Commit and push that change to `main`. GitHub Actions will rebuild the static site.

## API

- `GET /auth/login` — starts GitHub OAuth.
- `GET /auth/callback` — validates OAuth state, verifies the numeric GitHub user ID, and redirects back to the author page with a short-lived session.
- `GET /api/me` — returns the authenticated author.
- `POST /api/articles` — creates a new Markdown article and adds it to the notes index.

The Worker intentionally does not expose edit/delete endpoints in this first version. New article slugs are checked for collisions before writing.

## Important deployment note

GitHub Pages remains public and static. The author page is also a static asset, but it reveals no publishing capability without a valid session. The actual authorization check and repository write happen only inside this Worker. Do not place OAuth client secrets, session secrets or the fine-grained repository token in the Astro project.
