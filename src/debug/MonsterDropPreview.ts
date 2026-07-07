import { VIEWPORT } from "../config/ViewLayoutConfig";
import {
  HOLE_COUNT,
  HolePositions,
  MapType,
  getHoleGrid,
  getHoleZOrder,
} from "../game/board";
import { HoleNode } from "../game/board/HoleNode";
import { SceneLayer } from "../game/board/SceneLayer";
import { MONSTER_HOLE_TRIADS, type MonsterHoleTriad } from "../game/features/monster/MonsterHoleTriads";
import { MonsterAction, MonsterType } from "../game/features/monster/MonsterTypes";
import { MonsterNode } from "../game/features/monster/MonsterNode";
import { MONSTER_VIEW_CONFIG } from "../game/features/monster/MonsterViewConfig";
import { AnimType, ShrewAction, ShrewType } from "../game/features/shrew";
import { ShrewNode } from "../game/features/shrew/ShrewNode";

type PreviewMapKey = "meadow" | "ship" | "space";

interface PreviewMapConfig {
  label: string;
  mapType: MapType;
}

const MAP_CONFIG: Record<PreviewMapKey, PreviewMapConfig> = {
  meadow: { label: "Meadow", mapType: MapType.Meadow },
  ship: { label: "Ship", mapType: MapType.Ship },
  space: { label: "Space", mapType: MapType.Space },
};

const MONSTER_DROP_PREVIEW_SEC = 0.31;

class MonsterDropPreview {
  private readonly _root: any;
  private readonly _mapConfig: PreviewMapConfig;
  private readonly _shrews: ShrewNode[] = [];
  private readonly _monster = new MonsterNode();
  private readonly _triadLayer: any;
  private readonly _monsterDebugLayer: any;
  private _spawnSeq = 0;
  private _activeTriadIndex = 0;
  private _dropStartMs = 0;
  private _debugOverlayStartMs = 0;

  constructor(
    private readonly _Laya: any,
    mapKey: PreviewMapKey,
  ) {
    this._mapConfig = MAP_CONFIG[mapKey];
    this._root = new this._Laya.Sprite();
    this._root.name = `${this._mapConfig.label}MonsterDropPreviewRoot`;
    this._Laya.stage.addChild(this._root);

    this._triadLayer = new this._Laya.Sprite();
    this._triadLayer.name = "MonsterTriadOverlay";
    this._triadLayer.zOrder = 190;
    this._triadLayer.mouseEnabled = false;
    this._root.addChild(this._triadLayer);

    this._monsterDebugLayer = new this._Laya.Sprite();
    this._monsterDebugLayer.name = "MonsterSkeletonBoundsOverlay";
    this._monsterDebugLayer.zOrder = 230;
    this._monsterDebugLayer.mouseEnabled = false;
    this._root.addChild(this._monsterDebugLayer);
  }

  create(): void {
    const sceneLayer = new SceneLayer();
    sceneLayer.create(this._root);
    sceneLayer.switchScene(this._mapConfig.mapType);

    this._createHolesAndShrews();
    this._monster.create(this._root);
    this._monster.setVisible(false);
    this._createPanel();
    this.playTriad(0);
  }

  playTriad(triadIndex: number): void {
    this._activeTriadIndex = normalizeTriadIndex(triadIndex);
    const triad = MONSTER_HOLE_TRIADS[this._activeTriadIndex];
    const center = getTriadCenter(this._mapConfig.mapType, triad);

    this._updatePanelActiveState();
    this._updateShrewBlockedState(triad);
    this._drawTriadOverlays();

    this._monster.setPosition(center.xRatio, center.yRatio);
    this._monster.setZOrder(80);
    this._monster.setVisible(true);
    this._monster.setAnimation(MonsterAction.Drop, 0);
    this._ensureMonsterSpawned();
    this._startMonsterDebugOverlay();

    this._Laya.timer.clear(this, this._tickDrop);
    this._dropStartMs = Date.now();
    this._Laya.timer.loop(16, this, this._tickDrop);
  }

  private _tickDrop(): void {
    const elapsedSec = (Date.now() - this._dropStartMs) / 1000;
    const progress = Math.min(1, elapsedSec / MONSTER_DROP_PREVIEW_SEC);
    this._monster.setAnimation(MonsterAction.Drop, progress);
    this._drawMonsterDebugOverlay();
    if (progress >= 1) {
      this._Laya.timer.clear(this, this._tickDrop);
      this._monster.setAnimation(MonsterAction.Stay, 1);
    }
  }

