--[[
用户信息类
@author lsd
]]

local PlayerInfo = class("PlayerInfo", common.view.BaseView)

function PlayerInfo:ctor()
  
    self:init()     
end

function PlayerInfo:init()
    
    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("res/common/avatarlist1.plist")
    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("res/common/avatarlist2.plist")           
    cc.SpriteFrameCache:getInstance():addSpriteFrames("res/common/avatarlist1.plist")
    cc.SpriteFrameCache:getInstance():addSpriteFrames("res/common/avatarlist2.plist")
    
    --设置 UI的轮廓尺寸
    self._winSize = cc.Director:getInstance():getWinSize()
    self._frameSize = cc.size(self._winSize.width,self._winSize.height)
    self:setContentSize(self._frameSize)
    
    self:createUserInfoFrame()
    self:createMoneyFrame()
    self:createAngryHammerFrame()
    
    --在4：3的分辨率下，素材放到后占满屏幕，适当缩小
    if self._winSize.height == 768 then
    
        local mArray = self:getChildren()
        
        for key, var in ipairs(mArray) do
            var:setScale(0.9)
        end
                
        self._playerFrame:setScale(0.9)
        self._userNameBar:setPositionX(self._userNameBar:getPositionX() * 0.9)
        self._levelBarBg:setPositionX(self._levelBarBg:getPositionX() * 0.9)
        self._hpBarBg:setPositionX(self._hpBarBg:getPositionX() * 0.9)
        self._faceSprite:setScale(1.15)
    end
        
end

function PlayerInfo:onExit()

    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("res/common/avatarlist1.plist")
    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("res/common/avatarlist2.plist")
    
end

--[[
初始化头像框及周边界面
--]]
function PlayerInfo:createUserInfoFrame()
    
    --用户头像外框
    self._playerFrame = cc.Sprite:createWithSpriteFrameName("playerInfo/game_faceFrame.png")
    local nx = self._playerFrame:getContentSize().width * 0.55
    local ny = self._frameSize.height - self._playerFrame:getContentSize().height * 0.5 
    self._playerFrame:setPosition(cc.p(nx, ny))
    self:addChild(self._playerFrame)
    
    --设置头像，默认，影子头像
    self._faceSprite = cc.Sprite:createWithSpriteFrameName("playerInfo/game_face_default.png")
    nx = self._playerFrame:getContentSize().width * 0.5
    ny = self._playerFrame:getContentSize().height * 0.5 
    self._faceSprite:setPosition(cc.p(nx, ny))
    self._playerFrame:addChild(self._faceSprite, self._playerFrame:getLocalZOrder() - 1)
    self._faceSprite:setScale(1.15)
    
    --用户名 背景框
    self._userNameBar = cc.Sprite:createWithSpriteFrameName("playerInfo/player_name_frameBg.png")
    nx = self._playerFrame:getContentSize().width * 0.88 + self._userNameBar:getContentSize().width * 0.5  
    ny = self._playerFrame:getContentSize().height * 0.76 
    self._userNameBar:setPosition(cc.p(nx, ny))
    self._playerFrame:addChild(self._userNameBar, self._playerFrame:getLocalZOrder() - 2)
    
    --体力、血条 背景框
    self._hpBarBg = cc.Sprite:createWithSpriteFrameName("playerInfo/game_power_0.png")
    nx = self._playerFrame:getContentSize().width * 0.88 + self._hpBarBg:getContentSize().width * 0.5  
    ny = self._playerFrame:getContentSize().height * 0.45 
    self._hpBarBg:setPosition(cc.p(nx, ny))
    self._playerFrame:addChild(self._hpBarBg, self._playerFrame:getLocalZOrder() - 2)
    
    --HP文字
    self._hpLab = cc.LabelTTF:create("HP", "Arial", self._hpBarBg:getContentSize().height * 0.55)
    nx = self._hpBarBg:getContentSize().width * 0.3  
    ny = self._hpBarBg:getContentSize().height * 0.5
    self._hpLab:setPosition(cc.p(nx, ny))
    self._hpBarBg:addChild(self._hpLab, 100)
    
    --经验条 背景
    self._levelBarBg = cc.Sprite:createWithSpriteFrameName("playerInfo/game_level_0.png")
    nx = self._playerFrame:getContentSize().width * 0.88 + self._levelBarBg:getContentSize().width * 0.5  
    ny = self._playerFrame:getContentSize().height * 0.21 
    self._levelBarBg:setPosition(cc.p(nx, ny))
    self._playerFrame:addChild(self._levelBarBg, self._playerFrame:getLocalZOrder() - 2)
    local proxy = myAppFacade:retrieveProxy(common.model.GlobalProxy.NAME)
    local roomId = proxy._currentRoom.roomId
    local delayTime = 0
    if roomId == 61011 then
        self._levelBarBg:setVisible(false)
        self._hpBarBg:setVisible(false)
    end
