local ReceiveMessage = require("message.ReceiveMessage")

local RewardNewServerMessage = class("RewardNewServerMessage",ReceiveMessage)



function RewardNewServerMessage:unPackMessage()
    self._value = self._body:readInt()
    self._username = iconv.luaiconv(self._body:readString(32),"GBK","UTF-8")
    self._hammerName = iconv.luaiconv(self._body:readString(16),"GBK","UTF-8")
    self._protectName = iconv.luaiconv(self._body:readString(16),"GBK","UTF-8")
    self._dt = self._body:readInt()
    self._reserved = self._body:readInt()

end

return RewardNewServerMessage