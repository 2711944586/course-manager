# Aurora 课程管理中心

> 基于 **Angular 17 + Angular Material** 的企业级教务管理系统。
> Zinc/Slate 色阶设计体系 · Glassmorphism 毛玻璃界面 · Signal 驱动响应式架构 · 零后端纯前端运行。

---

## 设计系统

Zinc/Slate 色阶 + Indigo 克制强调色，对标 Linear / Stripe / Vercel 级别的视觉品质：

| 维度 | 实现 |
| ------ | ------ |
| **色彩** | Slate 灰度色阶 (bg-body #F1F5F9 / surface #FFFFFF / text #0F172A) + Indigo (#4F46E5) 主色 |
| **表面** | Glassmorphism 毛玻璃卡片 — `backdrop-filter: blur(12px) saturate(1.6)` + 半透明边框 |
| **主题** | 亮 / 暗双模式无缝切换，60+ CSS Custom Properties 自适应 |
| **阴影** | Tailwind 风格阴影系统 (shadow-sm/md/lg/xl) |
| **布局** | 左侧 260px 固定侧边栏 + 右侧 `--bg-page: #F1F5F9` 内容区 |
| **排版** | Inter + Noto Sans SC 字体链，JetBrains Mono 等宽 |
| **动画** | 瀑布式入场 + 路由模糊过渡 (16 条路由独立配置) + hover 微交互 |
| **骨架屏** | CSS-only skeleton 加载动画系统 (text / title / avatar / card / chart) |
| **通知** | 全局 Toast 通知系统 — Signal 驱动，支持 success / error / warning / info 四级别 |
| **无障碍** | `prefers-reduced-motion` 禁用动画，`:focus-visible` 焦点环 |

---

## 功能总览

### 仪表盘 `/dashboard`

- 六大核心指标卡片（Indigo 色彩映射 + 绿色趋势角标）
- 快捷操作面板，一键跳转课程 / 学生 / 日程 / 报表
- **交互式 SVG 图表**：环形图、柱状图、折线图，悬浮显示 Tooltip 详情
- 双列布局：系统提醒 (2/3) + 最近活动 (1/3)
- 重点课程 Top 5 排行、系统告警列表

### 课程管理 `/courses`

- 关键词搜索 + 状态筛选 + 四维排序
- Glassmorphism 课程卡片 — 毛玻璃背景 + hover 浮起微交互
- 完整 CRUD，独立编辑页面，排课冲突自动检测
- CSV 导出（含 BOM，兼容 Excel 中文）+ Toast 操作反馈

### 学生管理 `/students`

- 双视图切换：卡片视图 & 企业级表格视图
- **可排序列头**：姓名 / 年龄 / 成绩 / 更新时间，升降序切换
- 批量选择操作 + 分页组件 + 页码跳转
- ABCDEF 六级成绩体系，彩色等级徽章

### 教师管理 `/teachers`

- 教职员工信息管理（姓名、职称、院系、联系方式）
- 内置编辑面板 + 院系/姓名双向模糊搜索

### 选课与成绩 `/enrollments`

- 学生-课程关联匹配，成绩录入与等级自动换算
- 严格 TypeScript 类型：`EnrollmentViewModel` / `EnrollmentEditForm` / `EnrollmentStatus`
- 在读 / 结课 / 退课状态徽章可视化

### 教务日程 `/schedule`

- **网格日历视图**：周一至周日七列布局，响应式折叠 (960px → 4 列, 600px → 2 列)
- 课程状态边框色标（active 绿 / planned 黄 / completed 蓝）
- **课程详情弹窗**：点击课程项弹出信息面板，显示教师 / 学分 / 进度条 / 描述
- 进度指示器 + 活跃课程计数统计

### 数据报表 `/reports`

- 三维度 Tab 切换：综合总览 / 课程分析 / 学生分析
- SVG 交互式图表矩阵（环形图悬浮中心数据 + 柱状图 Tooltip + 折线图十字线）

### 数据分析 `/analytics`

- 四大 KPI 面板 + 多维图表矩阵
- 学生成绩 Top 10 排行榜

### 活动日志 `/activity-log`

- 操作审计追踪，自动记录 CRUD 操作时间线
- 统计面板 + 类型过滤

### 系统设置 `/settings`

- 可视化主题预览卡片（Zinc 色阶实时演示），一键切换亮/暗模式
- 数据管理：导出备份 / 清除日志 / 重置数据，操作结果 Toast 通知
- 系统元数据展示

### 全局功能

- **全局搜索** `Ctrl+K`：跨课程 + 学生模糊匹配
- **消息中心**：顶栏通知气泡 + 下拉面板
- **Toast 通知**：全局 Signal 驱动通知系统，支持四级别自动消失
- **数据备份**：侧边栏 JSON 全量导出/导入，操作 Toast 反馈
- **本地持久化**：所有数据自动存储至 localStorage

---

## 技术栈

| 层级 | 技术 |
| ------ | ------ |
| 框架 | Angular 17.3 (Standalone Components) |
| UI 库 | Angular Material 17.3 + CDK |
| 状态 | Angular Signals (`signal` / `computed` / `effect`) |
| 样式 | SCSS + CSS Custom Properties (60+ design tokens) |
| 图表 | 手写 SVG 交互式图表库（BarChart / DonutChart / LineChart） |
| 通知 | Signal-based Toast Service + Container Component |
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
│   ├── models/         # 数据模型 (Course / Student / Enrollment / Teacher / Notification)
│   ├── services/       # Signal 状态管理 + Toast 服务
│   └── utils/          # CSV 导出 / 数据备份 / 排课检测
├── dashboard/          # 仪表盘 — 指标卡片 + 交互式图表
├── course-list/        # 课程列表 — Glassmorphism 卡片
├── course-detail/      # 课程详情
├── course-edit/        # 课程编辑
├── students/           # 学生管理 — 可排序企业表格
├── student-detail/     # 学生详情
├── student-edit/       # 学生编辑
├── teachers/           # 教师管理
├── enrollments/        # 选课与成绩
├── schedule/           # 教务日程 — 网格日历 + 详情弹窗
├── reports/            # 数据报表
├── analytics/          # 数据分析
├── activity-log/       # 活动日志
├── settings/           # 系统设置
├── sidebar/            # 侧边栏 — 导出/导入 + Toast
└── shared/
    ├── animations/     # 路由过渡动画
    ├── components/     # 图表组件 / PageHero / Toast Container
    └── models/         # 共享类型定义
```
