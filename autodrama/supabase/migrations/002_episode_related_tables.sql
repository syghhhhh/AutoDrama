-- AutoDrama 数据库 Schema - 剧集相关表
-- Migration: 002_episode_related_tables

-- ============================================
-- 剧集表 (episodes)
-- ============================================
CREATE TABLE IF NOT EXISTS episodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_id UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
    episode_number INTEGER NOT NULL,
    title VARCHAR(255),
    synopsis TEXT,
    stage VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 剧集表索引
CREATE INDEX idx_episodes_series_id ON episodes(series_id);
CREATE INDEX idx_episodes_episode_number ON episodes(series_id, episode_number);
CREATE INDEX idx_episodes_stage ON episodes(stage);

-- 剧集表更新时间触发器
CREATE TRIGGER update_episodes_updated_at
    BEFORE UPDATE ON episodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 剧本表 (scripts)
-- ============================================
CREATE TABLE IF NOT EXISTS scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    content TEXT,
    ai_generated BOOLEAN DEFAULT FALSE,
    confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 剧本表索引
CREATE INDEX idx_scripts_episode_id ON scripts(episode_id);
CREATE UNIQUE INDEX idx_scripts_unique_episode ON scripts(episode_id);

-- 剧本表更新时间触发器
CREATE TRIGGER update_scripts_updated_at
    BEFORE UPDATE ON scripts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 分镜脚本表 (episode_scenes)
-- ============================================
CREATE TABLE IF NOT EXISTS episode_scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    scene_description TEXT,
    character_description TEXT,
    dialogue TEXT,
    action_description TEXT,
    image_status VARCHAR(20) DEFAULT 'pending' CHECK (image_status IN ('pending', 'processing', 'completed', 'failed')),
    video_status VARCHAR(20) DEFAULT 'pending' CHECK (video_status IN ('pending', 'processing', 'completed', 'failed')),
    confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 分镜脚本表索引
CREATE INDEX idx_episode_scenes_episode_id ON episode_scenes(episode_id);
CREATE INDEX idx_episode_scenes_order ON episode_scenes(episode_id, order_index);
CREATE INDEX idx_episode_scenes_image_status ON episode_scenes(image_status);
CREATE INDEX idx_episode_scenes_video_status ON episode_scenes(video_status);

-- ============================================
-- 分镜参考图表 (scene_reference_images)
-- ============================================
CREATE TABLE IF NOT EXISTS scene_reference_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    episode_scene_id UUID NOT NULL REFERENCES episode_scenes(id) ON DELETE CASCADE,
    url TEXT,
    storage_path TEXT,
    task_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 分镜参考图表索引
CREATE INDEX idx_scene_reference_images_episode_scene_id ON scene_reference_images(episode_scene_id);
CREATE INDEX idx_scene_reference_images_status ON scene_reference_images(status);
CREATE UNIQUE INDEX idx_scene_reference_images_unique ON scene_reference_images(episode_scene_id);

-- ============================================
-- 分镜资产关联表 (scene_assets)
-- ============================================
CREATE TABLE IF NOT EXISTS scene_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    episode_scene_id UUID NOT NULL REFERENCES episode_scenes(id) ON DELETE CASCADE,
    character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
    world_scene_id UUID REFERENCES world_scenes(id) ON DELETE SET NULL,
    asset_type VARCHAR(50) DEFAULT 'character' CHECK (asset_type IN ('character', 'scene', 'prop')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 分镜资产关联表索引
CREATE INDEX idx_scene_assets_episode_scene_id ON scene_assets(episode_scene_id);
CREATE INDEX idx_scene_assets_character_id ON scene_assets(character_id);
CREATE INDEX idx_scene_assets_world_scene_id ON scene_assets(world_scene_id);

-- ============================================
-- 分镜视频表 (scene_videos)
-- ============================================
CREATE TABLE IF NOT EXISTS scene_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    episode_scene_id UUID NOT NULL REFERENCES episode_scenes(id) ON DELETE CASCADE,
    url TEXT,
    storage_path TEXT,
    duration DECIMAL(10, 2),
    task_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 分镜视频表索引
CREATE INDEX idx_scene_videos_episode_scene_id ON scene_videos(episode_scene_id);
CREATE INDEX idx_scene_videos_status ON scene_videos(status);
CREATE UNIQUE INDEX idx_scene_videos_unique ON scene_videos(episode_scene_id);

-- ============================================
-- 剧集成片表 (episode_videos)
-- ============================================
CREATE TABLE IF NOT EXISTS episode_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    url TEXT,
    storage_path TEXT,
    duration DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 剧集成片表索引
CREATE INDEX idx_episode_videos_episode_id ON episode_videos(episode_id);
CREATE INDEX idx_episode_videos_status ON episode_videos(status);
CREATE UNIQUE INDEX idx_episode_videos_unique ON episode_videos(episode_id);

-- ============================================
-- Row Level Security (RLS) 策略
-- ============================================

-- 启用 RLS
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE episode_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scene_reference_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE scene_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE scene_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE episode_videos ENABLE ROW LEVEL SECURITY;

-- episodes 表策略
CREATE POLICY "Users can view episodes of their series" ON episodes
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM series WHERE series.id = episodes.series_id AND series.user_id = auth.uid())
    );

