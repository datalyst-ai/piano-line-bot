import crypto from "crypto";
import { askClaude } from "../lib/claudeClient.js";
import { replyText } from "../lib/lineClient.js";

export const config = {
  api: { bodyParser: false },
};

const FALLBACK_MESSAGE =
  "現在確認処理が混み合っています。時間をおいてもう一度お試しください。";

  const FOLLOW_MESSAGE =
  "はじめまして！園内ピアノ教室の公式LINEアカウントです。\n\nレッスンに関するお問い合わせ、欠席連絡、体験申込などはこちらからお気軽にメッセージをお送りください。\n\n株式会社ストレイン";

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function verifySignature(rawBody, signature) {
  const secret = process.env.LINE_CHANNEL_SECRET;
  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("base64");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

async function handleMessageEvent(event) {
  if (event.message.type !== "text") return;

  console.log("[log] entered text-message branch");
  const userText = event.message.text;
  console.log("[log] extracted userMessage, length:", userText.length);

  let reply;
  try {
    console.log("[log] about to call Claude");
    reply = await askClaude(userText);
  } catch (err) {
    console.log("[log] Claude call failed:", err.message);
    reply = FALLBACK_MESSAGE;
  }

  console.log("[log] about to call LINE reply");
  await replyText(event.replyToken, reply);
}

async function handleEvent(event) {
  switch (event.type) {
    case "message":
      return handleMessageEvent(event);
    case "follow":
      return replyText(event.replyToken, FOLLOW_MESSAGE);
    default:
      console.log("[log] skipped reason: unhandled event.type:", event.type);
      return;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const rawBody = await getRawBody(req);

  const signature = req.headers["x-line-signature"];
  if (!signature) {
    return res.status(400).json({ error: "Missing X-Line-Signature" });
  }

  try {
    if (!verifySignature(rawBody, signature)) {
      return res.status(401).json({ error: "Invalid signature" });
    }
  } catch {
    return res.status(401).json({ error: "Signature verification failed" });
  }

  const body = JSON.parse(rawBody.toString("utf8"));
  const events = body?.events ?? [];
  console.log("[log] events.length:", events.length);

  await Promise.allSettled(events.map(handleEvent));

  return res.status(200).json({ status: "ok" });
}
