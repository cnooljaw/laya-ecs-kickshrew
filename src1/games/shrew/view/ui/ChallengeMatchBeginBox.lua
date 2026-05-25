--[[
挑战赛结算框
@anthor pjchow
@date 15-11-10
]]
local ChallengeMatchBeginBox = class("ChallengeMatchBeginBox", function()
	return cc.Sprite:create()
end)

function ChallengeMatchBeginBox:ctor(callback)
	self.callback = callback
	self._winSize = cc.Director:getInstance():getWinSize()
    
    --背景
    local  mask = cc.Sprite:create("tile_translucent_bk.png")
    mask:setTextureRect(cc.rect(0,0,self._winSize.width*2,self._winSize.height*2))
    -- mask:setAnchorPoint(0,0)
    self:addChild(mask)
    mask:getTexture():setTexParameters(0x2601, 0x2601, 0x812f, 0x812f) 
	self:initBeginBox()

    self:addButton()


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

function ChallengeMatchBeginBox:initBeginBox()
	self._bg = cc.Sprite:create("kickshrew_challengeMatch_beginBox_bg.png")
	self:addChild(self._bg)
    self._bgSize = self._bg:getBoundingBox()
    local titleLabel = cc.Sprite:createWithSpriteFrameName("kickshrew_challengeMatch_beginBox_label_title.png")
    self._bg:addChild(titleLabel)
    titleLabel:setPosition(self._bgSize.width * 0.5, self._bgSize.height - titleLabel:getBoundingBox().height)

    local px = self._bgSize.width * 0.27
    local startPy = self._bgSize.height * 0.76
    local rewardTable = {} 
    local rewardMoneyTable = {2000, 1000, 400, 250, 100} 
    for var = 1, 5 do
        rewardTable[var] = self:getRewardItem(var, rewardMoneyTable[var])
        rewardTable[var]:setPosition(px, startPy - (var - 1) * self._bgSize.height * 0.16)
        self._bg:addChild(rewardTable[var])
    end

    local matchInfoBg = cc.Sprite:createWithSpriteFrameName("kickshrew_challengeMatch_beginBox_frame_r.png")
    self._bg:addChild(matchInfoBg)
    local matchInfoBgSize = matchInfoBg:getBoundingBox()
    matchInfoBg:setPosition(self._bgSize.width * 0.75,self._bgSize.height * 0.44)
    local infoLabel = cc.Sprite:createWithSpriteFrameName("kickshrew_challengeMatch_beginBox_label_content.png")
    matchInfoBg:addChild(infoLabel)
    infoLabel:setPosition(matchInfoBgSize.width * 0.5, matchInfoBgSize.height * 0.65)

    local chanceCountBg = cc.Sprite:createWithSpriteFrameName("kickshrew_challengeMatch_beginBox_frame_lastCount.png")
    local chanceCountBgSize = chanceCountBg:getBoundingBox()
    chanceCountBg:setPosition(matchInfoBgSize.width * 0.5, matchInfoBgSize.height * 0.25)
    matchInfoBg:addChild(chanceCountBg)
    local slashIcon = cc.Sprite:createWithSpriteFrameName("kickshrew_challengeMatch_beginBox_label_slash.png")
    chanceCountBg:addChild(slashIcon)
    slashIcon:setPosition(chanceCountBgSize.width * 0.5, chanceCountBgSize.height * 0.5)
    self._chanceCountLast = cc.LabelBMFont:create("0","fonts/catchgold_add_number.fnt")
    self._chanceCountAll = cc.LabelBMFont:create("10","fonts/catchgold_add_number.fnt")
    chanceCountBg:addChild(self._chanceCountLast)
    chanceCountBg:addChild(self._chanceCountAll)
    self._chanceCountLast:setPosition(chanceCountBgSize.width * 0.25, chanceCountBgSize.height * 0.5)
    self._chanceCountAll:setPosition(chanceCountBgSize.width * 0.75, chanceCountBgSize.height * 0.5)
end


function ChallengeMatchBeginBox:buttonClick()
    self.callback("startMatch")
end

function ChallengeMatchBeginBox:addButton()

    local menu = cc.Menu:create()
    menu:setPosition(0,0)
    self:addChild(menu)
    local norLabel = cc.Sprite:createWithSpriteFrameName("kickshrew_challengeMatch_beginBox_label_btnUp.png")
    local selLabel = cc.Sprite:createWithSpriteFrameName("kickshrew_challengeMatch_beginBox_label_btnDown.png")
    local button_nor = cc.Sprite:createWithSpriteFrameName("kickshrew_challengeMatch_beginBox_btn_up.png")
    local button_sel = cc.Sprite:createWithSpriteFrameName("kickshrew_challengeMatch_beginBox_btn_down.png")
    local buttonSize = button_nor:getBoundingBox()
    button_nor:addChild(norLabel)
    button_sel:addChild(selLabel)
    norLabel:setPosition(buttonSize.width*0.5, buttonSize.height*0.5)
    selLabel:setPosition(buttonSize.width*0.5, buttonSize.height*0.5)
    self._playBtn = cc.MenuItemSprite:create(button_nor,button_sel)
    self._playBtn:registerScriptTapHandler(handler(self,self.buttonClick))
    self._playBtn:setPosition(0, - self._bgSize.height*0.5 - self._playBtn:getBoundingBox().height * 0.5)
    menu:addChild(self._playBtn)
end

function ChallengeMatchBeginBox:getRewardItem(index, reward)
    local rewardItem = cc.Sprite:createWithSpriteFrameName("kickshrew_challengeMatch_beginBox_frame_rank.png")
    local itemSize = rewardItem:getBoundingBox()
    local rankFile = string.format("kickshrew_challengeMatch_beginBox_label_rank%d.png", index)
    local rankLabel = cc.Sprite:createWithSpriteFrameName(rankFile)
    rankLabel:setAnchorPoint(cc.p(0, 0.5))
    rewardItem:addChild(rankLabel)
    rankLabel:setPosition(itemSize.width * 0.05, itemSize.height * 0.5)

    local rewardMoney = cc.LabelTTF:create(reward, "", itemSize.height * 0.35)
    rewardMoney:setColor(cc.c3b(96,64,7))
    rewardItem:addChild(rewardMoney)
    rewardMoney:setAnchorPoint(cc.p(0, 0.5))
    rewardMoney:setPosition(itemSize.width * 0.51, itemSize.height * 0.5)

    local unitLabel = cc.LabelTTF:create("银子", "", itemSize.height * 0.35)
    unitLabel:setColor(cc.c3b(96,64,7))
    rewardItem:addChild(unitLabel)
    unitLabel:setAnchorPoint(cc.p(0, 0.5))
    unitLabel:setPosition(itemSize.width * 0.76, itemSize.height * 0.5)

    return rewardItem
end


function ChallengeMatchBeginBox:updateChanceCount(lastCount, allCount)
    self._chanceCountLast:setString(lastCount)
    self._chanceCountAll:setString(allCount)
end


return ChallengeMatchBeginBox