local ReceiveMessage = require("message.ReceiveMessage")

local GameReadyServerMessage = class("GameReadyServerMessage",ReceiveMessage)
local globalProxy = myAppFacade:retrieveProxy(common.model.GlobalProxy.NAME)

function GameReadyServerMessage:unPackMessage()
    self._playerid = self._body:readInt() --int
    self._errorCode = self._body:readInt() --int



    if self._body:getAvailable() > 0 then
        local len = self._body:readShort()
        local result = self._body:readString(len) --length reason
        self._result  = iconv.luaiconv(result,"GBK","UTF-8")

        if self._errorCode == -1  and self._playerid == globalProxy._myPlayerVo.playerId  and self._result ~= "" then
            globalProxy._lowGuaranteeMessage = self._result
        end
    end

end

function GameReadyServerMessage:getPlayerId()
	return self._playerid
end

function GameReadyServerMessage:getErrorCode()
    return self._errorCode	
end

function GameReadyServerMessage:getResult()
	return self._result
end

return GameReadyServerMessage