import { messagingApi } from "@line/bot-sdk";

const lineClient = new messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});

/**
 * @param {string} replyToken
 * @param {string} text
 */
export async function replyText(replyToken, text) {
  await lineClient.replyMessage({
    replyToken,
    messages: [{ type: "text", text }],
  });
}
