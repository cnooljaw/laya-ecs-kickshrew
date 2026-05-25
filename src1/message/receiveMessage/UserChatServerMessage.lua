local ReceiveMessage = require("message.ReceiveMessage")

local UserChatServerMessage = class("UserChatServerMessage",ReceiveMessage)



function UserChatServerMessage:unPackMessage()
    self._fontColor  = self._body:readInt() --int
    self._sendUserid = self._body:readInt() --int
    self._sendUserName = self._body:readString(32) --32 char
    self._targetUserid = self._body:readInt() -- int
    self._chatMessage = self._body:readString(256) -- 256char
    self._chatMessage =  iconv.luaiconv(self._chatMessage ,"GBK","UTF-8")
    self._type = self._body:readInt()

    --过滤表情
    self._chatMessage = string.gsub(self._chatMessage,"\\=%a%d%d","")

end

function UserChatServerMessage:getFontColor()
	return self._fontColor
end

function UserChatServerMessage:getSendUserId()
	return self._sendUserid
end

function UserChatServerMessage:getSendUserName()
	return self._sendUserName
end

function UserChatServerMessage:getTargetUserId()
	return self._targetUserid
end

function UserChatServerMessage:getChatMessage()
	return self._chatMessage
end

function UserChatServerMessage:getType()
	return self._type
end

return UserChatServerMessage