/**
 * ProtocolTypes — 网络协议接口定义
 *
 * 使用 api/proto/kick.proto 对应的 protobuf 二进制格式，
 * seqId 位于 Envelope.seq_id，业务 payload 不再包含 seq_id。
 */

/** 客户端 → 服务器: 击打请求 */
export interface KickRequest {
  seqId: number;            // Envelope.seq_id: 递增序列号，用于请求-回包匹配
  cmd: "kick";              // 命令字
  hammerType: number;       // 锤子类型 1-6 或 99
  bKickShrew: number;       // 1=击中, 0=未中
  numOfShrew: number;       // 击中地鼠数量
  shrews: Array<{
    shrewindex: number;     // 地鼠洞位索引 (1~9)
    protectType: number;    // 保护类型
  }>;
  comboID: number;          // 连击编号
}

/** 服务器 → 客户端: 击打结果回包 */
export interface KickResponse {
  seqId: number;            // Envelope.seq_id: 原样返回请求的 seqId
  cmd: "kickResult";        // 命令字
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
  combo: number;            // 连击数
  comboId: number;          // 连击编号
}