  private _createHolesAndShrews(): void {
    const positions = HolePositions[this._mapConfig.mapType];
    for (let i = 0; i < HOLE_COUNT; i++) {
      const { row } = getHoleGrid(i);

      const holeNode = new HoleNode();
      holeNode.create(this._root);
      holeNode.setPosition(positions.xRatios[i], positions.yRatios[i]);
      holeNode.setZOrder(getHoleZOrder(row));

      const shrewNode = new ShrewNode();
      shrewNode.create(holeNode.getContainer() || this._root);
      shrewNode.setSpriteFrame(ShrewType.Red, this._mapConfig.mapType);
      shrewNode.setAnimation(ShrewAction.Stand, AnimType.Stand, 1);
      shrewNode.setClickable(false);
      this._shrews.push(shrewNode);
    }

    for (const delayMs of [80, 180, 360, 720, 1200]) {
      this._Laya.timer.once(delayMs, this, () => this._syncShrewPose());
    }
  }

  private _syncShrewPose(): void {
    for (const shrew of this._shrews) {
      shrew.setAnimation(ShrewAction.Stand, AnimType.Stand, 1);
      shrew.setClickable(false);
    }
    this._updateShrewBlockedState(MONSTER_HOLE_TRIADS[this._activeTriadIndex]);
  }

  private _startMonsterDebugOverlay(): void {
    this._debugOverlayStartMs = Date.now();
    this._drawMonsterDebugOverlay();
    this._Laya.timer.clear(this, this._tickMonsterDebugOverlay);
    this._Laya.timer.loop(16, this, this._tickMonsterDebugOverlay);
  }

  private _tickMonsterDebugOverlay(): void {
    this._drawMonsterDebugOverlay();
    const geometry = this._monster.getDebugGeometry();
    if (Date.now() - this._debugOverlayStartMs > 2000 && geometry) {
      this._Laya.timer.clear(this, this._tickMonsterDebugOverlay);
    }
  }

  private _ensureMonsterSpawned(): void {
    if (this._spawnSeq > 0) return;
    this._spawnSeq = 1;
    this._monster.spawn(MonsterType.Rhino, this._spawnSeq);
  }

  private _updateShrewBlockedState(triad: MonsterHoleTriad): void {
    const occupied = new Set<number>(triad);
    for (let i = 0; i < this._shrews.length; i++) {
      this._shrews[i].setBlockedByOccupant(occupied.has(i));
    }
  }

  private _drawTriadOverlays(): void {
    const positions = HolePositions[this._mapConfig.mapType];
    const red = "#ff3b30";
    this._triadLayer.graphics.clear();
    for (let i = 0; i < MONSTER_HOLE_TRIADS.length; i++) {
      const triad = MONSTER_HOLE_TRIADS[i];
      const points = triad.map(index => ({
        x: positions.xRatios[index] * VIEWPORT.width,
        y: positions.yRatios[index] * VIEWPORT.height,
      }));
      const center = getTriadCenter(this._mapConfig.mapType, triad);
      const centerX = center.xRatio * VIEWPORT.width;
      const centerY = center.yRatio * VIEWPORT.height;
      const active = i === this._activeTriadIndex;
      const lineWidth = active ? 4 : 2;
      const pointRadius = active ? 8 : 5;

      this._triadLayer.graphics.drawLine(points[0].x, points[0].y, points[1].x, points[1].y, red, lineWidth);
      this._triadLayer.graphics.drawLine(points[1].x, points[1].y, points[2].x, points[2].y, red, lineWidth);
      this._triadLayer.graphics.drawLine(points[2].x, points[2].y, points[0].x, points[0].y, red, lineWidth);
      this._triadLayer.graphics.drawCircle(centerX, centerY, pointRadius, red);
      this._triadLayer.graphics.fillText(
        String(i),
        centerX + 7,
        centerY - 12,
        active ? "15px monospace" : "12px monospace",
        red,
        "left",
      );
    }
  }

  private _drawMonsterDebugOverlay(): void {
    const geometry = this._monster.getDebugGeometry();
    const graphics = this._monsterDebugLayer.graphics;
    const blue = "#0a84ff";
    const rawBoundsColor = "#8e8e93";

    graphics.clear();
    if (!geometry) return;

    const anchor = geometry.containerAnchor;
    graphics.drawLine(anchor.x - 14, anchor.y, anchor.x + 14, anchor.y, blue, 2);
    graphics.drawLine(anchor.x, anchor.y - 14, anchor.x, anchor.y + 14, blue, 2);
    graphics.drawCircle(anchor.x, anchor.y, 5, blue);
    graphics.fillText("container", anchor.x + 8, anchor.y + 8, "12px monospace", blue, "left");

    const rawBounds = geometry.rawSkeletonBounds;
    if (rawBounds) {
      this._drawRect(rawBounds, rawBoundsColor, 1);
      graphics.fillText("raw skeleton.getBounds()", rawBounds.x, rawBounds.y - 16, "12px monospace", rawBoundsColor, "left");
    }

    const visualBounds = geometry.visualBounds;
    this._drawRect(visualBounds, blue, 2);
    graphics.drawCircle(visualBounds.centerX, visualBounds.centerY, 5, blue);
    graphics.fillText("visualBounds", visualBounds.x, visualBounds.y - 16, "12px monospace", blue, "left");
  }

