# AutoDrama - 架构设计文档

## 项目概述

**自动化短剧制作系统**

用户输入主题/创意 → AI编写剧本 → AI生成分镜(含资产) → AI生成视频片段 → 自动拼接成片

---

## 技术栈

| 层级 | 技术选型 |
|-----|---------|
| 前端 | Next.js 15 (App Router) + TypeScript + Tailwind CSS |
| 后端 | Next.js API Routes |
| 数据库 | Supabase (PostgreSQL) |
| 认证 | Supabase Auth |
| 文件存储 | Supabase Storage |
| LLM | 智谱AI GLM-4 (剧本创作 + 分镜生成) |
| 视频生成 | 火山引擎 Seedance |
| 视频拼接 | FFmpeg.wasm 或云端服务 |

---

## 1. 系统架构图

```mermaid
graph TB
    subgraph Frontend["前端 (Next.js)"]
        UI[用户界面]
        Pages[页面路由]
        Components[组件库]
    end

    subgraph Backend["后端 (Next.js API)"]
        API[API Routes]
        Services[业务服务层]
    end

    subgraph Supabase["Supabase"]
        Auth[认证服务]
        DB[(PostgreSQL)]
        Storage[对象存储]
    end

    subgraph External["外部AI服务"]
        Zhipu[智谱AI GLM<br/>剧本+分镜]
        VolcVideo[火山引擎 Seedance<br/>视频生成]
    end

    UI --> Pages
    Pages --> Components
    UI --> API
    UI --> Auth
    API --> Services
    Services --> Auth
    Services --> DB
    Services --> Storage
    Services --> Zhipu
    Services --> VolcVideo
```

---

## 2. 核心业务流程图

```mermaid
flowchart TD
    Start([用户开始]) --> Auth{已登录?}
    Auth -->|否| Login[登录/注册]
    Auth -->|是| CreateProject[创建项目]
    Login --> CreateProject

    %% 阶段1: 剧本创作
    CreateProject --> ScriptEditor[剧本编辑器]
    ScriptEditor --> WriteScript{编写方式}
    WriteScript -->|手动编写| ManualScript[手动输入剧本]
    WriteScript -->|AI辅助| AIScript[AI生成剧本]
    AIScript --> EditScript[编辑/确认剧本]
    ManualScript --> EditScript
    EditScript --> ConfirmScript{确认剧本?}
    ConfirmScript -->|不满意| ScriptEditor
    ConfirmScript -->|满意| GenerateScenes[生成分镜]

    %% 阶段2: 分镜生成
    GenerateScenes --> AIProcessScenes[AI拆解分镜]
    AIProcessScenes --> ExtractAssets[提取形象资产]
    ExtractAssets --> ShowScenes[显示分镜列表]
    ShowScenes --> EditScenes[编辑分镜详情]
    EditScenes --> ConfirmScenes{确认所有分镜?}
    ConfirmScenes -->|不满意| RegenerateScenes[重新生成]
    RegenerateScenes --> AIProcessScenes
    ConfirmScenes -->|满意| GenerateVideos[生成视频片段]

    %% 阶段3: 视频生成
    GenerateVideos --> VideoLoop[批量生成视频]
    VideoLoop --> PollVideos[轮询视频状态]
    PollVideos --> ShowVideos[显示所有视频]
    ShowVideos --> ReviewVideos{逐个确认视频}
    ReviewVideos -->|某个不满意| RegenerateVideo[重新生成该视频]
    RegenerateVideo --> PollVideos
    ReviewVideos -->|全部满意| ConcatVideos[拼接成片]

    %% 阶段4: 拼接成片
    ConcatVideos --> FinalVideo[生成最终短片]
    FinalVideo --> Download[下载/分享]
    Download --> End([结束])
```

### 项目阶段流转

```mermaid
stateDiagram-v2
    [*] --> draft: 创建项目
    draft --> script: 开始编写剧本
    script --> scenes: 确认剧本，生成分镜
    scenes --> videos: 确认所有分镜，生成视频
    videos --> completed: 确认所有视频，拼接成片
    completed --> [*]
```

---

## 3. 数据模型图

