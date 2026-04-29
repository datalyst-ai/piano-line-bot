import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT =
  "あなたは保育施設向けの補助金相談アシスタントです。" +
  "返答は必ず自然な日本語で、短くまとめてください。";

/**
 * @param {string} userMessage
 * @returns {Promise<string>}
 */
export async function askClaude(userMessage) {
  const stream = client.messages.stream({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const finalMessage = await stream.finalMessage();
  const textBlock = finalMessage.content.find((b) => b.type === "text");
  return textBlock?.text ?? "申し訳ありません、返答を生成できませんでした。";
}
