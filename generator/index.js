import fs from 'fs';
import { spawnSync } from 'child_process';

let Queue, Worker;

const PIPE_PATH = '/tmp/pipe/audio.pcm';

function generateSine() {
  const samples = 44100;
  const buf = Buffer.alloc(samples * 4);
  for (let i = 0; i < samples; i++) {
    const v = Math.sin(2 * Math.PI * i / 44100 * 440);
    buf.writeInt16LE(Math.floor(v * 32767), i * 2);
    buf.writeInt16LE(Math.floor(v * 32767), samples * 2 + i * 2);
  }
  return buf;
}

async function main() {
  if (process.env.TEST_MODE) {
    process.stdin.resume();
    process.stdin.on('data', () => {
      const b = generateSine();
      process.stdout.write(b);
    });
    return;
  }

  ({ Queue, Worker } = await import('bullmq'));
  if (!fs.existsSync(PIPE_PATH)) {
    spawnSync('mkfifo', ['-m', '666', PIPE_PATH]);
  }

  const connection = { host: 'redis', port: 6379 };
  const worker = new Worker('music', async job => {
    const data = generateSine();
    fs.writeFileSync(PIPE_PATH, data);
  }, { connection });

  process.on('SIGTERM', async () => {
    await worker.close();
    process.exit(0);
  });
}

main().catch(err => { console.error(err); process.exit(1); });