```mermaid
erDiagram
    auth_users ||--o{ projects : creates
    projects ||--o| scripts : has
    projects ||--o{ scenes : contains
    projects ||--o{ assets : has
    scenes ||--o| videos : has
    scenes ||--o{ scene_assets : references
    assets ||--o{ scene_assets : referenced_by
    projects ||--o| final_videos : produces

    auth_users {
        uuid id PK
        string email
        string encrypted_password
        datetime created_at
    }

    projects {
        uuid id PK
        uuid user_id FK
        string title
        string stage "draft/script/scenes/videos/completed"
        datetime created_at
        datetime updated_at
    }

    scripts {
        uuid id PK
        uuid project_id FK
        text content "剧本内容"
        boolean ai_generated "是否AI生成"
        datetime created_at
        datetime updated_at
    }

    scenes {
        uuid id PK
        uuid project_id FK
        int order_index "分镜顺序"
        text scene_description "场景描述"
        text character_description "人物描述"
        text dialogue "对话内容"
        string video_status "pending/processing/completed/failed"
        boolean confirmed "是否已确认"
        datetime created_at
    }

    scene_assets {
        uuid scene_id FK
        uuid asset_id FK
    }

    assets {
        uuid id PK
        uuid project_id FK
        string name "资产名称"
        string asset_type "character/prop/background"
        text description "描述"
        string image_url "图片URL"
        string storage_path "存储路径"
        datetime created_at
    }

    videos {
        uuid id PK
        uuid scene_id FK
        string url "公开URL"
        string storage_path "Storage路径"
        int duration "时长(秒)"
        string task_id "任务ID"
        datetime created_at
    }

    final_videos {
        uuid id PK
        uuid project_id FK
        string url "公开URL"
        string storage_path "Storage路径"
        int duration "时长(秒)"
        string status "pending/processing/completed/failed"
        datetime created_at
    }
```

### 状态流转说明

| 字段 | 可能值 | 说明 |
|-----|-------|------|
| project.stage | draft | 刚创建 |
| | script | 剧本阶段 |
| | scenes | 分镜阶段 |
| | videos | 视频阶段 |
| | completed | 全部完成 |
| scene.video_status | pending | 等待生成视频 |
| | processing | 视频生成中 |
| | completed | 视频已生成 |
| | failed | 生成失败 |
| final_video.status | pending | 等待拼接 |
| | processing | 拼接中 |
| | completed | 拼接完成 |
| | failed | 拼接失败 |

---

## 4. 页面结构图

```mermaid
graph TB
    subgraph Auth["认证页面"]
        LoginPage[登录页 /login]
        RegisterPage[注册页 /register]
    end

    subgraph Main["主要页面"]
        HomePage[首页 /]
        ProjectsPage[项目列表 /projects]
        CreatePage[创建项目 /create]
    end

    subgraph ProjectDetail["项目详情页面"]
        ScriptPage[剧本编辑 /projects/:id/script]
        ScenesPage[分镜编辑 /projects/:id/scenes]
        AssetsPage[资产管理 /projects/:id/assets]
        VideosPage[视频生成 /projects/:id/videos]
        FinalPage[最终成片 /projects/:id/final]
    end

    HomePage --> CreatePage
    HomePage --> ProjectsPage
    LoginPage --> HomePage
    RegisterPage --> LoginPage
    ProjectsPage --> ScriptPage
    CreatePage --> ScriptPage

    ScriptPage --> ScenesPage
    ScenesPage --> VideosPage
    VideosPage --> FinalPage
    ScenesPage --> AssetsPage
```

---

## 5. API 设计

### 项目 API

| 方法 | 路径 | 描述 |
|-----|------|-----|
| POST | /api/projects | 创建项目 |
| GET | /api/projects | 获取项目列表 |
| GET | /api/projects/:id | 获取项目详情 |
| PATCH | /api/projects/:id | 更新项目 |
| DELETE | /api/projects/:id | 删除项目 |

### 剧本 API

| 方法 | 路径 | 描述 |
|-----|------|-----|
| GET | /api/projects/:id/script | 获取剧本 |
| POST | /api/projects/:id/script | 创建/更新剧本 |
| POST | /api/generate/script | AI生成剧本 |

### 分镜 API

| 方法 | 路径 | 描述 |
|-----|------|-----|
| GET | /api/projects/:id/scenes | 获取分镜列表 |
| PATCH | /api/scenes/:id | 修改分镜 |
| POST | /api/scenes/:id/confirm | 确认分镜 |
| POST | /api/scenes/confirm-all | 确认所有分镜 |
| POST | /api/generate/scenes | AI生成分镜 |

