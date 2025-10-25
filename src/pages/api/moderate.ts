import type { APIRoute } from 'astro';
import { Liveblocks } from "@liveblocks/node";

// Initialize Liveblocks with your secret key
const liveblocks = new Liveblocks({
  secret: import.meta.env.LIVEBLOCKS_SECRET_KEY || "sk_prod_AYSG44fe_rqa58ry7eAipRHqAS9AxPT82wZLfE0MGHtAYVHpatyZFOuuBxo6adXk",
});

// Simple admin authentication (in production, use proper auth)
const ADMIN_TOKEN = import.meta.env.ADMIN_TOKEN || "admin123";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { action, roomId, threadId, commentId, adminToken, newContent } = await request.json();
    
    // Verify admin access
    if (adminToken !== ADMIN_TOKEN) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let result;

    switch (action) {
      case 'deleteComment':
        if (!commentId) {
          throw new Error('Comment ID is required');
        }
        result = await liveblocks.deleteComment(commentId);
        break;

      case 'editComment':
        if (!commentId || !newContent) {
          throw new Error('Comment ID and new content are required');
        }
        result = await liveblocks.editComment(commentId, {
          body: newContent
        });
        break;

      case 'deleteThread':
        if (!threadId) {
          throw new Error('Thread ID is required');
        }
        result = await liveblocks.deleteThread(threadId);
        break;

      case 'getRoomData':
        if (!roomId) {
          throw new Error('Room ID is required');
        }
        // Get room data including all threads and comments
        result = await liveblocks.getRoom(roomId);
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      result 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Moderation error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Moderation failed' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
