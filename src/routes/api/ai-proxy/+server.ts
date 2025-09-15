// src/routes/api/ai-proxy/+server.ts
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
  // secrets privés
  const ENDPOINT = env.CLOUD_RUN_URL || 'https://activ-ai-536318065020.europe-west1.run.app';     // ex: https://activ-ai-....run.app
  const BEARER   = env.SERVICE_BEARER || 'sRxw1AAUcZ90zMp1JQE99XjorzkHyxjk_9K4Gf-hFGSU_Bs2dQVk4jkXTqZfG6eo';    // même valeur que côté Cloud Run

  const body = await request.text();
  
  console.log('🔄 Proxy API call to:', `${ENDPOINT}/submission`);
  console.log('🔑 Bearer token present:', !!BEARER);

  const res = await fetch(`${ENDPOINT}/submission`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${BEARER}`,
      'Content-Type': 'application/json'
    },
    body
  });

  const text = await res.text();
  
  console.log('📝 Proxy response status:', res.status);
  console.log('📊 Proxy response preview:', text.substring(0, 200) + '...');
  
  return new Response(text, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' }
  });
};