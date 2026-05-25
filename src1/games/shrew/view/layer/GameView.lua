--[[
打地鼠游戏界面类
@author lsd
]]


local scheduler = require "network.scheduler"
local GameView = class("GameView",common.view.BaseView)

function GameView:ctor()

    GameView.super.ctor(self)
        
    self._winSize = cc.Director:getInstance():getWinSize()
    self._scalex = self._winSize.width/960
    self._scaley = self._winSize.height/640
     
    self._notRespond = false        --处理雷神之锤出现是 鼠标点击响应开关
    self._hitTable  = true     
    self._mapType = shrewData.Map.None
    self._combo = 0
    self._comboID = 0      
    
    --初始锤子类型
    local preHammerID = cc.UserDefault:getInstance():getIntegerForKey(AppMacros.shrew.preHammerID)
    if preHammerID == 0 then
        preHammerID = 1
    end
    self._preHammerType = preHammerID 

    Log.i("self._preHammerType",self._preHammerType)

    local GameProxy = myAppFacade:retrieveProxy(shrew.model.GameProxy.NAME) 
    GameProxy._hammerType =  self._preHammerType
    

end

function GameView:init()
  
    --背景音乐
    sound.playBackgroundMusic(SoundRes.shrew.backgroundMusic) 

    --用户信息界面
    self._playerinfo = shrew.view.PlayerInfo.new()
    self:addChild(self._playerinfo,100)

    --锤子列表    
    self._hammerListView = shrew.view.HammerListView.new(handler(self,self.onViewClickCallBack))
    self:addChild(self._hammerListView,100)

    --初始化老鼠洞
    self:initHole()
    
    --左侧弹出框
    self._gameInfoTableView = shrew.view.GameInfoTableView.new(handler(self,self.onViewClickCallBack))
    self:addChild(self._gameInfoTableView,300)

    --初始化红包
    self:initRedPacket()
    
    --初始化打击的锤子
    local preHammerID = cc.UserDefault:getInstance():getIntegerForKey(AppMacros.shrew.preHammerID)
    if preHammerID == 0 then
        preHammerID = 1
    end
    local fileName = string.format("hammer/hammer_big_%d.png",preHammerID)
    self._touchHammerSprite = cc.Sprite:createWithSpriteFrameName(fileName)
    self._touchHammerSprite:setScale(1.1)
    self._touchHammerSprite:setVisible(false)
    self._touchHammerSprite:setAnchorPoint(cc.p(0.75,0.15))
    self:addChild(self._touchHammerSprite, 200)
    
    --鼠标消息
    self:addTouchControl()
    
            
end

--初始化红包
function GameView:initRedPacket()
    self._btnRedPacket = ccui.Button:create()
    self._btnRedPacket:ignoreContentAdaptWithSize(false)
    if(os.date("%m") == "10" and tonumber(os.date("%d")) >= 1 and tonumber(os.date("%d")) <= 7) then
        self._btnRedPacket:loadTextureNormal("redpacket/October1st_redpacket_small.png",0)
        self._btnRedPacket:loadTexturePressed("redpacket/October1st_redpacket_small.png",0)
        self._btnRedPacket:loadTextureDisabled("redpacket/October1st_redpacket_small.png",0)
        Log.i("十一")
    else
        self._btnRedPacket:loadTextureNormal("redpacket/redpacket_small.png",0)
        self._btnRedPacket:loadTexturePressed("redpacket/redpacket_small.png",0)
        self._btnRedPacket:loadTextureDisabled("redpacket/redpacket_small.png",0)
        Log.i("不是十一")
    end
    self._btnRedPacket:addTouchEventListener(handler(self,self.onRedPacketCallBack))


    self._btnRedPacket:setPosition(self._winSize.width-100,self._winSize.height-260)
    self:addChild(self._btnRedPacket,100)
    
    self._btnRedPacket:setVisible(false)

end

--显示红包
function GameView:showRedPacketBtn()
    self._btnRedPacket:setVisible(true)
    local function hide(dt)
        self._btnRedPacket:setVisible(false)
    end
    scheduler.performWithDelayGlobal(hide, 2)
end

--点击红包回调
function GameView:onRedPacketCallBack(ref, type)
    if type == ccui.TouchEventType.ended then
        if ref == self._btnRedPacket then
            Log.i("我点击到了")           
            self:onViewClickCallBack({"redpacket"})
        end
    end
end

--显示已抢完
function GameView:showRedpacketGrabed()
    self._btnRedPacket:setVisible(false)

    local redpacketGrab
    if(os.date("%m") == "10" and tonumber(os.date("%d")) >= 1 and tonumber(os.date("%d")) <= 7) then
         redpacketGrab = cc.Sprite:create("redpacket/October1st_redpacket_grab.png")
    else
         redpacketGrab = cc.Sprite:create("redpacket/redpacket_grab.png")
    end


    redpacketGrab:setPosition(self._btnRedPacket:getPosition())
    self:addChild(redpacketGrab,100)

    local function update(dt)
        if redpacketGrab or self._scheduler then
            redpacketGrab:removeFromParent()
            redpacketGrab = nil
        end
    end
    
    --已抢完显示的时间    暂定3秒
    scheduler.performWithDelayGlobal(update, 2)
    --self._scheduler = scheduler.scheduleGlobal(update, 3)
