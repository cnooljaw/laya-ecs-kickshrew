/**
 * DirtyFlags — 各组件字段的 bitmask 常量定义
 *
 * 与 DirtyMarkSystem 中定义的 bit 位一一对应，
 * 供 SyncView 和各 Binding 文件引用，判断哪些字段变化了。
 */

// ---- ShrewComponent 脏标记 ----
export const BIT_SHREW_TYPE = 0x0001;
export const BIT_SHREW_HP = 0x0002;
export const BIT_SHREW_ACTION = 0x0004;
export const BIT_SHREW_HAT = 0x0008;
export const BIT_SHREW_MAP = 0x0010;
export const BIT_SHREW_CLICKABLE = 0x0020;
export const BIT_SHREW_TIMER = 0x0040;
export const BIT_SHREW_PROP = 0x0080;

// ---- HoleComponent 脏标记 ----
export const BIT_HOLE_POS = 0x0001;
export const BIT_HOLE_SHREW = 0x0002;
export const BIT_HOLE_ZORDER = 0x0004;

// ---- HammerComponent 脏标记 ----
export const BIT_HAMMER_TYPE = 0x0001;
export const BIT_HAMMER_THUNDER = 0x0002;
export const BIT_HAMMER_HITTABLE = 0x0004;

// ---- SceneComponent 脏标记 ----
export const BIT_SCENE_MAP = 0x0001;
export const BIT_SCENE_TIMER = 0x0002;
export const BIT_SCENE_TRANSITION = 0x0004;

// ---- PlayerComponent 脏标记 ----
export const BIT_PLAYER_MONEY = 0x0001;
export const BIT_PLAYER_ANGRY = 0x0002;
export const BIT_PLAYER_POWER = 0x0004;
export const BIT_PLAYER_LEVEL = 0x0008;

// ---- AnimationComponent 脏标记 ----
export const BIT_ANIM_TYPE = 0x0001;
export const BIT_ANIM_PROGRESS = 0x0002;
export const BIT_ANIM_DURATION = 0x0004;

// ---- HitComponent 脏标记 ----
export const BIT_HIT_INDEX = 0x0001;
export const BIT_HIT_REWARD = 0x0002;
export const BIT_HIT_WASHIT = 0x0004;

// ---- PerfHeroComponent 脏标记 ----
export const BIT_PERF_HERO_POS = 0x0001;
export const BIT_PERF_HERO_SPAWN = 0x0002;
export const BIT_PERF_HERO_SCALE = 0x0004;

// ---- MonsterComponent 脏标记 ----
export const BIT_MONSTER_SPAWN = 0x0001;
export const BIT_MONSTER_POS = 0x0002;
export const BIT_MONSTER_SCALE = 0x0004;
export const BIT_MONSTER_SHOW = 0x0008;
