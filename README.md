# Aurora Course Manager

一个基于 Angular 17 + Angular Material + FastAPI 的课程管理系统。  
当前版本延续 `Aurora Night Deck` 工作台风格：顶部 `Command Strip`、底部悬浮 `Dock`、亮暗双主题玻璃壳层，并已经完成前后端分离的第一阶段落地。

当前仓库不再只是“纯前端演示”：`server/` 下的 Python FastAPI 服务已接入真实 HTTP 接口、SQLite 持久化、Alembic 迁移与标准种子数据；前端 `Classes / Teachers / Courses / Students / Enrollments` 已切到 API-backed store，开始以数据库为主数据源。

仓库地址：<https://github.com/2711944586/course-manager>

## Highlights

- `Mission Control` 首页：指标总览、风险雷达、推荐动作、运营时间线、最近工作区
- `Courses / Students` 工作台：搜索、筛选、排序、CRUD、局部预览、独立详情与编辑页
- `Analytics` 洞察面板：概览 / 对比 / 趋势分析三页签，本地计算与分析服务预留
- `Schedule` 周课表：按周一到周日自动分组，点击卡片弹出居中的课程详情弹层
- `Settings` 系统中心：主题切换、数据导出/导入/重置、系统配置入口
- 顶部全局搜索：支持 `Ctrl+K`
- 底部悬浮 Dock：`Dashboard / Courses / Students / Teachers / Enrollments / Analytics / Reports / Schedule / Activity Log / Settings`
- 底部中控台支持点击最左侧按钮展开 / 收起，并带有平滑开合动画

## 界面预览

<!-- screenshots:start -->

> 截图由 `npm run screenshots:readme` 自动生成，输出到 `docs/screenshots/`。

| 页面 | 暗色主题 | 亮色主题 |
| --- | --- | --- |
| Dashboard | ![Dashboard Dark](docs/screenshots/dashboard-dark.png) | ![Dashboard Light](docs/screenshots/dashboard-light.png) |
| Students | ![Students Dark](docs/screenshots/students-dark.png) | ![Students Light](docs/screenshots/students-light.png) |
| Schedule | ![Schedule Dark](docs/screenshots/schedule-dark.png) | ![Schedule Light](docs/screenshots/schedule-light.png) |

<!-- screenshots:end -->

## Fullstack 升级进展

- 仓库内公开执行文档：`fullstack-modernization-plan.md`
- Python 后端骨架：`server/`
- 已完成 FastAPI 入口、配置基线、数据库 session 基线、`/api/v1/health` 健康检查、Alembic 迁移与最小 pytest 样例
- 已新增 `classes` 资源、学生 `classId` 关联字段、标准 seed 导入脚本与 SQLite 数据库初始化流程
- `Classes / Teachers / Courses / Students / Enrollments` 已接入真实 API，并通过 store 信号层向页面分发数据库数据
- `Analytics / Notifications / Backup Restore / Activity Log` 仍保留前端本地逻辑，作为后续服务端化阶段

### 核心实体联调现状

- 后端提供 `classes / teachers / courses / students / enrollments / analytics / health` 路由
- 前端核心实体通过 API-backed store 读取、创建、更新、删除数据；页面层仍保留 Signals 消费方式
- 课程详情页已改为基于真实选课关系显示学生列表，不再使用伪造取模关联
- 教师与课程编辑流程已切换为真实教师档案选择，避免把教师姓名自由文本直接撞进数据库

## 技术栈

- Angular 17
- Angular Material
- Standalone Components
- Signals
- localStorage 缓存 + Signals
- FastAPI
- SQLAlchemy + Alembic
- SQLite（开发环境）

## 本次重构重点

- 壳层升级为极夜玻璃舰桥风格
- 默认暗色主题，亮色主题同步完成细节适配
- 表单、下拉、通知面板、快捷指令面板、Dock、浮层统一走主题 token
- 修复页面滚动、路由切换、启动端口冲突、localStorage 脏数据容错等问题
- 周课表详情弹层改为真正居中显示，不再出现点击后偏右偏下
- Dock 悬浮标签去重，不再与额外 tooltip 重叠
- Dock 最左侧品牌按钮改为中控台开关，可一键展开 / 收起整组导航

## 快速开始

### 一键启动（推荐）

双击 `start-course-manager.bat`，脚本会自动完成：

