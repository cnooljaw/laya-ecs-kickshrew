/**
 * ShrewNode — 复合地鼠精灵节点
 *
 * 参考 src1/games/shrew/view/ui/Shrew/BaseShrew.lua 实现：
 * - _mainLayer 包含所有部件，初始 y = HIDDEN_Y（藏在洞下）
 * - 出洞动画：mainLayer.y 从 HIDDEN_Y → STAND_Y（0.31秒）
 * - 入洞动画：mainLayer.y 从 STAND_Y → HIDDEN_Y（0.31秒）
 *
 * 坐标系转换（Cocos Y-up → Laya Y-down）：
 *   Cocos: child.setPosition(cx, cy)，child 中心在 _mainLayer 坐标 (cx, cy)（Y-up，原点左下）
 *   Laya:  layaX = cx，layaY = bh - cy（翻转 Y 轴）
 *   drawPart(tex, layaX, layaY) 以 (layaX, layaY) 为中心绘制（通过 -w/2,-h/2 偏移实现）
 *
 * 旋转帧处理（rotated=true in atlas JSON）：
 *   Laya AtlasLoader 不处理旋转标志，旋转帧显示时顺时针旋转90°
 *   需要对旋转帧的 Sprite 额外应用 rotation=-90°（逆时针补偿）
 *   同时旋转帧的 tex.width/height 在 atlas 中是互换的，drawTexture 时尺寸已正确
 *
 * _mainLayer.y 值：
 *   STAND_Y  = -bh*0.5（body 中心对齐 HoleNode 原点/洞口中心）
 *   HIDDEN_Y = bh*1.5  （Cocos: -bh*1.5 向下；Laya Y-down: +bh*1.5 向下=藏在洞下）
 *
 * ZOrder（参考 ShrewData.lua）：hand=0, ear=1, body=3, face=6
 */
import type { IShrewNode } from "../binding/ShrewViewBinding";
import { ShrewType, ShrewAction } from "../ecs/types";
import { getAtlasPath, getFrameTexture } from "../resource/AtlasConfig";
import { SHREW_VIEW_LAYOUT } from "../config/ViewLayoutConfig";

export function getShrewMainLayerY(actionState: number, bodyH: number, progress: number): number {
  const standY = -bodyH * 0.5;
  const hiddenY = bodyH * SHREW_VIEW_LAYOUT.hiddenOffsetRatio;

  switch (actionState) {
    case ShrewAction.Up:
      return hiddenY + (standY - hiddenY) * progress;
    case ShrewAction.Stand:
    case ShrewAction.Dizzy:
      return standY;
    case ShrewAction.Down:
      return standY + (hiddenY - standY) * progress;
    case ShrewAction.Wait:
    default:
      return hiddenY;
  }
}

/** 各类型地鼠的 atlas 和部件帧名映射 */
const SHREW_FRAMES: Record<number, {
  atlas: string;
  body: string;
  face: string;
  earLeft: string;
  earRight: string;
  handLeft: string;
  handRight: string;
  eyeLeft?: string;
  eyeRight?: string;
  /** 哪些帧在 atlas 中是 rotated=true，需要额外 -90° 旋转补偿 */
  rotatedFrames: string[];
}> = {
  [ShrewType.Red]: {
    atlas: "shrew_red",
    body: "red_body",         face: "red_face_smile",
    earLeft: "red_ear_left_up",   earRight: "red_ear_right_up",
    handLeft: "red_hand_left",    handRight: "red_hand_right",
    rotatedFrames: ["red_face_smile", "red_ear_left_up", "red_ear_right_up"],
  },
  [ShrewType.Blue]: {
    atlas: "shrew_boss",
    body: "boss_body",         face: "boss_face_smile",
    earLeft: "boss_ear_left",    earRight: "boss_ear_right",
    handLeft: "boss_hand_left_down", handRight: "boss_hand_right_down",
    rotatedFrames: ["boss_face_smile", "boss_hand_left_down"],
  },
  [ShrewType.Yellow]: {
    atlas: "shrew_yellow",
    body: "yellow_body",       face: "yellow_face_smile",
    earLeft: "yellow_ear_left_up", earRight: "yellow_ear_right_up",
    handLeft: "yellow_hand_left",  handRight: "yellow_hand_right",
    rotatedFrames: ["yellow_face_smile", "yellow_ear_left_up", "yellow_ear_right_up", "yellow_hand_left"],
  },
  [ShrewType.Green]: {
    atlas: "shrew_green",
    body: "second_body",       face: "second_face_smile",
    earLeft: "second_ear_left",   earRight: "second_ear_right",
    handLeft: "second_hand_up_left", handRight: "second_hand_up_right",
    eyeLeft: "second_red_eye_left",
    eyeRight: "second_red_eye_right",
    rotatedFrames: ["second_red_eye_right"],
  },
};

