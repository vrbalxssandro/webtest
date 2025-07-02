export async function onRequest(context) {
    if (context.request.method !== "GET") {
        return new Response("Method not allowed", { status: 405 });
    }

    const { VISITORS_KV } = context.env;
     if (!VISITORS_KV) {
        return new Response("KV Namespace not bound", { status: 500 });
    }
    
    const storedTimestamps = await VISITORS_KV.get("recent_timestamps");
    const timestamps = storedTimestamps ? JSON.parse(storedTimestamps) : [];
    
    return new Response(JSON.stringify(timestamps), {
        headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60'
        },
    });
}