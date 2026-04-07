# Scenario Seeds

运行 `npm run seed:scenarios` 会在 `scripts/seed/output/` 下生成三套可直接导入或演示的场景包：

- `standard-workspace.json`：标准教学运营场景
- `stress-workspace.json`：高容量压力场景
- `anomaly-workspace.json`：异常与风险排查场景

每个场景包都包含：

- `courses`
- `students`
- `teachers`
- `enrollments`
- `notifications`
- `activities`

这些数据结构与当前前端存储模型对齐，可作为前后端联调、演示和回归测试的基础样本。
