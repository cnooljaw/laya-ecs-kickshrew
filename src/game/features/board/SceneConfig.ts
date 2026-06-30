import { MapType } from "./BoardTypes";

export interface SceneConfig {
  mapType: MapType;
  bgAtlas: string;
  bgFrame: string;
  coverFrames: string[];
}

export const SCENE_CONFIGS: Record<number, SceneConfig> = {
  [MapType.Meadow]: {
    mapType: MapType.Meadow,
    bgAtlas: "game_view_grassbg",
    bgFrame: "shrew_grass_bg.png",
    coverFrames: ["grass_cover_1.png", "grass_cover_2.png", "grass_cover_3.png"],
  },
  [MapType.Ship]: {
    mapType: MapType.Ship,
    bgAtlas: "kickshrew_game_view_corsairbg",
    bgFrame: "shrew_corsair_bg.png",
    coverFrames: ["corsair_cover_3.png", "corsair_cover_2.png", "corsair_cover_1.png"],
  },
  [MapType.Space]: {
    mapType: MapType.Space,
    bgAtlas: "kickshrew_game_view_moonbg",
    bgFrame: "shrew_moon_bg.png",
    coverFrames: ["moon_cover_1.png", "moon_cover_2.png", "moon_cover_3.png"],
  },
};

/** 场景循环顺序：Meadow → Ship → Space → Meadow */
export const SCENE_CYCLE: MapType[] = [MapType.Meadow, MapType.Ship, MapType.Space];

/** 场景切换间隔（秒） */
export const SCENE_CYCLE_INTERVAL = 16;
