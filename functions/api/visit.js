/**
 * Cloudflare Pages Function to handle visit logging for the main homepage.
 *
 * This function is GDPR-compliant and operates based on user consent. It:
 * 1. Receives an optional username from the frontend.
 * 2. Gets the user's country from Cloudflare's request object.
 * 3. Updates an aggregate object of country visit counts.
 * 4. Updates a list of recent visit timestamps for the activity chart.
 * 5. Creates a new, individual log entry for each consented visit, including the timestamp,
 *    country, and optional username.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // Be more specific in production, e.g., 'https://yourdomain.com'
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// This function handles the actual POST request with the visit data.
export async function onRequestPost(context) {
    const { request, env } = context;
    // Ensure your KV Namespace is bound as 'VISITORS_KV' in the Pages project settings.
    const { VISITORS_KV } = env;

    if (!VISITORS_KV) {
        return new Response("KV Namespace not configured", { status: 500 });
    }

    try {
        const data = await request.json();
        const username = data.username || null; // Capture the optional username from the request body.
        const country = request.cf?.country || 'Unknown'; // Get country from Cloudflare request headers.
        const now = new Date();
        const timestamp = now.toISOString();

        // --- 1. Fetch existing aggregate data from KV ---
        const storedCountriesPromise = VISITORS_KV.get("country_visits", { type: "json" });
        const storedTimestampsPromise = VISITORS_KV.get("recent_timestamps", { type: "json" });

        const [countryData, timestamps] = await Promise.all([
            storedCountriesPromise,
            storedTimestampsPromise
        ]);
        
        const currentCountryData = countryData || {};
        const currentTimestamps = timestamps || [];

        // --- 2. Update the aggregate data ---
        // Update country counts
        currentCountryData[country] = (currentCountryData[country] || 0) + 1;

        // Add new timestamp for the activity chart and keep the list at a max of 200 entries.
        currentTimestamps.push(timestamp);
        const trimmedTimestamps = currentTimestamps.slice(-200);

        // --- 3. Create the new individual visit log ---
        const visitLog = {
            timestamp,
            country,
            // Only include the username key in the log if it was actually provided.
            ...(username && { username }),
        };
        const visitKey = `visit_${timestamp}_${Math.random().toString(36).substr(2, 5)}`;


        // --- 4. Write all updates back to KV ---
        // Use waitUntil to perform these writes without making the user wait for the response.
        context.waitUntil(
          Promise.all([
            VISITORS_KV.put("country_visits", JSON.stringify(currentCountryData)),
            VISITORS_KV.put("recent_timestamps", JSON.stringify(trimmedTimestamps)),
            VISITORS_KV.put(visitKey, JSON.stringify(visitLog)),
          ])
        );

        // --- 5. Respond with success ---
        return new Response(JSON.stringify({ success: true }), {
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Visit logging error:', error);
        return new Response(JSON.stringify({ success: false, error: 'Could not process visit.' }), {
            status: 500,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
    }
}

// This function handles CORS preflight (OPTIONS) requests.
export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: { ...CORS_HEADERS, 'Access-Control-Max-Age': '86400' }, // Cache preflight for 1 day
  });
}