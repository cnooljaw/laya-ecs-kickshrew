local ReceiveMessage = require("message.ReceiveMessage")

local TaskInitServerMessage = class("TaskInitServerMessage",ReceiveMessage)



function TaskInitServerMessage:unPackMessage()
    self._taskType = self._body:readChar() --char
    self._taskLen = self._body:readShort() --short
    if self._body:getAvailable() > 0 then
        local taskInfo = self._body:readString(self._taskLen) --256 length reason
        self._taskInfo = iconv.luaiconv(taskInfo,"GBK","UTF-8")
    end

end

function TaskInitServerMessage:getTaskType()
	return self._taskType
end

function TaskInitServerMessage:getTaskInfo()
	return self._taskInfo
end

return TaskInitServerMessage