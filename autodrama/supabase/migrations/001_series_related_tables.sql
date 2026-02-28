-- AutoDrama 数据库 Schema - 系列相关表
-- Migration: 001_series_related_tables

-- ============================================
-- 系列表 (series)
-- ============================================
CREATE TABLE IF NOT EXISTS series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    art_style VARCHAR(100),
    world_setting TEXT,
    total_episodes INTEGER DEFAULT 10,
    stage VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 系列表索引
CREATE INDEX idx_series_user_id ON series(user_id);
CREATE INDEX idx_series_stage ON series(stage);

-- 系列表更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_series_updated_at
    BEFORE UPDATE ON series
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 大纲表 (outlines)
-- ============================================
CREATE TABLE IF NOT EXISTS outlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_id UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
    content TEXT,
    episode_outlines JSONB DEFAULT '[]'::jsonb,
    confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 大纲表索引
CREATE INDEX idx_outlines_series_id ON outlines(series_id);

-- 大纲表更新时间触发器
CREATE TRIGGER update_outlines_updated_at
    BEFORE UPDATE ON outlines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 角色表 (characters)
-- ============================================
CREATE TABLE IF NOT EXISTS characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_id UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'supporting',
    appearance TEXT,
    personality TEXT,
    background TEXT,
    confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 角色表索引
CREATE INDEX idx_characters_series_id ON characters(series_id);
CREATE INDEX idx_characters_role ON characters(role);

-- ============================================
-- 角色图片表 (character_images)
-- ============================================
CREATE TABLE IF NOT EXISTS character_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    view_type VARCHAR(20) NOT NULL CHECK (view_type IN ('front', 'side', 'back')),
    url TEXT,
    storage_path TEXT,
    task_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 角色图片表索引
CREATE INDEX idx_character_images_character_id ON character_images(character_id);
CREATE INDEX idx_character_images_status ON character_images(status);
CREATE UNIQUE INDEX idx_character_images_unique_view ON character_images(character_id, view_type);

-- ============================================
-- 场景表 (world_scenes)
-- ============================================
CREATE TABLE IF NOT EXISTS world_scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_id UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    atmosphere TEXT,
    confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 场景表索引
CREATE INDEX idx_world_scenes_series_id ON world_scenes(series_id);

-- ============================================
-- 场景图片表 (scene_images)
-- ============================================
CREATE TABLE IF NOT EXISTS scene_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_scene_id UUID NOT NULL REFERENCES world_scenes(id) ON DELETE CASCADE,
    url TEXT,
    storage_path TEXT,
    task_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 场景图片表索引
CREATE INDEX idx_scene_images_world_scene_id ON scene_images(world_scene_id);
CREATE INDEX idx_scene_images_status ON scene_images(status);

-- ============================================
-- Row Level Security (RLS) 策略
-- ============================================

-- 启用 RLS
ALTER TABLE series ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scene_images ENABLE ROW LEVEL SECURITY;

-- series 表策略
CREATE POLICY "Users can view their own series" ON series
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own series" ON series
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own series" ON series
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own series" ON series
    FOR DELETE USING (auth.uid() = user_id);

-- outlines 表策略
CREATE POLICY "Users can view outlines of their series" ON outlines
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM series WHERE series.id = outlines.series_id AND series.user_id = auth.uid())
    );

CREATE POLICY "Users can insert outlines to their series" ON outlines
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM series WHERE series.id = outlines.series_id AND series.user_id = auth.uid())
    );

CREATE POLICY "Users can update outlines of their series" ON outlines
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM series WHERE series.id = outlines.series_id AND series.user_id = auth.uid())
    );

-- characters 表策略
CREATE POLICY "Users can view characters of their series" ON characters
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM series WHERE series.id = characters.series_id AND series.user_id = auth.uid())
    );

CREATE POLICY "Users can insert characters to their series" ON characters
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM series WHERE series.id = characters.series_id AND series.user_id = auth.uid())
    );

CREATE POLICY "Users can update characters of their series" ON characters
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM series WHERE series.id = characters.series_id AND series.user_id = auth.uid())
    );

CREATE POLICY "Users can delete characters of their series" ON characters
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM series WHERE series.id = characters.series_id AND series.user_id = auth.uid())
    );

-- character_images 表策略
CREATE POLICY "Users can view character images of their series" ON character_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM characters
            JOIN series ON series.id = characters.series_id
            WHERE characters.id = character_images.character_id AND series.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert character images to their series" ON character_images
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM characters
            JOIN series ON series.id = characters.series_id
            WHERE characters.id = character_images.character_id AND series.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update character images of their series" ON character_images
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM characters
            JOIN series ON series.id = characters.series_id
            WHERE characters.id = character_images.character_id AND series.user_id = auth.uid()
        )
    );

-- world_scenes 表策略
CREATE POLICY "Users can view world scenes of their series" ON world_scenes
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM series WHERE series.id = world_scenes.series_id AND series.user_id = auth.uid())
    );

CREATE POLICY "Users can insert world scenes to their series" ON world_scenes
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM series WHERE series.id = world_scenes.series_id AND series.user_id = auth.uid())
    );

CREATE POLICY "Users can update world scenes of their series" ON world_scenes
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM series WHERE series.id = world_scenes.series_id AND series.user_id = auth.uid())
    );

CREATE POLICY "Users can delete world scenes of their series" ON world_scenes
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM series WHERE series.id = world_scenes.series_id AND series.user_id = auth.uid())
    );

-- scene_images 表策略
CREATE POLICY "Users can view scene images of their series" ON scene_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM world_scenes
            JOIN series ON series.id = world_scenes.series_id
            WHERE world_scenes.id = scene_images.world_scene_id AND series.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert scene images to their series" ON scene_images
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM world_scenes
            JOIN series ON series.id = world_scenes.series_id
            WHERE world_scenes.id = scene_images.world_scene_id AND series.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update scene images of their series" ON scene_images
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM world_scenes
            JOIN series ON series.id = world_scenes.series_id
            WHERE world_scenes.id = scene_images.world_scene_id AND series.user_id = auth.uid()
        )
    );

-- ============================================
-- Storage bucket for media files
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('drama-media', 'drama-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage 策略
CREATE POLICY "Public can view media files" ON storage.objects
    FOR SELECT USING (bucket_id = 'drama-media');

CREATE POLICY "Authenticated users can upload media files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'drama-media' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update their media files" ON storage.objects
    FOR UPDATE USING (bucket_id = 'drama-media' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete their media files" ON storage.objects
    FOR DELETE USING (bucket_id = 'drama-media' AND auth.role() = 'authenticated');