# 打地鼠游戏修复计划 — 地鼠外观位置修复 + Space 场景蓝屏修复

## Context

当前打地鼠游戏已基本可运行，但存在两个视觉问题：

1. **地鼠外观错误**：各部件（脸/耳朵/手）位置不对，原因是 Cocos2d-x 坐标系（Y轴向上，子节点位置相对 _mainLayer 底部左角，各Sprite锚点默认(0.5,0.5) 即中心）与 LayaAir 坐标系（Y轴向下，位置是节点左上角）的差异未被正确处理。当前代码尝试做了 Y 轴翻转但方式不对，导致部件出现在错误位置。

2. **Space 场景蓝屏**：太空地图切换后显示蓝色背景+无洞口，可能是 atlas 加载失败或帧名匹配失败导致 `getFrameTexture` 返回 null，背景未绘制。

---

## 一、Cocos2d-x → LayaAir 坐标系转换分析

### Cocos2d-x 坐标系

- **Y 轴方向**：向上（屏幕底部 y=0，越往上 y 越大）
- **节点默认锚点**：(0.5, 0.5) = 中心，即 setPosition 设置的是节点**中心**相对**父节点底部左角**的偏移
- **_mainLayer（cc.Layer）锚点**：(0, 0) = 左下角，子节点的 setPosition(x, y) 即子节点**中心**在 _mainLayer 坐标系里的位置

所以 Cocos 中：
```
_mainLayer 左下角 = (0, 0)
body.setPosition(fw*0.5, fh*0.5) → body中心在 (fw*0.5, fh*0.5)，即 _mainLayer 中央
face.setPosition(fw*0.5, fh*0.6) → face中心在 (fw*0.5, fh*0.6)，即 body 上方
```

### LayaAir 坐标系

- **Y 轴方向**：向下（屏幕顶部 y=0，越往下 y 越大）
- **Sprite 位置**：默认是节点**左上角**坐标，无内建锚点概念
- **graphics.drawTexture(tex, offsetX, offsetY, w, h)** 中 offsetX/offsetY 是相对该 Sprite 自身坐标原点的偏移

当前代码用 `drawPart(tex, x, y, z)` 创建子 Sprite，该 Sprite.x = x, y = y，然后 `graphics.drawTexture(tex, -w/2, -h/2, w, h)` — 这相当于以 (x, y) 为中心绘制，**等价于 Cocos 中 setPosition(x, y) + 锚点(0.5,0.5)**。这个思路是正确的。

### 转换公式

Cocos 中 `child.setPosition(cx, cy)` 意思是：在 Cocos Y-up 坐标系下，child 的中心点位于 `(cx, cy)`（相对 _mainLayer 左下角）。

在 Laya 的 Y-down 坐标系中，`_mainLayer` 左上角对应 Cocos 的左上角（注意：_mainLayer 高度 = fh）。因此：

```
Laya Y = fh - Cocos Y = fh - cy   (把 Cocos Y-up 转换为 Laya Y-down)
Laya X = cx  (X 轴方向相同，不变)
```

### 当前代码 vs 正确计算对比（以 Red 地鼠为例，frameSize = fw × fh）

| 部件 | Cocos Y | 正确 Laya Y (fh-cocosY) | 当前代码 Y | 问题 |
|------|---------|------------------------|-----------|------|
| body | fh*0.5 | fh*0.5 | fh*0.5 ✓ | 正确 |
| face | fh*0.6 | fh*0.4 | fh*0.4 ✓ | 正确 |
| earLeft | fh*0.8 | fh*0.2 | fh*0.2 ✓ | 正确 |
| earRight | fh*0.8 | fh*0.2 | fh*0.2 ✓ | 正确 |
| handLeft | fh*0.42 | fh*0.58 | fh*0.58 ✓ | 正确 |
| handRight | fh*0.42 | fh*0.58 | fh*0.58 ✓ | 正确 |

**坐标计算本身实际上是正确的！**

### 真正的问题所在

问题不在于坐标公式，而在于以下几点：

**问题1：drawPart 的 x/y 含义混淆**

`drawPart(tex, x, y, zOrder)` 创建 `sp.x = x, sp.y = y`，然后 `drawTexture(tex, -w/2, -h/2)` — 这让 **sp 的绘制中心**在 `(x, y)`。但 Laya Sprite 的 `x/y` 是其**左上角**在父节点中的位置。`drawTexture` 的偏移是相对 Sprite 自身坐标原点（即左上角），所以绘制中心实际在 `(x + 0, y + 0)` — 没有问题，这是正确的"以(x,y)为中心"。

**但是**：各部件 Sprite 都是 `_mainLayer` 的子节点，`_mainLayer` 的位置是 `y = -fh*1.5`。在 `_mainLayer` 内部，body 的 drawTexture 坐标 (fw*0.5, fh*0.5) 是从 _mainLayer 顶左角向右/向下的偏移。

**问题2：地鼠完全显示时 _mainLayer.y 应为多少？**

在 Cocos 中：
- `_mainLayer` 初始 y = `-fh*1.5`（在洞下）
- 出洞后 y = `0`（_mainLayer 底部对齐到洞口底部）
- 此时 body 中心在 `_mainLayer` 内的 y = `fh*0.5`（Cocos Y-up），即 body 中心相对整个场景的 y = `0 + fh*0.5`

在 Laya 中：
- `_mainLayer` 初始 y = `-fh*1.5`（洞口以上 1.5 倍高度，即完全藏下）
- 出洞后 y 应为 **`-fh`**（不是 0！），使地鼠身体刚好在洞口上方可见
- 当 `_mainLayer.y = -fh` 时，body 在场景中的实际 y = `-fh + fh*0.5 = -fh*0.5`（在洞口上方）

**等等，这需要更仔细分析**。让我重新梳理：

在 Cocos 中，整个 `BaseShrew` 节点的 ContentSize = `(fw, fh)`，位置是洞口坐标。`ClippingNode` 从 `(0,0)` 开始（相对 BaseShrew 左下角），stencil 矩形是 `(-fw*0.5, 0)` 到 `(fw*1.2, fh*1.5)`，显示区域是洞口**向上**的区域。`_mainLayer.y = 0` 时，Layer 底部对齐 BaseShrew 底部，body 中心在 y = fh*0.5（向上），显示在洞口区域内。

