import type { VercelRequest, VercelResponse } from '@vercel/node';

const BACKEND_URL = 'https://entrenar-backend.railway.app';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://entrenar.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Obtener el path del query parameter
    const path = req.query.path;
    if (!path || typeof path !== 'string') {
      return res.status(400).json({ error: 'Path parameter is required' });
    }

    // Construir la URL del backend
    const backendUrl = `${BACKEND_URL}/api/${path}`;
    
    console.log(`Proxying request to: ${backendUrl}`);

    // Preparar headers básicos
    const headers: Record<string, string> = {};

    // Copiar headers importantes
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    // Preparar body para métodos que no sean GET
    let body: string | undefined;
    if (req.method !== 'GET' && req.body) {
      body = JSON.stringify(req.body);
      headers['Content-Type'] = 'application/json';
    }

    // Hacer la petición al backend
    const response = await fetch(backendUrl, {
      method: req.method,
      headers,
      body,
    });

    console.log(`Backend response status: ${response.status}`);

    // Obtener el contenido de la respuesta
    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Devolver la respuesta
    res.status(response.status).json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    
    // Devolver un error más informativo
    res.status(500).json({ 
      error: 'Proxy error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
