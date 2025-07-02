export async function onRequest(context) {
    // These are secrets you will set in the Cloudflare dashboard.
    const API_KEY = context.env.LASTFM_API_KEY;
    const USERNAME = context.env.LASTFM_USERNAME;

    if (!API_KEY || !USERNAME) {
        return new Response("Last.fm credentials not configured on the server.", { status: 500 });
    }

    const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${USERNAME}&api_key=${API_KEY}&format=json&limit=1`;

    try {
        // Fetch data from the Last.fm API
        const response = await fetch(url, {
            // It's good practice to identify your app in the User-Agent header
            headers: { 'User-Agent': 'MyAwesomeWebsite/1.0 ( mywebsite.com )' }
        });

        if (!response.ok) {
            throw new Error(`Last.fm API responded with status: ${response.status}`);
        }

        const data = await response.json();

        // Return the data to our own frontend
        return new Response(JSON.stringify(data), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=30' // Cache the result for 30 seconds
            },
        });

    } catch (error) {
        console.error("Error fetching from Last.fm API:", error);
        return new Response("Failed to fetch data from Last.fm.", { status: 502 }); // 502 Bad Gateway
    }
}