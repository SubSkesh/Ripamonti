// Cloudflare Pages: protects the whole draft with Basic Auth and keeps it out of search engines.
// Credentials come from the project's environment variables BASIC_AUTH_USER and BASIC_AUTH_PASS.

const REALM = 'Bozza Ripamonti';

function unauthorized() {
  return new Response('Accesso riservato.', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}

// constant-time comparison, so the response time does not leak how much of the password matched
function safeEqual(a, b) {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    diff |= (x[i] || 0) ^ (y[i] || 0);
  }
  return diff === 0;
}

function readCredentials(header) {
  if (!header) return null;
  const [scheme, encoded] = header.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'basic' || !encoded) return null;
  let decoded;
  try {
    decoded = new TextDecoder().decode(Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0)));
  } catch {
    return null;
  }
  const i = decoded.indexOf(':');
  if (i < 0) return null;
  return { user: decoded.slice(0, i), pass: decoded.slice(i + 1) };
}

export async function onRequest({ request, env, next }) {
  const user = env.BASIC_AUTH_USER;
  const pass = env.BASIC_AUTH_PASS;
  // fail closed: without configured credentials nobody gets in
  if (!user || !pass) return unauthorized();

  const creds = readCredentials(request.headers.get('Authorization'));
  // evaluate both comparisons so a wrong user and a wrong password take the same time
  const userOk = creds ? safeEqual(creds.user, user) : false;
  const passOk = creds ? safeEqual(creds.pass, pass) : false;
  if (!userOk || !passOk) return unauthorized();

  const response = await next();
  const out = new Response(response.body, response);
  out.headers.set('X-Robots-Tag', 'noindex');
  return out;
}
