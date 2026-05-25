local ReceiveMessage = require("message.ReceiveMessage")

local ChallengeMatchChanceServerMessage = class("ChallengeMatchChanceServerMessage",ReceiveMessage)


function ChallengeMatchChanceServerMessage:unPackMessage()
	Log.i("挑战次数")
    self._chance = self._body:readInt()
    Log.i("_chance", self._chance)
    self._maxChance = self._body:readInt()
    Log.i("_macChance", self._maxChance)

end

return ChallengeMatchChanceServerMessage