在 Laya 中，`_mainLayer.y = 0` 时，Layer 顶部对齐父节点（HoleNode）顶部。body 的 sp.y = fh*0.5（向下），即 body 中心在 HoleNode 内坐标 `fh*0.5`（向下）。

**_mainLayer 的 Stand 状态 y 值应该是 `-fh`（在 HoleNode 的可见区域上方）**？

实际上，需要看 HoleNode 是如何定位的，以及「洞口」的坐标对应关系。

---

## 二、修复方案

### 修复1：ShrewNode.ts — _mainLayer 的 y 偏移值

**Cocos 坐标系的 Stand 状态**：
- `_mainLayer.y = 0`（Layer 底部对齐 BaseShrew 的 y=0 即锚点底部）
- BaseShrew 锚点 (0.5, 0.5)，所以 BaseShrew 底部在 `hole.y - fh/2`（Y-up 坐标）
- body 中心绝对 y = hole.y - fh/2 + fh*0.5 = hole.y（与洞口中心等高）

**Laya 坐标系对应**（Y-down，HoleNode.y = hole.y）：
- body 中心要在 HoleNode.y 的相对位置 `0`（即与 HoleNode 对齐）
- body sp.y = fh*0.5（绘图中心在 sp.y=fh*0.5 处，相对 _mainLayer）
- 所以 _mainLayer.y = -fh*0.5（使 body 中心落在 HoleNode 的 y=0）

**Stand 时 `_mainLayer.y = -fh*0.5`**

Hidden（完全藏入洞下）时 `_mainLayer.y = -fh*0.5 - fh*1.5 = -fh*2.0`

```typescript
// Stand 显示状态
const STAND_Y  = -bh * 0.5;          // body 中心与洞口对齐
const HIDDEN_Y = -bh * 0.5 - bh * 1.5;  // = -bh * 2.0（完全藏入）

// 初始化
this._mainLayer.y = HIDDEN_Y;

// 出洞动画 (progress 0→1)
_mainLayer.y = HIDDEN_Y + (STAND_Y - HIDDEN_Y) * progress
             = -bh*2.0 + bh*1.5 * progress

// 入洞动画 (progress 0→1)
_mainLayer.y = STAND_Y + (HIDDEN_Y - STAND_Y) * progress
             = -bh*0.5 - bh*1.5 * progress
```

### 修复2：各地鼠类型的部件坐标（Cocos Y-up → Laya Y-down 转换）

转换公式：
- `layaX = cocosX`（X 轴不变）
- `layaY = fh - cocosY`（Y 轴翻转，fh = body 高度）

`drawPart(tex, layaX, layaY, zOrder, rotation=0)` 以 `(layaX, layaY)` 为中心绘制（通过 `-w/2, -h/2` 偏移实现）。

#### 红色地鼠 (Red)
```typescript
drawPart(bodyTex,  fw*0.5,        fh*0.5,  3);  // Cocos (0.5, 0.5)
drawPart(faceTex,  fw*0.5,        fh*0.4,  6);  // Cocos (0.5, 0.6) → 1-0.6=0.4
drawPart(earLTex,  fw*0.1,        fh*0.2,  1);  // Cocos (0.1, 0.8) → 1-0.8=0.2
drawPart(earRTex,  fw*0.88,       fh*0.2,  1);  // Cocos (0.88, 0.8) → 0.2
drawPart(handLTex, fw*(-0.05),    fh*0.58, 0);  // Cocos (0.5-0.55=-0.05, 0.42) → 1-0.42=0.58
drawPart(handRTex, fw*1.05,       fh*0.58, 0);  // Cocos (0.5+0.55=1.05, 0.42) → 0.58
```

#### 蓝色地鼠 (Blue/Boss)
```typescript
drawPart(bodyTex,  fw*0.5,   fh*0.5,  3);        // Cocos (0.5, 0.5)
drawPart(faceTex,  fw*0.5,   fh*0.45, 6);        // Cocos (0.5, 0.55) → 1-0.55=0.45
drawPart(earLTex,  fw*0.2,   fh*0.13, 1);        // Cocos (0.2, 0.87) → 1-0.87=0.13
drawPart(earRTex,  fw*0.78,  fh*0.12, 1);        // Cocos (0.78, 0.88) → 1-0.88=0.12
drawPart(handLTex, fw*0.04,  fh*0.58, 0, -20);   // Cocos (0.5-0.46=0.04, 0.42) → 0.58, rot=-20
drawPart(handRTex, fw*0.98,  fh*0.58, 0, 20);    // Cocos (0.5+0.48=0.98, 0.42) → 0.58, rot=+20
```

#### 黄色地鼠 (Yellow)
```typescript
drawPart(bodyTex,  fw*0.5,        fh*0.5,  3);  // Cocos (0.5, 0.5)
drawPart(faceTex,  fw*0.5,        fh*0.35, 6);  // Cocos (0.5, 0.65) → 1-0.65=0.35
drawPart(earLTex,  fw*0.1,        fh*0.2,  1);  // Cocos (0.1, 0.8) → 0.2
drawPart(earRTex,  fw*0.83,       fh*0.2,  1);  // Cocos (0.83, 0.8) → 0.2
drawPart(handLTex, fw*(-0.05),    fh*0.58, 0);  // Cocos (0.5-0.55=-0.05, 0.42) → 0.58
drawPart(handRTex, fw*1.05,       fh*0.58, 0);  // Cocos (0.5+0.55=1.05, 0.42) → 0.58
```

#### 绿色地鼠 (Green)
```typescript
drawPart(bodyTex,  fw*0.5,   fh*0.5,  3);       // Cocos (0.5, 0.5)
drawPart(faceTex,  fw*0.5,   fh*0.45, 6);       // Cocos (0.5, 0.55) → 0.45
drawPart(earLTex,  fw*0.2,   fh*0.14, 1);       // Cocos (0.2, 0.86) → 1-0.86=0.14
drawPart(earRTex,  fw*0.78,  fh*0.14, 1);       // Cocos (0.78, 0.86) → 0.14
drawPart(handLTex, fw*0.11,  fh*0.69, 0);       // Cocos (0.5-0.39=0.11, 0.31) → 1-0.31=0.69
drawPart(handRTex, fw*0.89,  fh*0.69, 0);       // Cocos (0.5+0.39=0.89, 0.31) → 0.69
```

