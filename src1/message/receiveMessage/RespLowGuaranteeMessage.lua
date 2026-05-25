--
-- Created by IntelliJ IDEA.
-- User: zero
-- Date: 15/7/7
-- Time: 上午10:40
-- To change this template use File | Settings | File Templates.
--

local ReceiveMessage = require("message.ReceiveMessage")

local RespLowGuaranteeMessage = class("RespLowGuaranteeMessage",ReceiveMessage)



function RespLowGuaranteeMessage:unPackMessage()
    self._len = self._body:readShort()
    self._response = iconv.luaiconv(self._body:readString(self._len),"GBK","UTF-8")
end

return RespLowGuaranteeMessage