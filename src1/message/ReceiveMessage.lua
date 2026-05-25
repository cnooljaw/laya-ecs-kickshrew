local Message = require("message.Message")
local ReceiveMessage = class("ReceiveMessage",Message)

function ReceiveMessage:ctor(cmdtype,body)
    self._cmdtype = cmdtype
    self._body = body 
    self._body:setPos(1)
    self:unPackMessage()
end

function ReceiveMessage:unPackMessage()
    
end

function ReceiveMessage:getCmdType()
	return self._cmdtype
end

return ReceiveMessage