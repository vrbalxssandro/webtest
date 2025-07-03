/**
 * Cloudflare Pages Function to handle visit pings for the Notebook project.
 * This function is mapped to the route /api/notebook/visit
 */

// Handles the actual POST request to log the visit.
export async function onRequestPost(context) {
  try {
    // context.env gives you access to your bindings (e.g., KV namespaces)
    const kv = context.env.NOTEBOOK_ANALYTICS;
    
    // KV.get() returns the value of a key.
    const currentValue = await kv.get('total_visits');
    const count = currentValue ? parseInt(currentValue, 10) : 0;
    
    const newCount = count + 1;

    // context.waitUntil() allows the function to complete after the response is sent.
    // This is perfect for non-critical writes like analytics.
    context.waitUntil(kv.put('total_visits', newCount.toString()));

    const responseBody = JSON.stringify({ success: true, message: 'Visit logged.' });
    
    return new Response(responseBody, {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // Be more specific in production
      },
    });

  } catch (error) {
    console.error('KV Error:', error);
    const errorBody = JSON.stringify({ success: false, error: 'Could not update visit count.' });
    return new Response(errorBody, {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });
  }
}

// Handles CORS preflight requests (OPTIONS method)
export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*', // Be more specific in production
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}