### 资产 API

| 方法 | 路径 | 描述 |
|-----|------|-----|
| GET | /api/projects/:id/assets | 获取资产列表 |
| POST | /api/assets | 创建资产 |
| PATCH | /api/assets/:id | 更新资产 |
| DELETE | /api/assets/:id | 删除资产 |

### 视频 API

| 方法 | 路径 | 描述 |
|-----|------|-----|
| POST | /api/generate/video/:sceneId | 为单个分镜创建视频任务 |
| GET | /api/generate/video/:taskId | 查询视频任务状态 |
| POST | /api/generate/videos | 批量创建所有分镜视频任务 |
| POST | /api/videos/:id/confirm | 确认视频 |
| POST | /api/videos/confirm-all | 确认所有视频 |

### 拼接 API

| 方法 | 路径 | 描述 |
|-----|------|-----|
| POST | /api/projects/:id/concat | 触发拼接任务 |
| GET | /api/projects/:id/concat | 查询拼接状态 |

---

## 6. 外部 API 集成

### 6.1 智谱AI GLM (剧本创作 + 分镜生成)

```
端点: https://open.bigmodel.cn/api/paas/v4/chat/completions
认证: Bearer Token
模型: glm-4
```

#### 剧本创作 Prompt

```
你是一位专业的短剧编剧。根据用户提供的主题/创意，编写一个短剧剧本。

要求：
1. 剧本时长约 1-3 分钟
2. 包含清晰的场景描述和人物对话
3. 情节紧凑，有起承转合
4. 输出格式为标准剧本格式

主题：{user_input}
```

#### 分镜生成 Prompt

```
你是一位专业的分镜师。将以下剧本拆解成多个分镜。

对于每个分镜，你需要提供：
1. scene_description: 场景描述（环境、时间、氛围）
2. character_description: 人物描述（外貌、表情、动作、服装）
3. dialogue: 对话内容（说话人和台词）
4. assets: 出现的形象资产列表，每个资产包含：
   - name: 资产名称
   - type: 类型 (character/prop/background)
   - description: 详细描述

请以 JSON 格式输出分镜列表。

剧本：
{script_content}
```

### 6.2 火山引擎 Seedance (视频生成)

```
创建任务: POST https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks
查询任务: GET https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/{task_id}
认证: Bearer Token
模型: doubao-seedance-1-5-pro-251215
```

请求示例:
```json
{
  "model": "doubao-seedance-1-5-pro-251215",
  "content": [
    {
      "type": "text",
      "text": "场景描述 + 人物描述 + 动作描述"
    }
  ],
  "generate_audio": true,
  "ratio": "adaptive",
  "duration": 5,
  "watermark": false
}
```

---

## 7. 环境变量

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 智谱AI
ZHIPU_API_KEY=your_zhipu_api_key

# 火山引擎
VOLC_API_KEY=your_volc_api_key
```

---

## 8. 目录结构

```
autodrama/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (main)/
│   │   │   ├── page.tsx              # 首页
│   │   │   ├── projects/page.tsx     # 项目列表
│   │   │   ├── create/page.tsx       # 创建项目
│   │   │   └── projects/[id]/
│   │   │       ├── script/page.tsx   # 剧本编辑
│   │   │       ├── scenes/page.tsx   # 分镜编辑
│   │   │       ├── assets/page.tsx   # 资产管理
│   │   │       ├── videos/page.tsx   # 视频生成
│   │   │       └── final/page.tsx    # 最终成片
│   │   ├── api/
│   │   │   ├── projects/
│   │   │   ├── generate/
│   │   │   ├── scenes/
│   │   │   ├── assets/
│   │   │   └── videos/
│   │   ├── layout.tsx
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   └── loading.tsx
│   ├── components/
│   │   ├── auth/
│   │   ├── layout/
│   │   ├── project/
│   │   ├── script/
│   │   ├── scene/
│   │   ├── asset/
│   │   ├── video/
│   │   └── ui/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── ai/
│   │   ├── db/
│   │   ├── video/
│   │   └── utils.ts
│   └── types/
├── supabase/
│   └── migrations/
├── public/
├── .env.local
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```