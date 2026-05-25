local ReceiveMessage = require("message.ReceiveMessage")

local WeekRankServerMessage = class("WeekRankServerMessage",ReceiveMessage)


function WeekRankServerMessage:unPackRank()
    local rank = {}
    rank._num = self._body:readInt()
    rank._score = self._body:readInt()
    rank._name = iconv.luaiconv(self._body:readString(32),"GBK","UTF-8")
    rank._reserved = self._body:readInt()

    return rank

end

function WeekRankServerMessage:unPackMessage()
    self._rankList = {}
    for i = 1, 10 do
        self._rankList[i] = self:unPackRank()
    end

end

return WeekRankServerMessage