export class ShrewNode implements IShrewNode {
  private _container: any = null;   // 洞位容器的子容器
  private _mainLayer: any = null;   // 部件层，做出洞/入洞动画
  private _bodyW: number = 94;
  private _bodyH: number = 110;
  private _currentShrewType: number = -1;
  private _currentMapType: number = -1;

  create(parent: any): void {
    const Laya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
    if (!Laya) { this._container = parent; return; }

    // 外层容器（定位用）
    this._container = new Laya.Sprite();
    this._container.name = "ShrewNode";
    this._container.visible = false;
    if (parent) parent.addChild(this._container);

    // mainLayer：所有部件都挂在这里，出洞/入洞靠移动它的 y
    this._mainLayer = new Laya.Sprite();
    this._mainLayer.name = "ShrewMainLayer";
    this._container.addChild(this._mainLayer);

    // 初始藏在洞中心下方（HIDDEN_Y = bh * 1.5）
    this._mainLayer.y = getShrewMainLayerY(ShrewAction.Wait, this._bodyH, 0);
  }

  setSpriteFrame(shrewType: number, mapType: number): void {
    if (this._currentShrewType === shrewType && this._currentMapType === mapType) return;
    this._currentShrewType = shrewType;
    this._currentMapType = mapType;

    const def = SHREW_FRAMES[shrewType];
    if (!def) return;

    const Laya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
    if (!Laya || !this._mainLayer) return;

    const atlasPath = getAtlasPath(def.atlas);
    const atlasUrl = `resources/${atlasPath}.atlas`;

    Laya.loader.load(atlasUrl, Laya.Loader.ATLAS).then((atlasRes: any) => {
      if (!this._mainLayer) return;
      if (!atlasRes) {
        console.error(`[ShrewNode] atlas load failed: ${atlasUrl}`);
        return;
      }

      // 清除旧部件
      this._mainLayer.removeChildren?.();

      const bodyTex = getFrameTexture(atlasRes, def.body);
      if (!bodyTex) {
        console.error(`[ShrewNode] body frame not found: ${def.body}, atlas:`, atlasUrl);
        return;
      }

      const bw = bodyTex.width;
      const bh = bodyTex.height;
      this._bodyW = bw;
      this._bodyH = bh;

      // HoleNode 原点代表洞口视觉中心。地鼠 stand 时 body 中心也对齐到这个原点。
      if (this._container) {
        this._container.x = -bw * 0.5;
        this._container.y = 0;
        // 不在 ShrewNode 上做 scrollRect：Laya 的 scrollRect x/y 会滚动内容，
        // 负数裁剪起点会把地鼠整体推到右下。洞口遮挡统一交给 SceneLayer cover。
        this._container.scrollRect = null;
      }

      // 更新 mainLayer 初始隐藏位置
      // Cocos: HIDDEN_Y=-bh*1.5; Laya Y-down: HIDDEN_Y=+bh*1.5
      this._mainLayer.y = getShrewMainLayerY(ShrewAction.Wait, bh, 0);

      // 旋转帧集合（O(1) 查找）
      const rotatedSet = new Set(def.rotatedFrames);

      /**
       * drawPart — 以 (x, y) 为中心绘制一个部件
       *
       * 对于 rotated=true 的帧（Laya AtlasLoader 忽略该标志）：
       *   atlas 中帧顺时针旋转90°存储，显示时需补偿 -90°（逆时针）
       *   tex.width/height 是 atlas 中旋转后的尺寸（宽高互换），已正确用于 drawTexture
       *
       * @param frameName  帧名，用于判断是否旋转帧（自动补偿 -90°）
       * @param extraRot   额外旋转角度（度），叠加于旋转补偿之上
       */
      const drawPart = (tex: any, frameName: string, x: number, y: number, zOrder: number, extraRot: number = 0) => {
        if (!tex) return;
        const sp = new Laya.Sprite();
        sp.zOrder = zOrder;
        const totalRot = (rotatedSet.has(frameName) ? -90 : 0) + extraRot;
        if (totalRot !== 0) sp.rotation = totalRot;
        sp.graphics.drawTexture(tex, -tex.width / 2, -tex.height / 2, tex.width, tex.height);
        sp.x = x;
        sp.y = y;
        this._mainLayer.addChild(sp);
      };

      // 根据地鼠类型，使用各自的 Cocos→Laya 坐标（layaY = bh - cocosY）
      // 参考各 Shrew.lua 的 setComPos() 函数
      switch (shrewType) {
        case ShrewType.Red:
          // Cocos: body(0.5,0.5) face(0.5,0.6) earL(0.1,0.8) earR(0.88,0.8)
          //        handL(-0.05,0.42) handR(1.05,0.42)
          drawPart(bodyTex,                                def.body,     bw * 0.5,     bh * 0.5,  3);
          drawPart(getFrameTexture(atlasRes, def.face),    def.face,     bw * 0.5,     bh * 0.4,  6);
          drawPart(getFrameTexture(atlasRes, def.earLeft), def.earLeft,  bw * 0.1,     bh * 0.2,  1);
          drawPart(getFrameTexture(atlasRes, def.earRight),def.earRight, bw * 0.88,    bh * 0.2,  1);
          drawPart(getFrameTexture(atlasRes, def.handLeft),def.handLeft, bw * (-0.05), bh * 0.58, 0);
          drawPart(getFrameTexture(atlasRes, def.handRight),def.handRight,bw * 1.05,   bh * 0.58, 0);
          break;

        case ShrewType.Blue:
          // Cocos: body(0.5,0.5) face(0.5,0.55) earL(0.2,0.87) earR(0.78,0.88)
          //        handL(0.04,0.42,rot=-20) handR(0.98,0.42,rot=+20)
          drawPart(bodyTex,                                def.body,     bw * 0.5,    bh * 0.5,  3);
          drawPart(getFrameTexture(atlasRes, def.face),    def.face,     bw * 0.5,    bh * 0.45, 6);
          drawPart(getFrameTexture(atlasRes, def.earLeft), def.earLeft,  bw * 0.2,    bh * 0.13, 1);
          drawPart(getFrameTexture(atlasRes, def.earRight),def.earRight, bw * 0.78,   bh * 0.12, 1);
          drawPart(getFrameTexture(atlasRes, def.handLeft),def.handLeft, bw * 0.04,   bh * 0.58, 0, -20);
          drawPart(getFrameTexture(atlasRes, def.handRight),def.handRight,bw * 0.98,  bh * 0.58, 0,  20);
          break;

        case ShrewType.Yellow:
          // Cocos: body(0.5,0.5) face(0.5,0.65) earL(0.1,0.8) earR(0.83,0.8)
          //        handL(-0.05,0.42) handR(1.05,0.42)
          drawPart(bodyTex,                                def.body,     bw * 0.5,     bh * 0.5,  3);
          drawPart(getFrameTexture(atlasRes, def.face),    def.face,     bw * 0.5,     bh * 0.35, 6);
          drawPart(getFrameTexture(atlasRes, def.earLeft), def.earLeft,  bw * 0.1,     bh * 0.2,  1);
          drawPart(getFrameTexture(atlasRes, def.earRight),def.earRight, bw * 0.83,    bh * 0.2,  1);
          drawPart(getFrameTexture(atlasRes, def.handLeft),def.handLeft, bw * (-0.05), bh * 0.58, 0);
          drawPart(getFrameTexture(atlasRes, def.handRight),def.handRight,bw * 1.05,   bh * 0.58, 0);
          break;

        case ShrewType.Green:
          // Cocos: body(0.5,0.5) face(0.5,0.55) earL(0.2,0.86) earR(0.78,0.86)
          //        handL(0.11,0.31) handR(0.89,0.31)
          //        eyeL(0.3,0.7) eyeR(0.7,0.7) → Laya: (0.3,0.3) (0.7,0.3)
          drawPart(bodyTex,                                def.body,     bw * 0.5,    bh * 0.5,  3);
          drawPart(getFrameTexture(atlasRes, def.face),    def.face,     bw * 0.5,    bh * 0.45, 6);
          drawPart(getFrameTexture(atlasRes, def.earLeft), def.earLeft,  bw * 0.2,    bh * 0.14, 1);
          drawPart(getFrameTexture(atlasRes, def.earRight),def.earRight, bw * 0.78,   bh * 0.14, 1);
          drawPart(getFrameTexture(atlasRes, def.handLeft),def.handLeft, bw * 0.11,   bh * 0.69, 0);
          drawPart(getFrameTexture(atlasRes, def.handRight),def.handRight,bw * 0.89,  bh * 0.69, 0);
          if (def.eyeLeft) drawPart(getFrameTexture(atlasRes, def.eyeLeft), def.eyeLeft, bw * 0.3, bh * 0.3, 7);
          if (def.eyeRight) drawPart(getFrameTexture(atlasRes, def.eyeRight), def.eyeRight, bw * 0.7, bh * 0.3, 7);
          break;

        default:
          drawPart(bodyTex,                                def.body,     bw * 0.5,     bh * 0.5,  3);
          drawPart(getFrameTexture(atlasRes, def.face),    def.face,     bw * 0.5,     bh * 0.4,  6);
          drawPart(getFrameTexture(atlasRes, def.earLeft), def.earLeft,  bw * 0.1,     bh * 0.2,  1);
          drawPart(getFrameTexture(atlasRes, def.earRight),def.earRight, bw * 0.88,    bh * 0.2,  1);
          drawPart(getFrameTexture(atlasRes, def.handLeft),def.handLeft, bw * (-0.05), bh * 0.58, 0);
          drawPart(getFrameTexture(atlasRes, def.handRight),def.handRight,bw * 1.05,   bh * 0.58, 0);
      }
    });
  }

