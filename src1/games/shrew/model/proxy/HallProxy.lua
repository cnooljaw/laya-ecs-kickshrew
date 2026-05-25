local SendMessageFactory = require("message.shrew.SendMessageFactory")
local HallProxy = class("HallProxy",common.model.BaseProxy)
local ReceiveMessageFactory = require("message.shrew.ReceiveMessageFactory")
HallProxy.NAME = "HallProxy"

--各个游戏的proxy只需要处理事件和数据
function HallProxy:onRegister()

    self.facade:registerCommand(ProtocolCommand.RESP_ENTER_ROOM_CMD, shrew.command.RespEnterRoomCommand)
    --self.facade:registerCommand(ProtocolCommand.RESP_UPDATEPLAYERCOUNT_CMD, shrew.command.RespUpdatePlayerCountCommand)
    --self.facade:registerCommand(ProtocolCommand.RESP_UPDATE_STATE_CMD, shrew.command.RespUpdateStateCommand)
end

function HallProxy:onRemove()
    self.facade:removeCommand(ProtocolCommand.RESP_ENTER_ROOM_CMD)
    --self.facade:removeCommand(ProtocolCommand.RESP_UPDATEPLAYERCOUNT_CMD)
    --self.facade:removeCommand(ProtocolCommand.RESP_UPDATE_STATE_CMD)

end


return HallProxy