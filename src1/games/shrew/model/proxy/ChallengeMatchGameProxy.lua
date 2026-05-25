local SendMessageFactory = require("message.shrew.SendMessageFactory")
local GameProxy = require("games.shrew.model.proxy.GameProxy")
local ChallengeMatchGameProxy = class("ChallengeMatchGameProxy",GameProxy)


function ChallengeMatchGameProxy:onRegisterEx()
    self.facade:registerCommand(ProtocolCommand.shrew.RESP_CHALLENGEMATCH_KICK_SHREW_CMD, shrew.command.RespChallengeMatchKickShrewCommand) 
    self.facade:registerCommand(ProtocolCommand.shrew.RESP_CHALLENGEMATCH_SCENE_CMD, shrew.command.RespChallengeMatchGameSceneCommand) 
    self.facade:registerCommand(ProtocolCommand.shrew.RESP_CHALLENGEMATCH_RANK_CMD, shrew.command.RespChallengeMatchRankCommand) 
    self.facade:registerCommand(ProtocolCommand.shrew.RESP_CHALLENGEMATCH_REWARD_CMD, shrew.command.RespChallengeMatchRewardCommand)
    self.facade:registerCommand(ProtocolCommand.shrew.RESP_CHALLENGEMATCH_CHANCE_CMD, shrew.command.RespChallengeMatchChanceCommand)

    self._isShowBeginBox = true
    self._isChallengeMatchStart = false
end

function ChallengeMatchGameProxy:onRemoveEx()
    self.facade:removeCommand(ProtocolCommand.shrew.RESP_CHALLENGEMATCH_KICK_SHREW_CMD)
    self.facade:removeCommand(ProtocolCommand.shrew.RESP_CHALLENGEMATCH_SCENE_CMD)
    self.facade:removeCommand(ProtocolCommand.shrew.RESP_CHALLENGEMATCH_RANK_CMD)
    self.facade:removeCommand(ProtocolCommand.shrew.RESP_CHALLENGEMATCH_REWARD_CMD)
    self.facade:removeCommand(ProtocolCommand.shrew.RESP_CHALLENGEMATCH_CHANCE_CMD)
end

--[[
发送敲击地鼠包
--]]
function ChallengeMatchGameProxy:doKickShrew(note)
   -- Log.i("GameProxy:doKickShrew")
    local sendMessage = SendMessageFactory.createChallengeMatchKickShrewMessage(note)
    local socketPorxy = self.facade:retrieveProxy(common.model.SocketProxy.NAME) 
    socketPorxy._socket:send(sendMessage:getPack()) 
end

function ChallengeMatchGameProxy:doChallengeMatchChance()
    Log.i("ChallengeMatchGameProxy:doChallengeMatchChance")
    local sendMessage = SendMessageFactory.createChallengeMatchChanceMessage() 
    local socketPorxy = self.facade:retrieveProxy(common.model.SocketProxy.NAME) 
    socketPorxy._socket:send(sendMessage:getPack())
end

--刷新玩家数据  回gameScene
function ChallengeMatchGameProxy:doChallengeMatchUpdateData()
    Log.i("ChallengeMatchGameProxy:doChallengeMatchUpdateData")
    local sendMessage = SendMessageFactory.createChallengeMatchUpdateDataMessage() 
    local socketPorxy = self.facade:retrieveProxy(common.model.SocketProxy.NAME) 
    socketPorxy._socket:send(sendMessage:getPack())
end


return ChallengeMatchGameProxy