end

--[[
初始化银子框
--]]
function PlayerInfo:createMoneyFrame()

    --背景框
    self._moneyBarBg = cc.Sprite:createWithSpriteFrameName("playerInfo/player_money_frameBg.png")
    local nx = self._frameSize.width * 0.5  
    local ny = self._playerFrame:convertToWorldSpace(cc.p(self._userNameBar:getPositionX(),self._userNameBar:getPositionY())).y
 
    self._moneyBarBg:setPosition(cc.p(nx, ny))
    self:addChild(self._moneyBarBg)
    
    --银子icon
    local silverIcon = cc.Sprite:createWithSpriteFrameName("playerInfo/game_money_icon.png")
    nx = silverIcon:getContentSize().width * 0.66
    ny = self._moneyBarBg:getContentSize().height * 0.5
    silverIcon:setPosition(cc.p(nx, ny))
    self._moneyBarBg:addChild(silverIcon)
    
end


--[[
初始化雷神锤信息框
--]]
function PlayerInfo:createAngryHammerFrame()

    --背景框
    self._angryBarBg = cc.Sprite:createWithSpriteFrameName("playerInfo/game_hammer99_famerBg.png")
    local nx = self._frameSize.width * 0.75
    local ny = self._playerFrame:convertToWorldSpace(cc.p(self._userNameBar:getPositionX(),self._userNameBar:getPositionY())).y
    self._angryBarBg:setPosition(cc.p(nx, ny))
    self:addChild(self._angryBarBg)
    
    --锤子图标
    local angryHammer = cc.Sprite:createWithSpriteFrameName("hammer/hammer_99.png")
    nx = angryHammer:getContentSize().width * 0.7
    ny = self._angryBarBg:getContentSize().height * 0.5
    angryHammer:setPosition(cc.p(nx, ny))
    self._angryBarBg:addChild(angryHammer)
    
    --锤子图标默认位置
    self._angryHammerDefPos = self._angryBarBg:convertToWorldSpace(cc.p(angryHammer:getPositionX(),angryHammer:getPositionY()))
    --分母不变
    local angry_1000 = cc.LabelTTF:create(" / 1000", "Arial", self._hpBarBg:getContentSize().height * 0.55)
    local angry_1000_px = self._angryBarBg:getContentSize().width * 0.55
    nx = angry_1000_px + angry_1000:getContentSize().width * 0.5
    ny = self._angryBarBg:getContentSize().height * 0.5
    angry_1000:setPosition(cc.p(nx, ny))
    self._angryBarBg:addChild(angry_1000)
        
    --分子
    self._angryBar = cc.LabelTTF:create("0", "Arial", self._hpBarBg:getContentSize().height * 0.55)
    self._angryBar:setColor(cc.c3b(221, 161, 31))
    nx = angry_1000_px - self._angryBar:getContentSize().width * 0.5
    ny = self._angryBarBg:getContentSize().height * 0.5
    self._angryBar:setPosition(cc.p(nx, ny))
    self._angryBarBg:addChild(self._angryBar)
end


--[[
更新 用户头像
@param faceID  number类型   头像ID
--]]
function PlayerInfo:updateFace(faceID)
    
    if faceID ~= 0 then
        if faceID <= 0 or faceID > 133 then
            faceID = 1
        end

        local faceId1 = math.floor(faceID / 10)
        local faceId2 = faceID % 10

        local faceIdTmp = string.format("avatar/%d%d.png",faceId1,faceId2)
        
        if self._faceSprite ~= nil then
            self._faceSprite:setSpriteFrame(faceIdTmp)
        end
        
    end
    
end

