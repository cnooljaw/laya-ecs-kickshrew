local ReceiveMessage = require("message.ReceiveMessage")

local AccountRegServerMessage = class("AccountRegServerMessage",ReceiveMessage)



function AccountRegServerMessage:unPackMessage()

    self._regUserId = self._body:readInt() --int
    self._reasonId = self._body:readInt() --int
end

function AccountRegServerMessage:getUserId()
	return self._regUserId
end

function AccountRegServerMessage:getReasonId()
	return self._reasonId
end

return AccountRegServerMessage