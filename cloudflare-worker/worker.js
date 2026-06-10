// Cloudflare Worker que recibe los datos actualizados desde la app
// y los publica en data.json del repo de GitHub usando la API de contenidos.
//
// Variables de entorno (Settings > Variables and Secrets en Cloudflare):
//   GITHUB_TOKEN    -> Personal Access Token con permiso Contents: Read & write
//                      sobre el repo trading-corto-plazo
//   PUBLISH_SECRET  -> Código secreto que solo conoce la app (lo eliges tú)

const OWNER = 'martineztorrens-ship-it';
const REPO = 'trading-corto-plazo';
const PATH = 'data.json';

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders() });
    }

    const auth = request.headers.get('X-Auth-Token');
    if (!auth || auth !== env.PUBLISH_SECRET) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: corsHeaders()
      });
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'JSON inválido' }), {
        status: 400,
        headers: corsHeaders()
      });
    }

    const ghHeaders = {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'User-Agent': 'trading-cp-worker',
      'Accept': 'application/vnd.github+json'
    };

    // 1. Obtener el SHA actual del archivo
    const getRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`,
      { headers: ghHeaders }
    );
    if (!getRes.ok) {
      const err = await getRes.text();
      return new Response(JSON.stringify({ error: 'No se pudo leer data.json', detail: err }), {
        status: 500,
        headers: corsHeaders()
      });
    }
    const fileInfo = await getRes.json();

    // 2. Subir el nuevo contenido
    const content = JSON.stringify(payload, null, 2);
    const contentBase64 = btoa(unescape(encodeURIComponent(content)));

    const putRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`,
      {
        method: 'PUT',
        headers: { ...ghHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Actualizar datos desde la app (móvil)',
          content: contentBase64,
          sha: fileInfo.sha
        })
      }
    );

    if (!putRes.ok) {
      const err = await putRes.text();
      return new Response(JSON.stringify({ error: 'No se pudo escribir data.json', detail: err }), {
        status: 500,
        headers: corsHeaders()
      });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders() });
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Content-Type': 'application/json'
  };
}