--[[
更新用户名
@param userName  string类型   用户名
--]]
function PlayerInfo:updateUserName(userName)

    if self._userName == nil then
        self._userName = cc.LabelTTF:create("", "Arial", self._userNameBar:getContentSize().height * 0.55)
        self._userNameBar:addChild(self._userName)
    end
 
    local nx = self._userNameBar:getContentSize().width * 0.5
    local ny = self._userNameBar:getContentSize().height * 0.5
    self._userName:setPosition(cc.p(nx, ny))

    self._userName:setString(userName)
end


--[[
更新 等级分文字
@param userlevel  string类型 等级分 如：Lv.3
--]]
function PlayerInfo:updateLevelNum(userLevel)

    if self._levelNum == nil then
        self._levelNum = cc.LabelTTF:create("", "Arial", self._hpBarBg:getContentSize().height * 0.55)
        self._levelBarBg:addChild(self._levelNum, 2)
    end
    
    local nx = self._hpLab:getPositionX() - self._hpLab:getContentSize().width * 0.5
    local ny = self._levelBarBg:getContentSize().height * 0.5
    self._levelNum:setPosition(cc.p(nx, ny))
    
    self._levelNum:setString(userLevel) 
end

--[[
更新 愤怒值
@param angryScore  number类型 愤怒值 
--]]
function PlayerInfo:updateAngryBar(angryScore)

    if self._angryBar ~= nil then

        local temp = string.format("%d",angryScore%1000)
        self._angryBar:setString(temp)
        
        local angry_1000_px = self._angryBarBg:getContentSize().width * 0.55
        local nx = angry_1000_px - self._angryBar:getContentSize().width * 0.5
        local ny = self._angryBarBg:getContentSize().height * 0.5
        self._angryBar:setPosition(cc.p(nx, ny))
    end

end

--[[
更新 银子数
@param money  number类型  银子数 
--]]
function PlayerInfo:updateMoneyBar(money)

    if self._moneyBar == nil then
        self._moneyBar = cc.LabelTTF:create("", "Arial", self._moneyBarBg:getContentSize().height * 0.55)
        self._moneyBarBg:addChild(self._moneyBar)
    end

    local nx = self._moneyBarBg:getContentSize().width * 0.52
    local ny = self._moneyBarBg:getContentSize().height * 0.5
    self._moneyBar:setPosition(cc.p(nx, ny))
    self._moneyBar:setString(string.formatnumberthousands(money))

end

--[[
更新 体力值
@param power     number类型  当前体力值 
@param powerTop  number类型  满体力值
--]]
function PlayerInfo:updateHPBar(power, powerTop)

    if self._hpBar == nil then
        local sprite = cc.Sprite:createWithSpriteFrameName("playerInfo/game_power_1.png")
        self._hpBar = cc.ProgressTimer:create(sprite)
    	self._hpBar:setMidpoint(cc.p(0, 0.5))
    	self._hpBar:setBarChangeRate(cc.p(1, 0)) --设置进度条的长度和高度开始变化的大小
    	self._hpBar:setType(cc.PROGRESS_TIMER_TYPE_BAR) --设置进度条为水平
    	self._hpBarBg:addChild(self._hpBar)
    	
    end
    
    local nx = self._hpBarBg:getContentSize().width * 0.5
    local ny = self._hpBarBg:getContentSize().height * 0.5
    self._hpBar:setPosition(nx, ny)
    
    local prcentage = (power / powerTop) * 100
    self._hpBar:setPercentage(prcentage)
        
end


--[[
更新 等级分进度条
@param levelScore  number类型  等级分
--]]
function PlayerInfo:updateLevelBar(levelScore)

    if self._levelBar == nil then
        local sprite = cc.Sprite:createWithSpriteFrameName("playerInfo/game_level_1.png")
        self._levelBar = cc.ProgressTimer:create(sprite)
        self._levelBar:setMidpoint(cc.p(0, 0.5))
        self._levelBar:setBarChangeRate(cc.p(1, 0)) --设置进度条的长度和高度开始变化的大小
        self._levelBar:setType(cc.PROGRESS_TIMER_TYPE_BAR) --设置进度条为水平
        self._levelBarBg:addChild(self._levelBar)

    end

    local nx = self._levelBarBg:getContentSize().width * 0.5
    local ny = self._levelBarBg:getContentSize().height * 0.5
    self._levelBar:setPosition(nx, ny)
    
    local prcentage = self:getLevelPer(levelScore)
    self._levelBar:setPercentage(prcentage)

