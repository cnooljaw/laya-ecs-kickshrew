local ReceiveMessage = require("message.ReceiveMessage")

local UserIDCardServerMessage = class("UserIDCardServerMessage",ReceiveMessage)



function UserIDCardServerMessage:unPackMessage()
    self._state = self._body:readInt() --int
    self._userid = self._body:readInt() --int
    if self._body:getAvailable() > 0 then
        local result = self._body:readString(256) --length reason
        self._result  = iconv.luaiconv(result,"GBK","UTF-8")
    end

end


function UserIDCardServerMessage:getState()
	return self._state
end

function UserIDCardServerMessage:getUserId()
	return self._userid
end

function UserIDCardServerMessage:getResult()
	return self._result
end


return UserIDCardServerMessage