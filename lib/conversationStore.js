import { kv } from "@vercel/kv";

// 会話履歴の保持期間（24時間）
const TTL_SECONDS = 60 * 60 * 24;

// トークンあふれ防止のため直近20メッセージ（10往復）を上限とする
const MAX_MESSAGES = 20;

/**
 * userId に紐づく会話履歴を取得する。
 * @param {string} userId
 * @returns {Promise<Array<{role: string, content: string}>>}
 */
export async function getHistory(userId) {
  return (await kv.get(`history:${userId}`)) ?? [];
}

/**
 * ユーザー発言とアシスタント返答を履歴に追記する。
 * @param {string} userId
 * @param {string} userMessage
 * @param {string} assistantMessage
 */
export async function appendHistory(userId, userMessage, assistantMessage) {
  const history = await getHistory(userId);
  history.push({ role: "user", content: userMessage });
  history.push({ role: "assistant", content: assistantMessage });
  const trimmed = history.slice(-MAX_MESSAGES);
  await kv.set(`history:${userId}`, trimmed, { ex: TTL_SECONDS });
}

/**
 * userId の会話履歴をリセットする（再開・テスト用）。
 * @param {string} userId
 */
export async function clearHistory(userId) {
  await kv.del(`history:${userId}`);
}