### 修复3：drawPart 支持旋转

```typescript
const drawPart = (tex: any, x: number, y: number, zOrder: number, rotation: number = 0) => {
  if (!tex) return;
  const sp = new Laya.Sprite();
  sp.zOrder = zOrder;
  if (rotation !== 0) sp.rotation = rotation;  // Laya rotation 顺时针，与 Cocos 相同
  sp.graphics.drawTexture(tex, -tex.width / 2, -tex.height / 2, tex.width, tex.height);
  sp.x = x; sp.y = y;
  this._mainLayer.addChild(sp);
};
```

### 修复4：setSpriteFrame 按类型分支调用

将当前通用的 `drawPart` 调用替换为 `switch(shrewType)` 分支，每种类型独立使用正确坐标。

### 修复5：setAnimation 更新 y 值计算

```typescript
const STAND_Y  = -bh * 0.5;
const HIDDEN_Y = -bh * 2.0;

case ShrewAction.Up:
  _mainLayer.y = HIDDEN_Y + (STAND_Y - HIDDEN_Y) * progress;  // -bh*2.0 + bh*1.5*progress
  break;
case ShrewAction.Stand:
  _mainLayer.y = STAND_Y;   // -bh*0.5
  break;
case ShrewAction.Down:
  _mainLayer.y = STAND_Y + (HIDDEN_Y - STAND_Y) * progress;   // -bh*0.5 - bh*1.5*progress
  break;
```

> **注意**：y 偏移量 `fh*0.5` 是基于洞口中心定位推导出的理论值。如果视觉效果不对（地鼠太高或太低），可以微调这个偏移量。

### 修复6：Space 场景 — 加载失败时 fallback 调试

在 `SceneLayer.switchScene` 中加强日志：

```typescript
Laya.loader.load(atlasUrl, Laya.Loader.ATLAS).then((atlasRes: any) => {
  if (!atlasRes) {
    console.error(`[SceneLayer] atlas load failed: ${atlasUrl}`);
    return;
  }
  const tex = getFrameTexture(atlasRes, frameName);
  if (!tex) {
    console.error(`[SceneLayer] frame not found: ${frameName}, frames:`,
      atlasRes.frames?.map((f: any) => f?.url));
    return;
  }
  this._bgSprite.graphics.clear();
  this._bgSprite.graphics.drawTexture(tex, 0, 0, W, H);
});
```

---

## 三、需要修改的文件

| 文件 | 修改内容 |
|------|---------|
| `src/view/ShrewNode.ts` | 1) `drawPart` 增加 `rotation` 参数；2) `setSpriteFrame` 改为 `switch(shrewType)` 分支，各类型用正确 Laya Y-down 坐标；3) `setAnimation` 中 `STAND_Y=-bh*0.5`，`HIDDEN_Y=-bh*2.0` |
| `src/view/SceneLayer.ts` | `switchScene` 添加加载失败错误日志，便于诊断 Space 场景蓝屏原因 |

---

## 四、验证方式

1. `npm run build`（或 IDE 构建），确认无编译错误
2. 浏览器打开游戏，切换到草地场景：
   - 地鼠各部件（耳/脸/手）位置正确，与原版 Cocos 游戏视觉一致
   - 出洞动画：地鼠从洞口底部出现，Stand 时整体居中在洞口上方
3. 打开 DevTools Console，切换到 Space 场景后查看日志：
   - 无 "atlas load failed" 或 "frame not found" 错误
   - 背景显示月球图
4. 各地鼠类型（红/蓝/黄/绿）逐一确认外观正确

## Context

将 src1 目录下的 Lua/Cocos2d-x 打地鼠源码，用 LayaAir 3.3.10 + bitECS 架构重新实现。源码分析已保存在项目记忆中。首版包含完整功能：4种地鼠、6+1锤子、连击/雷神锤、4场景地图、9洞布局。网络部分先本地模拟回包，后续对接真实服务器。资源用脚本自动将 Cocos plist 转为 Laya atlas 格式。

---

## 一、项目配置

### 1.1 安装 bitecs + vitest
- 创建 `package.json`，添加 `bitecs` 和 `vitest` 依赖
- 创建 `vitest.config.ts`，配置 include 为 `src/tests/**/*.test.ts`
- 更新 `tsconfig.json` 的 paths 配置，确保 bitecs 模块可解析
- 关键文件: `package.json`(新建), `vitest.config.ts`(新建), `tsconfig.json`(修改)