end

--[[
计算 等级分 百分比
@param levelScore  number类型  等级分
--]]
function PlayerInfo:getLevelPer(levelScore)
    local preLv = 0
    local level
    local maxLevel
    
    for level = 1, 100 do
        preLv = preLv + 1
        maxLevel = 50 * level * level - 1
        if maxLevel >= levelScore then
        	break
        end
    end
    
    if levelScore > 499999 then
        for level = 101, 200 do
            preLv = preLv + 1
            maxLevel = maxLevel + (50 * level * level - 1)
            if maxLevel >= levelScore then
                break
            end
        end
    end
    
    local preLevelScore = levelScore - (50 * (preLv - 1) * (preLv - 1) - 1)
    local preMaxLevel = maxLevel - (50 * (preLv - 1) * (preLv - 1) - 1)
    local ret = (preLevelScore / preMaxLevel) * 100

    --更新等级
    Log.i("preLv:",preLv)
    local temp = string.format("Lv.%d",preLv)
    self:updateLevelNum(temp)
    
    return ret
end

--[[
显示雷神锤动画
--]]
function PlayerInfo:showAngryHammerBigAction()
    
    --雷神锤动画背景
    self._angryHammerBig = cc.Sprite:createWithSpriteFrameName("hammer/hammer_big_99.png")
    self._angryHammerBig:setPosition(cc.p(self._frameSize.width * 0.5, self._frameSize.height * 0.5))
    self:addChild(self._angryHammerBig)
    
    --动画
    local animFrames = {}    
    for i = 1, 9 do
        local resName = string.format("kickshrew_treasure_hammereffect_%d.png", i)
        local pFrame = cc.SpriteFrameCache:getInstance():getSpriteFrame(resName)
        animFrames[i] = pFrame
    end
    
    local actionSprite = cc.Sprite:createWithSpriteFrame(animFrames[1])
    actionSprite:setPosition(cc.p(self._angryHammerBig:getContentSize().width * 0.5, self._angryHammerBig:getContentSize().height * 0.5))
    self._angryHammerBig:addChild(actionSprite)
    
    local animation = cc.Animation:createWithSpriteFrames(animFrames, 0.05)--这里定义了每一帧，和动画的间隔时间
    local animate = cc.Animate:create(animation)--这里创建了动画的Action  
    local seq = cc.Sequence:create(animate,cc.CallFunc:create(handler(self, self.removeAngryHammerBigActionBack)))
    actionSprite:runAction(seq)
    
end

--[[
移除雷神锤动画背景
--]]
function PlayerInfo:removeAngryHammerBigActionBack()
    
    if self._angryHammerBig ~= nil then
    	self._angryHammerBig:removeAllChildrenWithCleanup(true)
    	
        local px = self._angryHammerDefPos.x - self._angryHammerBig:getPositionX()
        local py = self._angryHammerDefPos.y - self._angryHammerBig:getPositionY()
        local moveBy = cc.MoveBy:create(0.5, cc.p(px, py))
        local scaleBy = cc.ScaleBy:create(0.5, 0.3)
        --动画结束后，回调函数
        local acts = cc.Sequence:create(moveBy, scaleBy, cc.CallFunc:create(handler(self,self.respondCallBack)))
        self._angryHammerBig:runAction(acts)
    end
       
end

--[[
移除雷神之锤 展示的大锤子
--]]
function PlayerInfo:removeAngryHammerBig()

     if self._angryHammerBig ~= nil then
        self._angryHammerBig:removeFromParent()
        self._angryHammerBig = nil
     end
end

--[[

--]]
function PlayerInfo:respondCallBack()

    --锤子不消失的补丁
    if self._angryHammerBig ~= nil and self._angryHammerBig:getPositionX() == self._frameSize.width * 0.5 then
        self._angryHammerBig:removeAllChildrenWithCleanup(true)
        self._angryHammerBig:setPosition(self._angryHammerDefPos)
        self._angryHammerBig:setScale(0.3)       
    end
    
    self:getParent()._notRespond = false
end

function PlayerInfo:setChallengeMatchView()
    self._moneyBarBg:setVisible(false)
    self._angryBarBg:setVisible(false)
end


return PlayerInfo