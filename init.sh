#!/bin/bash

# AutoDrama 初始化脚本

echo "🚀 AutoDrama 项目初始化..."

# 检查 autodrama 目录是否存在
if [ -d "autodrama" ]; then
    echo "✅ autodrama 目录已存在"
else
    echo "📦 创建 Next.js 项目..."
    npx create-next-app@latest autodrama --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
fi

# 进入项目目录
cd autodrama

# 安装额外依赖
echo "📦 安装额外依赖..."
npm install @supabase/supabase-js @supabase/ssr clsx tailwind-merge

# 创建 .env.local 模板
if [ ! -f ".env.local" ]; then
    echo "📝 创建 .env.local 模板..."
    cat > .env.local << 'EOF'
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 智谱AI
ZHIPU_API_KEY=your_zhipu_api_key

# 火山引擎
VOLC_API_KEY=your_volc_api_key
EOF
    echo "⚠️  请编辑 .env.local 填入真实的 API 密钥"
fi

# 创建目录结构
echo "📁 创建目录结构..."
mkdir -p src/lib/supabase
mkdir -p src/lib/ai
mkdir -p src/lib/db
mkdir -p src/lib/video
mkdir -p src/types
mkdir -p src/components/auth
mkdir -p src/components/layout
mkdir -p src/components/project
mkdir -p src/components/script
mkdir -p src/components/scene
mkdir -p src/components/asset
mkdir -p src/components/video
mkdir -p src/components/ui
mkdir -p supabase/migrations

# 创建 utils.ts
if [ ! -f "src/lib/utils.ts" ]; then
    echo "📝 创建 utils.ts..."
    cat > src/lib/utils.ts << 'EOF'
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
EOF
fi

# 启动开发服务器
echo "🚀 启动开发服务器..."
npm run dev &

echo ""
echo "✅ 初始化完成!"
echo ""
echo "📝 下一步:"
echo "   1. 编辑 autodrama/.env.local 填入 API 密钥"
echo "   2. 创建 Supabase 项目并运行数据库迁移"
echo "   3. 访问 http://localhost:3000 查看应用"
echo ""