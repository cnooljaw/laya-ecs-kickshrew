local ReceiveMessage = require("message.ReceiveMessage")

local RewardTopServerMessage = class("RewardTopServerMessage",ReceiveMessage)


function RewardTopServerMessage:unPackRewardItem()
    local rewardItem = {}
    rewardItem._value = self._body:readInt()
    rewardItem._username = iconv.luaiconv(self._body:readString(32),"GBK","UTF-8")
    rewardItem._hammerName = iconv.luaiconv(self._body:readString(16),"GBK","UTF-8")
    rewardItem._protectName = iconv.luaiconv(self._body:readString(16),"GBK","UTF-8")
    rewardItem._dt = self._body:readInt()
    rewardItem._reserved = self._body:readInt()
    return rewardItem
end

function RewardTopServerMessage:unPackMessage()
    self._len = self._body:readInt()
    self._items = {}
    for i = 1, self._len do
        self._items[i] = self:unPackRewardItem()
    end

end

return RewardTopServerMessage