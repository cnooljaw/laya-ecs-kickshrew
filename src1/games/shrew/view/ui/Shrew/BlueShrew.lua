--[[
蓝色地鼠类：有帽子的地鼠
@author lsd
]]


local BlueShrew = class("BlueShrew",shrew.view.BaseShrew)

function BlueShrew:ctor(shrewType, map_type)
    
    BlueShrew.super.ctor(self)
    
    self._hat = nil
    self._handLeft = nil
    self._handRight = nil
    self._hasHat = true
    
    --加载资源列表
    cc.SpriteFrameCache:getInstance():addSpriteFrames("kickshrew_role_boss.plist")
    
    self:init(shrewType, map_type)
end


--[[
初始化地鼠
--]]
function BlueShrew:init(shrewType, map_type)

    BlueShrew.super.initBaseShrew(self, shrewType)
    --初始数据
    self._hp = 2
    self._mapType = map_type
    self._frameSize = self._shrewBody:getContentSize()
    self:setContentSize(self._frameSize)
    self:setComPos()
    self:setComOrder()

    --根据不同的地图场景设置不同的帽子
    if self._mapType == shrewData.Map.Meadow then   
        self._hat = cc.Sprite:createWithSpriteFrameName("pumpkin01.png")
        self._hat:setPosition(cc.p(self._frameSize.width * 0.4, self._frameSize.height * 0.915))   

    elseif self._mapType == shrewData.Map.Ship then
        self._hat = cc.Sprite:createWithSpriteFrameName("pirate01.png")
        self._hat:setPosition(cc.p(self._frameSize.width * 0.53, self._frameSize.height * 1.1))    

    elseif self._mapType == shrewData.Map.Sewer then
        self._hat = cc.Sprite:createWithSpriteFrameName("farmer01.png")
        self._hat:setPosition(cc.p(self._frameSize.width * 0.4, self._frameSize.height))    

    elseif self._mapType == shrewData.Map.Space then
        self._hat = cc.Sprite:createWithSpriteFrameName("space01.png")
        self._hat:setPosition(cc.p(self._frameSize.width * 0.45, self._frameSize.height * 0.9))    
        
    end     
    self._mainLayer:addChild(self._hat, shrewData.Zorder.khat)
 
end

--[[
--]]
function BlueShrew:setComPos()

    self._shrewBody:setPosition(cc.p(self._frameSize.width * 0.5, self._frameSize.height * 0.5))
    self._shrewFace:setPosition(cc.p(self._frameSize.width * 0.5, self._frameSize.height * 0.55))
    
    self._shrewEarLeft:setPosition(cc.p(self._frameSize.width * 0.2, self._frameSize.height * 0.87))
    self._shrewEarRight:setPosition(cc.p(self._frameSize.width * 0.78, self._frameSize.height * 0.88))

    self._shrewHandLeft:setPosition(cc.p(self._shrewBody:getPositionX() - self._frameSize.width * 0.46, self._frameSize.height * 0.42))
    self._shrewHandLeft:setRotation(-20)
    self._shrewHandRight:setPosition(cc.p(self._shrewBody:getPositionX() + self._frameSize.width * 0.48, self._frameSize.height * 0.42))
    self._shrewHandRight:setRotation(20)

end

--[[
设置各个元素的层次
--]]
function BlueShrew:setComOrder()

    self._shrewBody:setLocalZOrder(shrewData.Zorder.kbody)
    self._shrewFace:setLocalZOrder(shrewData.Zorder.kface)
    
    self._shrewEarLeft:setLocalZOrder(shrewData.Zorder.kear)
    self._shrewEarRight:setLocalZOrder(shrewData.Zorder.kear)
    
    self._shrewHandLeft:setLocalZOrder(shrewData.Zorder.khand)
    self._shrewHandRight:setLocalZOrder(shrewData.Zorder.khand)
    
end

