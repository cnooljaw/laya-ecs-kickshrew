---
name: laya-runtime
description: Use when changing Laya view nodes, resource loading, scene switching, timers, tweens, input handling, lifecycle cleanup, or visual runtime behavior in this project.
---

# Laya Runtime

## 先读

- `AGENTS.md`
- `docs/laya-rules.md`
- 生命周期或 ownership 改动再读 `docs/architecture.md`
- 通用 LayaAir 判断使用全局 skill `layaair-developer`

## 工作流

1. 找到 owner：
   - `Main`：frameLoop、stage event。
   - `GameScene`：runtime 装配。
   - `Feature`：创建并注册本业务 node。
   - `ViewRegistry`：node/resource ownership 和 destroy。
   - view node：自己的 children、tween、timer、async load guard。
2. 规则不进 view node。输入转换成 adapter 调用或 ECS/system 更新。
3. 在 `src/game/features/<name>/*Node.ts` 实现 view contract。
4. 表现调参放在同切片 `*ViewConfig.ts`。
5. async loader callback 必须校验节点未销毁且请求仍然有效。
6. timer、tween、event 由注册它们的 owner 清理。
7. 运行时可见改动跑对应测试和 `npm run debug:ready`。

## 项目注意点

- `hitTable=0` 表示锤子冷却/锁定，不是洞位坐标 miss；日志区分 `hit.blocked` 和 `hit.miss`。
- Shrew 投影到 Dizzy 但画面不可见时，先查 `ShrewNode.setAnimation` 和状态退出/destroy 的 tween 清理。
- 浮层 UI 或 hit effect 必须设置高于 hole/cover 的 zOrder。
- 长跑内存看 `JS Heap Used`、`Peak`、`Sprite2DCount`、`GPUMemory`、`AllTexture`、`GPUBuffer`。
- `removeChildren()` 默认只移出显示树；需要释放子节点时用 `removeChildren(0, -1, true)`。

## 测试

```bash
npm test -- --run src/tests/view/KickInputAdapter.test.ts
npm test -- --run src/tests/view/ViewRegistry.test.ts
npm test -- --run src/tests/view/ShrewNode.test.ts
npm test -- --run src/tests/framework/view
npx tsc --noEmit
npm run debug:ready
```

## Review Checklist

- Laya 对象不是权威状态。
- View node 通过 `I*Node` contract 和 `ViewRegistry` 触达。
- 重复 `destroy()` 或场景切换不保留死节点。
- rebuild 路径会 destroy 旧 children。
- async load callback 幂等。
- 资源路径匹配 `src/resource/AtlasConfig.ts`。
- Cocos Y-up 到 Laya Y-down 的转换仍在代码附近说明。
