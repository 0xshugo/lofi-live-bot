import { google } from 'googleapis';

const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const youtube = google.youtube({ version: 'v3', auth });

async function postTheme() {
  const today = new Date().toISOString().slice(0,10);
  const text = `Today's theme: Lo-fi beats - ${today}`;
  try {
    await youtube.liveChatMessages.insert({
      part: 'snippet',
      requestBody: {
        snippet: {
          liveChatId: process.env.YT_LIVE_CHAT_ID,
          type: 'textMessageEvent',
          textMessageDetails: { messageText: text }
        }
      }
    });
  } catch (e) { console.log(e); }
}

setInterval(() => {
  const now = new Date();
  if (now.getUTCHours() === 15 && now.getUTCMinutes() === 0) { // 00:00 JST
    postTheme();
  }
}, 60000);

process.on('SIGTERM', () => process.exit(0));