### 1.2 目录结构
```
src/
├── Main.ts                         # 入口，引导加载→创建世界→启动游戏
├── ecs/
│   ├── types.ts                    # 枚举常量 (ShrewType/ShrewAction/MapType/HammerType/ZOrder)
│   ├── world.ts                    # createWorld + 实体工厂函数
│   ├── components/
│   │   ├── ShrewComponent.ts       # 地鼠：type/hp/action/hat/map/clickable/timer/prop
│   │   ├── HoleComponent.ts        # 洞位：gridRow/gridCol/posX/posY/shrewEid/zIndex
│   │   ├── HammerComponent.ts      # 锤子：selectedType/isThunderActive/hitTable
│   │   ├── ComboComponent.ts       # 连击：comboCount/comboID/targetHoles[3]
│   │   ├── SceneComponent.ts       # 场景：currentMap/timer/cycleInterval/transitioning
│   │   ├── PlayerComponent.ts      # 玩家：money/angry/power/powerTop/level
│   │   ├── AnimationComponent.ts   # 动画：animType/progress/duration
│   │   ├── HitComponent.ts         # 击中结果：shrewIndex/reward/wasHit
│   │   ├── NetworkComponent.ts     # 网络：connected/pendingKick/responseBuffer
│   │   └── DirtyComponent.ts       # 脏标记：各组件bitmask + forceFullSync
│   ├── systems/
│       ├── ShrewStateSystem.ts     # 状态机: None→Wait→Up→Stand→Down→Refresh, Dizzy/Delay
│       ├── ComboSystem.ts          # 相邻洞位计算，最多3个连击目标
│       ├── HitDetectionSystem.ts   # 触摸→洞位碰撞→组装击打请求
│       ├── HitResponseSystem.ts    # 处理回包→更新玩家/地鼠/连击数据
│       ├── SceneCycleSystem.ts     # 每100秒切换场景，强制刷新地鼠
│       ├── HammerSystem.ts         # 锤子选择，雷神锤(angry>=1000)触发
│       ├── AnimationTimerSystem.ts # 推进动画计时器
│       └── DirtyMarkSystem.ts      # 最终系统：比较前后帧差异，标记DirtyComponent
├── binding/
│   ├── DirtyFlags.ts               # 各组件字段的bitmask常量定义
│   ├── SyncView.ts                 # 主同步：读Dirty→调对应Binding→清标记
│   ├── ShrewViewBinding.ts         # ShrewComponent → ShrewNode (sprite帧/位置/动画)
│   ├── HoleViewBinding.ts          # HoleComponent → HoleNode (位置/可见性)
│   ├── HammerViewBinding.ts        # HammerComponent → HammerNode (锤子sprite/摇摆)
│   ├── ComboViewBinding.ts         # ComboComponent → ComboNode (闪电链)
│   ├── SceneViewBinding.ts         # SceneComponent → SceneLayer (背景切换)
│   ├── PlayerViewBinding.ts        # PlayerComponent → PlayerHUD (数值更新)
│   └── HitViewBinding.ts           # HitComponent → 金币/宝箱动画
├── view/
│   ├── GameScene.ts                # Laya Script 挂载到Scene2D，引导整个游戏
│   ├── ShrewNode.ts                # 复合Sprite: body+face+hands+ears+hat+prop+dizzy+swelling
│   ├── HoleNode.ts                 # 洞容器Sprite，含裁剪遮罩+ShrewNode子节点
│   ├── HammerNode.ts               # 光标锤子+击打特效
│   ├── ComboNode.ts                # 闪电中心+分支闪电
│   ├── SceneLayer.ts               # 背景+蒙版+装饰物，按场景切换
│   ├── PlayerHUD.ts                # 银子/愤怒条/体力条/等级
│   ├── HammerListPanel.ts          # 6锤子选择面板
│   ├── GoldParticleNode.ts         # 金币洒落动画(对象池)
│   ├── TreasureBoxNode.ts          # 宝箱动画
│   ├── DizzyStarNode.ts            # 眩晕星星动画
│   └── NodePool.ts                 # 通用节点对象池
├── network/
│   ├── ProtocolTypes.ts            # KickRequest/KickResponse 接口定义
│   ├── KickSocket.ts               # Laya.Socket 封装，JSON收发
│   ├── MockServer.ts               # 本地模拟服务器回包
│   └── NetworkAdapter.ts           # Socket事件 ↔ ECS NetworkComponent 桥梁
├── resource/
│   ├── PlistConverter.ts           # 离线工具：Cocos plist XML → Laya atlas JSON
│   ├── AtlasConfig.ts              # atlas逻辑名 → 文件路径 映射表
│   └── AssetLoader.ts              # 批量预加载atlas+音效
├── config/
│   ├── HolePositions.ts            # 4种场景的9洞坐标比例
│   ├── ShrewResourceMap.ts          # shrewType+mapType → sprite帧名映射
│   ├── HammerConfig.ts             # 锤子ID→名称/特效帧/价格
│   └── SceneConfig.ts              # 场景循环顺序/背景atlas/蒙版帧名
└── tests/
    ├── ecs/
    │   ├── components.test.ts       # 组件定义+世界创建+实体工厂
    │   ├── ShrewStateSystem.test.ts # 地鼠状态机转换
    │   ├── AnimationTimerSystem.test.ts # 动画计时器推进
    │   ├── ComboSystem.test.ts     # 连击相邻洞位计算
    │   ├── HitDetectionSystem.test.ts # 触摸碰撞检测
    │   ├── HitResponseSystem.test.ts  # 回包数据处理
    │   ├── SceneCycleSystem.test.ts   # 场景切换计时器
    │   ├── HammerSystem.test.ts       # 锤子选择+雷神锤触发
    │   └── DirtyMarkSystem.test.ts    # 脏标记比较与设置
    └── network/
        ├── KickSocket.test.ts     # seqId匹配+超时+并发请求
        └── MockServer.test.ts      # 模拟回包生成+seqId回传
```

---

## 二、ECS 组件设计

所有组件使用 `bitecs` 的 `defineComponent` + `Types.f32`，数据驱动，不含渲染逻辑。

| 组件 | 关键字段 | 说明 |
|------|---------|------|
| ShrewComponent | shrewType, hp, actionState, hasHat, mapType, isClickable, animTimer, propType | 每个地鼠一个 |
| HoleComponent | gridRow, gridCol, posXRatio, posYRatio, shrewEid, zIndex | 固定9个 |
| HammerComponent | selectedType, isThunderActive, hitTable | 单例 |
| ComboComponent | comboCount, comboID, targetHoles[3] | 单例 |
| SceneComponent | currentMap, sceneTimer, cycleInterval, transitioning | 单例 |
| PlayerComponent | money, angry, power, powerTop, level | 单例 |
| AnimationComponent | animType, progress, duration | 每地鼠一个 |
| HitComponent | shrewIndex, reward, wasHit | 击中时创建 |
| NetworkComponent | connected, pendingKick | 单例 |
| DirtyComponent | shrew/hole/hammer/combo/scene/player/anim/hitDirty bitmask, forceFullSync | 每实体一个 |

---

## 三、ECS 系统执行顺序

每帧在 `Laya.timer.frameLoop` 中按序执行：

```
1. ShrewStateSystem      — 推进状态机 (None→Wait→Up→Stand→Down→Refresh)
2. AnimationTimerSystem  — 推进动画计时器
3. ComboSystem           — 计算连击目标 (有pending击打时)
4. SceneCycleSystem      — 检查场景切换计时器
5. HammerSystem          — 检查雷神锤触发
6. HitResponseSystem     — 处理回包数据 (本地模拟/网络)
7. DirtyMarkSystem       — 标记脏数据
8. SyncView              — 刷新Laya视图节点
```

