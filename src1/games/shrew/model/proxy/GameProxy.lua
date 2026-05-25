local SendMessageFactory = require("message.shrew.SendMessageFactory")
local GameProxy = class("GameProxy",common.model.BaseProxy)
local ReceiveMessageFactory = require("message.shrew.ReceiveMessageFactory")
GameProxy.NAME = "GameProxy"
--各个游戏的proxy只需要处理事件和数据,注册需要处理的事件


function GameProxy:onRegister()
    
    --房间层相关的包
    self.facade:registerCommand(ProtocolCommand.RESP_SITDOWN_CMD, shrew.command.RespSitDownCommand) 
    self.facade:registerCommand(ProtocolCommand.RESP_STAND_UP_CMD, shrew.command.RespStandUpCommand) 
    self.facade:registerCommand(ProtocolCommand.RESP_LEAVE_ROOM_CMD, shrew.command.RespLeaveRoomCommand) 
    self.facade:registerCommand(ProtocolCommand.RESP_UPDATE_STATE_CMD, shrew.command.RespUpdateStateCommand) 
    self.facade:registerCommand(ProtocolCommand.RESP_TABLE_START_CMD, shrew.command.RespTableStartCommand) 
    self.facade:registerCommand(ProtocolCommand.RESP_TABLE_OVER_CMD, shrew.command.RespTableOverCommand) 
    self.facade:registerCommand(ProtocolCommand.RESP_GAME_READY_CMD, shrew.command.RespGameReadyCommand) 
    
    self.facade:registerCommand(ProtocolCommand.shrew.RESP_HAMMER_LIST_CMD, shrew.command.RespHammerListCommand)        --锤子列表信息包
    self.facade:registerCommand(ProtocolCommand.shrew.RESP_GAME_SCENE_CMD, shrew.command.RespGameSceneCommand)          --游戏场景包
    self.facade:registerCommand(ProtocolCommand.shrew.RESP_GAME_KICK_SHREW_CMD, shrew.command.RespKickShrewCommand)     --打地鼠回包
    self.facade:registerCommand(ProtocolCommand.shrew.RESP_GAME_WEEK_RANK_CMD,  shrew.command.RespWeekRankCommand)      --周幸运值排行
    self.facade:registerCommand(ProtocolCommand.shrew.RESP_GAME_REWARD_NEW_CMD,  shrew.command.RespRewardNewCommand)    --最新获奖信息
   
    self.facade:registerCommand(ProtocolCommand.RESP_UPDATE_PLAYER_CMD, common.command.UpdatePlayerCommand)
    self.facade:registerCommand(ProtocolCommand.RESP_USER_CHAT_CMD, common.command.RespChatMessage)
    self:onRegisterEx()
end

function GameProxy:onRegisterEx()

end

function GameProxy:onRemove()
    self.facade:removeCommand(ProtocolCommand.RESP_SITDOWN_CMD)
    self.facade:removeCommand(ProtocolCommand.RESP_STAND_UP_CMD)
    self.facade:removeCommand(ProtocolCommand.RESP_LEAVE_ROOM_CMD)
    self.facade:removeCommand(ProtocolCommand.RESP_UPDATE_STATE_CMD)
    self.facade:removeCommand(ProtocolCommand.RESP_TABLE_OVER_CMD)
    self.facade:removeCommand(ProtocolCommand.RESP_TABLE_START_CMD)
    self.facade:removeCommand(ProtocolCommand.RESP_GAME_READY_CMD)

    self.facade:removeCommand(ProtocolCommand.shrew.RESP_HAMMER_LIST_CMD)
    self.facade:removeCommand(ProtocolCommand.shrew.RESP_GAME_SCENE_CMD)
    self.facade:removeCommand(ProtocolCommand.shrew.RESP_GAME_KICK_SHREW_CMD)
    self.facade:removeCommand(ProtocolCommand.shrew.RESP_GAME_WEEK_RANK_CMD)
    self.facade:removeCommand(ProtocolCommand.shrew.RESP_GAME_REWARD_NEW_CMD)
    
     
    self.facade:removeCommand(ProtocolCommand.RESP_UPDATE_PLAYER_CMD)
    self.facade:removeCommand(ProtocolCommand.RESP_USER_CHAT_CMD)
    self:onRemoveEx()
end

function GameProxy:onRemoveEx()

end

function GameProxy:doGameStart()
    local globalProxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
    local playerId = globalProxy._myPlayerVo.playerId
    local sendMessage = SendMessageFactory.createGameStartMessage(playerId)
    local socketPorxy = self.facade:retrieveProxy(common.model.SocketProxy.NAME) 
    socketPorxy._socket:send(sendMessage:getPack()) 
end

function GameProxy:doGameReady()
    local globalProxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
    local playerId = globalProxy._myPlayerVo.playerId
    local sendMessage = SendMessageFactory.createGameReadyMessage(playerId)
    local socketPorxy = self.facade:retrieveProxy(common.model.SocketProxy.NAME) 
    socketPorxy._socket:send(sendMessage:getPack()) 
end


--[[
发送敲击地鼠包
--]]
function GameProxy:doKickShrew(note)
   -- Log.i("GameProxy:doKickShrew")
    local sendMessage = SendMessageFactory.createKickShrewMessage(note)
    local socketPorxy = self.facade:retrieveProxy(common.model.SocketProxy.NAME) 
    socketPorxy._socket:send(sendMessage:getPack()) 
end


function GameProxy:doGameExit()
    Log.i("doGameExit")
    local globalProxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
    local playerProxy = self.facade:retrieveProxy(common.model.PlayerProxy.NAME)
    local socketPorxy = self.facade:retrieveProxy(common.model.SocketProxy.NAME) 
    local playerId = globalProxy._myPlayerVo.playerId
    local player = playerProxy:getPlayer(playerId)    
    
    if player  then
      
        local tableId = player.mTableId
        local seatId = player.mSeatId
        local sendMessage = SendMessageFactory.createStandupMessage(tableId, seatId)
        socketPorxy._socket:send(sendMessage:getPack()) 
        
        Log.i("tableId:%d",tableId)
        Log.i("seatId:%d",seatId)

    end
end

function GameProxy:doGameScene()
    Log.i("doGameScene")
  
    local sendMessage = SendMessageFactory.createGameReconnectMessage()
    local socketPorxy = self.facade:retrieveProxy(common.model.SocketProxy.NAME) 
    socketPorxy._socket:send(sendMessage:getPack()) 
    local proxy = myAppFacade:retrieveProxy(common.model.GlobalProxy.NAME)
    local roomId = proxy._currentRoom.roomId
    if roomId == 61011 then
        self:doChallengeMatchUpdateData()
    end
end


return GameProxy