  private _drawRect(
    bounds: { x: number; y: number; width: number; height: number },
    color: string,
    lineWidth: number,
  ): void {
    const graphics = this._monsterDebugLayer.graphics;
    graphics.drawLine(bounds.x, bounds.y, bounds.x + bounds.width, bounds.y, color, lineWidth);
    graphics.drawLine(bounds.x + bounds.width, bounds.y, bounds.x + bounds.width, bounds.y + bounds.height, color, lineWidth);
    graphics.drawLine(bounds.x + bounds.width, bounds.y + bounds.height, bounds.x, bounds.y + bounds.height, color, lineWidth);
    graphics.drawLine(bounds.x, bounds.y + bounds.height, bounds.x, bounds.y, color, lineWidth);
  }

  private _createPanel(): void {
    const panel = document.createElement("div");
    panel.id = "monster-drop-panel";
    panel.innerHTML = `
      <div class="map-links">
        <a href="./debug-meadow-monster-drop.html" data-map="meadow">Meadow</a>
        <a href="./debug-ship-monster-drop.html" data-map="ship">Ship</a>
        <a href="./debug-space-monster-drop.html" data-map="space">Space</a>
      </div>
      <div class="triad-actions">
        <button type="button" data-action="replay">Replay</button>
        <button type="button" data-action="next">Next</button>
      </div>
      <div class="triad-buttons">
        ${MONSTER_HOLE_TRIADS.map((triad, index) => (
          `<button type="button" data-triad="${index}">${index}: [${triad.join(",")}]</button>`
        )).join("")}
      </div>
    `;
    document.body.appendChild(panel);

    panel.addEventListener("click", (event) => {
      const target = event.target as HTMLElement | null;
      if (!target || target.tagName !== "BUTTON") return;
      const triadIndex = target.getAttribute("data-triad");
      if (triadIndex !== null) {
        this.playTriad(Number(triadIndex));
        return;
      }
      const action = target.getAttribute("data-action");
      if (action === "replay") this.playTriad(this._activeTriadIndex);
      if (action === "next") this.playTriad(this._activeTriadIndex + 1);
    });
  }

  private _updatePanelActiveState(): void {
    const panel = document.getElementById("monster-drop-panel");
    if (!panel) return;
    for (const button of Array.from(panel.querySelectorAll<HTMLButtonElement>("button[data-triad]"))) {
      button.dataset.active = button.dataset.triad === String(this._activeTriadIndex) ? "true" : "false";
    }
    for (const link of Array.from(panel.querySelectorAll<HTMLAnchorElement>("a[data-map]"))) {
      link.dataset.active = link.dataset.map === getMapKey(this._mapConfig.mapType) ? "true" : "false";
    }
  }
}

function getTriadCenter(mapType: MapType, triad: MonsterHoleTriad): { xRatio: number; yRatio: number } {
  const positions = HolePositions[mapType];
  let xRatio = 0;
  let yRatio = 0;
  for (const holeIndex of triad) {
    xRatio += positions.xRatios[holeIndex];
    yRatio += positions.yRatios[holeIndex];
  }
  return {
    xRatio: xRatio / triad.length,
    yRatio: yRatio / triad.length,
  };
}

function getMapFromQuery(): PreviewMapKey {
  const params = new URLSearchParams(window.location.search);
  const map = params.get("map");
  if (map === "ship" || map === "space" || map === "meadow") return map;
  if (window.location.pathname.includes("ship")) return "ship";
  if (window.location.pathname.includes("space")) return "space";
  return "meadow";
}

function getMapKey(mapType: MapType): PreviewMapKey {
  if (mapType === MapType.Ship) return "ship";
  if (mapType === MapType.Space) return "space";
  return "meadow";
}

function normalizeTriadIndex(index: number): number {
  const count = MONSTER_HOLE_TRIADS.length;
  return ((Math.floor(index) % count) + count) % count;
}

if (!(Laya as any).PlayerConfig) (Laya as any).PlayerConfig = {};
if (!(Laya as any).PlayerConfig.UI) (Laya as any).PlayerConfig.UI = {};

const mapKey = getMapFromQuery();

Laya.init(VIEWPORT.width, VIEWPORT.height).then(() => {
  Laya.stage.scaleMode = Laya.Stage.SCALE_FIXED_AUTO;
  Laya.stage.bgColor = "#222222";
  const preview = new MonsterDropPreview(Laya, mapKey);
  preview.create();
  document.title = `${MAP_CONFIG[mapKey].label} Monster Drop`;
  console.log(`[MonsterDropPreview] ${MAP_CONFIG[mapKey].label} ready`);
}).catch((err: unknown) => {
  console.error("[MonsterDropPreview] init failed:", err);
});
