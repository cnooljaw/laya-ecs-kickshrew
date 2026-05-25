local ReceiveMessage = require("message.ReceiveMessage")

local HeartBeatServerMessage = class("HeartBeatServerMessage",ReceiveMessage)



function HeartBeatServerMessage:unPackMessage()

end

return HeartBeatServerMessage