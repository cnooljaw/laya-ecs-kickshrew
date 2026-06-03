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
export const BIT_SHREW_ALL = 0x00FF;

// ---- HoleComponent 脏标记 ----
export const BIT_HOLE_POS = 0x0001;
export const BIT_HOLE_SHREW = 0x0002;
export const BIT_HOLE_ZORDER = 0x0004;
export const BIT_HOLE_ALL = 0x0007;

// ---- HammerComponent 脏标记 ----
export const BIT_HAMMER_TYPE = 0x0001;
export const BIT_HAMMER_THUNDER = 0x0002;
export const BIT_HAMMER_HITTABLE = 0x0004;
export const BIT_HAMMER_ALL = 0x0007;

// ---- ComboComponent 脏标记 ----
export const BIT_COMBO_COUNT = 0x0001;
export const BIT_COMBO_ID = 0x0002;
export const BIT_COMBO_TARGETS = 0x0004;
export const BIT_COMBO_ALL = 0x0007;

// ---- SceneComponent 脏标记 ----
export const BIT_SCENE_MAP = 0x0001;
export const BIT_SCENE_TIMER = 0x0002;
export const BIT_SCENE_TRANSITION = 0x0004;
export const BIT_SCENE_ALL = 0x0007;

// ---- PlayerComponent 脏标记 ----
export const BIT_PLAYER_MONEY = 0x0001;
export const BIT_PLAYER_ANGRY = 0x0002;
export const BIT_PLAYER_POWER = 0x0004;
export const BIT_PLAYER_LEVEL = 0x0008;
export const BIT_PLAYER_ALL = 0x000F;

// ---- AnimationComponent 脏标记 ----
export const BIT_ANIM_TYPE = 0x0001;
export const BIT_ANIM_PROGRESS = 0x0002;
export const BIT_ANIM_DURATION = 0x0004;
export const BIT_ANIM_ALL = 0x0007;

// ---- HitComponent 脏标记 ----
export const BIT_HIT_INDEX = 0x0001;
export const BIT_HIT_REWARD = 0x0002;
export const BIT_HIT_WASHIT = 0x0004;
export const BIT_HIT_ALL = 0x0007;

// ---- PerfLadybirdComponent 脏标记 ----
export const BIT_PERF_LADYBIRD_POS = 0x0001;
export const BIT_PERF_LADYBIRD_PHASE = 0x0002;
export const BIT_PERF_LADYBIRD_SCALE = 0x0004;
export const BIT_PERF_LADYBIRD_ALL = 0x0007;
