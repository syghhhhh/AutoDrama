# AutoDrama - 探索发现

## 参考项目分析 (auto-coding-agent-demo)

### 项目结构
```
auto-coding-agent-demo/
├── CLAUDE.md          # Agent 工作流指令
├── task.json          # 任务定义
├── progress.txt       # 进度记录
├── init.sh            # 初始化脚本
├── architecture.md    # 架构设计
├── run-automation.sh  # 自动化运行脚本
├── hello-nextjs/      # Next.js 应用
└── supabase/          # 数据库 migration
```

### 关键模式

#### 1. CLAUDE.md 工作流
- Step 1: 初始化环境 (./init.sh)
- Step 2: 选择任务 (从 task.json)
- Step 3: 实现任务
- Step 4: 测试验证 (lint + build + 浏览器测试)
- Step 5: 更新 progress.txt
- Step 6: 提交更改 (包含 task.json 更新)

#### 2. task.json 格式
```json
{
  "project": "项目名称",
  "description": "项目描述",
  "tasks": [
    {
      "id": 1,
      "title": "任务标题",
      "description": "任务描述",
      "steps": ["步骤1", "步骤2"],
      "passes": false
    }
  ]
}
```

#### 3. architecture.md
- 使用 Mermaid 图表
- 包含系统架构、业务流程、数据模型、API设计
- 详细的外部API集成说明

#### 4. 阻塞处理规则
- 不提交 git
- 不标记 passes: true
- 记录阻塞原因到 progress.txt
- 输出清晰的阻塞信息

### 技术栈参考

| 组件 | 技术 |
|-----|-----|
| 前端 | Next.js 14+ (App Router) + TypeScript + Tailwind CSS |
| 后端 | Next.js API Routes |
| 数据库 | Supabase (PostgreSQL) |
| 认证 | Supabase Auth |
| 文件存储 | Supabase Storage |
| LLM | 智谱AI GLM-4.7 |
| 视频生成 | 火山引擎 Seedance |

---

## AutoDrama 特有需求

### 分镜数据结构
每个分镜需要包含：
- 场景描述
- 人物描述
- 对话内容
- 形象资产编号

### 资产管理
需要管理：
- 角色形象（保持一致性）
- 道具
- 场景背景

### 视频拼接
最终需要将多个视频片段拼接成完整短片

---

## 注意事项

1. **不要修改 auto-coding-agent-demo/ 目录** - 仅作为参考
2. **每次任务完成后 git commit + push**
3. **阻塞时停止并请求人工介入**