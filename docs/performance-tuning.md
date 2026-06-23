# 性能调教与压测经验

本文记录 LayaAir3 + ECS 项目里的性能压测方法、Spine 动画调教经验，以及 `perf` 压测链路的排查入口。遇到 FPS 下降、DrawCall/三角面暴涨、Spine 闪烁、节点池复用异常时优先读这里。

## 压测入口

调试构建：

```bash
npm run build:debug
```

本机和局域网调试服务：

```bash
npm run debug:ready
```

该命令会重新构建 debug 输出，并把静态服务固定绑定到 `0.0.0.0:8080`。只绑定 `127.0.0.1` 时其他设备访问不到；脚本会拒绝这种旧服务状态，要求停掉后重跑。

性能压测 URL：

```text
http://localhost:8080/debug-tsc.html?perf=1&heroes=200
http://<局域网IP>:8080/debug-tsc.html?perf=1&heroes=200
```

参数：

- `perf=1`：启用压测模式。
- `heroes` 或 `heroCount`：屏幕四周的英雄 Spine 槽位数。
- `shrewFast=0`：只测英雄压力时可关闭地鼠加速。

当前英雄资源配置在 `src/config/ViewLayoutConfig.ts` 的 `PERF_HERO_RESOURCES`：

```text
resources/heros/DestructionWarlock.sk
resources/heros/Ranger.sk
resources/heros/beila_girl.sk
```

## Agent 快速流程

当未来 Agent 处理 FPS、Spine/Skeleton、压测英雄闪烁或局域网发布问题时，按这个流程执行：

1. 先读 `AGENTS.md`、本文、`docs/laya-rules.md` 和 `docs/test-guide.md`。
2. 明确复现 URL、英雄数量、设备/浏览器、问题类型：稳态 FPS、周期卡顿、进场闪、退场闪、可见瞬移。
3. 先记录 FPS、FrameTime、DrawCall、Triangle、Sprite2DCount；不要只凭体感判断。
4. 分层定位：
   - ECS：数量、计时、随机重生、初始打散。
   - dirty/binding：`spawnSeq`、位置、缩放、资源投影。
   - view：Skeleton 池、STOPPED、pending 请求、visible 状态、async loader。
   - 发布：debug 构建、静态服务绑定、浏览器缓存。
5. 行为 bug 先补测试：`PerfHeroNode.test.ts` 测池化/隐藏/瞬移，`PerfHeroSystem.test.ts` 测生命周期，`PerfHeroViewBinding.test.ts` 测投影。
6. 修改后跑窄测试、`npx tsc --noEmit`；运行时可见改动继续跑 `npm test` 和 `npm run build:debug`。

## 压测链路

```text
URL query
  -> getPerfTestRuntimeConfig()
  -> PerfHeroFeature.setup()
  -> createPerfHeroEntities()
  -> perfHeroSystem(delta)
  -> DirtyMarkSystem 标记 BIT_PERF_HERO_*
  -> perfHeroViewBinding
  -> PerfHeroNode / PerfHeroSpinePoolGroup
  -> Laya Skeleton
```

职责边界：

- `src/config/PerfTestConfig.ts`：读取 URL 参数。
- `src/config/ViewLayoutConfig.ts`：资源、数量上限、边缘分布、缩放、循环时间。
- `src/ecs/world.ts`：创建压测实体、随机边缘位置、随机英雄类型。
- `src/ecs/gameplay/perfHero/PerfHeroSystem.ts`：推进压测英雄生命周期。
- `src/binding/PerfHeroViewBinding.ts`：把 ECS 数据投影给 view node。
- `src/view/PerfHeroNode.ts`：Spine 资源池、节点复用、进退场显示顺序。
- `src/features/PerfHeroFeature.ts`：声明系统、dirty、sync channel，创建压测节点并持有共享池引用。

ECS 侧只承载权威状态和随机重生，不直接操作 Laya。Spine/Skeleton 的创建、播放、隐藏、池化都属于 view 层。

## 观察指标

用 Laya Stat 或浏览器性能工具记录：

