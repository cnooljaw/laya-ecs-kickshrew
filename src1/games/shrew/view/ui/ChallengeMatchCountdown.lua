--[[
开赛倒计时
@author pjchow
@data 15-09-22
]]
local scheduler = require "network.scheduler"
local ChallengeMatchCountdown = class("ChallengeMatchCountdown", common.view.BaseView)

function ChallengeMatchCountdown:ctor(callback)
	self._callback = callback
	self._hourUnit100 = 0
    self._hourUnit10 = 0
    self._hourUnit1 = 0
    self._minuteUnit10 = 0
    self._minuteUnit1 = 0
    self._secondUnit10 = 0
    self._secondUnit1 = 0
	
	self._winSize = cc.Director:getInstance():getWinSize()
	self:showCountdownView()
    self:showCountdownLargeView()
	-- self:addButton()

	self._seconds = 0
    self._timeHandle = scheduler.scheduleGlobal(handler(self,self.updateDeltaTime), 1)

--    local function callback(touch, event)
--        return true
--    end 
--
--    local listener = cc.EventListenerTouchOneByOne:create()
--    listener:registerScriptHandler(callback,cc.Handler.EVENT_TOUCH_BEGAN )
--    listener:setSwallowTouches(true)
--    local eventDispatcher = self:getEventDispatcher()
--    eventDispatcher:addEventListenerWithSceneGraphPriority(listener,self)
end


function ChallengeMatchCountdown:showCountdownView()
	self._countdownBg = cc.Sprite:createWithSpriteFrameName("kickshrew_challengeMatch_countdownBox_bg.png")
	self._countdownBg:setPosition(self._winSize.width * 0.5, self._winSize.height * 0.5)
	self:addChild(self._countdownBg)
	local bgSize = self._countdownBg:getBoundingBox()

	local titleLabel = cc.Sprite:createWithSpriteFrameName("kickshrew_challengeMatch_countdownBox_label_title.png")
	self._countdownBg:addChild(titleLabel)
	titleLabel:setPosition(bgSize.width * 0.5, bgSize.height * 0.69)

	local lastTimeLabel = cc.Sprite:createWithSpriteFrameName("kickshrew_challengeMatch_countdownBox_label_lastTime.png")
	self._countdownBg:addChild(lastTimeLabel)
	lastTimeLabel:setPosition(bgSize.width * 0.27, bgSize.height * 0.385)


	self._hourUnit100Sprite = cc.Sprite:createWithSpriteFrameName("kickshrew_challengeMatch_countdownBox_num/0.png")
    self._hourUnit10Sprite = cc.Sprite:createWithSpriteFrameName("kickshrew_challengeMatch_countdownBox_num/0.png")
    self._minuteUnit10Sprite = cc.Sprite:createWithSpriteFrameName("kickshrew_challengeMatch_countdownBox_num/0.png")
    self._secondUnit10Sprite = cc.Sprite:createWithSpriteFrameName("kickshrew_challengeMatch_countdownBox_num/0.png")
    self._hourUnit1Sprite = cc.Sprite:createWithSpriteFrameName("kickshrew_challengeMatch_countdownBox_num/0.png")
    self._minuteUnit1Sprite = cc.Sprite:createWithSpriteFrameName("kickshrew_challengeMatch_countdownBox_num/0.png")
    self._secondUnit1Sprite = cc.Sprite:createWithSpriteFrameName("kickshrew_challengeMatch_countdownBox_num/0.png")
    local hourColon = cc.Sprite:createWithSpriteFrameName("kickshrew_challengeMatch_countdownBox_num/colon.png")
    local minuteColon = cc.Sprite:createWithSpriteFrameName("kickshrew_challengeMatch_countdownBox_num/colon.png")

    local timeUnitW = self._hourUnit10Sprite:getContentSize().width
    local timeUnitH = self._hourUnit10Sprite:getContentSize().height
    local offsetW = timeUnitW * 0.5

    self._startPx = bgSize.width* 0.52
    local py = bgSize.height * 0.37

    self._hourUnit100Sprite:setPosition(self._startPx - timeUnitW, py)
    self._hourUnit10Sprite:setPosition(self._startPx ,py)
    self._hourUnit1Sprite:setPosition(self._startPx + timeUnitW,py)
    hourColon:setPosition(self._startPx + timeUnitW*1.75,py)
    self._minuteUnit10Sprite:setPosition(self._startPx + timeUnitW*2.5 ,py)
    self._minuteUnit1Sprite:setPosition(self._startPx + timeUnitW*3.5 ,py)
    minuteColon:setPosition(self._startPx + timeUnitW*4.25,py)
    self._secondUnit10Sprite:setPosition(self._startPx + timeUnitW*5 ,py)
    self._secondUnit1Sprite:setPosition(self._startPx + timeUnitW*6 ,py)

    self._countdownBg:addChild(self._hourUnit100Sprite)
    self._hourUnit100Sprite:setVisible(false)
    self._countdownBg:addChild(self._hourUnit10Sprite)
    self._countdownBg:addChild(self._hourUnit1Sprite)
    self._countdownBg:addChild(hourColon)
    self._countdownBg:addChild(self._minuteUnit10Sprite)
    self._countdownBg:addChild(self._minuteUnit1Sprite)
    self._countdownBg:addChild(minuteColon)
    self._countdownBg:addChild(self._secondUnit10Sprite)
    self._countdownBg:addChild(self._secondUnit1Sprite)


