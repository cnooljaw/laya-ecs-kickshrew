local ReceiveMessage = require("message.ReceiveMessage")

local BindingPhoneServerMessage = class("BindingPhoneServerMessage",ReceiveMessage)



function BindingPhoneServerMessage:unPackMessage()
    Log.i("BindingPhoneServerMessage")
    self._ret = self._body:readInt() --int
    self._userid = self._body:readInt() --int
    if self._body:getAvailable() > 0 then
        local reasonStr = self._body:readString(256) --256 length reason
         self._reason = iconv.luaiconv(reasonStr,"GBK","UTF-8")
    end

end

return BindingPhoneServerMessage