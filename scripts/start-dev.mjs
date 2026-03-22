import net from 'node:net';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = Number.parseInt(process.env.PORT ?? '4200', 10);
const MAX_PORT_ATTEMPTS = 20;

const openRequested = process.argv.includes('--open');
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const ngCliPath = path.resolve(scriptDir, '../node_modules/@angular/cli/bin/ng.js');

function isPortAvailable(host, port) {
  return new Promise(resolve => {
    const server = net.createServer();

    server.unref();
    server.on('error', () => resolve(false));
    server.listen({ host, port }, () => {
      server.close(() => resolve(true));
    });
  });
}

async function resolvePort(host, preferredPort) {
  for (let offset = 0; offset < MAX_PORT_ATTEMPTS; offset += 1) {
    const port = preferredPort + offset;
    if (await isPortAvailable(host, port)) {
      return port;
    }
  }

  throw new Error(
    `从 ${preferredPort} 开始连续 ${MAX_PORT_ATTEMPTS} 个端口都不可用，请手动释放端口后重试。`,
  );
}

async function main() {
  const host = DEFAULT_HOST;
  const port = await resolvePort(host, DEFAULT_PORT);

  if (port !== DEFAULT_PORT) {
    console.log(`[Aurora] 默认端口 ${DEFAULT_PORT} 已被占用，自动切换到 ${port}。`);
  }

  console.log(`[Aurora] 正在启动开发服务器: http://${host}:${port}`);

  const ngArgs = ['serve', '--host', host, '--port', String(port)];
  if (openRequested) {
    ngArgs.push('--open');
  }

  const child = spawn(process.execPath, [ngCliPath, ...ngArgs], {
    stdio: 'inherit',
    env: process.env,
  });

  child.on('error', error => {
    console.error('[Aurora] 启动 Angular 开发服务器失败。');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });

  child.on('exit', code => {
    process.exit(code ?? 0);
  });
}

main().catch(error => {
  console.error('[Aurora] 无法确定可用端口。');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
