---
name: ecs-binding
description: Use when changing ECS components, EntityDefinition definitions, systems, ProjectionDefinition mappings, ProjectionRuntime behavior, typed effects, or view synchronization in this project.
---

# ECS Projection Workflow

## Read First

- `AGENTS.md`
- `docs/ecs-binding.md`
- `docs/architecture.md` for cross-module changes

## Workflow

1. Identify the authoritative component and the system/helper that owns writes.
2. Define or update the slice-local `EntityDefinition` initialization contract.
3. Keep systems pure: no Laya nodes, registries, resource loading, or view callbacks.
4. For persistent visible state:
   - update the view contract;
   - add a row in the owning `src/game/features/<name>/*Projection.ts`;
   - mount the node from the owning Feature.
5. For transient facts such as reward/miss:
   - define a typed effect in the owning feature;
   - emit from an adapter;
   - register the view handler in the owning Feature.
6. Keep Feature setup explicit for real topology such as one Hole owning one Shrew. Do not hide domain relationships in generic framework helpers.
7. Prefer initialization-time pooling. Runtime state changes should reuse entities and nodes.
8. Run the narrowest tests, then full tests and typecheck.

## Mental Model

```text
Feature EntityDefinition -> framework EntityRuntime -> Component
System changes Component
ProjectionRuntime.mark -> ProjectionRuntime.sync
View contract -> Laya node

Transient response -> EffectRuntime.emit -> flush -> view handler
```

Projection rows receive automatic private bits. Business code must not know or maintain those bits.

## Common Tests

```bash
npm test -- --run src/tests/ecs/EntityRuntime.test.ts
npm test -- --run src/tests/sync/ProjectionDefinition.test.ts src/tests/sync/ProjectionRuntime.test.ts
npm test -- --run src/tests/sync/CoreViewSync.test.ts src/tests/sync/FeatureViewSync.test.ts
npm test -- --run src/tests/effects
npx tsc --noEmit
```

## Review Checklist

- Component remains authoritative.
- Entity cardinality and initialization are explicit.
- Projection watches every visible field and uses `noProjection` for rule-only fields.
- Shared apply functions deduplicate coupled rows.
- Feature is assembly, not a rule container.
- No business dependency on dirty arrays, registry keys, full-sync flags, or global string events.
- World teardown clears EffectRuntime, ProjectionRuntime, ViewRegistry and EntityRuntime.