end

--显示大红包
function GameView:showBigRedpacket(rewardType,result)
    self._btnRedPacket:setVisible(false)

    local bigRedpacket
    if(os.date("%m") == "10" and tonumber(os.date("%d")) >= 1 and tonumber(os.date("%d")) <= 7) then
        bigRedpacket = cc.Sprite:create("redpacket/October1st_redpacket_big.png")
    else
        bigRedpacket = cc.Sprite:create("redpacket/redpacket_big.png")
    end

    bigRedpacket:setPosition(self._winSize.width/2,self._winSize.height*0.28)
    self:addChild(bigRedpacket,100)

    local function open(dt)
        bigRedpacket:removeFromParent()
        bigRedpacket = nil
        self:openRedpacket(rewardType,result)
    end

    scheduler.performWithDelayGlobal(open, 1)
end

--打开红包
function GameView:openRedpacket(rewardType,result)
    local openRedpacket
    if(os.date("%m") == "10" and tonumber(os.date("%d")) >= 1 and tonumber(os.date("%d")) <= 7) then
        openRedpacket = cc.Sprite:create("redpacket/October1st_redpacket_open.png")
    else
        openRedpacket = cc.Sprite:create("redpacket/redpacket_open.png")
    end


    openRedpacket:setAnchorPoint(0.5,0.33)
    openRedpacket:setPosition(self._winSize.width/2,self._winSize.height*0.28)
    self:addChild(openRedpacket,100)

    local opensize = openRedpacket:getContentSize()
    local reward = cc.Sprite:create("redpacket/silver.png")
    reward:setPosition(opensize.width*0.497,opensize.height*0.598)
    openRedpacket:addChild(reward)

    local multiply = cc.Sprite:create("redpacket/timessign.png")
    multiply:setPosition(opensize.width*0.370,opensize.height*0.761)
    openRedpacket:addChild(multiply)

    local number = ccui.TextAtlas:create(tostring(result),
													"redpacket/number.png",
													40,
													55,
													".")
    number:setAnchorPoint(0,0.5)
    number:setPosition(opensize.width*0.423,opensize.height*0.761)
    openRedpacket:addChild(number)
    
    if rewardType == 16 then

    end



    local function remove(dt)
        openRedpacket:removeFromParent()
        openRedpacket = nil
    end

    scheduler.performWithDelayGlobal(remove, 1.5)

end

function GameView:onExit()

    sound.stopBackgroundMusic()
    scheduler.unscheduleGlobal(self._handle)
end

--[[
初始化老鼠洞
--]]
function GameView:initHole()

    self._hole = self._hole or {}  
    for i = 1, 9 do
        if self._hole[i] == nil then
            self._hole[i] = cc.Sprite:create()
        end      
    end
end


--[[
随机出地鼠
--]]
function GameView:showRandShrew(map_type)
    
     for i = 1, #self._hole do
        local tempShrew = self:generateRandShrew(map_type)
        self._hole[i]:addChild(tempShrew, 0, 1)
     end
     
    self._handle = scheduler.scheduleGlobal(handler(self,self.refreshShrew), 0.2)    
end

--[[
根据地图类型，随机出地鼠
--]]
function GameView:generateRandShrew(map_type)

    math.newrandomseed()
    local shrewType = math.random(shrewData.Type.red, shrewData.Type.green)

    local tempShrew
    if shrewType == shrewData.Type.red then
        tempShrew = shrew.view.RedShrew.new(shrewType, map_type)

    elseif shrewType == shrewData.Type.blue then
        tempShrew = shrew.view.BlueShrew.new(shrewType, map_type)

    elseif shrewType == shrewData.Type.yellow then
        tempShrew = shrew.view.YellowShrew.new(shrewType, map_type)

    elseif shrewType == shrewData.Type.green then
        tempShrew = shrew.view.GreenShrew.new(shrewType, map_type)

    end
    return tempShrew
end

--[[
 刷新地鼠 
--]]
function GameView:refreshShrew()
    
    for i = 1, 9 do
       
       if self._hole[i] ~= nil then
       
            local shrew = self._hole[i]:getChildByTag(1)

            if shrew and shrew._shrewAction == shrewData.Action.Refresh then
        
                self._hole[i]:removeChildByTag(1)
                local newShrew = self:generateRandShrew(self._mapType)
                self._hole[i]:addChild(newShrew,0,1)   
                newShrew:setCanSeeViewRect()    
            end
       end
   
    end      
  
end

--[[
 显示雷神锤
--]]
function GameView:showAngryHammer()
    
    if self._notRespond == false then
    self._notRespond = true
    self._playerinfo:showAngryHammerBigAction()   	
    end
end