HitDetectionSystem 不在帧循环中，由 Laya 触摸事件异步触发，写入 ECS 组件数据后由下一帧的 DirtyMarkSystem 处理。

---

## 四、Dirty Binding 机制

### 数据流
```
ECS Systems 修改组件数据 → DirtyMarkSystem 比较前后帧差异 → 设置 DirtyComponent bitmask
→ SyncView 读取 bitmask → 调用对应 Binding 函数 → 更新 Laya 节点属性 → 清除 bitmask
```

### DirtyFlags 示例
```typescript
// ShrewComponent 的脏标记位
BIT_SHREW_TYPE      = 0x0001  // 地鼠类型变化→换精灵帧
BIT_SHREW_HP        = 0x0002  // HP变化→触发受击/死亡
BIT_SHREW_ACTION    = 0x0004  // 状态变化→播放动画
BIT_SHREW_HAT       = 0x0008  // 帽子变化→蓝鼠帽子破碎
BIT_SHREW_MAP       = 0x0010  // 地图变化→换道具
BIT_SHREW_CLICKABLE = 0x0020  // 可点击状态
BIT_SHREW_TIMER     = 0x0040  // 计时器
BIT_SHREW_PROP      = 0x0080  // 道具变化
```

### forceFullSync
场景切换时设置 `forceFullSync=1`，SyncView 同步所有绑定，忽略个别 bit 跳过优化。用于场景切换时的完整重建。

---

## 五、核心游戏机制移植

### 5.1 地鼠状态机 (ShrewStateSystem)
```
None → Wait(随机1~8秒) → Up(0.31秒上移动画) → Stand(2秒停留,isClickable=true)
→ Down(0.31秒下移动画) → Refresh(重新随机地鼠类型) → 循环
```
特殊状态：Dizzy(被击中眩晕，播放星星动画)→Delay→Down

### 5.2 9洞3x3布局
洞位 index 1~9，gridRow = floor((i-1)/3)，gridCol = (i-1)%3
坐标比例从源码4个场景View中提取，存在 HolePositions.ts 中

### 5.3 4种地鼠
| 类型 | HP | 特点 |
|------|-----|------|
| 红(1) | 1 | 普通道具 |
| 蓝(2) | 2 | BOSS帽子，第一击碎帽变脸，第二击才击倒 |
| 黄(3) | 1 | 普通道具 |
| 绿(4) | 1 | 红眼特效+道具 |

### 5.4 锤子系统
6种锤子(木/石/铜/银/金/神) + 雷神锤(99)，各有不同击打特效帧数和价格

### 5.5 连击系统
击中地鼠时检查3x3相邻洞位，最多连击4个(1+3相邻)，闪电链动画

### 5.6 雷神锤
愤怒值>=1000触发，全屏敲击所有可见地鼠，宝箱动画+金币滚动

### 5.7 4场景循环
草地→帆船→下水道→太空，每100秒切换，切换时 forceFullSync 重建场景

---

## 六、网络层（本地模拟）

### 6.1 协议设计 — 保证请求回包一一对应

**核心机制：seqId + 请求队列 + 超时重发**

每个请求携带递增的 `seqId`，服务器回包原样返回 `seqId`，客户端通过 `seqId` 匹出对应的 pending 请求进行匹配。

```
客户端                            服务器
  │  {seqId:1, cmd:"kick", ...}  │
  │ ───────────────────────────→  │
  │                               │
  │  {seqId:1, cmd:"kickResult"}  │
  │ ←───────────────────────────  │
  │                               │
  │  {seqId:2, cmd:"kick", ...}  │  (可连续发，seqId递增)
  │ ───────────────────────────→  │
  │  {seqId:3, cmd:"kick", ...}  │
  │ ───────────────────────────→  │
  │                               │
  │  {seqId:2, cmd:"kickResult"}  │  (按seqId匹配，不依赖顺序)
  │ ←───────────────────────────  │
  │  {seqId:3, cmd:"kickResult"}  │
  │ ←───────────────────────────  │
```

**关键规则**：
1. 客户端维护 `seqId` 自增计数器，每个请求分配唯一 seqId
2. 发送请求后存入 `pendingRequests: Map<seqId, KickRequest>` 等待匹配
3. 收到回包后，按 `seqId` 从 pendingRequests 中弹出对应请求
4. 超时未收到回包（默认3秒），从 pendingRequests 中移除并标记失败
5. 不阻塞输入——玩家可连续敲击多个地鼠，每个请求独立追踪
6. 源码的 `hitTable` 锁仅用于锤子动画期间防连点（~0.24秒），与网络等待无关

### 发包格式 (JSON)
```typescript
interface KickRequest {
  seqId: number;            // 递增序列号，用于请求-回包匹配
  cmd: "kick";              // 命令字，区分消息类型（预留扩展）
  hammerType: number;       // 锤子类型 1-6 或 99
  bKickShrew: number;       // 1=击中, 0=未中
  numOfShrew: number;       // 击中地鼠数量
  shrews: Array<{shrewindex: number, protectType: number}>;
  comboID: number;          // 连击编号
}
```

### 回包格式 (JSON)
```typescript
interface KickResponse {
  seqId: number;            // 原样返回请求的seqId，用于匹配
  cmd: "kickResult";       // 命令字，与请求cmd对应
  ret: number;              // 0=成功, -1=错误
  money: number;
  angry: number;
  power: number;
  levelScore: number;
  hammerId: number;
  numOfShrew: number;
  shrewResp: Array<{shrewIndex: number, reward: number}>;
  combo: number;
  comboId: number;
}
```

