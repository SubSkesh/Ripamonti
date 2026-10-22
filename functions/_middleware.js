// Cloudflare Pages: private client preview.
// The client signs in with the ID and password sent by OC Software, either on the OC Software site
// ("Anteprima clienti" posts to /login) or on the login page served here. A signed cookie then
// unlocks every page. Credentials come from BASIC_AUTH_USER / BASIC_AUTH_PASS; the cookie is signed
// with AUTH_SECRET when set, otherwise with the password, so changing it logs everyone out.
// Every response carries X-Robots-Tag: noindex.

const COOKIE = 'csw_preview';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days
// shown on the login page before signing in
const PUBLIC = [/^\/assets\/fonts\//, /^\/favicon\.ico$/];

const enc = new TextEncoder();

// constant-time comparison, so the response time does not leak how much matched
function safeEqual(a, b) {
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(mac))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function makeToken(user, secret) {
  const payload = `${Math.floor(Date.now() / 1000) + MAX_AGE}.${user}`;
  return `${payload}.${await sign(payload, secret)}`;
}

async function validToken(token, user, secret) {
  if (!token) return false;
  const i = token.lastIndexOf('.');
  if (i < 0) return false;
  const payload = token.slice(0, i);
  const dot = payload.indexOf('.');
  const exp = payload.slice(0, dot);
  const who = payload.slice(dot + 1);
  if (!safeEqual(who || '', user) || !(Number(exp) > Date.now() / 1000)) return false;
  return safeEqual(token.slice(i + 1), await sign(payload, secret));
}

function readCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

function checkCredentials(user, pass, env) {
  // evaluate both comparisons so a wrong ID and a wrong password take the same time
  const u = safeEqual(user || '', env.BASIC_AUTH_USER);
  const p = safeEqual(pass || '', env.BASIC_AUTH_PASS);
  return u && p;
}

// only same-site paths, so /login cannot be used to bounce visitors elsewhere
function safeNext(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

function noindex(response) {
  const out = new Response(response.body, response);
  out.headers.set('X-Robots-Tag', 'noindex');
  return out;
}

function redirect(location, cookie) {
  const headers = { Location: location, 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' };
  if (cookie) headers['Set-Cookie'] = cookie;
  return new Response(null, { status: 303, headers });
}

const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function loginPage(next, error, status = 200) {
  const html = `<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Anteprima riservata</title>
<style>
@font-face{font-family:"Barlow Condensed";font-weight:800;font-display:swap;src:url(/assets/fonts/barlow-condensed-latin-800-normal.woff2) format("woff2")}
@font-face{font-family:"Barlow";font-weight:400;font-display:swap;src:url(/assets/fonts/barlow-latin-400-normal.woff2) format("woff2")}
@font-face{font-family:"Barlow";font-weight:600;font-display:swap;src:url(/assets/fonts/barlow-latin-600-normal.woff2) format("woff2")}
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px 16px;background:radial-gradient(120% 90% at 50% 30%,#3A3F43 0%,#2F3234 45%,#141617 100%);color:#C9CED1;font:400 17px/1.5 Barlow,Arial,sans-serif}
main{width:100%;max-width:400px}
h1{margin:0 0 8px;font:800 44px/.95 "Barlow Condensed","Arial Narrow",sans-serif;text-transform:uppercase;color:#fff}
p{margin:0 0 28px}
label{display:block;font-size:14px;font-weight:600;color:#fff;margin:0 0 6px}
input{width:100%;margin:0 0 18px;padding:12px;font:400 17px Barlow,Arial,sans-serif;color:#fff;background:rgba(255,255,255,.06);border:0;border-bottom:2px solid rgba(255,255,255,.4);border-radius:0}
input:focus{outline:2px solid #fff;outline-offset:2px;border-bottom-color:#fff}
button{min-height:48px;padding:0 30px 0 26px;border:0;cursor:pointer;background:#fff;color:#000;font:600 17px Barlow,Arial,sans-serif;clip-path:polygon(0 0,100% 0,calc(100% - 14px) 100%,0 100%)}
button:hover{background:#E9ECED}
button:focus-visible{outline:2px solid #fff;outline-offset:4px}
.err{margin:0 0 20px;padding:10px 12px;background:rgba(232,160,160,.14);border-bottom:2px solid #E8A0A0;color:#fff;font-size:15px}
small{display:block;margin-top:28px;font-size:13px;color:#8F999F}
</style></head><body><main>
<h1>Anteprima riservata</h1>
<p>Inserisci l’ID e la password che ti abbiamo inviato.</p>
${error ? '<p class="err" role="alert">ID o password non corretti. Controlla e riprova.</p>' : ''}
<form method="post" action="/login">
<input type="hidden" name="next" value="${esc(next)}">
<label for="user">ID</label><input id="user" name="user" autocomplete="username" required autofocus>
<label for="pass">Password</label><input id="pass" name="pass" type="password" autocomplete="current-password" required>
<button type="submit">Entra</button>
</form>
<small>Bozza riservata, realizzata da OC Software.</small>
</main></body></html>`;
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  });
}

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);
  const configured = env.BASIC_AUTH_USER && env.BASIC_AUTH_PASS;
  const secret = env.AUTH_SECRET || env.BASIC_AUTH_PASS || '';

  if (url.pathname === '/login') {
    if (request.method === 'POST') {
      let form;
      try { form = await request.formData(); } catch { form = new FormData(); }
      const target = safeNext(form.get('next'));
      // fail closed: without configured credentials nobody gets in
      if (configured && checkCredentials(form.get('user'), form.get('pass'), env)) {
        const token = await makeToken(env.BASIC_AUTH_USER, secret);
        return redirect(target, `${COOKIE}=${token}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`);
      }
      return redirect(`/login?e=1&next=${encodeURIComponent(target)}`);
    }
    return loginPage(safeNext(url.searchParams.get('next')), url.searchParams.has('e'));
  }

  if (url.pathname === '/logout') {
    return redirect('/login', `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
  }

  if (PUBLIC.some((re) => re.test(url.pathname))) return noindex(await next());

  if (configured && (await validToken(readCookie(request, COOKIE), env.BASIC_AUTH_USER, secret))) {
    return noindex(await next());
  }

  // pages send the visitor to the login page; files (CSS, JS, images, 3D) just get 401
  const wantsPage = request.method === 'GET' && (request.headers.get('Accept') || '').includes('text/html');
  if (wantsPage) return redirect(`/login?next=${encodeURIComponent(url.pathname + url.search)}`);
  return new Response('Accesso riservato.', {
    status: 401,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  });
}
