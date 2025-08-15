import type { APIRoute } from "astro";
import { kv } from "@vercel/kv";

interface WallMessage {
  text: string;
  timestamp: string;
}

// A helper to get messages from KV. Returns empty array if none exist.
async function getMessages(): Promise<WallMessage[]> {
  return (await kv.get("messages")) || [];
}

export const GET: APIRoute = async () => {
  const messages = await getMessages();
  return new Response(JSON.stringify(messages), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string" || !message.trim()) {
      return new Response(JSON.stringify({ error: "Invalid message" }), {
        status: 400,
      });
    }

    const messages = await getMessages();

    messages.unshift({
      text: message.trim(),
      timestamp: new Date().toISOString(),
    });

    // Save the updated array back to Vercel KV
    await kv.set("messages", messages);

    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (error) {
    console.error("POST Error:", error);
    return new Response(JSON.stringify({ error: "Failed to post message" }), {
      status: 500,
    });
  }
};
