local ReceiveMessage = require("message.ReceiveMessage")

local SitDownServerMessage = class("SitDownServerMessage",ReceiveMessage)



function SitDownServerMessage:unPackMessage()
    self._state = self._body:readInt() --int
    self._userid = self._body:readInt() --int
    self._tableid = self._body:readShort()
    self._seatid = self._body:readShort()
    self._isObserver = self._body:readBool()
    
    if self._body:getAvailable() > 0 then
        local len = self._body:readShort()
        local result = self._body:readString(len) --length reason
        self._resultInfo  = iconv.luaiconv(result,"GBK","UTF-8")
        Log.i("sitdown resultInfo:"..self._resultInfo)
        
    end

end

function SitDownServerMessage:getState()
    return self._state
end

function SitDownServerMessage:getUserId()
	return self._userid
end

function SitDownServerMessage:getTableId()
	return self._tableid
end

function SitDownServerMessage:getSeatId()
	return self._seatid
end

function SitDownServerMessage:getIsObserver()
	return self._isObserver
end

function SitDownServerMessage:getResultInfo()
    return self._resultInfo	
end

return SitDownServerMessage