function GameView:showAngryHammerMovie()
   
    local animFrames = {}
    for i = 1, 5 do
        local resName = string.format("kickshrew_angry_hammer_effect_%d.png",i)
        local pFrame = cc.SpriteFrameCache:getInstance():getSpriteFrame(resName)
        animFrames[i] = pFrame
    end

    self._angryHammerSprite = cc.Sprite:createWithSpriteFrame(animFrames[1]) 
    self._angryHammerSprite:setPosition(self._endPoint.x, self._endPoint.y)
    self:addChild(self._angryHammerSprite, 30)


    local animation = cc.Animation:createWithSpriteFrames(animFrames, 0.2) --这里定义了每一帧，和动画的间隔时间
    local animate = cc.Animate:create(animation) --这里创建了动画的Action
    local seq = cc.Sequence:create(animate, cc.CallFunc:create(handler(self, self.showAngryHitBack)))  
    self._angryHammerSprite:runAction(seq)
    
end


function GameView:showAngryHitBack()

    self._angryHammerSprite:removeFromParent()
    self._angryHammerSprite = nil
    self._playerinfo:removeAngryHammerBig()
    self:removeTouchHammer()
    
    --还原 原来的锤子类
    local fileName = string.format("hammer/hammer_big_%d.png",self._preHammerType)
    self._touchHammerSprite:setSpriteFrame(fileName)
    
   
end


function GameView:removeTouchHammer()

    self._touchHammerSprite:setVisible(false)
    self._hitTable = true
end


--[[
鼠标事件
--]]
function GameView:addTouchControl()
  
    local  function onTouchBegan(touch, event)
        self._startPoint = touch:getLocation()
        
        if self:isTouchInRect(self._startPoint, self._gameInfoTableView._tableBg) then
            self._touchHammerSprite:setVisible(false)
                      
        elseif self:isTouchInRect(self._startPoint, self._hammerListView._hammerList._mHammerListBg) then
            self._touchHammerSprite:setVisible(false)
                       
        else
        
            if self._notRespond == false then
            
                if self._hitTable then
                    if self._playerinfo._angryHammerBig then
                        self._touchHammerSprite:setSpriteFrame("hammer/hammer_big_99.png")
                    end
                    
                    local px = self._startPoint.x + self._touchHammerSprite:getBoundingBox().width * 0.65
                    local py = self._startPoint.y + self._touchHammerSprite:getBoundingBox().height * 0.15
                    self._touchHammerSprite:setPosition(px, py)
                    self._touchHammerSprite:setVisible(true)
                    
                end
                        	
            end
     
        end
       
        return true
    end



    local function onTouchEnded(touch, event)
        self._endPoint = touch:getLocation()
        

        if self:isTouchInRect(self._startPoint, self._hammerListView._hammerList._mHammerListBg) then 
            self._touchHammerSprite:setVisible(false)
    
        elseif self:isTouchInRect(self._startPoint, self._gameInfoTableView._tableBg) then 
            self._touchHammerSprite:setVisible(false)
     
        else
                --收起锤子列表
                if self._hammerListView:isClosed() == false then
                	self._hammerListView:onClickPreHammer()
                end
                
                --播放锤子动画
                if self._notRespond == false then
                	
                    if self._hitTable == true then
                        local px = self._endPoint.x + self._touchHammerSprite:getBoundingBox().width * 0.65
                        local py = self._endPoint.y + self._touchHammerSprite:getBoundingBox().height * 0.15
                        self._touchHammerSprite:setPosition(px, py)
                        self._touchHammerSprite:setVisible(true)
                        
                        --摇摆动画
                        if  self._playerinfo._angryHammerBig ~= nil then
                           
                            self._hitTable = false
                            self._touchHammerSprite:setSpriteFrame("hammer/hammer_big_99.png")
    
                            local rotate1 = cc.RotateBy:create(0.04, 80)
                            local rotate2 = cc.RotateBy:create(0.08, -90)
                            local rotate3 = cc.RotateBy:create(0.04, 10)
                       
                            local seq = cc.Sequence:create(rotate1, rotate2, rotate3, cc.CallFunc:create(handler(self, self.showAngryHammerMovie)))  
                            self._touchHammerSprite:runAction(seq)
                            
                            --发包
                            self:doAngryLogic()
                            return true
                        else
                          
                            self._hitTable = false
                            local rotate1 = cc.RotateBy:create(0.08, 30)
                            local rotate2 = cc.RotateBy:create(0.08, -30)
                            local rotate3 = cc.RotateBy:create(0.08, 0)
    
                            local seq = cc.Sequence:create(rotate1, rotate2, rotate3, cc.CallFunc:create(handler(self, self.removeTouchHammer)))                        
                            self._touchHammerSprite:runAction(seq)
    
                        end
                        
                	end
                	
                    sound.playEffect(SoundRes.shrew.hitNull)              	
                    --播放 被击中地鼠的击打动画效果                   
                    for i = 1, #self._hole do

                        local shrew = self._hole[i]:getChildByTag(1)                            
                        if shrew and self._hole[i]:isVisible() then
                            --可敲击区域
                            local hitArea_x = shrew:convertToWorldSpace(cc.p(0,0)).x
                            local hitArea_y = shrew:convertToWorldSpace(cc.p(0,0)).y
                            local hitArea_width = shrew:getBoundingBox().width*1.2
                            local hitArea_height = shrew:getBoundingBox().height                
                            local hitArea = cc.rect(hitArea_x, hitArea_y, hitArea_width, hitArea_height)
                                                                                  
                            if cc.rectContainsPoint(hitArea,self._endPoint ) and  shrew._hp > 0 and self:isTouchInRect(self._endPoint, shrew._shrewBody) then
                                                              
                                --播放锤子敲击效果
                                self:doHammerEffect(touch)
                                sound.playEffect(SoundRes.shrew.hitOne)
                                sound.playEffect(SoundRes.shrew.shrewHit1)
                                shrew._hp = shrew._hp -1

                                --播放地鼠被敲晕的效果
                                shrew:doActionDizzy()

                                self:onViewClickCallBack({"kickshrew", self:doHitLogic(i, touch)})
                  
                            end
                         
                        end

                    end                       
                         	
                end
        end

    end

    local eventDispatcher = cc.Director:getInstance():getEventDispatcher()
    local listener = cc.EventListenerTouchOneByOne:create()
    listener:registerScriptHandler(onTouchBegan,cc.Handler.EVENT_TOUCH_BEGAN )
    listener:registerScriptHandler(onTouchEnded,cc.Handler.EVENT_TOUCH_ENDED )

    eventDispatcher:addEventListenerWithSceneGraphPriority(listener, self)  
