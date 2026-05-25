local ReceiveMessage = require("message.ReceiveMessage")

local HammerListServerMessage = class("HammerListServerMessage",ReceiveMessage)


function HammerListServerMessage:unPackHammer()
    local hammer = {}
    hammer._id = self._body:readInt()
    hammer._price = self._body:readInt()
    hammer._angryPrice = self._body:readInt()
    hammer._angry = self._body:readInt()
    hammer._type = self._body:readInt()
    hammer._lever = self._body:readInt()
    hammer.reserved = self._body:readInt()
    hammer._name = iconv.luaiconv(self._body:readString(16),"GBK","UTF-8")
    hammer._isSelected = 0
    hammer._hammerUsable = {}
    hammer._hammerUsable._id = hammer._id
    hammer._hammerUsable._count = 0
    return hammer
end


function HammerListServerMessage:unPackMessage()
    self._len = self._body:readInt()
    self._hammerList = {}

    for i = 1, self._len do
        self._hammerList[i] = self:unPackHammer()
    end


end

return HammerListServerMessage