end



function ChallengeMatchCountdown:showCountdownLargeView()
    self._largeNum = cc.Sprite:createWithSpriteFrameName("kickshrew_challengeMatch_countdownBox_num_large/5.png")
    self:addChild(self._largeNum)
    self._largeNum:setPosition(self._winSize.width * 0.5, self._winSize.height * 0.5)
    self._largeNum:setVisible(false)
    
end

function ChallengeMatchCountdown:buttonClick(ref, type)
    if type == ccui.TouchEventType.ended then
        if ref == self._btn_back then
            self._callback("goMatchRoom")
        end
    end
    
end

function ChallengeMatchCountdown:addButton()
    self._btn_back = ccui.Button:create("kickshrew_challengeMatch_countdownBox_btn_back.png","kickshrew_challengeMatch_countdownBox_btn_back_down.png",nil,1)
    self._btn_back:addTouchEventListener(handler(self,self.buttonClick))
    self._btn_back:setPosition(self._winSize.width * 0.9, self._winSize.height * 0.9)
    self:addChild(self._btn_back)
end

function ChallengeMatchCountdown:updateCountdown(seconds)

    self._seconds = seconds 

end

function ChallengeMatchCountdown:updateDeltaTime()

    self._seconds = self._seconds - 1   
    if self._seconds < 0 then
        scheduler.unscheduleGlobal(self._timeHandle)
        --倒计时结束比赛开始
        self._callback("countdown")
    	return
    end
    self:arithmeticDeltaTime(self._seconds)
    if self._seconds < 6 and self._seconds > 0 then
        self._countdownBg:setVisible(false)
        self._largeNum:setVisible(true)
        self:updateTimeSpriteLarge(self._seconds)
    end
end

function ChallengeMatchCountdown:removeTimeHandle()

    scheduler.unscheduleGlobal(self._timeHandle)

end

function ChallengeMatchCountdown:arithmeticDeltaTime(secondSum)


    if secondSum >= 3600 then
        local hour = math.floor(secondSum/3600)
        self._hourUnit100 = math.floor(hour/100)
        self._hourUnit10 = math.floor(hour%100/10)
        self._hourUnit1 = hour%10

        local minutes = secondSum%3600/60
        local minute = math.floor(minutes)
        self._minuteUnit10 = math.floor(minute/10)
        self._minuteUnit1 = minute%10

        local second = secondSum%3600%60
        self._secondUnit10 = math.floor(second/10)
        self._secondUnit1 = second%10

    elseif secondSum >= 60 and secondSum < 3600 then
        local minutes = secondSum%3600
        local minute = math.floor(minutes/60)
        self._minuteUnit10 = math.floor(minute/10)
        self._minuteUnit1 = minute%10

        local second = minutes%60
        self._secondUnit10 = math.floor(second/10)
        self._secondUnit1 = second%10
    elseif secondSum < 60 then
        self._secondUnit10 = math.floor(secondSum/10)
        self._secondUnit1 = secondSum%10
    end
    

    self:updateDeltaTimeSprite()

end


function ChallengeMatchCountdown:updateTimeSprite(timeSprite, timeIndex)
    local file = string.format("kickshrew_challengeMatch_countdownBox_num/%d.png",timeIndex)
    timeSprite:setSpriteFrame(file)
end


function ChallengeMatchCountdown:updateDeltaTimeSprite()
    self:updateTimeSprite(self._hourUnit100Sprite, self._hourUnit100)
    if self._hourUnit100 ~= 0 then self._hourUnit100Sprite:setVisible(true) end 
    self:updateTimeSprite(self._hourUnit10Sprite, self._hourUnit10);
    self:updateTimeSprite(self._hourUnit1Sprite, self._hourUnit1);
    self:updateTimeSprite(self._minuteUnit10Sprite, self._minuteUnit10);
    self:updateTimeSprite(self._minuteUnit1Sprite, self._minuteUnit1);
    self:updateTimeSprite(self._secondUnit10Sprite, self._secondUnit10);
    self:updateTimeSprite(self._secondUnit1Sprite, self._secondUnit1);
end

function ChallengeMatchCountdown:updateTimeSpriteLarge(timeIndex)
    local file = string.format("kickshrew_challengeMatch_countdownBox_num_large/%d.png",timeIndex)
    self._largeNum:setSpriteFrame(file)

    local toBig = cc.ScaleTo:create(0.3, 2.0)
    local toSmall = cc.ScaleTo:create(0.3, 0.5)
    local toNor = cc.ScaleTo:create(0.3, 1)
    self._largeNum:runAction(cc.Sequence:create(toBig,toSmall,toNor))
end

return ChallengeMatchCountdown