- FPS / FrameTime：判断是否超过 16.67ms 帧预算。
- DrawCall：判断 batching 和材质/纹理切换压力。
- Triangle：判断 Spine mesh/slot 复杂度。
- Sprite2DCount：判断节点数量是否失控。
- JS heap / GC：判断是否有频繁创建销毁。
- 首轮加载和周期性卡顿：区分资源加载、池化缺失、respawn 峰值。

## 长时间内存监测

调试构建里 `MemoryStatsPanel` 每秒显示：

```text
JS Heap Used <used> MB
Peak <peak> MB
Limit <limit> MB
```

含义：

- `Used`：当前 `performance.memory.usedJSHeapSize`，GC 后可能下降。
- `Peak`：本页面启动后观察到的 used 峰值，是单调不降的本地统计。它一直涨不等于强引用泄漏。
- `Limit`：浏览器 JS heap 上限。

如果旧面板显示的是 `used / totalJSHeapSize`，后一个数字也可能随 V8 扩容增长，不代表对象仍被引用。现在面板故意不显示 `totalJSHeapSize`，避免把 V8 已提交容量误判成泄漏。

长时间压测时不要只看 JS heap。至少同时记录：

```text
FPS / FrameTime
Sprite2DCount
DrawCall / Triangle
GPUMemory / AllTexture / RenderTexture / GPUBuffer
JS Heap Used / Peak / Limit
```

判断规则：

- `Used` 会下降，`Peak` 缓慢上升：通常是运行过程出现过更高分配峰值，先继续看 `Used` 是否阶梯式抬高。
- `Sprite2DCount` 稳定，但 `GPUMemory`、`AllTexture`、`GPUBuffer` 增长：优先怀疑资源、贴图、Graphics、Skeleton 或被移除但未 destroy 的节点。
- `Sprite2DCount` 持续增长：优先怀疑 view registry、对象池 release、场景切换、timer/tween/event 没清。
- `DrawCall`、`Triangle` 基本稳定但 FPS 下降：优先查 GC、GPU memory 增长、动画对象重建和浏览器长期运行压力。

本项目一次 2 小时 20 分钟样本：

```text
FPS: 60 -> 34
FrameTime: 16ms -> 29ms
Sprite2DCount: 1118 -> 1118
GPUMemory: 62.886M -> 109.882M
AllTexture: 21.792M -> 53.792M
GPUBuffer: 41.094M -> 56.09M
JS Heap Used: 303.3MB -> 418.0MB
Peak: 311.5MB -> 684.9MB
```

这个组合说明不是简单节点数量泄漏。`Sprite2DCount` 没变，但 GPU memory 增长明显，应先查“节点从父容器移除了，但内部贴图/graphics/buffer 没释放”的路径。已确认过的典型问题是 `ShrewNode` 重建部件时调用 `removeChildren()` 没传 `destroy=true`，旧部件被移出显示树但没有销毁；修法是 `removeChildren(0, -1, true)` 并补回归测试。

长时间内存排查清单：

- `removeChildren()` 是否需要第三个参数 `destroy=true`。
- view node 的 `destroy()` 是否清理自己创建的子节点、timer、tween、event、STOPPED 回调。
- `SceneLayer` 这类场景 owner 是否销毁过渡遮罩、背景、cover。
- WebSocket/loader 回调是否在 close/destroy 后解除引用或有 stale guard。
- Spine/Skeleton 池是否 release 当前实例，场景销毁时是否 dispose 共享池。
- scene cycle 或 map rebuild 后，`GPUMemory` 是否阶梯式增长。

建议用矩阵记录：

```text
heroes=0
heroes=50
heroes=100
heroes=200
heroes=300
heroes=200&shrewFast=0
```

不要只看单次 FPS。200 个 Spine 同时播放掉到 56 FPS 是合理压测现象，但如果伴随周期性闪动或卡顿，需要继续定位是重建、可见状态瞬移，还是渲染压力。

## Spine 压测结论

这次英雄压测暴露出几个稳定经验：

1. **200 个 Spine 的主要压力通常不在 ECS。**  
   bitecs 遍历 200 个压测实体只做计时和少量字段更新，成本很低。真正重的是 Laya Skeleton 每帧骨骼/slot/mesh 更新和渲染。

