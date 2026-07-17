# 性能调教与压测

本文记录本项目的压测入口、PerfHero 链路和长时间内存排查方法。通用 Laya 性能判断使用全局 skill `layaair-developer`。

## 入口

```bash
npm run debug:ready
```

页面：

```text
http://localhost:8080/debug-tsc.html?perf=1&heroes=200
http://<LAN-IP>:8080/debug-tsc.html?perf=1&heroes=200
```

参数：

- `perf=1`：启用压测模式。
- `heroes` / `heroCount`：英雄 Spine 槽位数。
- `shrewFast=0`：关闭地鼠加速，只看英雄压力。

`debug:ready` 固定使用 `0.0.0.0:8080`。如果已有旧服务只监听 `127.0.0.1:8080`，脚本会拒绝继续。

`perf=1` 只开启 PerfHero 压测，不等于开启调试统计。需要采集每帧、每个 System、network、Projection 和 Effect 的耗时时，在 `src/app/ClientDiagnostics.ts` 将唯一的 `ENABLE_CLIENT_DIAGNOSTICS` 常量临时改为 `true`。默认关闭时不创建面板，也不执行逐步骤计时；先用诊断数据确认瓶颈，再决定是否优化 `ProjectionRuntime` 或 System 调度。

## PerfHero 链路

```text
URL query
  -> PerfRuntimeConfig
  -> PerfHeroFeature.setup
  -> PerfHeroEntities create fixed slots
  -> PerfHeroSystems
  -> ProjectionRuntime mark/sync
  -> PerfHeroProjection
  -> PerfHeroNode / Spine pool
  -> Laya Skeleton
```

主要文件：

- `src/game/features/perfHero/PerfRuntimeConfig.ts`
- `src/game/features/perfHero/PerfHeroViewConfig.ts`
- `src/game/features/perfHero/PerfHeroRules.ts`
- `src/game/features/perfHero/PerfHeroEntities.ts`
- `src/game/features/perfHero/PerfHeroSystems.ts`
- `src/game/features/perfHero/PerfHeroProjection.ts`
- `src/game/features/perfHero/PerfHeroNode.ts`
- `src/game/features/perfHero/PerfHeroFeature.ts`

ECS 侧只承载权威状态和随机重生，不直接操作 Laya。Skeleton 创建、播放、隐藏和池化属于 view 层。

## 指标

至少记录：

```text
FPS / FrameTime
Sprite2DCount
DrawCall / Triangle
GPUMemory / AllTexture / RenderTexture / GPUBuffer
JS Heap Used / Peak / Limit
```

诊断开启时，`RuntimeDiagnosticsPanel` 还提供实际 `schedule` 和最近帧慢步骤。计数与计时本身会带来少量额外工作，尤其是逐 System 的高精度计时和 UI 文本刷新，因此它只用于 QA、开发机或短时压测采样；不应据此替代正式客户端的 profile 结论。

判断：

- `Peak` 单调不降是正常统计，不等于泄漏。
- `Sprite2DCount` 稳定但 GPU memory 增长：优先查被移出但未 destroy 的节点、Graphics、Texture、Skeleton。
- `Sprite2DCount` 持续增长：优先查 ViewRegistry、对象池 release、scene switch、timer、tween、event。
- DrawCall/Triangle 稳定但 FPS 下降：优先查 GC、GPU memory、动画重建和浏览器长期运行压力。

已验证过的典型问题：`ShrewNode` 重建部件时只 `removeChildren()`，旧部件被移出显示树但没有销毁。修法是 `removeChildren(0, -1, true)` 并补回归测试。

## Spine 规则

- 200 个 Spine 的主要压力通常在 Laya Skeleton 动画和渲染，不在 bitecs 遍历。
- 不要在每次 respawn 时 `destroy + buildArmature`；按资源建池复用 Skeleton。
- 共享池由 Feature 创建并交给 runtime 持有，slot node 只持有当前 active 实例。
- attach pooled Skeleton 前隐藏并重置 `x/y/scale/rotation/alpha`，`play()` 后再显示父容器。
- 旧动画仍可见时不要立即更新父容器坐标；把新 respawn pending 到 STOPPED/隐藏后应用。
- 初始 `ageSec` 打散，避免所有槽位同帧重生。

## 复现矩阵

```text
heroes=0
heroes=50
heroes=100
heroes=200
heroes=300
heroes=200&shrewFast=0
```

不要只看单次 FPS。区分真实 Spine 压力、ECS/Projection 压力、资源首次加载和周期性重建。

## 测试

```bash
npm test -- --run src/tests/game/features/perfHero/PerfHeroSystem.test.ts
npm test -- --run src/tests/game/features/perfHero/PerfHeroNode.test.ts
npm test -- --run src/tests/sync/FeatureViewSync.test.ts
npx tsc --noEmit
npm run build:debug
```
