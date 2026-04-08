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
  {
    slug: 'dashboard',
    label: 'Dashboard',
    heading: 'Dashboard / Mission Control',
    route: '/dashboard',
    description: '指标总览、风险雷达、推荐动作、运营时间线与最近工作区。',
  },
  {
    slug: 'courses',
    label: 'Courses',
    heading: 'Courses / 课程管理',
    route: '/courses',
    description: '课程搜索、状态筛选、卡片工作台、详情预览与课程维护入口。',
  },
  {
    slug: 'students',
    label: 'Students',
    heading: 'Students / 学生管理',
    route: '/students',
    description: '学生搜索筛选、卡片/表格双视图、局部预览、批量操作与异常恢复演示。',
  },
  {
    slug: 'teachers',
    label: 'Teachers',
    heading: 'Teachers / 教师管理',
    route: '/teachers',
    description: '教师检索、排班负荷、档案编辑入口与教师工作负载概览。',
  },
  {
    slug: 'enrollments',
    label: 'Enrollments',
    heading: 'Enrollments / 选课与成绩',
    route: '/enrollments',
    description: '选课关系、审批状态、成绩录入、待办队列与异常记录视图。',
  },
  {
    slug: 'analytics',
    label: 'Analytics',
    heading: 'Analytics / 数据分析',
    route: '/analytics',
    description: '概览、对比、趋势三类分析视图，以及风险与机会洞察。',
  },
  {
    slug: 'reports',
    label: 'Reports',
    heading: 'Reports / 数据报表',
    route: '/reports',
    description: '课程、学生与完成率等多维统计报表与可视化摘要。',
  },
  {
    slug: 'schedule',
    label: 'Schedule',
    heading: 'Schedule / 教务日程',
    route: '/schedule',
    description: '按周排布课程日历、课时概览与课程详情弹层入口。',
  },
  {
    slug: 'activity-log',
    label: 'Activity Log',
    heading: 'Activity Log / 活动日志',
    route: '/activity-log',
    description: '系统操作时间线、动作过滤器与审计留痕视图。',
  },
  {
    slug: 'settings',
    label: 'Settings',
    heading: 'Settings / 系统设置',
    route: '/settings',
    description: '主题切换、数据管理、分析服务预设与系统信息展示。',
  },
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

function buildReadmeGallery() {
  const header = [
    startMarker,
    '',
    '> 截图由 `npm run screenshots:readme` 自动生成，输出到 `docs/screenshots/`。',
    '> 每个模块均提供暗色 / 亮色主题截图与简要说明。',
  ];

  const sections = pages.flatMap(page => [
    '',
    `### ${page.heading}`,
    '',
    page.description,
    '',
    '| 暗色主题 | 亮色主题 |',
    '| --- | --- |',
    `| ![${page.label} Dark](docs/screenshots/${page.slug}-dark.png) | ![${page.label} Light](docs/screenshots/${page.slug}-light.png) |`,
  ]);

  return [...header, ...sections, '', endMarker].join('\n');
}

async function updateReadme() {
  const currentReadme = await fs.readFile(readmePath, 'utf8');
  const startIndex = currentReadme.indexOf(startMarker);
  const endIndex = currentReadme.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error('README.md 缺少截图标记区，无法自动更新。');
  }

  const nextReadme = `${currentReadme.slice(0, startIndex)}${buildReadmeGallery()}${currentReadme.slice(endIndex + endMarker.length)}`;
  await fs.writeFile(readmePath, nextReadme, 'utf8');
}

async function captureScreenshots(baseUrl) {
  await fs.mkdir(screenshotsDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    for (const theme of themes) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 960 },
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
          fullPage: false,
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
