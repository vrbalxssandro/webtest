export async function onRequest(context) {
    // This function only responds to POST requests
    if (context.request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
    }

    // VISITORS_KV must be bound in the Cloudflare dashboard
    const { VISITORS_KV } = context.env;
    if (!VISITORS_KV) {
        return new Response("KV Namespace not bound", { status: 500 });
    }
    
    // Get the two-letter country code from the Cloudflare request object
    const country = context.request.cf.country;

    // If for some reason there's no country, do nothing
    if (!country) {
        return new Response("No country data", { status: 200 });
    }

    // Get the current visitor data
    const storedData = await VISITORS_KV.get("country_visits");
    const visitData = storedData ? JSON.parse(storedData) : {};

    // Increment the count for the visitor's country
    visitData[country] = (visitData[country] || 0) + 1;

    // Save the updated data back to the KV store
    await VISITORS_KV.put("country_visits", JSON.stringify(visitData));

    return new Response("Visit logged", { status: 200 });
}