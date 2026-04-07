# Aurora Fullstack Modernization Plan

## Overview

本计划将 `course-manager` 从当前的 Angular 单体前端工作台，升级为 **Angular 17 前端 + Python FastAPI 后端 + 关系型数据库** 的完整前后端系统。

本轮升级的目标不是推翻现有壳层，而是在保留 `Aurora` 视觉体系、展示型组件与高密度工作台体验的前提下，补齐真正的后端、持久化、鉴权、审计、数据迁移与测试闭环。

### 本轮明确纳入范围

- 新增 Python 后端工程 `server/`
- 建立 FastAPI 应用、配置体系、数据库接入与健康检查
- 将 `courses`、`students`、`teachers`、`enrollments`、`activity logs`、`analytics snapshot`、`backups` 迁移为服务端数据域
- 在前端引入 `api + facade` 数据访问层
- 逐步从 `localStorage` 迁移到 API 驱动
- 建立最小可用鉴权、审计与回归测试链路

### 本轮明确不纳入范围

- 微服务拆分
- Redis / 队列系统
- 复杂多租户与组织树
- 云部署与生产基础设施编排
- 实时协作与 WebSocket 推送
- 完整排课沙盘的高级算法

## Current-state Audit

| 领域 | 当前现状 | 主要问题 | 升级方向 |
| --- | --- | --- | --- |
| 前端架构 | Angular 17 + Standalone + Signals | 没有后端、没有 API 层 | 增加 `core/api` 与 `core/facades` |
| 数据源 | `localStorage` + seed 数据 | 无法多端同步、无服务端真相 | 引入 FastAPI + 数据库 |
| 页面层 | Dashboard / Courses / Students / Teachers / Enrollments / Reports / Analytics / Settings | 一些页面已拆分良好，一些仍承担过重 orchestration | 保留展示型组件，收口容器逻辑 |
| 测试 | Karma + Jasmine，偏 service 单测 | 页面交互和集成覆盖薄弱 | 补前端页面/API 适配测试与后端 pytest |
| 备份恢复 | 前端 JSON 导入导出 | 只存在浏览器本地，不可审计 | 迁移为后端支持的备份能力 |
| 产品化 | 存在 AI/Mock/Stub 等外露措辞 | 有 demo 痕迹 | 统一改为业务化表达 |

### 现有关键文件

- `src/app/app.component.ts` — 全局壳层、搜索、通知、备份入口
- `src/app/app.routes.ts` — 路由与页面边界
- `src/app/core/services/course-store.service.ts`
- `src/app/core/services/student-store.service.ts`
- `src/app/core/services/teacher-store.service.ts`
- `src/app/core/services/enrollment-store.service.ts`
- `src/app/core/services/insight-engine.service.ts`
- `src/app/settings/settings.component.ts`
- `scripts/seed/output/*.json`

## Target Architecture

### Frontend Layers

1. **Shell Layer**
   - `AppComponent`
   - 导航、全局搜索、通知、主题、最近工作区
2. **Feature Workbench Layer**
   - Courses / Students / Teachers / Enrollments / Dashboard / Analytics / Reports / Settings
3. **Facade Layer**
   - `StudentsFacade`
   - `CoursesFacade`
   - `TeachersFacade`
   - `EnrollmentsFacade`
   - `AnalyticsFacade`
   - `SystemSettingsFacade`
4. **API Layer**
   - `StudentsApiService`
   - `CoursesApiService`
   - `TeachersApiService`
   - `EnrollmentsApiService`
   - `AnalyticsApiService`
   - `SystemAdminApiService`

### Backend Layers

1. **FastAPI App Layer**
   - API 注册
   - 路由版本前缀 `/api/v1`
   - 健康检查
   - 错误处理
2. **Core Layer**
   - 配置
   - 日志
   - 鉴权
   - 异常
3. **Database Layer**
   - SQLAlchemy models
   - Alembic migrations
   - session / engine
4. **Service Layer**
   - 领域校验
   - CRUD orchestration
   - 聚合与分析
   - 备份导入导出
5. **Schema Layer**
   - Pydantic v2 request / response DTOs

### Database Strategy

- 开发默认：SQLite 文件库
- 结构兼容：PostgreSQL
- 主实体：`courses`、`students`、`teachers`、`enrollments`、`activity_logs`
- 派生读模型：`analytics/snapshot` 先以查询聚合为主，不急于单独建表

## Compatibility Contract

以下兼容项在迁移前期必须保持稳定：

| 兼容项 | 当前形式 | 过渡策略 |
| --- | --- | --- |
| 主键 | 数字 ID | 服务端继续使用数字 ID |
| DTO 命名 | camelCase | 服务端响应保持 camelCase |
| 时间 | ISO 字符串 | 服务端统一输出 ISO 8601 |
| `Course.instructor` | 字符串 | 后端内部用 `teacherId`，响应继续投影 `instructor` |
| `Course.students` | 冗余人数 | 由选课数投影为兼容字段 |
| `Student.score` | 学生总体分 | 与 `Enrollment.score` 关系需在实现前明确 |
| 课程详情学生列表 | 前端伪造 | 改为真实 enrollment 关系查询 |

## Ten-iteration Execution Roadmap

### Iteration 1 — Freeze Contracts

- 冻结目标架构、边界、兼容约束
- 确认仓库计划文档与十轮路线
- 完成标准：路线、风险、验收表固定

### Iteration 2 — Visible Plan + Backend Bootstrap

- 创建仓库根目录 `fullstack-modernization-plan.md`
- 创建 `server/` 骨架
- 创建 `.env.example`、配置模块、健康检查
- 完成标准：后端项目结构落地，`/health` 可返回 200

