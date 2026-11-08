const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };
const CATEGORY_LABELS = {
  algorithms: 'Algorithms',
  android: 'Android & AAOS',
  automotive: 'Automotive',
  'embedded-linux': 'Embedded Linux',
  'system-design': 'System Design',
  leadership: 'Leadership',
  robotics: 'Robotics',
  research: 'Research & AI',
  general: 'General'
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...extraHeaders } });
}
function corsHeaders(origin) {
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'Authorization, Content-Type',
    'access-control-max-age': '86400',
    'vary': 'Origin'
  };
}
function base64url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function decodeBase64url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(normalized + '='.repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
async function signSession(userId, login, secret) {
  const header = base64url(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const payload = base64url(new TextEncoder().encode(JSON.stringify({ sub: String(userId), login, exp: Math.floor(Date.now() / 1000) + 3600 })));
  const data = header + '.' + payload;
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), new TextEncoder().encode(data));
  return data + '.' + base64url(new Uint8Array(signature));
}
async function verifySession(request, env) {
  const authorization = request.headers.get('authorization') || '';
  if (!authorization.startsWith('Bearer ')) return null;
  const token = authorization.slice(7);
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const data = parts[0] + '.' + parts[1];
  const valid = await crypto.subtle.verify('HMAC', await hmacKey(env.SESSION_SECRET), decodeBase64url(parts[2]), new TextEncoder().encode(data));
  if (!valid) return null;
  let payload;
  try { payload = JSON.parse(new TextDecoder().decode(decodeBase64url(parts[1]))); } catch { return null; }
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  if (String(payload.sub) !== String(env.GITHUB_ALLOWED_USER_ID)) return null;
  return payload;
}
function randomState() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return base64url(bytes);
}
function safeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}
function slugify(value) {
  return value.normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}
