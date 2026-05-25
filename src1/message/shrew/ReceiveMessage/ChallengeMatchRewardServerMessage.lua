local ReceiveMessage = require("message.ReceiveMessage")

local ChallengeMatchRewardServerMessage = class("ChallengeMatchRewardServerMessage",ReceiveMessage)


function ChallengeMatchRewardServerMessage:unPackMessage()
    self._rank = self._body:readInt()
    self._reward = self._body:readInt()
    self._userName = iconv.luaiconv(self._body:readString(32),"GBK","UTF-8")
    self._matchName = iconv.luaiconv(self._body:readString(32),"GBK","UTF-8")

end

return ChallengeMatchRewardServerMessage