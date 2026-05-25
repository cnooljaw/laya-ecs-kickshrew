local ReceiveMessage = require("message.ReceiveMessage")

local GameRankServerMessage = class("GameRankServerMessage",ReceiveMessage)



function GameRankServerMessage:unPackMessage()
    self._playerid = self._body:readInt() --int
    self._score = self._body:readInt() --int
    self._ranking = self._body:readInt() -- int

end

function GameRankServerMessage:getPlayerId()
	return self._playerid
end

function GameRankServerMessage:getScore()
	return self._score
end

function GameRankServerMessage:getRank()
    return self._ranking
end

return GameRankServerMessage