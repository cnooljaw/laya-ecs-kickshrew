local ReceiveMessage = require("message.ReceiveMessage")

local TableStartServerMessage = class("TableStartServerMessage",ReceiveMessage)



function TableStartServerMessage:unPackMessage()
    self._tableid = self._body:readShort() --short
end

function TableStartServerMessage:getTableId()
    return self._tableid
end

return TableStartServerMessage