local ReceiveMessage = require("message.ReceiveMessage")

local LoginServerMessage = class("LoginServerMessage",ReceiveMessage)



function LoginServerMessage:unPackMessage()
    --Log.i("LoginServerMessage:unPackMessage")
    self._state = self._body:readInt() --int
    self._userid = self._body:readInt() --int
    --local authenticBytes = network.ByteArray.new()
    --self._body:readBytes(authenticBytes,1,16)  --string
    self._authentic = self._body:readString(16)
    self._version = self._body:readInt()   --int
    if(self._body:getAvailable() > 0) then
        self._errorlength = self._body:readShort() -- short
        self._errorString = self._body:readString(self._errorlength)--string
    end
    local iconv = require("iconv")
    self._errorString = iconv.luaiconv(self._errorString, "GBK", "UTF-8")
    Log.i("LoginServerMessage._errorString:",self._errorString)
    -- Log.i(self._cmdtype,self._state,self._userid,self._authentic,self._version,self._errorlength,self._errorString)
end

return LoginServerMessage