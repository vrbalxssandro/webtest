/**
 * Handles GET requests to read all comments.
 */
async function handleGet(context) {
    // `COMMENTS_KV` is the name of our database, which we "bind" in the Cloudflare dashboard.
    const { COMMENTS_KV } = context.env;
    
    // Get the raw value from the KV store using the key "all_comments".
    const data = await COMMENTS_KV.get("all_comments");
    
    // If there's no data (e.g., first visit ever), return an empty array.
    const comments = data ? JSON.parse(data) : [];
    
    // Return the comments as a JSON response.
    return new Response(JSON.stringify(comments), {
        headers: { 'Content-Type': 'application/json' },
    });
}

/**
 * Handles POST requests to add a new comment.
 */
async function handlePost(context) {
    const { COMMENTS_KV } = context.env;
    
    // Read the incoming comment data from the request body.
    // Use a try-catch block for robust error handling if the body isn't valid JSON.
    let newComment;
    try {
        newComment = await context.request.json();
    } catch (e) {
        return new Response('Invalid JSON in request body', { status: 400 });
    }

    // Basic validation to ensure required fields are present.
    if (!newComment || !newComment.username || !newComment.message) {
        return new Response('Missing username or message in request body', { status: 400 });
    }

    // Add a server-side timestamp for accuracy and security.
    newComment.timestamp = new Date().toISOString();
    
    // Fetch the existing comments.
    const storedData = await COMMENTS_KV.get("all_comments");
    const comments = storedData ? JSON.parse(storedData) : [];
    
    // Add the new comment to the top of the array.
    comments.unshift(newComment);
    
    // Save the entire updated array back into the KV store.
    await COMMENTS_KV.put("all_comments", JSON.stringify(comments));
    
    // Return a success response.
    return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
    });
}

/**
 * The main handler that routes requests based on their method (GET or POST).
 * This is the entry point for all requests to /api/comments.
 */
export async function onRequest(context) {
    switch (context.request.method) {
        case "GET":
            return await handleGet(context);
        case "POST":
            return await handlePost(context);
        default:
            // For any other method (PUT, DELETE, etc.), return an error.
            return new Response("Method not allowed", { status: 405 });
    }
}