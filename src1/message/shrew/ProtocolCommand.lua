--
-- Created by IntelliJ IDEA.
-- User: baison
-- Date: 15/3/24
-- Time: 下午5:12
-- To change this template use File | Settings | File Templates.
--


ProtocolCommand = ProtocolCommand or {}
ProtocolCommand.shrew = ProtocolCommand.shrew or {}

-- 游戏部分的请求命令字
ProtocolCommand.shrew.REQ_GAME_START_CMD = 0x00008001 -- 玩家开始游戏请求
ProtocolCommand.shrew.REQ_GAME_READY_CMD = 0x00004004 -- 玩家游戏准备就绪请求
ProtocolCommand.shrew.REQ_GAME_RECONNECT_CMD = 0X00008007 --重新进入房间，启动客户端后发送该消息， 空包


ProtocolCommand.shrew.REQ_GAME_KICK_SHREW_CMD = 0x00008101 -- 打地鼠请求
ProtocolCommand.shrew.RESP_GAME_KICK_SHREW_CMD = 0x80008101 -- 打地鼠 响应
ProtocolCommand.shrew.RESP_GAME_SETTLE_ACCOUNT_CMD = 0x00008102 -- 结算
ProtocolCommand.shrew.RESP_HAMMER_LIST_CMD = 0x00008103 -- 锤子列表

ProtocolCommand.shrew.RESP_GAME_REWARD_TOP_CMD = 0X00008105   --最高获奖记录
ProtocolCommand.shrew.RESP_GAME_REWARD_NEW_CMD = 0X00008106   --最新获奖记录
ProtocolCommand.shrew.RESP_GAME_DAY_RANK_CMD  = 0X00008107   --日幸运值排行
ProtocolCommand.shrew.RESP_GAME_WEEK_RANK_CMD  = 0X00008108   --周幸运值排行


ProtocolCommand.shrew.RESP_GAME_SCENE_CMD = 0X00008110 --场景回包
ProtocolCommand.shrew.RESP_GAME_ROBOT_CMD = 0X00008112 --托管
ProtocolCommand.shrew.RESP_UPDATE_POWER_CMD = 0x00008113 --

--挑战赛
ProtocolCommand.shrew.REQ_GAME_UPDATE_DATA_CMD  = 0X00008109   --刷新玩家数据
ProtocolCommand.shrew.REQ_CHALLENGEMATCH_KICK_SHREW_CMD = 0x00008121 --比赛打地鼠
ProtocolCommand.shrew.RESP_CHALLENGEMATCH_KICK_SHREW_CMD = 0x80008121 --比赛打地鼠
ProtocolCommand.shrew.RESP_CHALLENGEMATCH_SCENE_CMD = 0x00008122 --场景
ProtocolCommand.shrew.RESP_CHALLENGEMATCH_RANK_CMD = 0x00008123 --排行
ProtocolCommand.shrew.RESP_CHALLENGEMATCH_REWARD_CMD = 0x00008124 --奖励
ProtocolCommand.shrew.REQ_CHALLENGEMATCH_CHANCE_CMD = 0x00008125
ProtocolCommand.shrew.RESP_CHALLENGEMATCH_CHANCE_CMD = 0x80008125