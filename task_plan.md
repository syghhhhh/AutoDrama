# AutoDrama - 任务规划

## 项目定位

**这是一个软件开发项目**，目标是构建一个"自动化AI短剧制作系统"。

**Agent 的角色**：作为开发助手，帮助构建这个系统的代码、数据库、API、前端界面。

---

## 系统功能概述

构建的系统将支持：
- 创建短剧系列，编写大纲
- 设定角色和场景
- 生成美术资产（角色三视图、场景参考图）
- 创作剧集（剧本 → 分镜脚本 → 分镜参考图 → 分镜视频 → 拼接成片）

**核心流程**：系列大纲 → 角色场景设定 → 美术资产生成 → 剧集创作

---

## 外部 API 集成

| 功能 | API | 说明 |
|-----|-----|-----|
| 大模型 | **Poe API** | 大纲生成、剧本生成、分镜脚本生成 |
| 图片生成 | **火山引擎即梦** | 角色三视图、场景图、分镜参考图 |
| 视频生成 | **可灵 API** | 分镜视频生成 |

---

## 核心差异点（对比参考项目）

| 参考项目 (hello-nextjs) | AutoDrama |
|------------------------|-----------|
| 单个项目 = 单个剧本 | 系列 → 多个剧集 |
| 故事 → 分镜描述 → 图片 → 视频 | 大纲 → 角色/场景 → 资产 → 剧集 |
| 无资产管理 | 需要资产管理（角色三视图、场景图） |
| 智谱AI + 火山引擎Seedream/Seedance | Poe + 火山引擎即梦 + 可灵 |
| 剧本 → 分镜 → 视频 | 剧本 → 分镜脚本 → 分镜参考图 → 分镜视频 → 成片 |

---

## 技术架构

```
前端: Next.js 15 + TypeScript + Tailwind CSS
后端: Next.js API Routes
数据库: Supabase (PostgreSQL)
文件存储: Supabase Storage
LLM: Poe API (大纲创作 + 剧本生成 + 分镜脚本生成)
图片生成: 火山引擎即梦 API (角色三视图、场景图、分镜参考图)
视频生成: 可灵 API
视频拼接: FFmpeg (本地处理)
```

---

## 阶段划分

### Phase 1: 基础架构 (任务 1-8)
- 项目初始化与配置
- 数据库设计（系列+剧集相关表）
- Supabase 客户端封装
- 用户认证系统

### Phase 2: AI服务集成 (任务 9-12)
- Poe API (大纲+剧本+分镜脚本生成)
- 火山引擎即梦 API (角色三视图、场景图、分镜参考图)
- 可灵 API (视频生成)
- 视频拼接服务

### Phase 3: 数据层 (任务 13-23)
- 系列数据访问
- 大纲数据访问
- 角色/场景数据访问
- 美术资产数据访问
- 剧集数据访问
- 剧本/分镜脚本/参考图/视频数据访问

### Phase 4: API层 (任务 24-34)
- 系列管理 API
- 大纲 API
- 角色/场景 API
- 美术资产生成 API
- 剧集管理 API
- 剧本 API
- 分镜脚本 API
- 分镜参考图 API
- 分镜视频 API
- 成片拼接 API

### Phase 5: 前端UI (任务 35-50)
- 首页与导航
- 系列列表与创建
- 大纲编辑器
- 角色设定页面
- 场景设定页面
- 美术资产页面
- 剧集列表页面
- 剧本编写页面
- 分镜脚本页面
- 分镜参考图页面
- 分镜视频页面
- 成片预览页面
- 阶段指示器
- 状态更新

### Phase 6: 完善与测试 (任务 51-54)
- 错误处理
- Loading状态
- 响应式设计
- 最终测试

---

## 数据模型概览

```
series (短剧系列)
├── id, user_id, title, description
├── art_style (美术风格)
├── world_setting (世界观)
├── total_episodes (总集数)
└── stage (阶段)

outlines (大纲)
├── id, series_id
├── content (大纲内容)
└── episode_outlines (各集梗概 JSON)

characters (角色)
├── id, series_id
├── name, role, appearance, personality, background
└── confirmed

character_images (角色图片)
├── id, character_id
├── view_type (front/side/back)
└── url, task_id, status

world_scenes (场景)
├── id, series_id
├── name, description, atmosphere
└── confirmed

scene_images (场景图片)
├── id, world_scene_id
├── url, task_id, status, order_index

episodes (剧集)
├── id, series_id
├── episode_number, title, synopsis
└── stage

scripts (剧本)
├── id, episode_id
├── content, ai_generated, confirmed

episode_scenes (分镜脚本)
├── id, episode_id
├── order_index, scene_description, character_description
├── dialogue, action_description
├── image_status, video_status, confirmed

scene_reference_images (分镜参考图)
├── id, episode_scene_id
├── url, task_id, status

scene_assets (分镜资产关联)
├── episode_scene_id, character_id, world_scene_id

scene_videos (分镜视频)
├── id, episode_scene_id
├── url, duration, task_id, status

episode_videos (剧集成片)
├── id, episode_id
├── url, duration, status
```

---

## 用户流程（最终系统用户）

```mermaid
graph LR
    A[创建系列] --> B[编写大纲]
    B --> C[设定角色]
    C --> D[设定场景]
    D --> E[生成美术资产]
    E --> F[创作剧集1]
    F --> G[创作剧集2]
    G --> H[...]
    H --> I[系列完成]

    subgraph 创作剧集
        F1[编写剧本] --> F2[分镜脚本]
        F2 --> F3[分镜参考图]
        F3 --> F4[分镜视频]
        F4 --> F5[拼接成片]
    end
```

---

## 开发工作流（Agent 必须遵循）

每个 Task 必须按照以下顺序完整执行，缺一不可：

### Step 1: 恢复上下文
- 读取 task.json 了解任务状态
- 读取 progress.txt 了解最新进展

### Step 2: 代码编写
- 阅读 task.json 中任务描述和步骤
- 实现功能代码
- 确保代码符合项目规范

### Step 3: 初次提交（代码完成后）
```bash
git add .
git commit -m "[Task X] [任务标题] - 初版实现"
git push
```

### Step 4: 测试验证
- 运行 `npm run lint` 检查代码规范
- 运行 `npm run build` 确保构建成功
- **UI 修改必须在浏览器中测试**
- 验证功能正常工作

### Step 5: 更新文档
- 更新 `progress.txt` 记录工作内容
- 更新 `task.json` 将 `"passes": false` 改为 `"passes": true`

### Step 6: 最终提交（测试和文档完成后）
```bash
git add .
git commit -m "[Task X] [任务标题] - 完成"
git push
```

---

## Git 提交规则总结

**每个 Task 需要两次提交**：

| 提交时机 | Commit Message | 内容 |
|---------|----------------|------|
| 代码编写完成 | `[Task X] [标题] - 初版实现` | 代码文件 |
| 测试+文档完成 | `[Task X] [标题] - 完成` | task.json, progress.txt |

---

## Task 完成检查清单

```
□ 恢复上下文（读取 task.json, progress.txt）
□ 代码编写完成
□ 初次提交（初版实现）
□ 测试验证通过（lint + build + 浏览器测试）
□ progress.txt 已更新
□ task.json passes 已改为 true
□ 最终提交（完成）
```

---

## 阻塞处理

如果遇到以下情况需要人工介入：
- .env.local 需要真实 API 密钥
- Supabase 项目需要创建
- 外部服务需要开通

阻塞时：
- **不提交 git**（即使是初版）
- 不标记 passes: true
- 在 progress.txt 记录阻塞原因
- 输出清晰的阻塞信息