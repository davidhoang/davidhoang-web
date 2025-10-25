// Simple auth endpoint for public commenting
// This allows anonymous users to comment with optional names

export async function GET() {
  // For public commenting, we'll generate a simple user object
  const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
  
  return new Response(
    JSON.stringify({
      user: {
        id: userId,
        name: `Anonymous User ${userId.slice(-4)}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
      },
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
