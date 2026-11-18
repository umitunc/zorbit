import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const viteBin = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
const electronCli = path.join(ROOT, 'node_modules', 'electron', 'cli.js');

const stripAnsi = (text) => text.replace(/\x1B\[[0-9;]*[A-Za-z]/g, '');

const viteProc = spawn(process.execPath, [viteBin], {
  cwd: ROOT,
  stdio: ['inherit', 'pipe', 'pipe'],
});

let electronStarted = false;
let electronProc = null;

function shutdown(code = 0) {
  if (electronProc && !electronProc.killed) {
    electronProc.kill();
  }
  if (!viteProc.killed) {
    viteProc.kill();
  }
  process.exit(code);
}

function handleOutput(chunk, targetStream) {
  const text = chunk.toString();
  targetStream.write(text);

  if (electronStarted) return;
  const clean = stripAnsi(text);
  const match = clean.match(/Local:\s*(https?:\/\/localhost:\d+\/?)/i);
  if (match) {
    electronStarted = true;
    const devUrl = match[1];
    electronProc = spawn(process.execPath, [electronCli, '.'], {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env, VITE_DEV_SERVER_URL: devUrl },
    });
    electronProc.on('exit', (code) => shutdown(code ?? 0));
  }
}

viteProc.stdout.on('data', (chunk) => handleOutput(chunk, process.stdout));
viteProc.stderr.on('data', (chunk) => handleOutput(chunk, process.stderr));
viteProc.on('exit', (code) => {
  if (!electronStarted) {
    process.exit(code ?? 1);
  }
});

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

