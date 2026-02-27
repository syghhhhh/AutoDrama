# AutoDrama - 自动化短剧制作系统任务规划

## 项目概述

构建一个自动化短剧制作流水线系统：
**剧本创作 → 分镜生成 → AI视频片段生成 → 视频拼接成片**

---

## 核心差异点（对比参考项目）

| 参考项目 (hello-nextjs) | AutoDrama |
|------------------------|-----------|
| 故事 → 分镜描述 → 图片 → 视频 | 剧本 → 分镜(含资产) → 视频片段 → 拼接成片 |
| 需要图片生成环节 | 跳过图片，直接生成视频 |
| 单独的视频确认 | 最终拼接合成完整短片 |
| 无资产管理 | 需要资产管理（角色形象一致性） |

---

## 技术架构

```
前端: Next.js 15 + TypeScript + Tailwind CSS
后端: Next.js API Routes
数据库: Supabase (PostgreSQL)
文件存储: Supabase Storage
LLM: 智谱AI GLM-4 (剧本创作 + 分镜生成)
视频生成: 火山引擎 Seedance / 可灵 AI
视频拼接: FFmpeg.wasm 或云端服务
```

---

## 阶段划分

### Phase 1: 基础架构 (任务 1-6)
- 项目初始化与配置
- 数据库设计
- Supabase 客户端封装
- 用户认证系统

### Phase 2: AI服务集成 (任务 7-9)
- 智谱AI 剧本生成分镜 API
- 视频生成 API (火山引擎/可灵)
- 视频拼接服务

### Phase 3: 数据层 (任务 10-12)
- 项目 CRUD
- 分镜数据访问
- 资产数据访问

### Phase 4: API层 (任务 13-16)
- 项目管理 API
- 剧本生成分镜 API
- 视频生成 API
- 视频拼接 API

### Phase 5: 前端UI (任务 17-23)
- 首页与导航
- 项目列表
- 剧本编辑器
- 分镜编辑器
- 视频生成与预览
- 资产管理界面
- 最终成片导出

### Phase 6: 完善与测试 (任务 24-27)
- 错误处理
- Loading状态
- 响应式设计
- 最终测试

---

## 详细任务列表

### Phase 1: 基础架构

#### 任务 1: 项目初始化
- 创建 Next.js 15 项目
- 配置 TypeScript + Tailwind CSS
- 安装核心依赖
- 创建 .env.local 模板

#### 任务 2: 数据库 Schema 设计
- projects 表 (项目)
- scripts 表 (剧本)
- scenes 表 (分镜，含资产编号)
- assets 表 (形象资产)
- videos 表 (视频片段)
- final_videos 表 (最终成片)

#### 任务 3: Supabase 客户端封装
- 服务端客户端
- 浏览器客户端
- 中间件集成

#### 任务 4: 用户认证 - 登录
- 登录页面
- 登录表单组件

#### 任务 5: 用户认证 - 注册
- 注册页面
- 注册表单组件

#### 任务 6: 认证中间件
- 路由保护
- 自动重定向

---

### Phase 2: AI服务集成

#### 任务 7: 智谱AI 封装
- 剧本创作 prompt
- 分镜生成 prompt (含资产提取)
- API 调用封装

#### 任务 8: 视频生成 API 封装
- 火山引擎 Seedance 集成
- 或可灵 AI 集成
- 任务状态查询

#### 任务 9: 视频拼接服务
- FFmpeg.wasm 集成 或
- 云端视频拼接服务
- 片段顺序编排

---

### Phase 3: 数据层

#### 任务 10: 项目数据访问
- CRUD 操作
- 阶段状态管理

#### 任务 11: 分镜数据访问
- 分镜 CRUD
- 资产关联
- 确认状态

#### 任务 12: 资产数据访问
- 资产 CRUD
- 资产-分镜关联

---

### Phase 4: API层

#### 任务 13: 项目管理 API
- 创建/读取/更新/删除项目

#### 任务 14: 剧本与分镜 API
- 保存剧本
- 生成/重新生成分镜
- 编辑分镜
- 确认分镜

#### 任务 15: 视频生成 API
- 单个分镜视频生成
- 批量视频生成
- 状态查询

#### 任务 16: 视频拼接 API
- 触发拼接任务
- 查询拼接状态
- 下载最终成片

---

### Phase 5: 前端UI

#### 任务 17: 首页与导航
- 导航栏组件
- 首页布局

#### 任务 18: 项目列表页
- 项目卡片
- 分页加载

#### 任务 19: 剧本编辑器
- 剧本输入/编辑
- AI辅助创作按钮
- 自动保存

#### 任务 20: 分镜编辑器
- 分镜列表展示
- 分镜编辑 (场景、人物、对话、资产)
- 资产选择器
- 确认/重新生成

#### 任务 21: 资产管理界面
- 资产库展示
- 资产上传
- 资产编辑

#### 任务 22: 视频生成与预览
- 生成按钮
- 进度显示
- 视频预览
- 重新生成

#### 任务 23: 最终成片导出
- 拼接触发
- 进度显示
- 预览与下载

---

### Phase 6: 完善与测试

#### 任务 24: 错误处理
- 全局错误页面
- API错误处理
- Toast提示

#### 任务 25: Loading状态
- 加载组件
- 骨架屏

#### 任务 26: 响应式设计
- 移动端适配

#### 任务 27: 最终测试
- lint/build
- 完整流程测试
- 性能优化

---

## 数据模型设计

```
projects (项目)
├── id: uuid
├── user_id: uuid
├── title: string
├── stage: draft/script/scenes/videos/completed
└── created_at, updated_at

scripts (剧本)
├── id: uuid
├── project_id: uuid
├── content: text
├── ai_generated: boolean
└── created_at, updated_at

scenes (分镜)
├── id: uuid
├── project_id: uuid
├── order_index: int
├── scene_description: text (场景描述)
├── character_description: text (人物描述)
├── dialogue: text (对话内容)
├── asset_ids: uuid[] (关联资产)
├── video_status: pending/processing/completed/failed
├── confirmed: boolean
└── created_at

assets (形象资产)
├── id: uuid
├── project_id: uuid
├── name: string
├── description: text
├── image_url: string
├── asset_type: character/prop/background
└── created_at

videos (视频片段)
├── id: uuid
├── scene_id: uuid
├── url: string
├── duration: int
├── task_id: string
└── created_at

final_videos (最终成片)
├── id: uuid
├── project_id: uuid
├── url: string
├── duration: int
├── status: pending/processing/completed/failed
└── created_at
```

---

## Git 工作流

每次完成任务后：
1. 更新 task.json (passes: true)
2. 更新 progress.txt
3. 提交所有更改：
   ```bash
   git add .
   git commit -m "[任务标题] - completed"
   git push
   ```

---

## 阻塞处理

如果遇到以下情况需要人工介入：
- .env.local 需要真实 API 密钥
- Supabase 项目需要创建
- 外部服务需要开通

阻塞时：
- 不提交 git
- 不标记 passes: true
- 在 progress.txt 记录阻塞原因
- 输出清晰的阻塞信息