local ReceiveMessage = require("message.ReceiveMessage")

local UpdateUsePwdServerMessage = class("UpdateUsePwdServerMessage",ReceiveMessage)



function UpdateUsePwdServerMessage:unPackMessage()
    Log.i("UpdateUsePwdServerMessage")
    self._state = self._body:readInt() --int
    if self._body:getAvailable() > 0 then
        if self._body:getAvailable() > 0 then
            local len = self.body:readShort()
            local result = self._body:readString(len) --length reason
            self._result  = iconv.luaiconv(result,"GBK","UTF-8")
        end
    end

end

function UpdateUsePwdServerMessage:getState()
	return self._state
end

function UpdateUsePwdServerMessage:getResult()
	return self._result
end

return UpdateUsePwdServerMessage