end

--[[
播放 被击中时，锤子的动画效果
--]]
function GameView:doHammerEffect(touch)

    local hammerType = self._preHammerType
    
    local animFrames = {}
    
    if hammerType == 1 then
        local pFrame = cc.SpriteFrameCache:getInstance():getSpriteFrame("wood_hammer_effect_1.png")
        animFrames[1] = pFrame
    elseif hammerType == 2 then
    
        for i = 1, 3 do
            local fileName = string.format("stone_hammer_effect_%d.png",i)
            local pFrame = cc.SpriteFrameCache:getInstance():getSpriteFrame(fileName)
            animFrames[i] = pFrame
        end
   
    elseif hammerType == 3 then
    
        for i = 1, 3 do
            local fileName = string.format("copper_hammer_effect_%d.png",i)
            local pFrame = cc.SpriteFrameCache:getInstance():getSpriteFrame(fileName)
            animFrames[i] = pFrame
        end
        
    elseif hammerType == 4 then
    
        for i = 1, 10 do
            local fileName = string.format("silver_hammer_effect_%d.png",i)
            local pFrame = cc.SpriteFrameCache:getInstance():getSpriteFrame(fileName)
            animFrames[i] = pFrame
        end
        
    elseif hammerType == 5 then
    
        for i = 1, 3 do
            local fileName = string.format("gold_hammer_effect_%d.png",i)
            local pFrame = cc.SpriteFrameCache:getInstance():getSpriteFrame(fileName)
            animFrames[i] = pFrame
        end
    
    elseif hammerType == 6 then
    
        for i = 1, 4 do
            local fileName = string.format("god_hammer_effect_%d.png",i)
            local pFrame = cc.SpriteFrameCache:getInstance():getSpriteFrame(fileName)
            animFrames[i] = pFrame
        end
        
    end
    
    if self._hammerEffectSprite ~= nil then
        self._hammerEffectSprite:removeFromParent()
        self._hammerEffectSprite = nil
    end
    self._hammerEffectSprite = cc.Sprite:createWithSpriteFrame(animFrames[1])
    self._hammerEffectSprite:setPosition(touch:getLocation())
    self:addChild(self._hammerEffectSprite, 30)
    local bubble2_ani
    
    if hammerType == 4 then
        bubble2_ani = cc.Animation:createWithSpriteFrames(animFrames, 0.1)
    else
        bubble2_ani = cc.Animation:createWithSpriteFrames(animFrames, 0.2)
    end
    
    local animate = cc.Animate:create(bubble2_ani) --这里创建了动画的Action
    local seq = cc.Sequence:create(animate, cc.CallFunc:create(handler(self, self.doHammerEffectBack)))  
    self._hammerEffectSprite:runAction(seq)
      
end

--[[
移除打击效果
--]]
function GameView:doHammerEffectBack()
    self._hammerEffectSprite:removeFromParent()
    self._hammerEffectSprite = nil
end



--[[
发送雷神锤的包
--]]
function GameView:doAngryLogic()

 
    for i = 1, #self._hole do
        local shrew = self._hole[i]:getChildByTag(1)
        if shrew ~= nil and shrew:isCanClick() == true then
        	
        	if shrew._hp > 0 then
        		shrew._hp = shrew._hp -1                                
                shrew:doActionDizzy()
        	end
     
        end
    end
    
    local KickReqVo = require("games.shrew.model.vo.KickReqVo").new()
    KickReqVo.hammerType = 99
    KickReqVo.bKickShrew = 1
    KickReqVo.numOfShrew = 1
    KickReqVo.shrews[1].shrewindex = 0
    KickReqVo.shrews[1].protectType = 0
    KickReqVo.comboID = 0                    
    self:onViewClickCallBack({"kickshrew", KickReqVo})
    
