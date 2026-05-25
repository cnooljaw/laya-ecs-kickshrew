local RespRoomReadyCommand = class("RespRoomReadyCommand",puremvc.SimpleCommand)


function RespRoomReadyCommand:execute(note)
    Log.i("RespRoomReadyCommand:execute")
    local globalProxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
    if globalProxy._isResume == true  then
        Log.i("需要断线重连了")
        self:sendNotification(AppEvents.shrew.fromView.goGame)
    end
end

return RespRoomReadyCommand