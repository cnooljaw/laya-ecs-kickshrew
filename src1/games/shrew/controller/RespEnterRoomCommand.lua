local RespEnterRoomCommand = class("RespEnterRoomCommand",puremvc.SimpleCommand)



function RespEnterRoomCommand:execute(note)
    Log.i("RespEnterRoomCommand:execute")
   
    local proxy = self.facade:retrieveProxy(shrew.model.HallProxy.NAME)
    local mediator = self.facade:retrieveMediator(shrew.view.HallViewMediator.NAME)
    Log.i(note:getBody():getState())
    local message = note:getBody()
    local state = note:getBody():getState()
    if state == 0 then
        mediator:goRoom()
    elseif state == -2 then
        if message._result then
            self:sendNotification(AppEvents.shrew.enterRoomFail, message._result)
        else
            self:sendNotification(AppEvents.shrew.enterRoomFail, ErrorDefines.HALL_ENTER_ROOM_FAIL)
        end
    end
        
end
return RespEnterRoomCommand