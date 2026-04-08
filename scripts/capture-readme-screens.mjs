import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const readmePath = path.resolve(projectRoot, 'README.md');
const screenshotsDir = path.resolve(projectRoot, 'docs', 'screenshots');
const themeStorageKey = 'aurora.course-manager.theme';
const startMarker = '<!-- screenshots:start -->';
const endMarker = '<!-- screenshots:end -->';

const cliUrl = process.argv.find(argument => argument.startsWith('--url='))?.slice('--url='.length)?.trim();

const pages = [
  { slug: 'dashboard', label: 'Dashboard', route: '/dashboard' },
  { slug: 'students', label: 'Students', route: '/students' },
  { slug: 'schedule', label: 'Schedule', route: '/schedule' },
];

const themes = ['dark', 'light'];

function normalizeBaseUrl(candidate) {
  return candidate.replace(/\/+$/, '');
}

async function canReach(url) {
  try {
    const response = await fetch(`${normalizeBaseUrl(url)}/`, {
      signal: AbortSignal.timeout(3_000),
    });

    return response.ok;
  } catch {
    return false;
  }
}

async function resolveBaseUrl() {
  const explicitUrl = cliUrl || process.env.AURORA_APP_URL?.trim();
  if (explicitUrl) {
    return normalizeBaseUrl(explicitUrl);
  }

  const candidates = Array.from({ length: 20 }, (_, index) => `http://127.0.0.1:${4200 + index}`);
  for (const candidate of candidates) {
    if (await canReach(candidate)) {
      return candidate;
    }
  }

  throw new Error('未找到可访问的本地前端地址。请先启动开发服务器，或通过 --url / AURORA_APP_URL 指定地址。');
}

function buildReadmeTable() {
  const header = [
    startMarker,
    '',
    '> 截图由 `npm run screenshots:readme` 自动生成，输出到 `docs/screenshots/`。',
    '',
    '| 页面 | 暗色主题 | 亮色主题 |',
    '| --- | --- | --- |',
  ];

  const rows = pages.map(page =>
    `| ${page.label} | ![${page.label} Dark](docs/screenshots/${page.slug}-dark.png) | ![${page.label} Light](docs/screenshots/${page.slug}-light.png) |`,
  );

  return [...header, ...rows, '', endMarker].join('\n');
}

async function updateReadme() {
  const currentReadme = await fs.readFile(readmePath, 'utf8');
  const startIndex = currentReadme.indexOf(startMarker);
  const endIndex = currentReadme.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error('README.md 缺少截图标记区，无法自动更新。');
  }

  const nextReadme = `${currentReadme.slice(0, startIndex)}${buildReadmeTable()}${currentReadme.slice(endIndex + endMarker.length)}`;
  await fs.writeFile(readmePath, nextReadme, 'utf8');
}

async function captureScreenshots(baseUrl) {
  await fs.mkdir(screenshotsDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    for (const theme of themes) {
      const context = await browser.newContext({
        viewport: { width: 1600, height: 1080 },
        colorScheme: theme === 'dark' ? 'dark' : 'light',
      });

      await context.addInitScript(({ resolvedTheme, storageKey }) => {
        window.localStorage.setItem(storageKey, resolvedTheme);
        window.addEventListener('DOMContentLoaded', () => {
          document.body.classList.remove('app-theme-dark', 'app-theme-light');
          document.body.classList.add(resolvedTheme === 'dark' ? 'app-theme-dark' : 'app-theme-light');
          document.documentElement.setAttribute('data-theme', resolvedTheme);
        });
      }, { resolvedTheme: theme, storageKey: themeStorageKey });

      for (const pageDef of pages) {
        const page = await context.newPage();
        const targetUrl = new URL(pageDef.route, `${baseUrl}/`).toString();

        await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 60_000 });
        await page.waitForTimeout(1_000);
        await page.screenshot({
          path: path.join(screenshotsDir, `${pageDef.slug}-${theme}.png`),
          fullPage: true,
        });
        await page.close();
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }
}

async function main() {
  const baseUrl = await resolveBaseUrl();
  await captureScreenshots(baseUrl);
  await updateReadme();
  console.log(`[Aurora] README 截图已刷新，目标地址：${baseUrl}`);
}

main().catch(error => {
  console.error('[Aurora] 生成 README 截图失败。');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
