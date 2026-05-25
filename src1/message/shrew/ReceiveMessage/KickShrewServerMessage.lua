local ReceiveMessage = require("message.ReceiveMessage")

local KickShrewServerMessage = class("KickShrewServerMessage",ReceiveMessage)



function KickShrewServerMessage:unPackMessage()
    self._ret = self._body:readInt()
    self._money = self._body:readInt()
    self._reward = self._body:readInt()
    self._luckValue = self._body:readInt()
    self._levelScore = self._body:readInt()
    self._rank = self._body:readInt()
    self._hammerId = self._body:readInt()
    self._angry = self._body:readInt()
    self._length = self._body:readShort()
    self._szReason = iconv.luaiconv(self._body:readString(64),"GBK","UTF-8")
    self._dayRank = self._body:readInt()
    self._weekRank = self._body:readInt()
    self._numOfShrew = self._body:readInt()
    self._shrewResp = {}
    for i = 1, 10 do
        self._shrewResp[i] = {}
        self._shrewResp[i]._shrewIndex = self._body:readInt()
        self._shrewResp[i]._reward = self._body:readInt()
    end
    self._combo = self._body:readInt()
    self._power = self._body:readInt()
    self._comboId =self._body:readInt()


end

return KickShrewServerMessage