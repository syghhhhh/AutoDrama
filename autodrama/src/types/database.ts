/**
 * Database types for Supabase.
 * These types are generated from the database schema.
 * Run `npx supabase gen types typescript --project-id your-project-id > src/types/database.ts` to regenerate.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Enum types
export type SeriesStage = "draft" | "outline" | "assets" | "episodes" | "completed";
export type EpisodeStage = "draft" | "script" | "scene_script" | "scene_images" | "videos" | "completed";
export type AssetStatus = "pending" | "processing" | "completed" | "failed";
export type CharacterRole = "protagonist" | "supporting" | "minor" | "antagonist";
export type ViewType = "front" | "side" | "back";
export type AssetType = "character" | "scene" | "prop";

export interface Database {
  public: {
    Tables: {
      // ============================================
      // Series related tables
      // ============================================
      series: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          art_style: string | null;
          world_setting: string | null;
          total_episodes: number;
          stage: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          art_style?: string | null;
          world_setting?: string | null;
          total_episodes?: number;
          stage?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          art_style?: string | null;
          world_setting?: string | null;
          total_episodes?: number;
          stage?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "series_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      outlines: {
        Row: {
          id: string;
          series_id: string;
          content: string | null;
          episode_outlines: Json;
          confirmed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          series_id: string;
          content?: string | null;
          episode_outlines?: Json;
          confirmed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          series_id?: string;
          content?: string | null;
          episode_outlines?: Json;
          confirmed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "outlines_series_id_fkey";
            columns: ["series_id"];
            isOneToOne: true;
            referencedRelation: "series";
            referencedColumns: ["id"];
          }
        ];
      };
      characters: {
        Row: {
          id: string;
          series_id: string;
          name: string;
          role: string;
          appearance: string | null;
          personality: string | null;
          background: string | null;
          confirmed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          series_id: string;
          name: string;
          role?: string;
          appearance?: string | null;
          personality?: string | null;
          background?: string | null;
          confirmed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          series_id?: string;
          name?: string;
          role?: string;
          appearance?: string | null;
          personality?: string | null;
          background?: string | null;
          confirmed?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "characters_series_id_fkey";
            columns: ["series_id"];
            isOneToOne: false;
            referencedRelation: "series";
            referencedColumns: ["id"];
          }
        ];
      };
      character_images: {
        Row: {
          id: string;
          character_id: string;
          view_type: ViewType;
          url: string | null;
          storage_path: string | null;
          task_id: string | null;
          status: AssetStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          character_id: string;
          view_type: ViewType;
          url?: string | null;
          storage_path?: string | null;
          task_id?: string | null;
          status?: AssetStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          character_id?: string;
          view_type?: ViewType;
          url?: string | null;
          storage_path?: string | null;
          task_id?: string | null;
          status?: AssetStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "character_images_character_id_fkey";
            columns: ["character_id"];
            isOneToOne: false;
            referencedRelation: "characters";
            referencedColumns: ["id"];
          }
        ];
      };
      world_scenes: {
        Row: {
          id: string;
          series_id: string;
          name: string;
          description: string | null;
          atmosphere: string | null;
          confirmed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          series_id: string;
          name: string;
          description?: string | null;
          atmosphere?: string | null;
          confirmed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          series_id?: string;
          name?: string;
          description?: string | null;
          atmosphere?: string | null;
          confirmed?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "world_scenes_series_id_fkey";
            columns: ["series_id"];
            isOneToOne: false;
            referencedRelation: "series";
            referencedColumns: ["id"];
          }
        ];
      };
      scene_images: {
        Row: {
          id: string;
          world_scene_id: string;
          url: string | null;
          storage_path: string | null;
          task_id: string | null;
          status: AssetStatus;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          world_scene_id: string;
          url?: string | null;
          storage_path?: string | null;
          task_id?: string | null;
          status?: AssetStatus;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          world_scene_id?: string;
          url?: string | null;
          storage_path?: string | null;
          task_id?: string | null;
          status?: AssetStatus;
          order_index?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scene_images_world_scene_id_fkey";
            columns: ["world_scene_id"];
            isOneToOne: false;
            referencedRelation: "world_scenes";
            referencedColumns: ["id"];
          }
        ];
      };
      // ============================================
      // Episode related tables
      // ============================================
      episodes: {
        Row: {
          id: string;
          series_id: string;
          episode_number: number;
          title: string | null;
          synopsis: string | null;
          stage: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          series_id: string;
          episode_number: number;
          title?: string | null;
          synopsis?: string | null;
          stage?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          series_id?: string;
          episode_number?: number;
          title?: string | null;
          synopsis?: string | null;
          stage?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "episodes_series_id_fkey";
            columns: ["series_id"];
            isOneToOne: false;
            referencedRelation: "series";
            referencedColumns: ["id"];
          }
        ];
      };
      scripts: {
        Row: {
          id: string;
          episode_id: string;
          content: string | null;
          ai_generated: boolean;
          confirmed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          episode_id: string;
          content?: string | null;
          ai_generated?: boolean;
          confirmed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          episode_id?: string;
          content?: string | null;
          ai_generated?: boolean;
          confirmed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scripts_episode_id_fkey";
            columns: ["episode_id"];
            isOneToOne: true;
            referencedRelation: "episodes";
            referencedColumns: ["id"];
          }
        ];
      };
      episode_scenes: {
        Row: {
          id: string;
          episode_id: string;
          order_index: number;
          scene_description: string | null;
          character_description: string | null;
          dialogue: string | null;
          action_description: string | null;
          image_status: AssetStatus;
          video_status: AssetStatus;
          confirmed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          episode_id: string;
          order_index?: number;
          scene_description?: string | null;
          character_description?: string | null;
          dialogue?: string | null;
          action_description?: string | null;
          image_status?: AssetStatus;
          video_status?: AssetStatus;
          confirmed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          episode_id?: string;
          order_index?: number;
          scene_description?: string | null;
          character_description?: string | null;
          dialogue?: string | null;
          action_description?: string | null;
          image_status?: AssetStatus;
          video_status?: AssetStatus;
          confirmed?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "episode_scenes_episode_id_fkey";
            columns: ["episode_id"];
            isOneToOne: false;
            referencedRelation: "episodes";
            referencedColumns: ["id"];
          }
        ];
      };
      scene_reference_images: {
        Row: {
          id: string;
          episode_scene_id: string;
          url: string | null;
          storage_path: string | null;
          task_id: string | null;
          status: AssetStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          episode_scene_id: string;
          url?: string | null;
          storage_path?: string | null;
          task_id?: string | null;
          status?: AssetStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          episode_scene_id?: string;
          url?: string | null;
          storage_path?: string | null;
          task_id?: string | null;
          status?: AssetStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scene_reference_images_episode_scene_id_fkey";
            columns: ["episode_scene_id"];
            isOneToOne: true;
            referencedRelation: "episode_scenes";
            referencedColumns: ["id"];
          }
        ];
      };
      scene_assets: {
        Row: {
          id: string;
          episode_scene_id: string;
          character_id: string | null;
          world_scene_id: string | null;
          asset_type: AssetType;
          created_at: string;
        };
        Insert: {
          id?: string;
          episode_scene_id: string;
          character_id?: string | null;
          world_scene_id?: string | null;
          asset_type?: AssetType;
          created_at?: string;
        };
        Update: {
          id?: string;
          episode_scene_id?: string;
          character_id?: string | null;
          world_scene_id?: string | null;
          asset_type?: AssetType;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scene_assets_episode_scene_id_fkey";
            columns: ["episode_scene_id"];
            isOneToOne: false;
            referencedRelation: "episode_scenes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scene_assets_character_id_fkey";
            columns: ["character_id"];
            isOneToOne: false;
            referencedRelation: "characters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scene_assets_world_scene_id_fkey";
            columns: ["world_scene_id"];
            isOneToOne: false;
            referencedRelation: "world_scenes";
            referencedColumns: ["id"];
          }
        ];
      };
      scene_videos: {
        Row: {
          id: string;
          episode_scene_id: string;
          url: string | null;
          storage_path: string | null;
          duration: number | null;
          task_id: string | null;
          status: AssetStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          episode_scene_id: string;
          url?: string | null;
          storage_path?: string | null;
          duration?: number | null;
          task_id?: string | null;
          status?: AssetStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          episode_scene_id?: string;
          url?: string | null;
          storage_path?: string | null;
          duration?: number | null;
          task_id?: string | null;
          status?: AssetStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scene_videos_episode_scene_id_fkey";
            columns: ["episode_scene_id"];
            isOneToOne: true;
            referencedRelation: "episode_scenes";
            referencedColumns: ["id"];
          }
        ];
      };
      episode_videos: {
        Row: {
          id: string;
          episode_id: string;
          url: string | null;
          storage_path: string | null;
          duration: number | null;
          status: AssetStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          episode_id: string;
          url?: string | null;
          storage_path?: string | null;
          duration?: number | null;
          status?: AssetStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          episode_id?: string;
          url?: string | null;
          storage_path?: string | null;
          duration?: number | null;
          status?: AssetStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "episode_videos_episode_id_fkey";
            columns: ["episode_id"];
            isOneToOne: true;
            referencedRelation: "episodes";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      series_stage: SeriesStage;
      episode_stage: EpisodeStage;
      asset_status: AssetStatus;
      character_role: CharacterRole;
      view_type: ViewType;
      asset_type: AssetType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// ============================================
// Convenience types for tables
// ============================================

// Series related
export type Series = Database["public"]["Tables"]["series"]["Row"];
export type SeriesInsert = Database["public"]["Tables"]["series"]["Insert"];
export type SeriesUpdate = Database["public"]["Tables"]["series"]["Update"];

export type Outline = Database["public"]["Tables"]["outlines"]["Row"];
export type OutlineInsert = Database["public"]["Tables"]["outlines"]["Insert"];
export type OutlineUpdate = Database["public"]["Tables"]["outlines"]["Update"];

export type Character = Database["public"]["Tables"]["characters"]["Row"];
export type CharacterInsert = Database["public"]["Tables"]["characters"]["Insert"];
export type CharacterUpdate = Database["public"]["Tables"]["characters"]["Update"];

export type CharacterImage = Database["public"]["Tables"]["character_images"]["Row"];
export type CharacterImageInsert = Database["public"]["Tables"]["character_images"]["Insert"];
export type CharacterImageUpdate = Database["public"]["Tables"]["character_images"]["Update"];

export type WorldScene = Database["public"]["Tables"]["world_scenes"]["Row"];
export type WorldSceneInsert = Database["public"]["Tables"]["world_scenes"]["Insert"];
export type WorldSceneUpdate = Database["public"]["Tables"]["world_scenes"]["Update"];

export type SceneImage = Database["public"]["Tables"]["scene_images"]["Row"];
export type SceneImageInsert = Database["public"]["Tables"]["scene_images"]["Insert"];
export type SceneImageUpdate = Database["public"]["Tables"]["scene_images"]["Update"];

// Episode related
export type Episode = Database["public"]["Tables"]["episodes"]["Row"];
export type EpisodeInsert = Database["public"]["Tables"]["episodes"]["Insert"];
export type EpisodeUpdate = Database["public"]["Tables"]["episodes"]["Update"];

export type Script = Database["public"]["Tables"]["scripts"]["Row"];
export type ScriptInsert = Database["public"]["Tables"]["scripts"]["Insert"];
export type ScriptUpdate = Database["public"]["Tables"]["scripts"]["Update"];

export type EpisodeScene = Database["public"]["Tables"]["episode_scenes"]["Row"];
export type EpisodeSceneInsert = Database["public"]["Tables"]["episode_scenes"]["Insert"];
export type EpisodeSceneUpdate = Database["public"]["Tables"]["episode_scenes"]["Update"];

export type SceneReferenceImage = Database["public"]["Tables"]["scene_reference_images"]["Row"];
export type SceneReferenceImageInsert = Database["public"]["Tables"]["scene_reference_images"]["Insert"];
export type SceneReferenceImageUpdate = Database["public"]["Tables"]["scene_reference_images"]["Update"];

export type SceneAsset = Database["public"]["Tables"]["scene_assets"]["Row"];
export type SceneAssetInsert = Database["public"]["Tables"]["scene_assets"]["Insert"];
export type SceneAssetUpdate = Database["public"]["Tables"]["scene_assets"]["Update"];

export type SceneVideo = Database["public"]["Tables"]["scene_videos"]["Row"];
export type SceneVideoInsert = Database["public"]["Tables"]["scene_videos"]["Insert"];
export type SceneVideoUpdate = Database["public"]["Tables"]["scene_videos"]["Update"];

export type EpisodeVideo = Database["public"]["Tables"]["episode_videos"]["Row"];
export type EpisodeVideoInsert = Database["public"]["Tables"]["episode_videos"]["Insert"];
export type EpisodeVideoUpdate = Database["public"]["Tables"]["episode_videos"]["Update"];

// ============================================
// Combined types for API responses
// ============================================

export type CharacterWithImages = Character & {
  images: CharacterImage[];
};

export type WorldSceneWithImages = WorldScene & {
  images: SceneImage[];
};

export type SeriesWithRelations = Series & {
  outline: Outline | null;
  characters: CharacterWithImages[];
  world_scenes: WorldSceneWithImages[];
  episodes: Episode[];
};

export type EpisodeSceneWithRelations = EpisodeScene & {
  reference_image: SceneReferenceImage | null;
  video: SceneVideo | null;
  assets: SceneAsset[];
};

export type EpisodeWithRelations = Episode & {
  script: Script | null;
  scenes: EpisodeSceneWithRelations[];
  video: EpisodeVideo | null;
};