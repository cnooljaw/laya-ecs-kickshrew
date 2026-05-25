--[[
挑战赛信息
@author pjchow
@data 15-09-22
]]
local scheduler = require "network.scheduler"
local ChallengeMatchTopInfo = class("ChallengeMatchTopInfo", function()
	return cc.Sprite:create()
end)

function ChallengeMatchTopInfo:ctor()
	self._winSize = cc.Director:getInstance():getWinSize()
	self:showChallengeMatchInfo()
	self._time = 0
    self._timeHandle = scheduler.scheduleGlobal(handler(self,self.updataTime), 1)
end


function ChallengeMatchTopInfo:showChallengeMatchInfo()

    self._matchInfoBg = cc.Sprite:create("kickshrew_challengeMatchTopInfo_bg.png")
    self:addChild(self._matchInfoBg)
    self._matchInfoBg:setOpacity(99)
    local matchInfoBgSize = self._matchInfoBg:getBoundingBox()
    


    local labelSize = self._winSize.height *  0.045
   	local myRankStr = "我的排名：0/0"
    self._myRankLabel = cc.LabelTTF:create(myRankStr, "", labelSize)
    self._matchInfoBg:addChild(self._myRankLabel)
    self._myRankLabel:setAnchorPoint(cc.p(0, 0.5))
    self._myRankLabel:setPosition(matchInfoBgSize.width * 0.1, matchInfoBgSize.height * 0.58)
    self._myRankLabel:setColor(cc.c3b(232, 223, 221))
    
    local lastTimeStr = "剩余时间：00:00"
	self._lastTimeLabel = cc.LabelTTF:create(lastTimeStr, "", labelSize)
    self._matchInfoBg:addChild(self._lastTimeLabel)
    self._lastTimeLabel:setAnchorPoint(cc.p(0, 0.5))
    self._lastTimeLabel:setPosition(matchInfoBgSize.width * 0.55, matchInfoBgSize.height * 0.58)
	self._lastTimeLabel:setColor(cc.c3b(232, 223, 221))

    local myScoreStr = "我的得分：1000000"
	self._myScoreLabel = cc.LabelTTF:create(myScoreStr, "", labelSize)
    self._matchInfoBg:addChild(self._myScoreLabel)
    self._myScoreLabel:setAnchorPoint(cc.p(0, 0.5))
    self._myScoreLabel:setPosition(matchInfoBgSize.width * 0.1, matchInfoBgSize.height * 0.28)
	self._myScoreLabel:setColor(cc.c3b(232, 223, 221))

    local bestScoreStr = "本场最高：0"
	self._bestScoreLabel = cc.LabelTTF:create(bestScoreStr, "", labelSize)
    self._matchInfoBg:addChild(self._bestScoreLabel)
    self._bestScoreLabel:setAnchorPoint(cc.p(0, 0.5))
    self._bestScoreLabel:setPosition(matchInfoBgSize.width * 0.55, matchInfoBgSize.height * 0.28)
	self._bestScoreLabel:setColor(cc.c3b(232, 223, 221))
end


--更新排名
function ChallengeMatchTopInfo:updateMatchRank(rank, playerNum)
    local myRankStr = string.format("我的排名：%d/%d", rank, playerNum)
    self._myRankLabel:setString(myRankStr)
end

--更新剩余时间
function ChallengeMatchTopInfo:updateMatchCountdown(time)
    self._time = time - 2
end

--更新分数
function ChallengeMatchTopInfo:updateMatchMyScore(score)
    local myScoreStr = string.format("我的积分：%d", score)
    self._myScoreLabel:setString(myScoreStr)
end

--更新最高分
function ChallengeMatchTopInfo:updateMatchMaxScore(maxScore)
    local bestScoreStr = string.format("本场最高：%d", maxScore)
    self._bestScoreLabel:setString(bestScoreStr)
end


function ChallengeMatchTopInfo:updataTime()
    
    if self._time == nil then
        return
    end
    
    local temp = self._time
    local hour = math.floor(temp/3600)
    temp = temp % 3600
    local minute = math.floor(temp/60)
    temp = temp % 60
    local second = temp
    
 
    local timeTemp = string.format("%s:%s", self:toTimeString(minute), self:toTimeString(second))
    local lastTimeStr = string.format("剩余时间：%s", timeTemp)
    self._lastTimeLabel:setString(lastTimeStr)    
    if self._time > 0 then
        self._time = self._time - 1
    end

end

function ChallengeMatchTopInfo:toTimeString(time)
    
   
    if time >=0 and time < 10 then
        local temp  =string.format("0%d",time)
        return temp
        
    elseif time >= 10 then   
        return tostring(time)
    
    end
end

return ChallengeMatchTopInfo