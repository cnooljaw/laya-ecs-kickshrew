--[[
挑战赛结算框
@anthor pjchow
@date 15-09-18
]]
local ChallengeMatchGameOverBox = class("ChallengeMatchGameOverBox", function()
	return cc.Layer:create()
end)

function ChallengeMatchGameOverBox:ctor(callback)
	self.callback = callback
	self._winSize = cc.Director:getInstance():getWinSize()
    
	self:showGameOverBox()
    local function update()
        self:addButton()
    end

    local action = cc.Sequence:create(cc.DelayTime:create(2), cc.CallFunc:create(update))
    self:runAction(action)
	

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

function ChallengeMatchGameOverBox:showGameOverBox()
	self._bg = cc.Sprite:createWithSpriteFrameName("kickshrew_gameOverBox_bg.png")
    self._bg:setPosition(self._winSize.width * 0.5, self._winSize.height * 0.55)
	self:addChild(self._bg)
    self._bg:setScale(0.9)
	local titleStr = "恭喜"
    local contentStr = "\t\t您在30万金比赛中获得217名！\n特册表彰，以资鼓励！"
    local bgSize = self._bg:getBoundingBox()
    local labelSize = self._bg:getBoundingBox().height * 0.1
    local titleLabel = cc.LabelTTF:create(titleStr, "", labelSize)
    self._bg:addChild(titleLabel)
    titleLabel:setPosition(bgSize.width * 0.55 , bgSize.height * 0.63)

    self._contentLabel = cc.LabelTTF:create(contentStr, "", labelSize *0.8)
    self._bg:addChild(self._contentLabel)
    self._contentLabel:setContentSize(bgSize.width * 0.6, bgSize.height * 0.5)
    self._contentLabel:setPosition(bgSize.width * 0.55, bgSize.height * 0.4)
    self._contentLabel:setHorizontalAlignment(cc.TEXT_ALIGNMENT_LEFT)
end


function ChallengeMatchGameOverBox:buttonClick(ref, type)
    if type == ccui.TouchEventType.ended then
        if ref == self._continueBtn then
            self.callback("continueMatch")
        elseif ref == self._backBtn then
            self.callback("gameexit")
        end
    end
    
end

function ChallengeMatchGameOverBox:addButton()

    self._backBtn = ccui.Button:create("kickshrew_gameOverBox_btn_back.png","kickshrew_gameOverBox_btn_back_down.png",nil,1)
    self._backBtn:addTouchEventListener(handler(self,self.buttonClick))
    self._backBtn:setPosition(self._winSize.width*0.36,self._winSize.height*0.15)
    self:addChild(self._backBtn)
    self._backBtn:setScale(0.8)
    self._continueBtn = ccui.Button:create("kickshrew_gameOverBox_btn_continue.png","kickshrew_gameOverBox_btn_continue_down.png",nil,1)
    self._continueBtn:addTouchEventListener(handler(self,self.buttonClick))
    self._continueBtn:setPosition(self._winSize.width*0.64,self._winSize.height*0.15)
    self:addChild(self._continueBtn)
    self._continueBtn:setScale(0.8)
end


function ChallengeMatchGameOverBox:updateInfo(rank, reward, userName, matchName)

    local contentStr = string.format("\t\t您在%s中获得第%d名！\n特此表彰，以资鼓励！\n 奖励：%d银子", matchName, rank, reward)

    self._contentLabel:setString(contentStr)
    
end


return ChallengeMatchGameOverBox