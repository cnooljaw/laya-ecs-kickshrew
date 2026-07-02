import { VIEWPORT } from "../config/ViewLayoutConfig";
import {
  HOLE_COUNT,
  HolePositions,
  MapType,
  getHoleGrid,
  getHoleZOrder,
} from "../game/board";
import {
  AnimType,
  ShrewAction,
  ShrewType,
} from "../game/features/shrew";
import { HoleNode } from "../game/board";
import { SceneLayer } from "../game/board";
import { ShrewNode } from "../game/features/shrew/ShrewNode";

type PreviewPose = "up0" | "stand";
type PreviewMapKey = "meadow" | "ship" | "space";

interface PreviewShrew {
  node: ShrewNode;
  action: ShrewAction;
  animType: AnimType;
  progress: number;
}

interface CoverDebug {
  id: string;
  zOrder: number;
  y: number;
  height: number;
  color: string;
}

interface PreviewMapConfig {
  label: string;
  mapType: MapType;
  coverDebug: CoverDebug[];
}

function createCoverDebug(bottomHeight: number, middleHeight: number, topHeight: number): CoverDebug[] {
  const cover1Y = VIEWPORT.height - bottomHeight;
  const cover2Y = cover1Y - middleHeight;
  const cover3Y = cover2Y - topHeight;

  return [
    { id: "cover3", zOrder: 3, y: cover3Y, height: topHeight, color: "#00d2ff" },
    { id: "cover2", zOrder: 5, y: cover2Y, height: middleHeight, color: "#ffd60a" },
    { id: "cover1", zOrder: 7, y: cover1Y, height: bottomHeight, color: "#bf5af2" },
  ];
}

const MAP_CONFIG: Record<PreviewMapKey, PreviewMapConfig> = {
  meadow: {
    label: "Meadow",
    mapType: MapType.Meadow,
    coverDebug: createCoverDebug(151, 133, 118),
  },
  ship: {
    label: "Ship",
    mapType: MapType.Ship,
    coverDebug: createCoverDebug(144, 132, 118),
  },
  space: {
    label: "Space",
    mapType: MapType.Space,
    coverDebug: createCoverDebug(147, 133, 116),
  },
};

const POSE_CONFIG: Record<PreviewPose, { action: ShrewAction; animType: AnimType; progress: number; label: string }> = {
  up0: {
    action: ShrewAction.Up,
    animType: AnimType.Up,
    progress: 0,
    label: "Up Start",
  },
  stand: {
    action: ShrewAction.Stand,
    animType: AnimType.Stand,
    progress: 1,
    label: "Stand",
  },
};

function getMapFromQuery(): PreviewMapKey {
  const params = new URLSearchParams(window.location.search);
  const map = params.get("map");
  if (map === "ship" || map === "space" || map === "meadow") return map;
  if (window.location.pathname.includes("ship")) return "ship";
  if (window.location.pathname.includes("space")) return "space";
  return "meadow";
}

function getPoseFromQuery(): PreviewPose {
  const params = new URLSearchParams(window.location.search);
  if (window.location.pathname.includes("stand")) return "stand";
  return params.get("pose") === "stand" ? "stand" : "up0";
}

function createOverlay(LayaRuntime: any, root: any, mapConfig: PreviewMapConfig): void {
  const positions = HolePositions[mapConfig.mapType];

  for (let i = 0; i < HOLE_COUNT; i++) {
    const x = positions.xRatios[i] * VIEWPORT.width;
    const y = positions.yRatios[i] * VIEWPORT.height;
    const { row, col } = getHoleGrid(i);

    const marker = new LayaRuntime.Sprite();
    marker.name = `HoleMarker_${i}`;
    marker.zOrder = 200;
    marker.mouseEnabled = false;
    marker.graphics.drawLine(-34, 0, 34, 0, "#ff3b30", 2);
    marker.graphics.drawLine(0, -34, 0, 34, "#ff3b30", 2);
    marker.graphics.drawCircle(0, 0, 4, "#ff3b30");
    marker.graphics.fillText(
      `${i + 1} r${row}c${col} shrew z${getHoleZOrder(row)}`,
      8,
      -34,
      "13px monospace",
      "#ffffff",
      "left"
    );
    marker.pos(x, y);
    root.addChild(marker);
  }
}

