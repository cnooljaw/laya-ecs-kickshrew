local ReceiveMessage = require("message.ReceiveMessage")

local UpdatePowerServerMessage = class("UpdatePowerServerMessage",ReceiveMessage)



function UpdatePowerServerMessage:unPackMessage()
    self._powerValue = self._body:readInt() --int
end

return UpdatePowerServerMessage