### KickSocket.ts 核心逻辑
```typescript
class KickSocket {
  private _seqId: number = 0;                    // 自增序列号
  private _pendingRequests: Map<number, {        // 等待回包的请求
    req: KickRequest;
    timestamp: number;                            // 发送时间，用于超时检测
    resolve: (resp: KickResponse) => void;        // Promise回调
  }> = new Map();
  private _timeoutMs: number = 3000;             // 超时时间

  // 发送请求，返回Promise（可await或忽略）
  sendKick(req: Omit<KickRequest, 'seqId'>): Promise<KickResponse> {
    const seqId = ++this._seqId;
    const fullReq = { ...req, seqId };
    return new Promise((resolve, reject) => {
      this._pendingRequests.set(seqId, {
        req: fullReq, timestamp: Date.now(), resolve
      });
      this._socket.send(JSON.stringify(fullReq));
    });
  }

  // 收到回包，按seqId匹配
  onMessage(data: string) {
    const resp: KickResponse = JSON.parse(data);
    const pending = this._pendingRequests.get(resp.seqId);
    if (pending) {
      this._pendingRequests.delete(resp.seqId);
      pending.resolve(resp);
    }
    // 无匹配seqId则丢弃（可能是超时后的迟到回包）
  }

  // 每帧检查超时
  checkTimeout() {
    const now = Date.now();
    for (const [seqId, pending] of this._pendingRequests) {
      if (now - pending.timestamp > this._timeoutMs) {
        this._pendingRequests.delete(seqId);
        // 超时处理：标记失败，但不影响后续请求
      }
    }
  }
}
```

### MockServer.ts
本地模拟服务器逻辑：
- 收到 kick 请求后，**原样返回 seqId**，生成模拟回包
- 根据击中地鼠类型计算奖励(蓝鼠双倍)
- 随机增加愤怒值(10~30)
- 随机连击数(0~3)
- 预留 KickSocket 接口，后续直接替换为真实服务器连接

---

## 七、资源转换

### PlistConverter.ts (离线工具脚本)
1. 读取 Cocos plist XML 文件
2. 解析 `<dict>` 结构：frame名、rect、offset、rotated、sourceSize
3. 生成 Laya `.atlas` JSON 格式：`{ "frames": { "name": { "frame": {x,y,w,h}, "rotated": bool, "spriteSourceSize": {x,y,w,h}, "sourceSize": {w,h} } } }`
4. 输出到 `assets/resources/kickshrew/` 同目录

### 需要转换的 plist 列表
- `kickshrew_role_red.plist` — 红色地鼠
- `kickshrew_role_second.plist` — 绿色地鼠
- `kickshrew_role_yellow.plist` — 黄色地鼠
- `kickshrew_role_boss.plist` — 蓝色地鼠
- `kickshrew_boss_hat.plist` — BOSS帽子
- `shrew_dizzy_star.plist` — 眩晕星星
- `kickshrew_game_view.plist` — 游戏通用UI
- `kickshrew_combo_lighting.plist` — 连击闪电
- `kickshrew_hammer_effect.plist` — 锤子特效
- `kickshrew_treasue_effect.plist` — 宝箱特效
- `kickshrew_angry_hammer_effect.plist` — 雷神锤特效
- `kickshrew_treasure_box.plist` — 宝箱
- `game_view_grass.plist` / `game_view_grassbg.plist` — 草地场景
- `kickshrew_game_view_corsair.plist` / `kickshrew_game_view_corsairbg.plist` — 帆船场景
- `kickshrew_game_view_sewer.plist` / `kickshrew_game_view_sewerbg_01.plist` / `kickshrew_game_view_sewerbg_02.plist` — 下水道场景
- `kickshrew_game_view_moon.plist` / `kickshrew_game_view_moonbg.plist` — 太空场景
- `kickshrew_swear_animation.plist` — 地鼠表情
- `kickshrew_gameOverBox.plist` — 游戏结束
- `kickshrew_challengeMatch_countdownBox.plist` — 倒计时
- `kickshrew_challengeMatch_beginBox.plist` — 开始框
- `kickshrew_room_view.plist` — 房间视图

---

## 八、Laya 视图层要点

### ShrewNode (复合Sprite)
- 使用 Panel(scrollRect) 实现裁剪遮罩，模拟地鼠进出洞口效果
- 子节点：body/face/handL/handR/earL/earR/eyeL/eyeR/hat/prop/swelling/dizzyStars
- 子节点索引顺序决定 ZOrder（与源码 Zorder 常量对应）
- 对象池管理：Refresh时回池，新地鼠从池中取

### HoleNode
- 容器Sprite，定位在场景特定坐标
- 子节点包含 ShrewNode
- 行级 zOrder：第1行=2, 第2行=4, 第3行=6

### SceneLayer
- 背景 Sprite + 3行蒙版Sprite(cover) + 装饰物
- 场景切换时：卸载旧atlas帧 → 加载新atlas → 重建子节点层级
- `cacheAs="normal"` 优化静态部分

### HammerNode
- 锚点(0.75, 0.15)，跟随触摸位置
- 普通锤击：旋转30°→-30°→0° (0.24秒)
- 雷神锤击：旋转80°→-90°→10° (0.16秒)

---

## 九、实现步骤（TDD 流程）

### Step 1: 项目基础设施
- 创建 `package.json`，安装 `bitecs` + `vitest`
- 创建 `vitest.config.ts`
- 更新 `tsconfig.json`
- 修改 `src/Main.ts` 为入口引导
- 运行 `npx vitest run` 验证框架可用

### Step 2: 枚举与配置
- `src/ecs/types.ts` — 所有枚举常量
- `src/config/` 下4个配置文件

### Step 3: ECS 组件 + 世界（TDD: 先写测试）
- 🔴 写 `tests/ecs/components.test.ts`：测试组件默认值、实体创建、工厂函数
- 🟢 实现 `src/ecs/components/` 下10个组件文件
- 🟢 实现 `src/ecs/world.ts` — 世界创建+实体工厂
- 运行 `npx vitest run` 确认通过

### Step 4: 资源转换
- `src/resource/PlistConverter.ts` — 转换脚本
- 运行转换，生成 Laya atlas 文件
- `src/resource/AtlasConfig.ts` + `AssetLoader.ts`

