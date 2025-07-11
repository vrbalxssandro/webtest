export async function onRequest(context) {
    if (context.request.method !== "GET") {
        return new Response("Method not allowed", { status: 405 });
    }

    const { VISITORS_KV } = context.env;
     if (!VISITORS_KV) {
        return new Response("KV Namespace not bound", { status: 500 });
    }
    
    const storedData = await VISITORS_KV.get("country_visits");
    const countryData = storedData ? JSON.parse(storedData) : {};
    
    const totalVisits = Object.values(countryData).reduce((sum, count) => sum + count, 0);

    const responsePayload = {
        total_visits: totalVisits,
        countries: countryData
    };

    return new Response(JSON.stringify(responsePayload), {
        headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60'
        },
    });
}