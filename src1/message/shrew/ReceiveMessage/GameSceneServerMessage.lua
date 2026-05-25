local ReceiveMessage = require("message.ReceiveMessage")

local GameSceneServerMessage = class("GameSceneServerMessage",ReceiveMessage)


function GameSceneServerMessage:unPackMessage()
    self._rank = self._body:readInt()
    self._exp = self._body:readInt()
    self._luck = self._body:readInt()
    self._angry = self._body:readInt()
    self._reserved = self._body:readInt()
    self._len = self._body:readInt()
    
    self._hammerUsable = {}   
    for i=1,8 do
        self._hammerUsable[i] = {}
        self._hammerUsable[i]._id = self._body:readInt()
        self._hammerUsable[i]._count = self._body:readInt()
        -- print("GameSceneServerMessage未用锤子:",self._hammerUsable[i]._count)
    end
    self._version = self._body:readInt()
    self._dayRank = self._body:readInt()
    self._weekRank = self._body:readInt()
    self._power = self._body:readInt()
    self._powerTop = self._body:readInt()
    self._money = self._body:readInt()
end

return GameSceneServerMessage