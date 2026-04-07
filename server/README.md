# Aurora Course Manager API

这是 `Aurora Course Manager` 的 Python 后端，采用 `FastAPI + SQLAlchemy + Alembic + Pydantic Settings`。

## 当前阶段

当前已完成前后端分离第一阶段，并已通过实际联调验证：

- FastAPI 应用入口与统一 API 路由
- 配置加载与 CORS 基线
- SQLite 数据库 engine / session 基线
- Alembic 初始化迁移与班级扩展迁移
- `/api/v1/health` 健康检查
- `classes` 资源的列表 / 详情 / 创建 / 删除接口
- 标准场景 seed 导入脚本
- pytest 健康检查样例

## 目录结构

- `app/main.py` — FastAPI 应用入口
- `app/api/router.py` — API 总路由
- `app/api/routes/health.py` — 健康检查路由
- `app/api/routes/classes.py` — 班级 REST 路由
- `app/core/config.py` — 应用配置
- `app/db/session.py` — 数据库 engine / session
- `app/services/seed_loader.py` — 标准 workspace 数据导入
- `scripts/import_seed.py` — 种子数据导入脚本
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

## 当前 API 说明

### Health

- `GET /api/v1/health`

返回服务状态、版本、环境与 API 前缀。

### Classes

- `GET /api/v1/classes`
- `GET /api/v1/classes/{class_id}`
- `POST /api/v1/classes`
- `DELETE /api/v1/classes/{class_id}`

说明：

- 删除不存在班级会返回 `404`
- 删除仍有关联学生的班级会返回 `409`
- 班级编号重复创建会返回 `409`

## 测试

在 `server/` 目录执行：

```bash
pytest
```

后续将在该骨架上继续补充：数据库迁移、领域实体、核心 CRUD、鉴权与审计。
