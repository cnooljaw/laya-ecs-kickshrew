local ReceiveMessage = require("message.ReceiveMessage")

local EnterRoomServerMessage = class("EnterRoomServerMessage",ReceiveMessage)
local globalProxy = myAppFacade:retrieveProxy(common.model.GlobalProxy.NAME)


function EnterRoomServerMessage:unPackMessage()
    self._state = self._body:readInt() --int
    self._playerCount = self._body:readInt() --int
    if self._body:getAvailable() > 2 then
        local len = self._body:readShort()
        local result = self._body:readString(len) --length reason
        self._result  = iconv.luaiconv(result,"GBK","UTF-8")
        if self._state == 0  and self._result ~= "" then
            globalProxy._lowGuaranteeMessage = self._result
        end
    end
end

function EnterRoomServerMessage:getState()
	return self._state
end

function EnterRoomServerMessage:getPlayerCount()
	return self._playerCount
end

function EnterRoomServerMessage:getResult()
	return self._result
end

return EnterRoomServerMessage