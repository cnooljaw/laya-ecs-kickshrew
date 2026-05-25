local ReceiveMessage = require("message.ReceiveMessage")

local UpdatePlayerCountServerMessage = class("UpdatePlayerCountServerMessage",ReceiveMessage)

function UpdatePlayerCountServerMessage:unPackMessage()
    self._rooms = self._rooms or {}
    local i = 1
    while self._body:getAvailable() > 0 do
        self._rooms[i] = {}
        self._rooms[i].roomId = self._body:readUInt()
        self._rooms[i].playerCount = self._body:readUInt()
        --Log.i(self._rooms.roomId,self._rooms.playerCount)
        i = i + 1
    end

end

return UpdatePlayerCountServerMessage