local ReceiveMessage = require("message.ReceiveMessage")

local RegisterServerMessage = class("RegisterServerMessage",ReceiveMessage)



function RegisterServerMessage:unPackMessage()
    self._regUserId = self._body:readInt() --int
    self._regReasonId = self._body:readInt() --int

end

function RegisterServerMessage:getRegUserId()
    return self._regUserId
end

function RegisterServerMessage:getRegReasonId()
    return self._regReasonId
end

return RegisterServerMessage