  setAnimation(actionState: number, _animType: number, progress: number): void {
    const Laya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
    if (!Laya || !this._container) return;

    switch (actionState) {
      case ShrewAction.Wait:
        this._container.visible = false;
        if (this._mainLayer) this._mainLayer.y = getShrewMainLayerY(actionState, this._bodyH, progress);
        break;

      case ShrewAction.Up:
        // 出洞：progress 0→1，mainLayer.y 从下方隐藏点 → 洞中心点
        this._container.visible = true;
        if (this._mainLayer) this._mainLayer.y = getShrewMainLayerY(actionState, this._bodyH, progress);
        break;

      case ShrewAction.Stand:
        this._container.visible = true;
        if (this._mainLayer) this._mainLayer.y = getShrewMainLayerY(actionState, this._bodyH, progress);
        break;

      case ShrewAction.Down:
        // 入洞：progress 0→1，mainLayer.y 从洞中心点 → 下方隐藏点
        this._container.visible = true;
        if (this._mainLayer) this._mainLayer.y = getShrewMainLayerY(actionState, this._bodyH, progress);
        break;

      case ShrewAction.Dizzy:
        this._container.visible = true;
        if (this._mainLayer) this._mainLayer.y = getShrewMainLayerY(actionState, this._bodyH, progress);
        break;

      default:
        this._container.visible = false;
    }
  }

  setClickable(clickable: boolean): void {
    if (this._container) this._container.mouseEnabled = clickable;
  }

  setHatVisible(_visible: boolean): void {
    // 蓝鼠帽子：boss_hat atlas，暂不实现
  }

  setPropType(_propType: number): void {
    // TODO: 根据 propType 显示不同道具
  }

  destroy(): void {
    if (this._container) {
      this._container.destroy();
      this._container = null;
    }
    this._mainLayer = null;
  }
}
