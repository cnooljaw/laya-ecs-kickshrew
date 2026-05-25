local ReceiveMessage = require("message.ReceiveMessage")

local TableOverServerMessage = class("TableOverServerMessage",ReceiveMessage)



function TableOverServerMessage:unPackMessage()
    self._tableid = self._body:readShort() --short
end

function TableOverServerMessage:getTableId()
    return self._tableid
end

return TableOverServerMessage