function yamlString(value) {
  return JSON.stringify(String(value ?? '').trim());
}
function utf8ToBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}
function decodeGitHubContent(value) {
  const binary = atob(value.replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
async function githubRequest(env, path, options = {}) {
  return fetch('https://api.github.com/repos/' + env.GITHUB_REPO + '/contents/' + path, {
    ...options,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: 'Bearer ' + env.GITHUB_CONTENTS_TOKEN,
      'x-github-api-version': '2022-11-28',
      'user-agent': 'private-knowledge-hub-authoring',
      ...(options.headers || {})
    }
  });
}
async function appendToNotesIndex(env, category, title, slug, description) {
  const indexPath = 'src/content/docs/articles/notes/index.md';
  const response = await githubRequest(env, indexPath);
  if (!response.ok) throw new Error('Could not read the notes index (' + response.status + ').');
  const file = await response.json();
  let content = decodeGitHubContent(file.content);
  const heading = '## ' + CATEGORY_LABELS[category];
  const entry = '- [' + title.replace(/[\[\]]/g, '') + '](/articles/notes/' + category + '/' + slug + '/) — ' + description.replace(/[\r\n]/g, ' ');
  const headingIndex = content.indexOf(heading);
  if (headingIndex < 0) {
    content += '\n' + heading + '\n\n' + entry + '\n';
  } else {
    const afterHeading = headingIndex + heading.length;
    const nextHeading = content.indexOf('\n## ', afterHeading);
    const insertion = nextHeading < 0 ? content.length : nextHeading;
    content = content.slice(0, insertion).replace(/\s*$/, '\n') + entry + '\n' + content.slice(insertion);
  }
  const update = await githubRequest(env, indexPath, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      message: 'Add article to notes index: ' + title,
      content: utf8ToBase64(content),
      sha: file.sha,
      branch: 'main'
    })
  });
  if (!update.ok) throw new Error('Article was created, but the notes index update failed (' + update.status + ').');
}
async function handle(request, env) {
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  if (request.method === 'OPTIONS') {
    if (origin !== env.SITE_ORIGIN) return new Response(null, { status: 403 });
    return new Response(null, { status: 204, headers: corsHeaders(env.SITE_ORIGIN) });
  }

  if (url.pathname === '/auth/login' && request.method === 'GET') {
    const state = randomState();
    const callback = url.origin + '/auth/callback';
    const authorize = new URL('https://github.com/login/oauth/authorize');
    authorize.searchParams.set('client_id', env.GITHUB_OAUTH_CLIENT_ID);
    authorize.searchParams.set('redirect_uri', callback);
    authorize.searchParams.set('scope', 'read:user');
    authorize.searchParams.set('state', state);
    return new Response(null, {
      status: 302,
      headers: {
        location: authorize.toString(),
        'set-cookie': 'oauth_state=' + state + '; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600'
      }
    });
  }

  if (url.pathname === '/auth/callback' && request.method === 'GET') {
    const stateCookie = request.headers.get('cookie') || '';
    const stateMatch = stateCookie.match(/(?:^|;\s*)oauth_state=([^;]+)/);
    const expectedState = stateMatch?.[1] || '';
    const receivedState = url.searchParams.get('state') || '';
    const clearCookie = 'oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0';
    if (!safeEqual(expectedState, receivedState)) return new Response('OAuth state validation failed. Please restart login.', { status: 400, headers: { 'set-cookie': clearCookie } });
    const code = url.searchParams.get('code');
    if (!code) return new Response('GitHub did not return an authorization code.', { status: 400, headers: { 'set-cookie': clearCookie } });

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ client_id: env.GITHUB_OAUTH_CLIENT_ID, client_secret: env.GITHUB_OAUTH_CLIENT_SECRET, code })
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) return new Response('GitHub authentication failed.', { status: 401, headers: { 'set-cookie': clearCookie } });

    const userResponse = await fetch('https://api.github.com/user', {
      headers: { authorization: 'Bearer ' + tokenData.access_token, accept: 'application/vnd.github+json', 'user-agent': 'private-knowledge-hub-authoring' }
    });
    const user = await userResponse.json();
    if (!userResponse.ok || String(user.id) !== String(env.GITHUB_ALLOWED_USER_ID)) {
      return new Response('This GitHub account is not authorized to publish on this site.', { status: 403, headers: { 'set-cookie': clearCookie } });
    }
    const session = await signSession(user.id, user.login, env.SESSION_SECRET);
    return new Response(null, {
      status: 302,
      headers: {
        location: env.SITE_ORIGIN + '/author/#token=' + encodeURIComponent(session),
        'set-cookie': clearCookie,
        'cache-control': 'no-store'
      }
    });
  }

  if (origin && origin !== env.SITE_ORIGIN) return json({ error: 'Origin not allowed.' }, 403);
  const cors = corsHeaders(env.SITE_ORIGIN);

  if (url.pathname === '/api/me' && request.method === 'GET') {
    const session = await verifySession(request, env);
    if (!session) return json({ error: 'Unauthorized. Please sign in again.' }, 401, cors);
    return json({ user: { id: session.sub, login: session.login } }, 200, cors);
  }

  if (url.pathname === '/api/articles' && request.method === 'POST') {
    const session = await verifySession(request, env);
    if (!session) return json({ error: 'Unauthorized. Please sign in again.' }, 401, cors);
    let input;
    try { input = await request.json(); } catch { return json({ error: 'Invalid JSON body.' }, 400, cors); }
    const title = String(input.title || '').trim();
    const description = String(input.description || '').trim();
    const body = String(input.body || '').trim();
    const category = String(input.category || '');
    const tags = Array.isArray(input.tags) ? input.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 12) : [];
    if (!title || title.length > 160 || !description || description.length > 300 || !body || body.length > 100000) return json({ error: 'Please provide a title, description and article body within the size limits.' }, 400, cors);
    if (!Object.hasOwn(CATEGORY_LABELS, category)) return json({ error: 'Unknown article category.' }, 400, cors);
    const slug = slugify(title);
    if (!slug) return json({ error: 'The title must contain at least one letter or number.' }, 400, cors);
    const path = 'src/content/docs/articles/notes/' + category + '/' + slug + '.md';
    const existing = await githubRequest(env, path);
    if (existing.status !== 404) return json({ error: existing.ok ? 'An article with this slug already exists.' : 'Could not check whether this article already exists.' }, existing.ok ? 409 : 502, cors);

    const frontmatter = [
      '---',
      'title: ' + yamlString(title),
      'description: ' + yamlString(description),
      'sidebar:',
      '  order: 100',
      '  label: ' + yamlString(title),
      'tags: ' + JSON.stringify(tags),
      '---',
      '',
      body,
      ''
    ].join('\n');
    const create = await githubRequest(env, path, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'Publish article: ' + title, content: utf8ToBase64(frontmatter), branch: 'main' })
    });
    if (!create.ok) {
      const details = await create.json().catch(() => ({}));
      return json({ error: details.message || 'GitHub could not create the article.' }, create.status, cors);
    }
    try {
      await appendToNotesIndex(env, category, title, slug, description);
    } catch (error) {
      return json({ ok: true, warning: error.message, path, url: env.SITE_ORIGIN + '/articles/notes/' + category + '/' + slug + '/' }, 202, cors);
    }
    return json({ ok: true, path, url: env.SITE_ORIGIN + '/articles/notes/' + category + '/' + slug + '/' }, 201, cors);
  }

  return json({ error: 'Not found.' }, 404, cors);
}

export default {
  async fetch(request, env) {
    try {
      return await handle(request, env);
    } catch (error) {
      return json({ error: 'Server error: ' + (error?.message || 'unknown failure') }, 500);
    }
  }
};
