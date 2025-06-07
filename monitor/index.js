import { google } from 'googleapis';
import { Queue } from 'bullmq';

const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const youtube = google.youtube({ version: 'v3', auth });
const queue = new Queue('music', { connection: { host: 'redis', port: 6379 } });

const commands = ['!lofi_jazz','!phonk_lofi','!vaporwave','!chillhop','!ambient_lofi','!citypop_lofi'];

async function poll() {
  try {
    const res = await youtube.liveChatMessages.list({
      liveChatId: process.env.YT_LIVE_CHAT_ID,
      part: 'snippet,authorDetails'
    });
    const msgs = res.data.items || [];
    for (const m of msgs) {
      const amount = m.snippet?.superChatDetails?.amountMicros / 1e6 || 0;
      const text = m.snippet?.textMessageDetails?.messageText || '';
      if (commands.includes(text) && amount >= 200) {
        if (await queue.count() < 5) {
          await queue.add('music', { style: text.substring(1) });
        } else {
          console.log('Queue full');
        }
      } else if (text === '!skip' && amount >= 1000) {
        await queue.drain();
      }
    }
  } catch (e) {
    console.log(e);
  }
}

setInterval(poll, Number(process.env.POLL_INTERVAL || 5000));

process.on('SIGTERM', async () => {
  await queue.close();
  process.exit(0);
});