CREATE POLICY "Users can insert episodes to their series" ON episodes
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM series WHERE series.id = episodes.series_id AND series.user_id = auth.uid())
    );

CREATE POLICY "Users can update episodes of their series" ON episodes
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM series WHERE series.id = episodes.series_id AND series.user_id = auth.uid())
    );

CREATE POLICY "Users can delete episodes of their series" ON episodes
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM series WHERE series.id = episodes.series_id AND series.user_id = auth.uid())
    );

-- scripts 表策略
CREATE POLICY "Users can view scripts of their episodes" ON scripts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM episodes
            JOIN series ON series.id = episodes.series_id
            WHERE episodes.id = scripts.episode_id AND series.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert scripts to their episodes" ON scripts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM episodes
            JOIN series ON series.id = episodes.series_id
            WHERE episodes.id = scripts.episode_id AND series.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update scripts of their episodes" ON scripts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM episodes
            JOIN series ON series.id = episodes.series_id
            WHERE episodes.id = scripts.episode_id AND series.user_id = auth.uid()
        )
    );

-- episode_scenes 表策略
CREATE POLICY "Users can view episode scenes of their series" ON episode_scenes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM episodes
            JOIN series ON series.id = episodes.series_id
            WHERE episodes.id = episode_scenes.episode_id AND series.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert episode scenes to their episodes" ON episode_scenes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM episodes
            JOIN series ON series.id = episodes.series_id
            WHERE episodes.id = episode_scenes.episode_id AND series.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update episode scenes of their series" ON episode_scenes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM episodes
            JOIN series ON series.id = episodes.series_id
            WHERE episodes.id = episode_scenes.episode_id AND series.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete episode scenes of their series" ON episode_scenes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM episodes
            JOIN series ON series.id = episodes.series_id
            WHERE episodes.id = episode_scenes.episode_id AND series.user_id = auth.uid()
        )
    );

-- scene_reference_images 表策略
CREATE POLICY "Users can view scene reference images of their series" ON scene_reference_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM episode_scenes
            JOIN episodes ON episodes.id = episode_scenes.episode_id
            JOIN series ON series.id = episodes.series_id
            WHERE episode_scenes.id = scene_reference_images.episode_scene_id AND series.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert scene reference images to their episodes" ON scene_reference_images
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM episode_scenes
            JOIN episodes ON episodes.id = episode_scenes.episode_id
            JOIN series ON series.id = episodes.series_id
            WHERE episode_scenes.id = scene_reference_images.episode_scene_id AND series.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update scene reference images of their series" ON scene_reference_images
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM episode_scenes
            JOIN episodes ON episodes.id = episode_scenes.episode_id
            JOIN series ON series.id = episodes.series_id
            WHERE episode_scenes.id = scene_reference_images.episode_scene_id AND series.user_id = auth.uid()
        )
    );

-- scene_assets 表策略
CREATE POLICY "Users can view scene assets of their series" ON scene_assets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM episode_scenes
            JOIN episodes ON episodes.id = episode_scenes.episode_id
            JOIN series ON series.id = episodes.series_id
            WHERE episode_scenes.id = scene_assets.episode_scene_id AND series.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert scene assets to their episodes" ON scene_assets
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM episode_scenes
            JOIN episodes ON episodes.id = episode_scenes.episode_id
            JOIN series ON series.id = episodes.series_id
            WHERE episode_scenes.id = scene_assets.episode_scene_id AND series.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete scene assets of their series" ON scene_assets
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM episode_scenes
            JOIN episodes ON episodes.id = episode_scenes.episode_id
            JOIN series ON series.id = episodes.series_id
            WHERE episode_scenes.id = scene_assets.episode_scene_id AND series.user_id = auth.uid()
        )
    );

-- scene_videos 表策略
CREATE POLICY "Users can view scene videos of their series" ON scene_videos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM episode_scenes
            JOIN episodes ON episodes.id = episode_scenes.episode_id
            JOIN series ON series.id = episodes.series_id
            WHERE episode_scenes.id = scene_videos.episode_scene_id AND series.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert scene videos to their episodes" ON scene_videos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM episode_scenes
            JOIN episodes ON episodes.id = episode_scenes.episode_id
            JOIN series ON series.id = episodes.series_id
            WHERE episode_scenes.id = scene_videos.episode_scene_id AND series.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update scene videos of their series" ON scene_videos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM episode_scenes
            JOIN episodes ON episodes.id = episode_scenes.episode_id
            JOIN series ON series.id = episodes.series_id
            WHERE episode_scenes.id = scene_videos.episode_scene_id AND series.user_id = auth.uid()
        )
    );

-- episode_videos 表策略
CREATE POLICY "Users can view episode videos of their series" ON episode_videos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM episodes
            JOIN series ON series.id = episodes.series_id
            WHERE episodes.id = episode_videos.episode_id AND series.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert episode videos to their episodes" ON episode_videos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM episodes
            JOIN series ON series.id = episodes.series_id
            WHERE episodes.id = episode_videos.episode_id AND series.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update episode videos of their series" ON episode_videos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM episodes
            JOIN series ON series.id = episodes.series_id
            WHERE episodes.id = episode_videos.episode_id AND series.user_id = auth.uid()
        )
    );