local SendMessageFactory = require("message.shrew.SendMessageFactory")
local RoomProxy = class("RoomProxy",common.model.BaseProxy)
local ReceiveMessageFactory = require("message.shrew.ReceiveMessageFactory")
RoomProxy.NAME = "RoomProxy"
--各个游戏的proxy只需要处理事件和数据,注册需要处理的事件
function RoomProxy:onRegister()
    self.facade:registerCommand(ProtocolCommand.RESP_SITDOWN_CMD, shrew.command.RespSitDownCommand) 
    self.facade:registerCommand(ProtocolCommand.RESP_STAND_UP_CMD, shrew.command.RespStandUpCommand) 
    self.facade:registerCommand(ProtocolCommand.RESP_LEAVE_ROOM_CMD, shrew.command.RespLeaveRoomCommand ) 
    self.facade:registerCommand(ProtocolCommand.RESP_UPDATE_STATE_CMD, shrew.command.RespUpdateStateCommand) 
    self.facade:registerCommand(ProtocolCommand.RESP_TABLE_START_CMD, shrew.command.RespTableStartCommand) 
    self.facade:registerCommand(ProtocolCommand.RESP_TABLE_OVER_CMD, shrew.command.RespTableOverCommand) 
    self.facade:registerCommand(ProtocolCommand.RESP_GAME_READY_CMD, shrew.command.RespGameReadyCommand) 
    self.facade:registerCommand(ProtocolCommand.RESP_UPDATE_PLAYER_CMD, common.command.UpdatePlayerCommand)
    self.facade:registerCommand(ProtocolCommand.RESP_ROOMREADY_CMD,shrew.command.RespRoomReadyCommand)
end

function RoomProxy:onRemove()
    self.facade:removeCommand(ProtocolCommand.RESP_SITDOWN_CMD)
    self.facade:removeCommand(ProtocolCommand.RESP_STAND_UP_CMD)
    self.facade:removeCommand(ProtocolCommand.RESP_LEAVE_ROOM_CMD)
    self.facade:removeCommand(ProtocolCommand.RESP_UPDATE_STATE_CMD)
    self.facade:removeCommand(ProtocolCommand.RESP_TABLE_OVER_CMD)
    self.facade:removeCommand(ProtocolCommand.RESP_TABLE_START_CMD)
    self.facade:removeCommand(ProtocolCommand.RESP_GAME_READY_CMD)
    self.facade:removeCommand(ProtocolCommand.RESP_UPDATE_PLAYER_CMD)
    self.facade:removeCommand(ProtocolCommand.RESP_ROOMREADY_CMD)
end



function RoomProxy:doSitDown(note)
    Log.i("RoomProxy:doSitDown ",note[1],note[2])
    local sendMessage = SendMessageFactory.createSitdownMessage(note[1], note[2], "") 
    local socketPorxy = self.facade:retrieveProxy(common.model.SocketProxy.NAME) 
    socketPorxy._socket:send(sendMessage:getPack())
end



return RoomProxy