ProtocolCommand = ProtocolCommand or {}
ProtocolCommand.REQ_HEART_BEAT_CMD = 0x00000000 -- 心跳包命令
ProtocolCommand.RESP_HEART_BEAT_CMD = 0x80000000 -- 心跳包返回命令

--此处为客户端请求命令定义
ProtocolCommand.REQ_LOGIN_CMD = 0x00000001 -- 登陆命令
ProtocolCommand.REQ_ACCOUNT_REG_CMD = 0x00000003  --账户注册
ProtocolCommand.REQ_PLAYERINFO_CMD = 0x00000007 -- 登陆返回命令
ProtocolCommand.REQ_PLAYER_COUNT = 0x00000008     --请求服务器玩家人数
ProtocolCommand.REQ_LOGOUT_CMD = 0x00000002 -- 登出命令
ProtocolCommand.REQ_ENTER_ROOM_CMD = 0x00004000 --进入房间命令
ProtocolCommand.REQ_LEAVE_ROOM_CMD = 0x00004001 --请求离开房间
ProtocolCommand.REQ_KICK_OFF_CMD = 0x00004002 --请求踢出某个玩家
ProtocolCommand.REQ_SITDOWN_CMD = 0x00004003 --坐下请求
ProtocolCommand.REQ_UPDATEUSERPWD_CMD = 0x00004211 --请求修改密码
ProtocolCommand.REQ_RESET_PASSWORD_CMD = 0x00004212 --游戏重置密码请求命令
ProtocolCommand.REQ_BINDINGPHONE_CMD = 0x00004213 --绑定手机号及获取验证码请求命令
ProtocolCommand.REQ_BINDIN_USER_IDCARD_CMD = 0x00004214 --绑定个人信息 身份证的请求命令

--此处为服务器端返回命令定义
ProtocolCommand.RESP_LOGIN_CMD = 0x80000001 --登陆返回命令
ProtocolCommand.RESP_ACCOUNT_REG_CMD = 0x80000003 --登陆返回命令
ProtocolCommand.RESP_UPDATE_PLAYER_CMD = 0x00000005 -- 更新玩家信息命令
ProtocolCommand.RESP_PLAYER_COUNT_CMD = 0x80000008 -- 在线更新人数命令
ProtocolCommand.RESP_ENTER_ROOM_CMD = 0x80004000 -- 登陆房间命令
ProtocolCommand.RESP_KICK_OFF_CMD = 0x80004002 -- 踢出某个玩家命令
ProtocolCommand.RESP_LEAVE_ROOM_CMD = 0x80004001 -- 服务器端离开房间命令
ProtocolCommand.RESP_SITDOWN_CMD = 0x80004003 -- 坐下请求命令
ProtocolCommand.RESP_GAME_READY_CMD = 0x80004004 -- 玩家游戏准备就绪命令

-- 此处定义活动返回命令
ProtocolCommand.RESP_TASK_INIT_CMD = 0xa -- 服务器返回活动参加消息包
ProtocolCommand.REQ_TASK_SUBMIT_CMD = 0xb -- 请求领取活动奖励消息包
ProtocolCommand.RESP_UPDATEUSERPWD_CMD = 0x80004211--修改密码返回命令
ProtocolCommand.RESP_UPDATEPLAYERCOUNT_CMD = 0x80000008 --更新房间里面的人数
ProtocolCommand.RESP_RESET_PASSWORD_CMD = 0x80004212-- 游戏重置密码返回命令
ProtocolCommand.RESP_BINDINGPHONE_CMD = 0x80004213--绑定手机号及获取验证码返回命令
ProtocolCommand.RESP_BINDIN_USER_IDCARD_CMD = 0x80004214 --绑定个人信息 身份证的返回命令

ProtocolCommand.RESP_UPDATE_STATE_CMD = 0x00004009-- 更新用户状态
ProtocolCommand.REQ_STAND_UP_CMD = 0x00004005--玩家站起
ProtocolCommand.RESP_TABLE_START_CMD = 0x00004006--游戏开始桌子id
ProtocolCommand.RESP_TABLE_OVER_CMD = 0x00004007--游戏结束桌子id
ProtocolCommand.RESP_STAND_UP_CMD = 0x80004005--服务器返回玩家站起

ProtocolCommand.RESP_ROOMREADY_CMD = 0X00004017--玩家信息和状态加载完毕

ProtocolCommand.REQ_GAME_RANK_CMD = 0x00008020-- 玩家头像信息请求

ProtocolCommand.RESP_GAME_RANK_CMD = 0x80008020-- 玩家头像信息应答

ProtocolCommand.RESP_NetWorkError_CMD = 0x3333--jaw定义，网络断开消息类型

ProtocolCommand.REQ_USER_CHAT_CMD = 0x00008003--游戏层，用户聊天 发送命令
ProtocolCommand.RESP_HALL_CHAT_CMD = 0x80004050-- 房间层聊天接收命令
ProtocolCommand.RESP_USER_CHAT_CMD = 0x80008003-- 游戏层，用户聊天接收命令

ProtocolCommand.REQ_LOW_GUARANTEE_CMD =  0x00000064 --  低保请求包
ProtocolCommand.RESP_LOW_GUARANTEE_CMD = 0x80000064 --  低保请求回包

ProtocolCommand.ObjectChateType = {
    ObjectChat_User     = 0,        -- 普通聊天;
    ObjectChat_Bugle    = 1,        -- 小喇叭;
    ObjectChat_System   = 2,        -- 系统消息;
    ObjectChat_Admin    = 3,        -- 管理员消息;
    ObjectChat_Task     = 0x10,     -- 任务消息;
    ObjectChat_Game     = 0x20,     -- 游戏消息;
}