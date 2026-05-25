local ReceiveMessage = require("message.ReceiveMessage")

local RoomReadyServerMessage = class("RoomReadyServerMessage",ReceiveMessage)



function RoomReadyServerMessage:unPackMessage()
    self._currentTime = self._body:readInt() --int

end

function RoomReadyServerMessage:getCurrentTime()
	return self._currentTime
end

return RoomReadyServerMessage