function createCoverOverlay(LayaRuntime: any, root: any, coverDebug: CoverDebug[]): void {
  for (const cover of coverDebug) {
    const overlay = new LayaRuntime.Sprite();
    overlay.name = `CoverDebug_${cover.id}`;
    overlay.zOrder = 195;
    overlay.mouseEnabled = false;

    const bottomY = cover.y + cover.height;
    overlay.graphics.drawLine(0, cover.y, VIEWPORT.width, cover.y, cover.color, 2);
    overlay.graphics.drawLine(0, bottomY, VIEWPORT.width, bottomY, cover.color, 3);
    overlay.graphics.drawLine(0, cover.y, 0, bottomY, cover.color, 2);
    overlay.graphics.drawLine(VIEWPORT.width, cover.y, VIEWPORT.width, bottomY, cover.color, 2);
    overlay.graphics.fillText(
      `${cover.id} z${cover.zOrder} y=${cover.y} bottom=${bottomY}`,
      10,
      cover.y + 8,
      "14px monospace",
      cover.color,
      "left"
    );
    root.addChild(overlay);
  }
}

function applyPose(previewShrews: PreviewShrew[]): void {
  for (const item of previewShrews) {
    item.node.setAnimation(item.action, item.animType, item.progress);
    item.node.setClickable(item.action === ShrewAction.Stand);
  }
}

function schedulePoseSync(LayaRuntime: any, previewShrews: PreviewShrew[]): void {
  applyPose(previewShrews);
  for (const delayMs of [80, 180, 360, 720, 1200]) {
    LayaRuntime.timer.once(delayMs, null, () => applyPose(previewShrews));
  }
}

function addPoseLinks(mapKey: PreviewMapKey, pose: PreviewPose): void {
  const isActive = (targetMap: PreviewMapKey, targetPose: PreviewPose) => mapKey === targetMap && pose === targetPose;
  const panel = document.createElement("div");
  panel.id = "pose-preview-panel";
  panel.innerHTML = `
    <a href="./debug-meadow-shrews-up0.html" data-active="${isActive("meadow", "up0")}">Meadow Up</a>
    <a href="./debug-meadow-shrews-stand.html" data-active="${isActive("meadow", "stand")}">Meadow Stand</a>
    <a href="./debug-ship-shrews-stand.html" data-active="${isActive("ship", "stand")}">Ship Stand</a>
    <a href="./debug-space-shrews-stand.html" data-active="${isActive("space", "stand")}">Space Stand</a>
  `;
  document.body.appendChild(panel);
}

function createPreview(LayaRuntime: any, mapKey: PreviewMapKey, pose: PreviewPose): void {
  const mapConfig = MAP_CONFIG[mapKey];
  const poseConfig = POSE_CONFIG[pose];

  const root = new LayaRuntime.Sprite();
  root.name = `${mapConfig.label}ShrewPosePreviewRoot`;
  LayaRuntime.stage.addChild(root);

  const sceneLayer = new SceneLayer();
  sceneLayer.create(root);
  sceneLayer.switchScene(mapConfig.mapType);

  const previewShrews: PreviewShrew[] = [];
  const positions = HolePositions[mapConfig.mapType];

  for (let i = 0; i < HOLE_COUNT; i++) {
    const { row } = getHoleGrid(i);

    const holeNode = new HoleNode();
    holeNode.create(root);
    holeNode.setPosition(positions.xRatios[i], positions.yRatios[i]);
    holeNode.setZOrder(getHoleZOrder(row));

    const shrewNode = new ShrewNode();
    shrewNode.create(holeNode.getContainer() || root);
    shrewNode.setSpriteFrame(ShrewType.Red, mapConfig.mapType);

    previewShrews.push({
      node: shrewNode,
      action: poseConfig.action,
      animType: poseConfig.animType,
      progress: poseConfig.progress,
    });
  }

  if (pose === "up0") createCoverOverlay(LayaRuntime, root, mapConfig.coverDebug);
  createOverlay(LayaRuntime, root, mapConfig);
  schedulePoseSync(LayaRuntime, previewShrews);

  document.title = `${mapConfig.label} Shrews - ${poseConfig.label}`;
}

if (!(Laya as any).PlayerConfig) (Laya as any).PlayerConfig = {};
if (!(Laya as any).PlayerConfig.UI) (Laya as any).PlayerConfig.UI = {};

const mapKey = getMapFromQuery();
const pose = getPoseFromQuery();
addPoseLinks(mapKey, pose);

Laya.init(VIEWPORT.width, VIEWPORT.height).then(() => {
  Laya.stage.scaleMode = Laya.Stage.SCALE_FIXED_AUTO;
  Laya.stage.bgColor = "#222222";
  createPreview(Laya, mapKey, pose);
  console.log(`[MeadowShrewPosePreview] ${MAP_CONFIG[mapKey].label} ${POSE_CONFIG[pose].label} ready`);
}).catch((err: unknown) => {
  console.error("[MeadowShrewPosePreview] init failed:", err);
});
