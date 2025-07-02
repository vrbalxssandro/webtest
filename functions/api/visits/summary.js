export async function onRequest(context) {
    if (context.request.method !== "GET") {
        return new Response("Method not allowed", { status: 405 });
    }

    // VISITORS_KV must be bound in the Cloudflare dashboard
    const { VISITORS_KV } = context.env;
     if (!VISITORS_KV) {
        return new Response("KV Namespace not bound", { status: 500 });
    }
    
    const storedData = await VISITORS_KV.get("country_visits");
    const visitData = storedData ? JSON.parse(storedData) : {};
    
    return new Response(JSON.stringify(visitData), {
        headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60' // Cache for 1 minute
        },
    });
}