import type { APIRoute } from 'astro';
import { Liveblocks } from "@liveblocks/node";

// Initialize Liveblocks with your secret key
const liveblocks = new Liveblocks({
  secret: import.meta.env.LIVEBLOCKS_SECRET_KEY || "sk_prod_AYSG44fe_rqa58ry7eAipRHqAS9AxPT82wZLfE0MGHtAYVHpatyZFOuuBxo6adXk",
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, name } = await request.json();
    
    if (!email || !name) {
      return new Response(JSON.stringify({ error: 'Email and name are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate a simple user ID based on email (in production, use a proper user system)
    const userId = email.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Create user metadata
    const userInfo = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=007bff&color=fff&size=40`
    };

    // Create a Liveblocks session
    const session = liveblocks.prepareSession(userId, {
      userInfo: userInfo,
    });

    // Allow access to all rooms (you can restrict this based on your needs)
    session.allow("*", session.FULL_ACCESS);

    // Authorize the session
    const { status, body } = await session.authorize();

    return new Response(JSON.stringify(body), {
      status: status,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('Auth error:', error);
    return new Response(JSON.stringify({ error: 'Authentication failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
};
