/**
 * ProtocolTypes — 网络协议接口定义
 *
 * 使用 api/proto/kick.proto 对应的 protobuf 二进制格式，
 * seqId 位于 Envelope.seq_id，协议号位于 Envelope.msg_id；
 * 业务 payload 不再包含 seq_id/cmd。
 */

export const PROTOCOL_MSG_IDS = {
  PingReq: 1,
  PongResp: 2,
  JoinRoomReq: 1001,
  JoinRoomResp: 1002,
  GameSnapshotReq: 1003,
  GameSnapshotResp: 1004,
  TimeSyncReq: 1005,
  TimeSyncResp: 1006,
  KickReq: 2001,
  KickResp: 2002,
  ShrewTimelinePush: 3001,
  ShrewStatePush: 3002,
  ErrorResp: 9001,
} as const;

/** 客户端 → 服务器: 击打请求 */
export interface KickRequest {
  seqId: number;            // Envelope.seq_id: 递增序列号，用于请求-回包匹配
  cmd: "kick";              // 客户端业务语义；wire 层映射为 Envelope.msg_id=2001
  attackEpoch?: number;     // 服务端 AttackActor 代际；快照建立后由 NetworkAdapter 自动填充
  hammerType: number;       // 锤子类型 1-6 或 99
  bKickShrew: number;       // 1=击中, 0=未中
  numOfShrew: number;       // 击中地鼠数量
  shrews: Array<{
    shrewindex: number;     // 地鼠洞位索引 (1~9)
    protectType: number;    // 保护类型
    spawnSeq?: number;      // 服务端生成序列，防止旧地鼠命中包落到新一轮
  }>;
  comboID: number;          // 协议兼容保留字段，客户端内部不再计算连击，固定传 0
}

/** 服务器 → 客户端: 击打结果回包 */
export interface KickResponse {
  seqId: number;            // Envelope.seq_id: 原样返回请求的 seqId
  cmd: "kickResult";        // 客户端业务语义；wire 层由 Envelope.msg_id=2002 还原
  ret: number;              // 0=成功, -1=错误
  money: number;            // 获得金币
  angry: number;            // 当前愤怒值
  power: number;            // 获得体力
  levelScore: number;       // 当前关卡分数
  hammerId: number;         // 当前锤子ID
  numOfShrew: number;       // 击中地鼠数量
  shrewResp: Array<{
    shrewIndex: number;     // 地鼠洞位索引
    reward: number;         // 奖励金额
  }>;
  combo: number;            // 协议兼容保留字段，客户端内部忽略
  comboId: number;          // 协议兼容保留字段，客户端内部忽略
}

export interface ShrewTiming {
  waitMs: number;
  upMs: number;
  standMs: number;
  downMs: number;
  dizzyMs: number;
}

/** 一次服务端权威地鼠生命周期，时间均使用服务端 Unix 毫秒。 */
export interface ShrewCycle {
  holeIndex: number;
  spawnSeq: number;
  shrewType: number;
  protectType: number;
  hp: number;
  waitStartMs: number;
  upStartMs: number;
  standStartMs: number;
  downStartMs: number;
  endMs: number;
}

export interface GameSnapshot {
  serverTimeMs: number;
  attackId: number;
  attackEpoch: number;
  timelineRev: number;
  defaultTiming: ShrewTiming;
  activeCycles: ShrewCycle[];
}

export interface GameSnapshotResponse {
  seqId: number;
  snapshot: GameSnapshot;
}

export interface TimeSyncResponse {
  seqId: number;
  clientSendMs: number;
  serverTimeMs: number;
}

export interface ShrewTimelinePush {
  serverTimeMs: number;
  attackId: number;
  attackEpoch: number;
  timelineRev: number;
  cycles: ShrewCycle[];
}

export interface ShrewStatePush {
  serverTimeMs: number;
  attackId: number;
  attackEpoch: number;
  timelineRev: number;
  holeIndex: number;
  spawnSeq: number;
  actionState: number;
  phaseStartMs: number;
  phaseEndMs: number;
  hp: number;
  clickable: boolean;
}

export interface ErrorResponse {
  seqId: number;
  code: number;
  message: string;
}
