import { HolePositions, getHoleGrid, getHoleZOrder } from "../config/HolePositions";
import { VIEWPORT } from "../config/ViewLayoutConfig";
import { AnimType, HOLE_COUNT, MapType, ShrewAction, ShrewType } from "../ecs/types";
import { HoleNode } from "../view/HoleNode";
import { SceneLayer } from "../view/SceneLayer";
import { ShrewNode } from "../view/ShrewNode";

type PreviewPose = "up0" | "stand";

interface PreviewShrew {
  node: ShrewNode;
  action: ShrewAction;
  animType: AnimType;
  progress: number;
}

const POSE_CONFIG: Record<PreviewPose, { action: ShrewAction; animType: AnimType; progress: number; title: string }> = {
  up0: {
    action: ShrewAction.Up,
    animType: AnimType.Up,
    progress: 0,
    title: "Meadow Up Start",
  },
  stand: {
    action: ShrewAction.Stand,
    animType: AnimType.Stand,
    progress: 1,
    title: "Meadow Stand",
  },
};

function getPoseFromQuery(): PreviewPose {
  const params = new URLSearchParams(window.location.search);
  if (window.location.pathname.includes("stand")) return "stand";
  return params.get("pose") === "stand" ? "stand" : "up0";
}

function createOverlay(LayaRuntime: any, root: any): void {
  const positions = HolePositions[MapType.Meadow];

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
      `${i + 1} r${row}c${col} z${getHoleZOrder(row)}`,
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

function addPoseLinks(pose: PreviewPose): void {
  const panel = document.createElement("div");
  panel.id = "pose-preview-panel";
  panel.innerHTML = `
    <a href="./debug-meadow-shrews-up0.html" data-active="${pose === "up0"}">Up start</a>
    <a href="./debug-meadow-shrews-stand.html" data-active="${pose === "stand"}">Stand</a>
  `;
  document.body.appendChild(panel);
}

function createPreview(LayaRuntime: any, pose: PreviewPose): void {
  const poseConfig = POSE_CONFIG[pose];

  const root = new LayaRuntime.Sprite();
  root.name = "MeadowShrewPosePreviewRoot";
  LayaRuntime.stage.addChild(root);

  const sceneLayer = new SceneLayer();
  sceneLayer.create(root);
  sceneLayer.switchScene(MapType.Meadow);

  const previewShrews: PreviewShrew[] = [];
  const positions = HolePositions[MapType.Meadow];

  for (let i = 0; i < HOLE_COUNT; i++) {
    const { row } = getHoleGrid(i);

    const holeNode = new HoleNode();
    holeNode.create(root);
    holeNode.setPosition(positions.xRatios[i], positions.yRatios[i]);
    holeNode.setZOrder(getHoleZOrder(row));

    const shrewNode = new ShrewNode();
    shrewNode.create(holeNode.getContainer() || root);
    shrewNode.setSpriteFrame(ShrewType.Red, MapType.Meadow);

    previewShrews.push({
      node: shrewNode,
      action: poseConfig.action,
      animType: poseConfig.animType,
      progress: poseConfig.progress,
    });
  }

  createOverlay(LayaRuntime, root);
  schedulePoseSync(LayaRuntime, previewShrews);

  document.title = poseConfig.title;
}

if (!(Laya as any).PlayerConfig) (Laya as any).PlayerConfig = {};
if (!(Laya as any).PlayerConfig.UI) (Laya as any).PlayerConfig.UI = {};

const pose = getPoseFromQuery();
addPoseLinks(pose);

Laya.init(VIEWPORT.width, VIEWPORT.height).then(() => {
  Laya.stage.scaleMode = Laya.Stage.SCALE_FIXED_AUTO;
  Laya.stage.bgColor = "#222222";
  createPreview(Laya, pose);
  console.log(`[MeadowShrewPosePreview] ${POSE_CONFIG[pose].title} ready`);
}).catch((err: unknown) => {
  console.error("[MeadowShrewPosePreview] init failed:", err);
});
