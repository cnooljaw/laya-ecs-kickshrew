local ReqEnterRoomCommand = class("ReqEnterRoomCommand",puremvc.SimpleCommand)

function ReqEnterRoomCommand:execute(note)
    Log.i("ReqEnterRoomCommand:execute")
    local socketProxy = self.facade:retrieveProxy(common.model.SocketProxy.NAME) 
    Log.i("note:getBody().isOnOff",note:getBody().isOnOff)
    if (note:getBody().isOnOff == "on") then --判断房间是否是开启状态
        local globalProxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
        local room = globalProxy:getCurrentRoom()
--        room.ip = "61.174.28.126"
--		room.port = 4600
--		room.roomId = 61003
        Log.i("room.ip",room.ip)
        Log.i("room.port",room.port)
        socketProxy:openSocket(room.ip, room.port, handler(globalProxy, globalProxy.sendEnterRoomMessage), "message.shrew.ReceiveMessageFactory")
    end
end

return ReqEnterRoomCommand