### Step 5: ECS 系统（TDD: 每个系统先写测试）
- 🔴 写 `tests/ecs/ShrewStateSystem.test.ts`
- 🟢 实现 `ShrewStateSystem.ts`（最核心）
- 🔴 写 `tests/ecs/AnimationTimerSystem.test.ts`
- 🟢 实现 `AnimationTimerSystem.ts`
- 🔴 写 `tests/ecs/ComboSystem.test.ts`
- 🟢 实现 `ComboSystem.ts`
- 🔴 写 `tests/ecs/HitDetectionSystem.test.ts`
- 🟢 实现 `HitDetectionSystem.ts`
- 🔴 写 `tests/ecs/HitResponseSystem.test.ts`
- 🟢 实现 `HitResponseSystem.ts` + `MockServer.ts`
- 🔴 写 `tests/ecs/SceneCycleSystem.test.ts`
- 🟢 实现 `SceneCycleSystem.ts`
- 🔴 写 `tests/ecs/HammerSystem.test.ts`
- 🟢 实现 `HammerSystem.ts`
- 🔴 写 `tests/ecs/DirtyMarkSystem.test.ts`
- 🟢 实现 `DirtyMarkSystem.ts`
- 🔴 写 `tests/network/MockServer.test.ts`
- 🟢 完善 `MockServer.ts`
- 每个系统完成后运行 `npx vitest run` 确认全部通过

### Step 6: Dirty Binding 层
- `src/binding/DirtyFlags.ts`
- 各 Binding 文件
- `src/binding/SyncView.ts`

### Step 7: Laya 视图节点
- NodePool
- ShrewNode + HoleNode
- HammerNode + ComboNode + GoldParticleNode + DizzyStarNode + TreasureBoxNode
- SceneLayer
- PlayerHUD + HammerListPanel

### Step 8: 网络层（TDD: 先写测试）
- 🔴 写 `tests/network/KickSocket.test.ts`
- 🟢 实现 `KickSocket.ts` — seqId匹配+pending请求管理+超时检测
- 🔴 写 `tests/network/MockServer.test.ts`
- 🟢 实现 `MockServer.ts` — 本地模拟回包+seqId回传
- 🟢 实现 `ProtocolTypes.ts` + `NetworkAdapter.ts`
- 运行 `npx vitest run` 确认全部通过

### Step 9: 游戏入口整合
- GameScene.ts
- Main.ts 完整引导流程
- 帧循环注册与调度

### Step 10: 集成验证
- `npx vitest run` 全部单元测试通过
- 在 LayaAirIDE 中运行项目
- 验证地鼠出洞/进洞动画
- 验证触摸敲击与击打反馈
- 验证4场景切换
- 验证连击与雷神锤
- 验证模拟回包数据更新

---

## 十、验证方式

1. **编译检查**: 在 LayaAirIDE 中打开项目，确认 TypeScript 无报错
2. **资源加载**: 运行后确认 atlas 正常加载，sprite 帧可正确显示
3. **地鼠循环**: 9个地鼠按状态机循环出洞/停留/进洞/刷新
4. **触摸敲击**: 点击地鼠区域触发击打，锤子动画正常播放
5. **蓝鼠双击**: 蓝色地鼠第一击碎帽，第二击才倒
6. **连击闪电**: 连击时出现闪电链动画
7. **场景切换**: 100秒后自动切换场景，背景/蒙版/装饰更新
8. **雷神锤**: 愤怒值满后触发雷神锤，全屏击打+宝箱动画
9. **模拟回包**: 击中地鼠后银子/愤怒值/体力正确更新

---

## 十、验证方式

1. **编译检查**: 在 LayaAirIDE 中打开项目，确认 TypeScript 无报错
2. **资源加载**: 运行后确认 atlas 正常加载，sprite 帧可正确显示
3. **地鼠循环**: 9个地鼠按状态机循环出洞/停留/进洞/刷新
4. **触摸敲击**: 点击地鼠区域触发击打，锤子动画正常播放
5. **蓝鼠双击**: 蓝色地鼠第一击碎帽，第二击才倒
6. **连击闪电**: 连击时出现闪电链动画
7. **场景切换**: 100秒后自动切换场景，背景/蒙版/装饰更新
8. **雷神锤**: 愤怒值满后触发雷神锤，全屏击打+宝箱动画
9. **模拟回包**: 击中地鼠后银子/愤怒值/体力正确更新
10. **单元测试**: `npx vitest run` 全部通过

---

## 十一、TDD 测试体系 (Vitest)

### 11.1 测试框架配置
- `vitest.config.ts`:
  ```typescript
  import { defineConfig } from 'vitest/config';
  export default defineConfig({
    include: ['src/tests/**/*.test.ts'],
  });
  ```
- `package.json` scripts: `"test": "vitest run", "test:watch": "vitest"`
- ECS 组件和系统是纯数据/纯逻辑，零 Laya 依赖，天然适合 TDD

### 11.2 测试文件与用例设计

#### `tests/ecs/components.test.ts` — 组件定义与世界创建
- 创建 world 后，验证默认组件值
- `createShrewEntity(world, ShrewType.Red, MapType.Meadow)` 验证 shrewType=1, hp=1, actionState=None
- `createShrewEntity(world, ShrewType.Blue, MapType.Meadow)` 验证 shrewType=2, hp=2, hasHat=1
- 创建9个 HoleEntity 验证 gridRow/gridCol 正确映射
- 单例实体(Hammer/Combo/Scene/Player/Network)验证唯一性
- 实体回收后重新分配验证数据重置

#### `tests/ecs/ShrewStateSystem.test.ts` — 地鼠状态机
- **None→Wait**: 初始状态为None，执行1帧后转为Wait，animTimer在1~8+1范围
- **Wait→Up**: 手动设animTimer=0，执行后转Up，animTimer=0.31
- **Up→Stand**: animTimer递减到0后转Stand，isClickable=1，animTimer=2.0
- **Stand→Down**: animTimer递减到0后转Down，isClickable=0
- **Down→Refresh**: animTimer递减到0后转Refresh
- **Refresh→None**: Refresh后重新随机shrewType，hp重置，actionState回到None
- **Dizzy触发**: 外部设置actionState=Dizzy，验证播放眩晕后转Delay→Down
- **蓝鼠双击**: hp=2的蓝鼠，第一击hp→1,hasHat→0,actionState→Dizzy；第二击hp→0
- **计时精度**: 每帧delta=1/60，验证animTimer递减正确

