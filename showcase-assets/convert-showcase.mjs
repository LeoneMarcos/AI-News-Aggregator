import { access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const input = path.join(root, 'showcase-assets', 'raw-auto', 'ai-news-aggregator-showcase-raw.webm');
const output = path.join(root, 'showcase-assets', 'ai-news-aggregator-showcase.mp4');
const ffmpeg = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
const ffprobe = process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe';

const run = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0 ? resolve(stdout.trim()) : reject(new Error(`${command} exited ${code}: ${stderr}`)),
    );
  });

await access(input);
await run(ffmpeg, [
  '-y',
  '-i',
  input,
  '-c:v',
  'libx264',
  '-preset',
  'medium',
  '-crf',
  '22',
  '-pix_fmt',
  'yuv420p',
  '-movflags',
  '+faststart',
  '-an',
  output,
]);

const metadata = await run(ffprobe, [
  '-v',
  'error',
  '-show_entries',
  'format=duration,size:stream=codec_name,pix_fmt,width,height',
  '-of',
  'json',
  output,
]);

console.log(JSON.stringify({ input, output, metadata: JSON.parse(metadata) }));
