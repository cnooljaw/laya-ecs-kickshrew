local ReceiveMessage = require("message.ReceiveMessage")

local ChallengeMatchGameSceneServerMessage = class("ChallengeMatchGameSceneServerMessage",ReceiveMessage)


function ChallengeMatchGameSceneServerMessage:unPackMessage()
	Log.i("场景包")
    self._version = self._body:readInt()
    Log.i("_version", self._version)
    self._score = self._body:readInt()
    Log.i("_score", self._score)
    self._matchState = self._body:readInt()
    Log.i("_matchState", self._matchState)
    self._time = self._body:readInt()
    Log.i("_time", self._time)
    self._rank = self._body:readInt()
    Log.i("_rank", self._rank)
    self._playerNum = self._body:readInt()
	Log.i("_playerNum", self._playerNum)
    self._maxScore = self._body:readInt()
    Log.i("_maxScore", self._maxScore)
end

return ChallengeMatchGameSceneServerMessage