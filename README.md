# Aurora 课程管理中心

> 基于 **Angular 17 + Angular Material** 的企业级教务管理前端系统。
> 采用 Signals 驱动响应式架构，Geist 风格设计系统，暗色/亮色双主题无缝切换。
> 内置 SVG 交互式图表库、多维度数据分析、操作审计日志，零后端纯前端运行。

---

## 设计系统

对标 Vercel Geist Design System，打造克制、高对比度、专业化的视觉语言：

- **色彩**：Vercel Blue (#0070f3) 主色 + 10级灰度色阶，语义色完整覆盖
- **主题**：亮/暗双模式，侧边栏随主题自适应（亮色浅底 / 暗色深底）
- **排版**：Inter + Noto Sans SC 字体链，JetBrains Mono 代码等宽
- **组件**：精细化 1px 边框 + 无阴影卡片（hover 时浮出微阴影）
- **动画**：瀑布式入场 + 路由模糊过渡 + hover 微交互
- **无障碍**：`prefers-reduced-motion` 全局禁用动画，`:focus-visible` 可视焦点环

---

## 功能总览

### 仪表盘 `/dashboard`

- 六大核心指标卡片（彩色左边框 + 图标色区分）
- 快捷操作面板，一键跳转课程/学生/日程/报表
- 课程状态环形图、成绩等级柱状图、分数段折线图
- 重点课程排行（Top 5）、系统告警列表、近期活动时间线

### 课程管理 `/courses`

- 关键词搜索 + 状态筛选 + 四维排序
- 完整 CRUD，独立编辑页面，排课冲突自动检测
- CSV 导出（含 BOM，兼容 Excel 中文）

### 学生管理 `/students`

- 双视图切换：卡片视图 & 表格视图（含分页）
- ABCDEF 六级成绩体系，彩色等级徽章
- 批量操作 + 页码输入跳转

### 教师管理 `/teachers`

- 教职员工信息管理（姓名、职称、院系、联系方式）
- 内置编辑面板 + 院系/姓名双向模糊搜索

### 选课与成绩 `/enrollments`

- 学生-课程关联匹配，成绩录入与等级自动换算
- 在读/结课/退课状态徽章可视化

### 数据报表 `/reports`

- 三维度 Tab 切换：综合总览 / 课程分析 / 学生分析
- SVG 交互式图表矩阵（环形图、柱状图、折线图）

### 数据分析 `/analytics`

- 四大 KPI 面板 + 多维图表矩阵
- 学生成绩 Top 10 排行榜

### 活动日志 `/activity-log`

- 操作审计追踪，自动记录 CRUD 操作时间线
- 统计面板 + 类型过滤

### 系统设置 `/settings`

- 可视化主题预览卡片，一键切换亮/暗模式
- 数据管理：导出备份 / 清除日志 / 重置数据
- 系统元数据展示

### 全局功能

- **全局搜索** `Ctrl+K`：跨课程 + 学生模糊匹配
- **消息中心**：顶栏通知气泡 + 下拉面板
- **数据备份**：侧边栏 JSON 全量导出/导入
- **本地持久化**：所有数据自动存储至 localStorage

---

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 框架 | Angular 17.3 (Standalone Components) |
| UI 库 | Angular Material 17.3 + CDK |
| 状态 | Angular Signals (`signal` / `computed` / `effect`) |
| 样式 | SCSS + CSS Custom Properties (50+ design tokens) |
| 构建 | ESBuild via Angular CLI |

---

## 快速开始

```bash
npm install
npm run start:open
```

访问 `http://localhost:4200`

---

## 项目结构

```text
src/app/
├── core/
│   ├── models/         # 数据模型
│   ├── services/       # 状态管理服务
│   └── utils/          # 工具函数
├── dashboard/          # 仪表盘
├── course-list/        # 课程列表
├── course-detail/      # 课程详情
├── course-edit/        # 课程编辑
├── students/           # 学生管理
├── student-detail/     # 学生详情
├── student-edit/       # 学生编辑
├── teachers/           # 教师管理
├── enrollments/        # 选课管理
├── schedule/           # 教务排课
├── reports/            # 数据报表
├── analytics/          # 数据分析
├── activity-log/       # 活动日志
├── settings/           # 系统设置
├── sidebar/            # 侧边栏
└── shared/             # 共享组件/动画/模型
```
