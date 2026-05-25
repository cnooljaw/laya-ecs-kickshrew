local ReceiveMessage = require("message.ReceiveMessage")

local DayRankServerMessage = class("DayRankServerMessage",ReceiveMessage)


function DayRankServerMessage:unPackRank()
    local rank = {}
    rank._num = self._body:readInt()
    rank._score = self._body:readInt()
    rank._name = iconv.luaiconv(self._body:readString(32),"GBK","UTF-8")
    rank._reserved = self._body:readInt()

    return rank

end

function DayRankServerMessage:unPackMessage()
    self._rankList = {}
    for i=1,10 do
        self._rankList[i] = self:unPackRank()
    end
end

return DayRankServerMessage