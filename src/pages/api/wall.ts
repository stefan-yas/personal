import type { APIRoute } from "astro";
import { promises as fs } from "fs";
import path from "path";

// Path to a top-level `data` directory for persistent storage.
const dataDir = path.resolve(process.cwd(), "data");
const wallPath = path.join(dataDir, "wall.json");

// This function ensures the data directory and wall.json file exist.
async function ensureDataFile() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.access(wallPath);
  } catch (error) {
    // If the file doesn't exist, create it with an empty array.
    await fs.writeFile(wallPath, "[]", "utf-8");
  }
}

async function getMessages(): Promise<{ text: string; timestamp: string }[]> {
  await ensureDataFile();
  const fileContent = await fs.readFile(wallPath, "utf-8");
  try {
    return fileContent ? JSON.parse(fileContent) : [];
  } catch (e) {
    console.error("Error parsing wall.json, treating as empty.", e);
    return [];
  }
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

    await fs.writeFile(wallPath, JSON.stringify(messages, null, 2), "utf-8");
    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (error) {
    console.error("POST Error:", error);
    return new Response(JSON.stringify({ error: "Failed to post message" }), {
      status: 500,
    });
  }
};
