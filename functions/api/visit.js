export async function onRequest(context) {
    if (context.request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
    }

    const { VISITORS_KV } = context.env;
    if (!VISITORS_KV) return new Response("KV Namespace not bound", { status: 500 });
    
    const country = context.request.cf.country;
    const now = new Date().toISOString();

    const storedCountries = await VISITORS_KV.get("country_visits");
    const storedTimestamps = await VISITORS_KV.get("recent_timestamps");

    const countryData = storedCountries ? JSON.parse(storedCountries) : {};
    const timestamps = storedTimestamps ? JSON.parse(storedTimestamps) : [];

    if (country) {
        countryData[country] = (countryData[country] || 0) + 1;
    }

    timestamps.push(now);
    const trimmedTimestamps = timestamps.slice(-200);

    await VISITORS_KV.put("country_visits", JSON.stringify(countryData));
    await VISITORS_KV.put("recent_timestamps", JSON.stringify(trimmedTimestamps));

    return new Response("Visit logged", { status: 200 });
}