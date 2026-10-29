// One-shot sync: reads recent messages from the codes channel and updates codes.json.
// Env: DISCORD_TOKEN (bot token), CHANNEL_ID (the channel to read).
import { readFile, writeFile } from "node:fs/promises";
import { parseCodeDrop, mergeCodes } from "./parser.js";

const { DISCORD_TOKEN, CHANNEL_ID } = process.env;
if (!DISCORD_TOKEN || !CHANNEL_ID) throw new Error("Set DISCORD_TOKEN and CHANNEL_ID");

const FILE = new URL("./codes.json", import.meta.url);

const res = await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages?limit=50`, {
  headers: { Authorization: `Bot ${DISCORD_TOKEN}` },
});
if (!res.ok) throw new Error(`Discord returned ${res.status}: ${await res.text()}`);
const messages = (await res.json()).reverse(); // oldest first

let codes = JSON.parse(await readFile(FILE, "utf8").catch(() => "[]"));
for (const m of messages) {
  // Don't skip bot/webhook authors: followed or reposted messages arrive that way.
  const text = m.content || m.embeds?.[0]?.description || "";
  const drop = parseCodeDrop(text, m.timestamp);
  if (drop) codes = mergeCodes(codes, drop);
}
await writeFile(FILE, JSON.stringify(codes, null, 2) + "\n");
console.log(`${codes.length} codes in codes.json`);