### Iteration 3 — Models, Migrations, Seeds

- 建立 SQLAlchemy 模型
- 建立 Alembic 初始化迁移
- 导入现有 `scripts/seed/output/*.json` 作为种子输入
- 完成标准：数据库可初始化，基础种子可落库

### Iteration 4 — Core REST APIs

- 实现 `courses`、`students`、`teachers`、`enrollments`
- 实现 `activity-logs`、`analytics/snapshot`、`backups`
- 完成标准：核心 API 可 CRUD / 查询 / 备份导出

### Iteration 5 — Frontend API Foundation

- 在 Angular 中加入 `provideHttpClient`
- 新建 `core/api` 与 `core/facades`
- 增加环境配置与统一错误映射
- 完成标准：前端具备访问后端的统一入口

### Iteration 6 — Students and Courses Migration

- `StudentsComponent` 迁移到 facade
- `CourseList` / `CourseDetail` / `CourseEdit` 迁移到 facade
- 修复课程详情中的伪选课关系
- 完成标准：学生与课程核心流程不再依赖 localStorage

### Iteration 7 — Teachers and Enrollments Migration

- `TeachersComponent` 迁移
- `EnrollmentsComponent` 迁移
- 收口跨域 join/read-model
- 完成标准：教师与选课工作台 API 驱动完成

### Iteration 8 — Analytics, Reports, Settings

- 把分析、报表、设置迁移为后端聚合/系统接口驱动
- 保留 `theme` 与 `recentWorkspace` 为本地偏好
- 清除用户可见 AI/Mock/Stub 痕迹
- 完成标准：系统级数据操作迁移完成

### Iteration 9 — Auth, Audit, UX Hardening

- 引入最小可用 JWT 鉴权
- 加前端守卫与 401/403 处理
- 统一 loading/error/empty/success UX
- 完成标准：写接口受保护，审计链路可用

### Iteration 10 — Tests, Docs, Final Verification

- 前端补页面/API/facade 测试
- 后端补 pytest / API / DB 约束测试
- 完善 README、运行方式、迁移说明
- 完成标准：关键业务链路自检通过

## Milestones and Acceptance Gates

| 里程碑 | 通过条件 |
| --- | --- |
| M1 计划冻结 | 本文件与执行蓝本一致，路线不再改动 |
| M2 后端可启动 | `server/` 可启动，`/health` 返回正常 |
| M3 基础 CRUD 打通 | 四大实体 API 可用，数据库落库成功 |
| M4 学生课程迁移完成 | 对应页面不再依赖本地 store 为真数据源 |
| M5 教师选课迁移完成 | 跨域工作台 API 驱动稳定 |
| M6 分析设置迁移完成 | Analytics / Reports / Settings 对后端聚合可用 |
| M7 鉴权审计完成 | 受保护写接口与操作日志生效 |
| M8 回归完成 | 关键链路测试与手工验证全部通过 |

## Risk Register

| 风险 | 触发点 | 影响 | 缓解策略 |
| --- | --- | --- | --- |
| 成绩双来源 | `Student.score` 与 `Enrollment.score` 并存 | 指标口径错乱 | 先冻结成绩真值来源，再迁移 analytics |
| 课程详情伪选课关系 | 当前详情页模拟学生列表 | 页面行为改变 | 先引入真实 enrollment 查询，再调整 UI 文案 |
| 动态端口 | 前端开发端口自动漂移 | API base URL 不稳定 | 增加环境配置或明确代理方案 |
| 无环境配置 | 当前仓库无 `.env*` / env ts | 联调混乱 | 建立根 `.env` 与后端 `.env.example` |
| 指标双写 | 前端和后端同时算 analytics | 数据不一致 | analytics 最终收口到后端 |
| 用户可见 AI 痕迹 | Settings / Analytics 文案存在占位词 | 产品感不足 | 全量替换为业务表达 |

## Verification Matrix

| 维度 | 最低要求 |
| --- | --- |
| 前端 | `npm run test:headless` 覆盖新增 facade/API 适配与关键页面 |
| 后端 | `pytest` 覆盖健康检查、配置、模型校验、CRUD、错误路径 |
| 集成 | 至少验证“建课 → 建生 → 选课 → 分析 → 备份/恢复” |
| 手工回归 | 全局搜索、通知、主题切换、最近工作区、设置工具流可用 |

## Working Agreements

- 保留现有 `Aurora` 壳层和视觉风格，不推翻 UI 基础
- 优先复用 `course-cards`、`student-table`、`page-hero` 等展示型组件
- 先建立 facade，再替换 store 数据源
- 本地偏好（主题、最近工作区）不急于后端化
- 任何删除 localStorage 旧逻辑的动作，都必须在对应 API 稳定后进行
- 数据迁移相关修改必须伴随种子/导入导出说明

## Immediate Execution Kickoff

1. 创建仓库根目录 `fullstack-modernization-plan.md`
2. 创建 `server/` 最小目录：`app/`, `app/api/`, `app/core/`, `app/db/`, `app/models/`, `app/schemas/`, `app/services/`, `tests/`
3. 创建后端基础文件：
   - `pyproject.toml`
   - `app/main.py`
   - `app/core/config.py`
   - `app/db/session.py`
   - `.env.example`
   - `README.md`
4. 先打通 `/health`
5. `/health`、配置加载、数据库连接通过后，再进入实体与 CRUD

## Change Log

| 日期 | 轮次 | 变更摘要 | 决策结果 |
| --- | --- | --- | --- |
| 2026-04-07 | Plan Freeze | 确认 Python + FastAPI 路线 | 作为唯一执行蓝本 |
