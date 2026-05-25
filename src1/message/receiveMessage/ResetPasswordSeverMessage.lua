local ReceiveMessage = require("message.ReceiveMessage")

local ResetPasswordSeverMessage = class("ResetPasswordSeverMessage",ReceiveMessage)



function ResetPasswordSeverMessage:unPackMessage()
    Log.i("ResetPasswordSeverMessage")
    self._returnState = self._body:readInt() --int
    self._userid = self._body:readInt() --int
    self._authentic = self._body:readString(16) --16char
    
    
    if self._body:getAvailable() > 0 then
        local reasonStr = self._body:readString(256) --256 length reason
        self._reason = iconv.luaiconv(reasonStr,"GBK","UTF-8")
    end

end

function ResetPasswordSeverMessage:getReturnState()
    return self._returnState	
end

function ResetPasswordSeverMessage:getUserId()
    return self._userid
end

function ResetPasswordSeverMessage:getAuthentic()
    return self._authentic
end

function ResetPasswordSeverMessage:getReason()
    return self._reason	
end


return ResetPasswordSeverMessage