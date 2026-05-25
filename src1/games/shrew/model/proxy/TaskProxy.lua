
local TaskProxy = class("TaskProxy",common.model.BaseProxy)
TaskProxy.NAME = "TaskProxy"

--各个游戏的proxy只需要处理事件和数据
function TaskProxy:onRegister()

    self.facade:registerCommand(ProtocolCommand.RESP_ENTER_ROOM_CMD, shrew.command.RespEnterRoomCommand) 
      
end

function TaskProxy:onRemove()
    
    self.facade:removeCommand(ProtocolCommand.RESP_ENTER_ROOM_CMD)
end

return TaskProxy