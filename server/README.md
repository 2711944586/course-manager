# Aurora Course Manager API

这是 `Aurora Course Manager` 的 Python 后端，采用 `FastAPI + SQLAlchemy + Alembic + Pydantic Settings`。

## 当前阶段

当前已完成前后端分离第一阶段，并已通过实际联调验证：

- FastAPI 应用入口与统一 API 路由
- 配置加载、根目录 `.env` / `server/.env` 双层环境读取、开发态 `42xx` 端口 CORS 兼容
- SQLite 数据库 engine / session 基线
- Alembic 初始化迁移与班级扩展迁移
- `/api/v1/health` 健康检查
- `classes / teachers / courses / students / enrollments / analytics` 资源路由
- 标准场景 seed 导入脚本
- 启动前数据库基础数据检查脚本
- pytest 健康检查样例

## 目录结构

- `app/main.py` — FastAPI 应用入口
- `app/api/router.py` — API 总路由
- `app/api/routes/health.py` — 健康检查路由
- `app/api/routes/classes.py` — 班级 REST 路由
- `app/api/routes/courses.py` — 课程 REST 路由
- `app/api/routes/students.py` — 学生 REST 路由
- `app/api/routes/teachers.py` — 教师 REST 路由
- `app/api/routes/enrollments.py` — 选课 REST 路由
- `app/api/routes/analytics.py` — 仪表盘摘要接口
- `app/core/config.py` — 应用配置
- `app/db/session.py` — 数据库 engine / session
- `app/services/seed_loader.py` — 标准 workspace 数据导入
- `scripts/import_seed.py` — 种子数据导入脚本
- `scripts/check_seed_needed.py` — 判断数据库是否需要导种子
- `tests/test_health.py` — 最小后端测试

## 已验证的本地运行方式

### 1. 安装依赖

在 `server/` 目录安装后端依赖：

```bash
pip install -e .[dev]
```

### 2. 配置环境变量

- 后端优先读取仓库根 `.env`
- 也支持使用 `server/.env`
- 示例模板见 `server/.env.example`

默认开发配置使用：

- `sqlite:///server/data/aurora.db`
- `http://127.0.0.1:4200`
- `http://localhost:4200`
- `http://127.0.0.1:42xx / http://localhost:42xx`（通过 `AURORA_CORS_ORIGIN_REGEX` 覆盖）

### 3. 执行数据库迁移

在仓库根目录执行：

```bash
python -m alembic -c server/alembic.ini upgrade head
```

### 4. 导入标准种子数据

在仓库根目录执行：

```bash
python server/scripts/import_seed.py
```

默认会导入 `scripts/seed/output/standard-workspace.json`，并同步写入班级、教师、课程、学生、选课与活动日志。

### 5. 启动服务

在 `server/` 目录执行：

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 6. 验证接口

- 健康检查：`GET /api/v1/health`
- 班级列表：`GET /api/v1/classes`
- 课程列表：`GET /api/v1/courses`
- 学生列表：`GET /api/v1/students`
- 教师列表：`GET /api/v1/teachers`
- 选课列表：`GET /api/v1/enrollments`
- OpenAPI / Swagger：`GET /api/v1/docs`

## 当前 API 说明

### Health

- `GET /api/v1/health`

返回服务状态、版本、环境与 API 前缀。

### Core Resources

- `GET /api/v1/classes` / `GET /api/v1/classes/{class_id}` / `POST /api/v1/classes` / `DELETE /api/v1/classes/{class_id}`
- `GET /api/v1/courses` / `GET /api/v1/courses/{course_id}` / `POST /api/v1/courses` / `PUT /api/v1/courses/{course_id}` / `DELETE /api/v1/courses/{course_id}`
- `GET /api/v1/students` / `GET /api/v1/students/{student_id}` / `POST /api/v1/students` / `PUT /api/v1/students/{student_id}` / `DELETE /api/v1/students/{student_id}`
- `GET /api/v1/teachers` / `GET /api/v1/teachers/{teacher_id}` / `POST /api/v1/teachers` / `PUT /api/v1/teachers/{teacher_id}` / `DELETE /api/v1/teachers/{teacher_id}`
- `GET /api/v1/enrollments` / `GET /api/v1/enrollments/{enrollment_id}` / `POST /api/v1/enrollments` / `PUT /api/v1/enrollments/{enrollment_id}` / `DELETE /api/v1/enrollments/{enrollment_id}`
- `GET /api/v1/analytics/dashboard`

说明：

- 删除仍有关联学生的班级会返回 `409`
- 课程写接口支持通过 `teacherId` 写入，并兼容 `instructor` 名称解析过渡
- 学生与课程创建/更新的 `updatedAt` 由服务端生成
- SQLite 已显式开启外键约束，避免本地开发环境出现悬挂引用

## 测试

在 `server/` 目录执行：

```bash
pytest
```

后续将在该骨架上继续补充：分析接口扩展、活动日志/通知服务端化、鉴权与审计。