#### `tests/ecs/ComboSystem.test.ts` — 连击计算
- 洞位(0,0)的相邻洞：(0,1),(1,0),(1,1) — 3个
- 洞位(1,1)的相邻洞：(0,0),(0,1),(0,2),(1,0),(1,2),(2,0),(2,1),(2,2) — 8个
- 相邻洞位中有可点击地鼠时，最多选3个作为combo目标
- 相邻洞位全部不可点击时，combo目标为空
- comboCount=0时，不计算连击

#### `tests/ecs/HitDetectionSystem.test.ts` — 碰撞检测
- 触摸点在地鼠hitArea内：返回击中结果，shrew.hp-1, actionState=Dizzy
- 触摸点不在任何hitArea内：bKickShrew=0（未击中）
- 地鼠isClickable=0时：即使触摸点在范围内也不击中
- 锤子hitTable=0时（动画中）：不响应触摸
- combo激活时：击中一个地鼠，同时检测相邻洞位，组合KickReqVo

#### `tests/ecs/HitResponseSystem.test.ts` — 回包处理
- ret=0：验证money/angry/power/level正确更新
- angry>=1000：验证isThunderActive=1
- hammerId=99：验证触发宝箱动画标记
- numOfShrew>0：验证HitComponent创建，reward记录
- ret=-1：验证错误消息标记
- combo/comboId：验证ComboComponent更新

#### `tests/ecs/AnimationTimerSystem.test.ts` — 动画计时器
- animDuration=0.31, progress=0 时，delta=1/60 后 progress 增加约 0.054
- progress 从 0 推进到 >=1.0 时，标记动画完成（触发状态机转换）
- delta=0 时不推进
- 多个实体同时推进验证
- sceneTimer < cycleInterval：不切换
- sceneTimer >= cycleInterval：currentMap前进1步，重置timer
- Meadow→Ship→Sewer→Space→Meadow 循环
- 切换时所有地鼠强制Refresh，mapType更新
- forceFullSync=1 被设置

#### `tests/ecs/HammerSystem.test.ts` — 锤子系统
- 默认锤子selectedType=1(木锤)
- 切换锤子：selectedType更新
- angry从999变1000：isThunderActive=1, selectedType=99
- 雷神锤动画完成：isThunderActive=0, selectedType恢复previousType
- 雷神锤状态时hitTable=0，阻止普通敲击

#### `tests/ecs/DirtyMarkSystem.test.ts` — 脏标记
- 组件值未变化：对应bit为0
- shrewType变化：BIT_SHREW_TYPE=1
- hp变化：BIT_SHREW_HP=1
- actionState变化：BIT_SHREW_ACTION=1
- 多个字段同时变化：多个bit同时为1
- 执行后dirty bits被保留（由SyncView清除）

#### `tests/network/KickSocket.test.ts` — 协议匹配与可靠性
- **seqId递增**: 连续发送3个请求，seqId分别为1,2,3
- **单请求匹配**: 发送seqId=1请求，收到seqId=1回包，pendingRequests清空对应条目
- **乱序回包**: 先发seqId=1和2，回包先到seqId=2再seqId=1，两次都正确匹配
- **并发匹配**: 发5个请求，收到5个回包（seqId乱序），全部正确弹出
- **未知seqId丢弃**: 收到seqId=999的回包（无对应请求），不报错，静默丢弃
- **超时移除**: 发送请求后3秒未收到回包，pendingRequests中移除该条目
- **超时不影响后续**: seqId=1超时后，seqId=2仍正常匹配
- **hitTable与网络解耦**: 锤子动画期间hitTable=0阻止发请求，动画结束后hitTable=1可发请求；网络等待不阻塞输入

#### `tests/network/MockServer.test.ts` — 模拟回包生成
- 击中红色地鼠：reward > 0, angry增加
- 击中蓝色地鼠(带帽)：reward翻倍
- 未击中：numOfShrew=0, reward=0
- 锤子类型99(雷神)：reward按所有可见地鼠计算
- 回包JSON格式与KickResponse接口一致
- **seqId原样回传**: 请求seqId=5，回包seqId=5

### 11.3 TDD 开发流程

实现每个功能时遵循 Red→Green→Refactor 循环：

```
1. 写测试 (Red)     — 先写一个会失败的测试
2. 写实现 (Green)   — 写最简代码让测试通过
3. 重构 (Refactor)  — 优化代码，确保测试仍通过
```

**具体执行顺序**：
1. 先写 `components.test.ts` → 实现 `types.ts` + `world.ts` + 各组件
2. 先写 `ShrewStateSystem.test.ts` → 实现 `ShrewStateSystem.ts`
3. 先写 `ComboSystem.test.ts` → 实现 `ComboSystem.ts`
4. 先写 `HitDetectionSystem.test.ts` → 实现 `HitDetectionSystem.ts`
5. 先写 `HitResponseSystem.test.ts` → 实现 `HitResponseSystem.ts` + `MockServer.ts`
6. 先写 `SceneCycleSystem.test.ts` → 实现 `SceneCycleSystem.ts`
7. 先写 `HammerSystem.test.ts` → 实现 `HammerSystem.ts`
8. 先写 `DirtyMarkSystem.test.ts` → 实现 `DirtyMarkSystem.ts`
9. 先写 `MockServer.test.ts` → 完善 `MockServer.ts`

每个系统实现后立即运行 `npx vitest run` 确认全部通过，再进入下一个系统。

---

## 关键修改文件

| 操作 | 文件路径 |
|------|---------|
| 新建 | `package.json` |
| 修改 | `tsconfig.json` |
| 修改 | `src/Main.ts` |
| 新建 | `src/ecs/` 下所有文件 (~15个) |
| 新建 | `src/binding/` 下所有文件 (~9个) |
| 新建 | `src/view/` 下所有文件 (~12个) |
| 新建 | `src/network/` 下所有文件 (~4个) |
| 新建 | `src/resource/` 下所有文件 (~3个) |
| 新建 | `src/config/` 下所有文件 (~4个) |
| 新建 | `vitest.config.ts` |
| 新建 | `src/tests/ecs/` 下所有测试文件 (~10个) |
| 新建 | `src/tests/network/` 下测试文件 (~2个) |