function BlueShrew:doActionDizzy()

    if self._hasHat == true then
        --设置打掉BOSS 帽子后的BOSS表情
        self._shrewFace:setSpriteFrame("boss_face_angry.png")
        
        local animFrames = {}
        local actionTime 
        
        if self._mapType == shrewData.Map.Meadow then   
           for i = 1, 5 do
                local resName = string.format("pumpkin0%d.png",i)
                local pFrame = cc.SpriteFrameCache:getInstance():getSpriteFrame(resName)
                animFrames[i] = pFrame
           end
           actionTime = 0.1
        elseif self._mapType == shrewData.Map.Ship then
            for i = 1, 15 do
                local resName
                if i < 10 then
                	resName = string.format("pirate0%d.png",i)
                else
                    resName = string.format("pirate%d.png",i)
                end
               
                local pFrame = cc.SpriteFrameCache:getInstance():getSpriteFrame(resName)
                animFrames[i] = pFrame
           end
           actionTime = 0.04
        elseif self._mapType == shrewData.Map.Sewer then
           for i = 1, 5 do
                local resName = string.format("farmer0%d.png",i)
                local pFrame = cc.SpriteFrameCache:getInstance():getSpriteFrame(resName)
                animFrames[i] = pFrame
           end
           actionTime = 0.1
        elseif self._mapType == shrewData.Map.Space then
            for i = 1, 5 do
                local resName = string.format("space0%d.png",i)
                local pFrame = cc.SpriteFrameCache:getInstance():getSpriteFrame(resName)
                animFrames[i] = pFrame
           end
           actionTime = 0.1
        end 
          
 
        self._hatSprite = cc.Sprite:createWithSpriteFrame(animFrames[1])
        self._hatSprite:setPosition(self._hat:getPositionX(),self._hat:getPositionY())
        self._mainLayer:removeChild(self._hat)
        self:addChild(self._hatSprite, 200)
        
        local animation = cc.Animation:createWithSpriteFrames(animFrames, actionTime)--这里定义了每一帧，和动画的间隔时间
        local animate = cc.Animate:create(animation)--这里创建了动画的Action  
        local seq = cc.Sequence:create(animate,cc.CallFunc:create(handler(self, self.hatBrokenCallBack)))
        
        self._shrewAction = shrewData.Action.Up
        self._hatSprite:runAction(seq)
   
        self._hasHat = false
        self._isCanClick = true
        
    else
        BlueShrew.super.doActionDizzy(self)
    end
    
end


function BlueShrew:hatBrokenCallBack()

    local action = cc.DelayTime:create(2)    
    self:runAction(action)   
    self._hatSprite:removeFromParent()
    self._hatSprite = nil
   -- self._shrewAction = shrewData.Action.Down   
end


--[[
--]]
function BlueShrew:setSwelling()
    
    --设置被敲的表情
    self._shrewFace:setSpriteFrame("boss_face_miserable.png")   
    self._shrewSwelling = cc.Sprite:createWithSpriteFrameName("boss_Swelling.png") 
    self._shrewSwelling:setPosition(cc.p(self._frameSize.width * 0.65, self._frameSize.height))  
    self._mainLayer:addChild(self._shrewSwelling, shrewData.Zorder.kSwelling)
    
    if self._handLeft  and self._handRight then
    
        self._mainLayer:removeChild(self._handLeft, true)
        self._handLeft = nil
        
        self._mainLayer:removeChild(self._handRight, true)
        self._handRight = nil        
    end
    
    self._shrewHandLeft:setVisible(true)
    self._shrewHandRight:setVisible(true)
    
    self._shrewHandLeft:setSpriteFrame("boss_hand_left_dizzy.png")  
    self._shrewHandRight:setSpriteFrame("boss_hand_right_dizzy.png")  
    
    self._shrewHandRight:setLocalZOrder(shrewData.Zorder.knumber)


    self:setScale(0.95)
end

function BlueShrew:setFrontHand()

    self._shrewHandLeft:setVisible(false)
    self._shrewHandRight:setVisible(false)
   
    self._handLeft = cc.Sprite:createWithSpriteFrameName("boss_hand_left_up.png") 
    self._mainLayer:addChild(self._handLeft, shrewData.Zorder.knumber)
    local nx = self._shrewBody:getPositionX() - self._shrewBody:getContentSize().width * 0.365
    local ny = self._shrewBody:getPositionY() - self._shrewBody:getContentSize().height * 0.17
    self._handLeft:setPosition(cc.p(nx, ny))
    
    self._handRight = cc.Sprite:createWithSpriteFrameName("boss_hand_right_up.png") 
    self._mainLayer:addChild(self._handRight, shrewData.Zorder.knumber)   
    local nx2 = self._shrewBody:getPositionX() + self._shrewBody:getContentSize().width * 0.365
    local ny2 = self._shrewBody:getPositionY() - self._shrewBody:getContentSize().height * 0.17
    self._handRight:setPosition(cc.p(nx2, ny2))
    
    
end

function BlueShrew:setDownHand()
    self._shrewHandRight:setLocalZOrder(shrewData.Zorder.khand)
    self._shrewHandRight:setVisible(true)
    self._shrewHandLeft:setVisible(true)
    
    if self._handLeft  and self._handRight  then
          
        self._mainLayer:removeChild(self._handLeft,true)
        self._handLeft = nil

        self._mainLayer:removeChild(self._handRight,true)
        self._handRight = nil        
    end
    
end

return BlueShrew