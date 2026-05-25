local ReceiveMessage = require("message.ReceiveMessage")

local SettleAccountServerMessage = class("SettleAccountServerMessage",ReceiveMessage)



function SettleAccountServerMessage:unPackMessage()
    self._winMoney = self._body:readInt() --int
end

return SettleAccountServerMessage