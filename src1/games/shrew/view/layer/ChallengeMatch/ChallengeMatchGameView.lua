--[[
挑战赛类
@author pjchow
@data 15-09-17
]]

local scheduler = require "network.scheduler"
local ChallengeMatchGameView = class("ChallengeMatchGameView",shrew.view.GameView)

function ChallengeMatchGameView:ctor()

    ChallengeMatchGameView.super.ctor(self)

    self._countdownView = nil
    -- self:addCountdownView()
    self:addMatchInfo()
    -- self:showMatchOverBox()

    self:showMatchBeginBox()
    
end
function ChallengeMatchGameView:showMatchBeginBox()
    self._beginBox = shrew.view.ChallengeMatchBeginBox.new(handler(self, self.onViewClickCallBack))
    self._beginBox:setPosition(self._winSize.width * 0.5, self._winSize.height * 0.6)
    self._beginBox:setScale(0.8)
    self:addChild(self._beginBox, 201)
end

function ChallengeMatchGameView:addCountdownView()
    self._countdownView = shrew.view.ChallengeMatchCountdown.new(handler(self, self.onViewClickCallBack))
    self:addChild(self._countdownView, 99)
end

function ChallengeMatchGameView:addMatchInfo()
    self._matchInfoView = shrew.view.ChallengeMatchTopInfo.new()
    self._matchInfoView:setPosition(cc.p(self._winSize.width * 0.63, self._winSize.height * 0.955))
    self._matchInfoView:setScale(0.8)
    self:addChild(self._matchInfoView, 99)
end

function ChallengeMatchGameView:onExit()
    ChallengeMatchGameView.super.onExit(self)
    if self._countdownView then
        self._countdownView:removeTimeHandle()
    end
end
-- --[[
-- 设置
-- --]]
function ChallengeMatchGameView:showRandShrew(map_type)
    self._map_type = map_type
    for i = 1, #self._hole do
        local tempShrew = self:generateRandShrew(map_type)
        self._hole[i]:addChild(tempShrew, 0, 1)
    end

    self._handle = scheduler.scheduleGlobal(handler(self,self.refreshShrew), 0.2)    
end


--设置地鼠状态
function ChallengeMatchGameView:setShrewState(state)
    for i = 1, 9 do
       if self._hole[i] ~= nil then
            if state == shrewData.Action.None then
                local shrew = self._hole[i]:getChildByTag(1)
                shrew._shrewAction = state
            end
            if state == shrewData.Action.Refresh then
                self._hole[i]:removeChildByTag(1)
                local newShrew = self:generateRandShrew(self._mapType)
                self._hole[i]:addChild(newShrew,0,1)   
                newShrew:setCanSeeViewRect()  
            end
       end
    end  
end
--[[
开始出地鼠
--]]
function ChallengeMatchGameView:startShowRandShrew()
    Log.i("移除倒计时和结算框")
    self:setShrewState(shrewData.Action.None)
    if self._countdownView then

        self._countdownView:removeTimeHandle()
        self._countdownView:removeFromParent()
        self._countdownView = nil 
    end

    if self._matchOverBox then
        self._matchOverBox:removeFromParent()
        self._matchOverBox = nil
    end
end

function ChallengeMatchGameView:showMatchOverBox(rank, reward, userName, matchName)
    self:setShrewState(shrewData.Action.Refresh)
    self._matchOverBox = shrew.view.ChallengeMatchGameOverBox.new(handler(self, self.onViewClickCallBack))
    self:addChild(self._matchOverBox,99)
    self._matchOverBox:updateInfo(rank, reward, userName, matchName)
    if self._countdownView then self._countdownView:setVisible(false) end
end

function ChallengeMatchGameView:continueMatch()
    
	if self._countdownView then self._countdownView:setVisible(true) end
    if self._matchOverBox then
        self._matchOverBox:removeFromParent()
        self._matchOverBox = nil
    end
end


--更新排名
function ChallengeMatchGameView:updateMatchRank(rank, playerNum)
    self._matchInfoView:updateMatchRank(rank, playerNum)
end
--更新剩余时间
function ChallengeMatchGameView:updateMatchCountdown(time)
    self._matchInfoView:updateMatchCountdown(time)
end
--更新分数
function ChallengeMatchGameView:updateMatchMyScore(score)
    self._matchInfoView:updateMatchMyScore(score)
end
--更新最高分
function ChallengeMatchGameView:updateMatchMaxScore(maxScore)
    self._matchInfoView:updateMatchMaxScore(maxScore)
end

function ChallengeMatchGameView:updateMatchDidNotStartCountdown(time)
    Log.i("new出倒计时框")
    if self._countdownView == nil then
        self:addCountdownView()
    end
    self._countdownView:updateCountdown(time)
end

function ChallengeMatchGameView:doUpdateMatchChance(lastCount, allCount)
    if self._beginBox then
        self._beginBox:updateChanceCount(lastCount, allCount)
    end
end
function ChallengeMatchGameView:removeBeginBox()
    if self._beginBox then
        self._beginBox:removeFromParent()
        self._beginBox = nil
    end
end


return ChallengeMatchGameView