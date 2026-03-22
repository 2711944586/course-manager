# Aurora Course Manager

一个基于 Angular 17 + Angular Material 的纯前端课程管理台。  
当前版本已经升级为 `Aurora Night Deck` 界面体系：顶部 `Command Strip`、底部悬浮 `Dock`、亮暗双主题玻璃工作台、本地智能洞察与零后端数据持久化。

仓库地址：<https://github.com/2711944586/course-manager>

## Highlights

- `Mission Control` 首页：指标总览、风险雷达、推荐动作、运营时间线、最近工作区
- `Courses / Students` 工作台：搜索、筛选、排序、CRUD、局部预览、独立详情与编辑页
- `Analytics` 智能洞察：概览 / 对比 / 智能洞察三页签，本地计算 + AI Provider 占位层
- `Schedule` 周课表：按周一到周日自动分组，点击卡片弹出居中的课程详情弹层
- `Settings` 系统中心：主题切换、数据导出/导入/重置、AI Provider 状态区
- 顶部全局搜索：支持 `Ctrl+K`
- 底部悬浮 Dock：`Dashboard / Courses / Students / Analytics / Schedule / Settings`

## 技术栈

- Angular 17
- Angular Material
- Standalone Components
- Signals
- localStorage 持久化

## 本次重构重点

- 壳层升级为极夜玻璃舰桥风格
- 默认暗色主题，亮色主题同步完成细节适配
- 表单、下拉、通知面板、快捷指令面板、Dock、浮层统一走主题 token
- 修复页面滚动、路由切换、启动端口冲突、localStorage 脏数据容错等问题
- 周课表详情弹层改为真正居中显示，不再出现点击后偏右偏下
- Dock 悬浮标签去重，不再与额外 tooltip 重叠

## 快速开始

```bash
npm install
npm run start
```

自动打开浏览器：

```bash
npm run start:open
```

开发脚本会自动寻找空闲端口，不再强依赖 `4200`。启动后以终端输出的地址为准。

## 常用脚本

```bash
npm run start          # 自动选择可用端口启动开发服务器
npm run start:open     # 自动选择可用端口并打开浏览器
npm run start:raw      # 直接用 4200 启动 ng serve
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

### Analytics

- 概览 / 对比 / 智能洞察三页签
- 本地风险雷达、趋势洞察、推荐动作
- AI Provider 配置状态占位

### Schedule

- 自动生成周课表
- 排课提醒与活跃课程统计
- 点击课程卡片查看居中详情弹层

### Settings

- 亮暗主题切换
- 本地数据导出 / 导入 / 清理 / 重置
- AI Provider 占位配置
- 系统信息展示

## 数据与存储

- 所有业务数据默认保存在 `localStorage`
- Settings 页可导出 JSON 备份
- Settings 页可重置课程、学生、教师、选课、活动日志、通知、最近工作区、AI stub
- 项目内置种子课程、教师和学生演示数据

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

- 这是纯前端项目，没有真实后端和鉴权系统
- AI 相关功能当前只做前端接口预留，不会发起真实 OpenAI 请求
- 如果浏览器仍停留在旧缓存页面，重新执行 `npm run start` 后强制刷新即可