1. 数据库迁移（Alembic）
2. 后端 API 服务启动（`http://127.0.0.1:8000`）
3. 前端依赖安装与开发服务器启动（`http://127.0.0.1:4200`）
4. 自动打开浏览器

建议通过让脚本正常退出来停止服务；如果直接强制关闭批处理窗口，不保证总能完整执行清理逻辑。

### 仅启动前端

```bash
npm install
npm run start
```

自动打开浏览器：

```bash
npm run start:open
```

开发脚本会自动寻找 `4200-4219` 间的空闲端口；后端默认已放行该区间的本地 CORS。启动后以前端终端输出地址为准。

### 启动完整前后端联调

1. 先按 `server/README.md` 完成后端依赖安装、数据库迁移与种子导入
2. 在 `server/` 目录启动 FastAPI 服务（默认 `127.0.0.1:8000`）
3. 回到仓库根目录执行 `npm run start`

前端当前默认请求 `http://127.0.0.1:8000/api/v1`。

## 常用脚本

```bash
npm run start          # 自动选择可用端口启动开发服务器
npm run start:open     # 自动选择可用端口并打开浏览器
npm run start:raw      # 直接用 4200 启动 ng serve
npm run screenshots:readme  # 先自动探测本地 dev server，再生成最新明暗主题截图
npm run build          # 生产构建
npm run test           # Karma 测试
npm run test:headless  # Headless 测试
```

## 主要模块

### Dashboard

- Mission Control 总览
- 风险卡、行动卡、最近工作区、运营时间线
- 图表：环形图 / 柱状图 / 折线图

### Courses

- 搜索、状态筛选、排序
- 课程卡片工作台 + 侧边预览
- 课程 CRUD、详情、编辑、CSV 导出

### Students

- 卡片 / 表格双视图
- 批量选择、分页、页码跳转
- 成绩分级、详情 / 编辑页
- 已展示学生所属班级，并支持导出班级列

### Teachers

- 教师列表与搜索
- 教师详情、课程关联总览

### Enrollments

- 选课记录管理与成绩录入
- 多维度筛选与排序

### Analytics

- 概览 / 对比 / 趋势分析三页签
- 风险雷达、趋势洞察、推荐动作
- 分析服务接口对接

### Reports

- 数据报表与统计图表
- 学生成绩分布、课程完成率等多维报告

### Schedule

- 自动生成周课表
- 排课提醒与活跃课程统计
- 点击课程卡片查看居中详情弹层

### Activity Log

- 操作日志时间线
- 按类型 / 实体筛选与搜索

### Settings

- 亮暗主题切换
- 数据导出 / 导入 / 清理 / 重置
- 分析服务配置
- 系统信息展示

## 数据与存储

- 班级、教师、课程、学生、选课主体数据当前以后端 SQLite 数据库为主，前端保留本地缓存作为启动兜底
- `start-course-manager.bat` 仅会在核心表全部为空或数据库尚未初始化时自动导入标准种子，避免部分空表场景误重置现有数据
- `Analytics / Notifications / Backup Restore / Activity Log` 当前仍以前端本地状态为主
- Settings 页可导出 JSON 备份
- Settings 页可重置课程、学生、教师、选课、活动日志、通知与最近工作区
- 项目内置标准种子课程、教师、学生与班级数据

## 项目结构

```text
src/
├── app/
│   ├── activity-log/
│   ├── analytics/
│   ├── core/
│   │   ├── models/
│   │   ├── services/
│   │   └── utils/
│   ├── course-detail/
│   ├── course-edit/
│   ├── course-list/
│   ├── dashboard/
│   ├── enrollments/
│   ├── reports/
│   ├── schedule/
│   ├── settings/
│   ├── sidebar/
│   ├── student-detail/
│   ├── student-edit/
│   ├── students/
│   ├── shared/
│   └── teachers/
├── assets/
└── styles.scss
```

## 说明

- 当前仓库处于渐进式前后端分离阶段：核心实体已走真实 API，洞察/通知/备份恢复仍在后续阶段
- 分析相关能力当前仍以前端计算与接口预留为主，不会默认发起外部模型请求
- 后端实施说明见 `server/README.md`
- 根目录 `.env` 为本地开发配置文件，不纳入版本控制
- 如果浏览器仍停留在旧缓存页面，重新执行 `npm run start` 后强制刷新即可
