local ReceiveMessage = require("message.ReceiveMessage")

local StandupServerMessage = class("StandupServerMessage",ReceiveMessage)



function StandupServerMessage:unPackMessage()
    self._state = self._body:readInt() --int
    self._userid = self._body:readInt() --int

end

function StandupServerMessage:getState()
    return self._state
end

function StandupServerMessage:getUserId()
	return self._userid
end

return StandupServerMessage