end

--[[
控制敲打锤子的逻辑，获取敲下去的发包所需要的数据
--]]
function GameView:doHitLogic(index, pTouch)


    local shrew = self._hole[index]:getChildByTag(1)  
    local KickReqVo = require("games.shrew.model.vo.KickReqVo").new()
    
    KickReqVo.hammerType = self._preHammerType
    KickReqVo.comboID = self:getNComboID()   --连击编号
    

    --当前要执行连击   根据index得到周边的indexs ，判断 indexs 位置中是否有地鼠
    if self:getNCombo() > 0 and KickReqVo.comboID > 0 then
        local comboHole = self:getComboHole(index)   
  
        --播放闪电效果
        self:doComboaAnimation(index,comboHole,pTouch)
        
        KickReqVo.bKickShrew = (#comboHole <= 0 and shrew._hp > 0) and 0 or 1
        KickReqVo.numOfShrew = shrew._hp > 0 and #comboHole or #comboHole + 1
        
        local kindex = 0
        
        for i = 1, #comboHole do
        	local shrewReq = require("src/games/shrew/model/vo/ShrewReqVo.lua").new()
        	local tempShrew = self._hole[comboHole[i]]:getChildByTag(1)  
        	
        	if tempShrew._hp > 0 then        	    
        		tempShrew._hp = tempShrew._hp - 1
        		tempShrew:doActionDizzy()
        	end
        	
        	shrewReq.shrewindex = comboHole[i]
        	shrewReq.protectType = (tempShrew._shrewType == shrewData.Type.blue) and 1 or 0    
            kindex = kindex + 1    	
        	KickReqVo.shrews[kindex] = shrewReq
          
        end
        
        if shrew._hp <= 0 then
            local shrewReq = require("src/games/shrew/model/vo/ShrewReqVo.lua").new()
            local tempShrew = self._hole[index]:getChildByTag(1)
            
            shrewReq.shrewindex = index
            shrewReq.protectType = (tempShrew._shrewType == shrewData.Type.blue) and 1 or 0  
            kindex = kindex + 1       
            KickReqVo.shrews[kindex] = shrewReq            
        end
        
    -- 非连击操作 判断当前地鼠
    else 
        local tempShrew = self._hole[index]:getChildByTag(1)
        
        KickReqVo.bKickShrew = (shrew._hp > 0) and 0 or 1
        KickReqVo.numOfShrew =  (KickReqVo.bKickShrew == 1) and 1 or 0  -- 非连击状态,敲中数量为1
        local shrewReq = require("src/games/shrew/model/vo/ShrewReqVo.lua").new()
        
        if KickReqVo.numOfShrew >= 1 then
            shrewReq.shrewindex = index
            shrewReq.protectType = (tempShrew._shrewType == shrewData.Type.blue) and 1 or 0  
        else
            shrewReq.shrewindex = 0
            shrewReq.protectType = 0 
        end
    
        KickReqVo.shrews[1] = shrewReq 
    end
    
    return KickReqVo
end

--[[
--]]
function GameView:doComboaAnimation(index, comboHole, pTouch)
    
    if #comboHole > 0 then
        sound.playEffect(SoundRes.shrew.multiKick)
        local animFrames = {}
        for i = 1, 7 do
            local resName = string.format("center_lightning_%d.png",i)
            local pFrame = cc.SpriteFrameCache:getInstance():getSpriteFrame(resName)
            animFrames[i] = pFrame
        end
        
        self:comboCallBack1() 
        self._comboSprite = cc.Sprite:createWithSpriteFrame(animFrames[1])
        self._comboSprite:setRotation(80)  
        self._comboSprite:setPosition(pTouch:getLocation())
        self:addChild(self._comboSprite, 10)

        local animation = cc.Animation:createWithSpriteFrames(animFrames, 0.15) --这里定义了每一帧，和动画的间隔时间
        local animate = cc.Animate:create(animation) --这里创建了动画的Action
        local seq = cc.Sequence:create(animate, cc.CallFunc:create(handler(self, self.comboCallBack1)))  
        self._comboSprite:runAction(seq)
    end
    
    local indexPosX = self._hole[index]:getPositionX()
    local indexPosY = self._hole[index]:getPositionY()
    
    for i = 1, #comboHole do
    	
        local tempPosX = self._hole[comboHole[i]]:getPositionX()
        local tempPosY = self._hole[comboHole[i]]:getPositionY()
        local distance = math.sqrt((indexPosX - tempPosX) * (indexPosX - tempPosX) + (indexPosY - tempPosY) * (indexPosY - tempPosY))        
        local degree = math.floor(math.acos((tempPosX - indexPosX) / distance) * 180 / 3.1415926)  

        if tempPosY < indexPosY then
            degree = -degree
        end
        
        self:comboAnimation(pTouch, -degree)
    end
end

--[[
分散出去的闪电链动画
--]]
function GameView:comboAnimation(pTouch, rot)
    

    local animFrames = {}
    for i = 1, 4 do
        local resName = string.format("lightning_%d.png",i)
        local pFrame = cc.SpriteFrameCache:getInstance():getSpriteFrame(resName)
        animFrames[i] = pFrame
    end

    
    local comboSprite2 = cc.Sprite:createWithSpriteFrame(animFrames[1])
    comboSprite2:setAnchorPoint(cc.p(0,0.5))
    comboSprite2:setRotation(rot)  
    comboSprite2:setPosition(pTouch:getLocation())
    self:addChild(comboSprite2, 10)

    local animation = cc.Animation:createWithSpriteFrames(animFrames, 0.2) --这里定义了每一帧，和动画的间隔时间
    local animate = cc.Animate:create(animation) --这里创建了动画的Action
    
    local function fun()
        self:comboCallBack2(comboSprite2)
    end
    local seq = cc.Sequence:create(animate, cc.CallFunc:create(fun))  
    comboSprite2:runAction(seq)
    
end

function GameView:comboCallBack1()    
    if self._comboSprite ~= nil then
        self._comboSprite:removeFromParent()
        self._comboSprite = nil
    end 
end

function GameView:comboCallBack2(sprite)

    sprite:removeFromParent()
    sprite = nil
end

--[[
获取连击的洞，最多3个
@param index        number类型    打中的那个洞ID
@return             table        
--]]
function GameView:getComboHole(index) 
        
    local comboHole = {}
    local holeCount = 0
    
    local HoleVo = require("games.shrew.model.vo.HoleVo")
    local temp = {}
    
    for i = 1, 9 do 
        temp[i] = HoleVo.new()
        if math.floor(i / 4) == 0 then
            temp[i].x = 1
        elseif math.floor(i / 4) == 1 then
            temp[i].x = 2
        elseif math.floor(i / 4) == 2 then
            temp[i].x = 3
        end 
        
        if i % 3 == 1 then
            temp[i].y = 1
        elseif i % 3 == 2 then
            temp[i].y = 2
        elseif i % 3 == 0 then
            temp[i].y = 3
        end      
        
    end
    
    for i = 1, 9 do 
        if i ~= index and math.abs(temp[index].x - temp[i].x) <= 1 and math.abs(temp[index].y - temp[i].y) <= 1 then
        
            local shrew = self._hole[i]:getChildByTag(1)
            
            if shrew and shrew:isCanClick() and shrew._hp > 0 then
                holeCount = holeCount + 1
                comboHole[holeCount] = i
            end

        end   
    end
   
    --加上敲击的地鼠本身， 最多连击4个地鼠
   local tag = {}
   for i = 1, holeCount do
   	    tag[i] = true
   end
   
   local res = {} 
   local conut = 0
   if holeCount > 3 then

   	   repeat	   
   	        math.newrandomseed()
   	        local n = math.random(1,holeCount)  	        
   	        if tag[n] == true then
   	        	conut = conut + 1
   	        	res[conut] = comboHole[n]
   	        end
   	        tag[n] = false  	        
   	   until  conut == 3
        return res
   else
        return comboHole
   end
      
end
--[[
设置连击标记
--]]
function GameView:setNCombo(combo)

    self._combo = combo
end

--[[
获取连击标记
--]]
function GameView:getNCombo()

    return self._combo
end

--[[
设置连击编号
--]]
function GameView:setNComboID(comboID)

    self._comboID = comboID
end

--[[
获取连击编号
--]]
function GameView:getNComboID(comboID)

    return self._comboID
end

--[[
开宝箱动画
--]]
function GameView:playTreasueMovie(reward)
    
    --记录开宝箱 奖励金额
    self._reward = reward
    
    if self._shadow ~= nil then
        self._shadow:removeFromParent()
        self._shadow = nil
    end
    self._shadow = cc.Sprite:createWithSpriteFrameName("kickshrew_treasure_sunshine.png")
    self._shadow:setPosition(self._winSize.width/2, self._winSize.height/2)
    self:addChild(self._shadow, 99, 33)
    self._shadow:setScale(1.2)   
    local rotate = cc.RotateBy:create(30,360)
    self._shadow:setVisible(false)
    self._shadow:runAction(cc.RepeatForever:create(rotate))
    
    local animFrames = {}
    for i = 1, 17 do
        local resName = string.format("kickshrew_treasure_box_%d.png",i)
        local pFrame = cc.SpriteFrameCache:getInstance():getSpriteFrame(resName)
        animFrames[i] = pFrame
    end

    if self._treasueSprite ~= nil then
        self._treasueSprite:removeFromParent()
        self._treasueSprite = nil
    end
    self._treasueSprite  = cc.Sprite:createWithSpriteFrame(animFrames[1])
    self._treasueSprite:setPosition(self._shadow:getPositionX() + self._shadow:getBoundingBox().width*(1/7), self._shadow:getPositionY())
    self:addChild(self._treasueSprite, 100, 34)
    self._treasueSprite:setScale(1.2)   
    self._treasueSprite:setVisible(false)

    if self._angryReward ~= nil then
        self._angryReward:removeFromParent()
        self._angryReward = nil
    end
    self._angryReward = cc.LabelBMFont:create("0", self:getRewardFont())
    self._angryReward:setPosition(self._winSize.width * 0.51, self._treasueSprite:getPositionY() + self._treasueSprite:getBoundingBox().height * 0.6)
    self._angryReward:setVisible(false)
    self:addChild(self._angryReward, 104, 35)

    local animation = cc.Animation:createWithSpriteFrames(animFrames, 0.2) --这里定义了每一帧，和动画的间隔时间
    local animate = cc.Animate:create(animation) --这里创建了动画的Action
    local delay = cc.DelayTime:create(0.1) --宝箱动画延迟1秒显示
    local a1 = cc.Sequence:create(delay, cc.CallFunc:create(handler(self, self.delayCallBack)))  
    local delay2 = cc.DelayTime:create(0.5) --宝箱动画放完后停留时间
    local seq = cc.Sequence:create(a1, animate, delay2, cc.CallFunc:create(handler(self, self.movieCallBack)))  
    self._treasueSprite:runAction(seq)
    
end

--[[
获取奖励字体
--]]
function GameView:getRewardFont()

    local font 
    local targetPlatform = cc.Application:getInstance():getTargetPlatform()
    if cc.PLATFORM_OS_IPHONE  == targetPlatform or cc.PLATFORM_OS_IPAD == targetPlatform then
        font = "angey_reward.fnt"
    else
        font = "fonts/angey_reward.fnt"
    end

    return font
end


function GameView:delayCallBack()
    
    self._shadow:setVisible(true)
    self._treasueSprite:setVisible(true)
    self._angryReward:setVisible(true)
    self._subCount = math.floor(self._reward/41) + 4 --除以40 个位是5，+4 即9，9的累加，即个位9..8..7..6..5..4..3..2..1..
    
    self._rewardHandle = scheduler.scheduleGlobal(handler(self,self.updateAngryReward), 0.00001) 
end


function GameView:updateAngryReward()
   
    if self._angryReward ~= nil then
        local reward = tonumber(self._angryReward:getString())
        if reward <= self._reward then
            reward = reward + self._subCount
            self._angryReward:setString(tostring(reward))
        else
            self._angryReward:setString(tostring(self._reward))
            scheduler.unscheduleGlobal(self._rewardHandle)
        end
    end
  	
end

function GameView:movieCallBack()
    
    self._shadow:removeFromParent()
    self._shadow = nil
    
    self._treasueSprite:removeFromParent()
    self._treasueSprite = nil
    
    self._angryReward:removeFromParent()
    self._angryReward = nil
    
    scheduler.unscheduleGlobal(self._rewardHandle)    
end

--[[
底部获奖信息
@param time     string类型   获奖时间
@param name     string类型   获奖人用户名
@param hammer   string类型   所用锤子
@param money    number类型   获奖金额
--]]
function GameView:showPlayerAward(name, hammer, money)
     
       
    self:showPlayerAwardCallBack()
    self._awardBg = cc.Sprite:createWithSpriteFrameName("broadcast_Bg.png")
    self._awardBg:setPosition(self._winSize.width/2, self._awardBg:getContentSize().height/2)
    self:addChild(self._awardBg, 150)

    local n = self._winSize.width/self._awardBg:getContentSize().width
    self._awardBg:setScaleX(n)
     
    local temp = string.format("[%s]使用[%s]击打地鼠，获得", name, hammer)           
    local label1 = cc.LabelTTF:create(temp, "Helvetica", self._awardBg:getContentSize().height * 0.7)
    local label2 = cc.LabelTTF:create(tostring(money), "Helvetica", self._awardBg:getContentSize().height * 0.7)
    local label3 = cc.LabelTTF:create("银子", "Helvetica", self._awardBg:getContentSize().height * 0.7)

    label1:setColor(cc.c3b(224, 219, 219))
    label2:setColor(cc.c3b(238, 10, 5))
    label3:setColor(cc.c3b(224, 219, 219))

    self._labelLayer = cc.Layer:create()
    local width =  label1:getContentSize().width + label2:getContentSize().width + label3:getContentSize().width
    local height = self._awardBg:getContentSize().height
    self._labelLayer:setContentSize(cc.size(width,height))

    self._labelLayer:addChild(label1)
    self._labelLayer:addChild(label2)
    self._labelLayer:addChild(label3)
    self:addChild(self._labelLayer,151)

    label1:setAnchorPoint(cc.p(0,0.5))
    label2:setAnchorPoint(cc.p(0,0.5))
    label3:setAnchorPoint(cc.p(0,0.5))
    label1:setPosition(0, 0)
    label2:setPosition(label1:getContentSize().width, 0)
    label3:setPosition(label1:getContentSize().width + label2:getContentSize().width, 0)
    
    local px = (self._winSize.width - width)/2
    local py = self._awardBg:getPositionY()
    self._labelLayer:setPosition(px, py)
           
    local delay = cc.DelayTime:create(3)
    local seq = cc.Sequence:create(delay, cc.CallFunc:create(handler(self, self.showPlayerAwardCallBack)))  
    self._awardBg:runAction(seq)
   
      
end

function GameView:showPlayerAwardCallBack()
    
    if self._awardBg ~= nil then
        self._awardBg:removeFromParent()
        self._awardBg = nil
    end
   
    if self._labelLayer ~= nil then
        self._labelLayer:removeFromParent()
        self._labelLayer = nil
    end
end

function GameView:standUp(playerId)
    
    local globalProxy = myAppFacade:retrieveProxy(common.model.GlobalProxy.NAME)
    if playerId == globalProxy._myPlayerVo.playerId then
        self:onViewClickCallBack("gotoroom")
    end
end

--[[
更新 用户头像
@param faceID  number类型   头像ID
--]]
function GameView:updateFace(faceID)
    self._playerinfo:updateFace(faceID)
end

--[[
更新用户名
@param userName  string类型   用户名
--]]
function GameView:updateUserName(userName)
    self._playerinfo:updateUserName(userName)
end

--[[
更新 等级分文字
@param userlevel  string类型 等级分 如：Lv.3
--]]
function GameView:updateLevelNum(userLevel)
    self._playerinfo:updateLevelNum(userLevel)
end

--[[
更新 愤怒值
@param angryScore  number类型 愤怒值 
--]]
function GameView:updateAngryBar(angryScore)
    self._playerinfo:updateAngryBar(angryScore)
end

--[[
更新 银子数
@param money  number类型  银子数 
--]]
function GameView:updateMoneyBar(money)
    self._playerinfo:updateMoneyBar(money)
end

--[[
更新 体力值
@param power     number类型  当前体力值 
@param powerTop  number类型  满体力值
--]]
function GameView:updateHPBar(power, powerTop)
    self._playerinfo:updateHPBar(power, powerTop)
end

--[[
更新 等级分进度条
@param levelScore  number类型  等级分
--]]
function GameView:updateLevelBar(levelScore)
    self._playerinfo:updateLevelBar(levelScore)
end

--[[
更新Item
@param index            number类型   锤子列表序列号
@param hammerID         number类型   锤子ID
@param hammerPrice      number类型   锤子单次敲击价钱
--]]
function GameView:updataHammerListItem(index, hammerID, hammerPrice)       
    self._hammerListView:updataItem(index, hammerID, hammerPrice)
end

--[[
更新免费锤子信息
@param index            number类型   锤子列表序列号
@param hammerID         number类型   锤子ID
@param FreeHammerCount  number类型   免费锤子个数
--]]
function GameView:updataFreeHammer(index, hammerID, FreeHammerCount)
    self._hammerListView:updataFreeHammer(index, hammerID, FreeHammerCount)
end

--[[
更新当前选中的锤子
@param hammerID         number类型   锤子ID
--]]
function GameView:updataSelectedHammer(hammerID)
    self._hammerListView:updataSelectedHammer(hammerID)
end


--[[
更新当前的锤子
@param hammerID         number类型   锤子ID
--]]
function GameView:setTouchHammer(hammerID) 
    local fileName = string.format("hammer/hammer_big_%d.png",hammerID)
    self._touchHammerSprite:setSpriteFrame(fileName)
    
    self._preHammerType = hammerID

    Log.i("self._preHammerType",self._preHammerType)

    local GameProxy = myAppFacade:retrieveProxy(shrew.model.GameProxy.NAME)
    GameProxy._hammerType =  self._preHammerType
    
end


--[[
更新每周排名信息

--]]
function GameView:updataWeekRankView(rankInfo)
    self._gameInfoTableView:updataWeekRankView(rankInfo)
end

--[[
更新个人信息数据
--]]
function GameView:updataRewardInfo(rewardInfo)

    self._gameInfoTableView:updataRewardInfo(rewardInfo)
end

--[[
显示金币洒落动画
@param shrewResp         table类型   打中的地鼠信息
--]]
function GameView:showGoldAnimation(shrewResp)

    for i = 1, #shrewResp do
        
        if shrewResp[i]._reward > 0 then
            local goldFlash = shrew.view.GoldParticle.new(shrewResp[i]._reward)
            self._hole[shrewResp[i]._shrewIndex]:addChild(goldFlash,5)
            
            local shrew = self._hole[shrewResp[i]._shrewIndex]:getChildByTag(1)            
            local px =  shrew:getBoundingBox().width * 0.5   
            local py =  shrew:getBoundingBox().height *0.5           
            goldFlash:setPosition(px, py)
        end
    end
    
end

--[[
提示信息
@param info         string类型   提示信息
--]]
function GameView:showMsgBox(info)
    doMsgBox(self, info)
end

function GameView:doNetWorkErr()
    doMsgBox(self,ErrorDefines.NET_WORK_BROKEN_ERROR,handler(self,self.onViewClickCallBack))
end

return GameView