2. **不要在每次 respawn 时 `destroy + buildArmature`。**  
   即使 `.sk` templet 已缓存，每秒上百次 Skeleton 创建销毁也会带来分配、GC 和构建成本。按 Spine 资源建池，复用 Skeleton 实例。

3. **资源池由 Feature 创建，槽位节点只持有当前实例。**  
   `PerfHeroFeature` 创建 `PerfHeroSpinePoolGroup` 并交给运行时 refs，`GameScene.destroy()` 统一释放池；每个 `PerfHeroNode` 负责自己的位置和当前 active 实例，节点销毁时 release 当前实例。

4. **复用节点进场前必须隐藏并重置本地状态。**  
   pooled Skeleton 可能停在上一轮最后一帧。attach 时先 `visible=false`，重置 `x/y/scale/rotation/alpha`，调用 `play()` 后再显示父容器。

5. **不要在旧动画仍可见时更新容器坐标。**  
   ECS 到期 respawn 时，旧动画可能还没触发 STOPPED。此时立即设置新 `x/y` 会出现肉眼可见的瞬移闪烁。view 层应把新请求放入 pending，等 STOPPED 隐藏旧动画后再应用最新请求。

6. **打散首轮和降低 respawn 频率。**  
   创建压测实体时把初始 `ageSec` 随机打散，避免 200 个槽位在 1-2 秒内集中重生。循环间隔不要过短，当前压测英雄使用 3-6 秒一轮。

7. **压测要区分“真实动画压力”和“游戏系统压力”。**  
   如果目标是测 ECS/dirty，同步对象可以更轻；如果目标是测 Laya Spine 渲染，就保留真实 Skeleton。不要把 Spine 压测结果误解成 ECS 性能瓶颈。

## 常见问题和修法

### FPS 小幅下降但没有卡顿

多半是 Skeleton 每帧动画/渲染成本。先记录 DrawCall、Triangle、Sprite2DCount，再决定是减少同时播放数量、降低资源复杂度，还是分层做轻量替身。

### 周期性卡顿

优先查：

- 是否仍在每轮创建/销毁 Skeleton。
- 是否有集中 respawn。
- 是否资源第一次加载和播放同时发生。
- 是否有大量 promise 回调同帧完成。

### 进场瞬间闪一下

优先查 view 层：

- 容器创建后是否默认隐藏。
- attach pooled Skeleton 时是否先隐藏。
- `play()` 时父容器是否仍隐藏。
- 是否播放重置完成后才显示。

### 退场或下一轮出现时坐标瞬移

优先查：

- 当前动画可见时是否直接应用了新的 `x/y`。
- STOPPED 回调是否负责隐藏旧节点。
- 新 respawn 是否 pending 到退场后再应用。
- pending 是否只保留最新请求，避免队列堆积。

### 数量越多越不稳定

优先查：

- 池是否按资源共享，而不是每个 slot 自己建池。
- 场景销毁时池是否统一释放。
- view registry 是否重复注册或泄漏节点。
- `spawnSeq` 是否能防止同一轮重复播放。

## 测试策略

纯 ECS：

```bash
npm test -- --run src/tests/ecs/PerfHeroSystem.test.ts
```

dirty/binding：

```bash
npm test -- --run src/tests/binding/PerfHeroViewBinding.test.ts
```

view node 池化和显示顺序：

```bash
npm test -- --run src/tests/view/PerfHeroNode.test.ts
```

运行时改动完成后继续跑：

```bash
npm test
npx tsc --noEmit
npm run build:debug
```

如果要发布给局域网设备验证，确认静态服务监听 `*:端口`，并用本机 `curl -I` 先确认页面返回 200。

## 代码改动原则

- 先用测试复现性能 bug 的关键行为，例如“播放中 respawn 会移动可见容器”。
- ECS 不引入 Laya 对象、Skeleton、loader、timer。
- binding 只投影数据，不承担池化生命周期。
- view node 负责局部显示状态、STOPPED 事件、pending 请求和 pooled instance。
- 生命周期 owner 要清楚：`PerfHeroFeature` 创建共享池并交给运行时 refs，`ViewRegistry` 管节点销毁，`PerfHeroNode` 管当前 active 实例。
- 不用 `forceFullSync` 或隐藏全局节点来掩盖局部状态机问题。
