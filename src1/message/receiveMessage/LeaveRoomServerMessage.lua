local ReceiveMessage = require("message.ReceiveMessage")

local LeaveRoomServerMessage = class("LeaveRoomServerMessage",ReceiveMessage)



function LeaveRoomServerMessage:unPackMessage()
    --Log.i("收到leaveRoom包")
    self._leaveUserId = self._body:readInt() --int
    self._leaveReason = self._body:readInt() --int

end

function LeaveRoomServerMessage:getLeaveUserId()
	return self._leaveUserId
end

function LeaveRoomServerMessage:getLeaveReason()
	return self._leaveReason
end

return LeaveRoomServerMessage