--[[
地鼠挑战赛
@author pjchow
@data 15-09-22
]]
local scheduler = require "network.scheduler"
local ChallengeMatchGameViewMediator = class("ChallengeMatchGameViewMediator", shrew.view.GameViewMediator)

function ChallengeMatchGameViewMediator:listNotificationInterests()

    local superList = ChallengeMatchGameViewMediator.super.listNotificationInterests(self)
    --添加事件
    -- table.insert(superList,AppEvents.ddz.respGetRankInfo)

    return superList      
end


function ChallengeMatchGameViewMediator:onViewClickEx(eventData)
	if eventData == "countdown" then
		self:startShowRandShrew()
    elseif eventData == "continueMatch" then
        self:continueMatch()
        self._proxy._isShowBeginBox = false
        self:sendNotification(AppEvents.shrew.fromView.gameScene)
        self:sendNotification(AppEvents.shrew.fromView.challengeMatchChance)
    elseif eventData == "startMatch" then
        if self._proxy._lastCount <= 0 then
            doMsgBox(self:getViewComponent(), "今日挑战次数已用完，明天再来挑战吧~")
        else
            self._proxy._isShowBeginBox = false
            self:sendNotification(AppEvents.shrew.fromView.gameScene)
            self:removeBeginBox()
        end
	end
end


--重写父类方法
function ChallengeMatchGameViewMediator:setGameViewAndProxy()
    self._proxy = shrew.model.ChallengeMatchGameProxy.new() --保持一个proxy的引用  
    self.facade:registerProxy(self._proxy)
    self._gameScene = {shrew.view.ChallengeMatchGameViewGrass, shrew.view.ChallengeMatchGameViewShip, shrew.view.ChallengeMatchGameViewSpace, shrew.view.ChallengeMatchGameViewSewer}
    local randomIdx = math.random(1,4)
    self._preSceneIndex = randomIdx
    self:setViewComponent(self._gameScene[self._preSceneIndex].new())  

    
end
function ChallengeMatchGameViewMediator:onRegisterEx()
    self:sendNotification(AppEvents.shrew.fromView.challengeMatchChance)
    local globalProxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
    if globalProxy._isResume == true then
        --请求gameScene
        self:sendNotification(AppEvents.shrew.fromView.gameScene)
    elseif  globalProxy._isResume == false then
        --发送准备包
        self:sendNotification(AppEvents.shrew.fromView.gameReady)
        --发送游戏开始包
        self:sendNotification(AppEvents.shrew.fromView.gameStart)
    end

end


--比赛开始显示地鼠
function ChallengeMatchGameViewMediator:startShowRandShrew()
    
    self:getViewComponent():startShowRandShrew()
end

function ChallengeMatchGameViewMediator:continueMatch()
    self:getViewComponent():continueMatch()
end


--更新排名
function ChallengeMatchGameViewMediator:updateMatchRank(rank, playerNum)
    self:getViewComponent():updateMatchRank(rank, playerNum)
end

--更新比赛剩余时间
function ChallengeMatchGameViewMediator:updateMatchCountdown(time)
    self:getViewComponent():updateMatchCountdown(time)
end

--更新分数
function ChallengeMatchGameViewMediator:updateMatchMyScore(score)
    self:getViewComponent():updateMatchMyScore(score)
end

--更新最高分
function ChallengeMatchGameViewMediator:updateMatchMaxScore(maxScore)
    self:getViewComponent():updateMatchMaxScore(maxScore)
end

--更新比赛开始剩余时间
function ChallengeMatchGameViewMediator:updateMatchDidNotStartCountdown(time)
   self:getViewComponent():updateMatchDidNotStartCountdown(time)
end

function ChallengeMatchGameViewMediator:showMatchOverBox(rank, reward, userName, matchName)
    self:getViewComponent():showMatchOverBox(rank, reward, userName, matchName)
end

function ChallengeMatchGameViewMediator:doUpdateMatchChance(lastCount, allCount)
    self._proxy._lastCount = lastCount
    self:getViewComponent():doUpdateMatchChance(lastCount, allCount)
end

function ChallengeMatchGameViewMediator:removeBeginBox()
    self:getViewComponent():removeBeginBox()
end


return ChallengeMatchGameViewMediator