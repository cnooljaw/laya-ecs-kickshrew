--[[
绿色地鼠类
@author lsd
]]


local GreenShrew = class("GreenShrew",shrew.view.BaseShrew)

function GreenShrew:ctor(shrewType, map_type)

    GreenShrew.super.ctor(self)
    
    self._shrewEyeLeft = nil
    self._shrewEyeRight = nil
    self._prop = nil
    self._prop1 = nil

    --加载资源列表
    cc.SpriteFrameCache:getInstance():addSpriteFrames("kickshrew_role_second.plist")
    
    self:init(shrewType, map_type)
end

--[[
初始化地鼠
--]]
function GreenShrew:init(shrewType, map_type)

    GreenShrew.super.initBaseShrew(self, shrewType) 
           
    --初始数据
    self._hp = 1
    self._mapType = map_type
    self._frameSize = self._shrewBody:getContentSize()
    self:setContentSize(self._frameSize)
    
    --左眼
    self._shrewEyeLeft = cc.Sprite:createWithSpriteFrameName(self._shrewData.leftEyesNormalResIndex)
    self._mainLayer:addChild(self._shrewEyeLeft, shrewData.Zorder.keyes)
    
    --右眼
    self._shrewEyeRight = cc.Sprite:createWithSpriteFrameName(self._shrewData.rightEyesNormalResIndex)
    self._mainLayer:addChild(self._shrewEyeRight, shrewData.Zorder.keyes)

    self:setComPos()
    self:setComOrder()
    
                          
    --根据不同的地图场景设置不同的道具
    if self._mapType == shrewData.Map.Meadow then   
        self._prop = cc.Sprite:createWithSpriteFrameName(self._shrewData.prop1)
        self._prop:setPosition(cc.p(self._frameSize.width * 0.48, self._frameSize.height))   

    elseif self._mapType == shrewData.Map.Ship then
    
        local _,pos = string.find(self._shrewData.prop2, '|') 
        local propRes = string.sub(self._shrewData.prop2, 1, pos-1)
        local prop1Res = string.sub(self._shrewData.prop2, pos + 1, string.len(self._shrewData.prop2))
            
        self._prop = cc.Sprite:createWithSpriteFrameName(propRes)
        self._prop:setPosition(cc.p(self._frameSize.width * 0.48, self._frameSize.height * 0.9))  
        
        self._prop1 = cc.Sprite:createWithSpriteFrameName(prop1Res)
        self._prop1:setPosition(cc.p(self._frameSize.width * 0.9, self._frameSize.height * 0.72))  

    elseif self._mapType == shrewData.Map.Sewer then
        self._prop = cc.Sprite:createWithSpriteFrameName(self._shrewData.prop3)
        self._prop:setPosition(cc.p(self._frameSize.width * 0.5, self._frameSize.height * 0.68))    

    elseif self._mapType == shrewData.Map.Space then
        self._prop = cc.Sprite:createWithSpriteFrameName(self._shrewData.prop4)
        self._prop:setPosition(cc.p(self._frameSize.width * 0.5, self._frameSize.height * 0.67))    

    else

    end     
    self._mainLayer:addChild(self._prop, shrewData.Zorder.kprops)

end

--[[
--]]
function GreenShrew:setComPos()

    self._shrewBody:setPosition(cc.p(self._frameSize.width * 0.5, self._frameSize.height * 0.5))
    self._shrewFace:setPosition(cc.p(self._frameSize.width * 0.5, self._frameSize.height * 0.55))
    

    if self._mapType == shrewData.Map.Ship then
        self._shrewEarLeft:setPosition(cc.p(self._frameSize.width * 0.1, self._frameSize.height * 0.9))
        self._shrewEarRight:setPosition(cc.p(self._frameSize.width * 1.1, self._frameSize.height * 0.9))
        self._shrewEarRight:setLocalZOrder(20)
    else
        self._shrewEarLeft:setPosition(cc.p(self._frameSize.width * 0.2, self._frameSize.height * 0.86))
        self._shrewEarRight:setPosition(cc.p(self._frameSize.width * 0.78, self._frameSize.height * 0.86))
    end
    
    self._shrewEarLeft:setPosition(cc.p(self._frameSize.width * 0.2, self._frameSize.height * 0.86))
    self._shrewEarRight:setPosition(cc.p(self._frameSize.width * 0.78, self._frameSize.height * 0.86))
    
    self._shrewHandLeft:setPosition(cc.p(self._shrewBody:getPositionX() - self._frameSize.width * 0.39, self._frameSize.height * 0.31))
    self._shrewHandRight:setPosition(cc.p(self._shrewBody:getPositionX() + self._frameSize.width * 0.39, self._frameSize.height * 0.31))

    self._shrewEyeLeft:setPosition(cc.p(self._frameSize.width * 0.3, self._frameSize.height * 0.7))
    self._shrewEyeRight:setPosition(cc.p(self._frameSize.width * 0.7, self._frameSize.height * 0.7))
    
end

--[[
设置各个元素的层次
--]]
function GreenShrew:setComOrder()

    self._shrewBody:setLocalZOrder(shrewData.Zorder.kbody)
    self._shrewFace:setLocalZOrder(shrewData.Zorder.kface)
    self._shrewEarLeft:setLocalZOrder(shrewData.Zorder.kear)
    self._shrewEarRight:setLocalZOrder(shrewData.Zorder.kear)
    self._shrewHandLeft:setLocalZOrder(1000)
    self._shrewHandRight:setLocalZOrder(1000)

end

--[[
--]]
function GreenShrew:setSwelling()

    self._shrewFace:setSpriteFrame("second_face_cry.png")
    
    --左眼敲中动画
    self._shrewEyeLeft:setSpriteFrame("second_eye_right_dizzy.png") 
    local animFrames1 = {}
    local tempEyeLeft = cc.SpriteFrameCache:getInstance():getSpriteFrame("second_eye_right_dizzy.png")
    local tempEyeLeft1 = cc.SpriteFrameCache:getInstance():getSpriteFrame("second_eye_right_dizzy1.png")
    animFrames1[1] = tempEyeLeft
    animFrames1[2] = tempEyeLeft1
    
    local animationLeft = cc.Animation:createWithSpriteFrames(animFrames1, 0.1)--这里定义了每一帧，和动画的间隔时间
    local animate1 = cc.Animate:create(animationLeft)--这里创建了动画的Action
    local rep1 = cc.Repeat:create(animate1,3)
    self._shrewEyeLeft:runAction(rep1)
    
    --右眼敲中动画
    self._shrewEyeRight:setSpriteFrame("second_eye_left_dizzy.png") 
    local animFrames2 = {}
    local tempEyeRight = cc.SpriteFrameCache:getInstance():getSpriteFrame("second_eye_left_dizzy.png")
    local tempEyeRight1 = cc.SpriteFrameCache:getInstance():getSpriteFrame("second_eye_left_dizzy1.png")
    animFrames2[1] = tempEyeRight
    animFrames2[2] = tempEyeRight1

    local animationRight = cc.Animation:createWithSpriteFrames(animFrames2, 0.1)--这里定义了每一帧，和动画的间隔时间
    local animate2 = cc.Animate:create(animationRight)--这里创建了动画的Action
    local rep2 = cc.Repeat:create(animate2,3)
    self._shrewEyeRight:runAction(rep2)
    

  
    --
    if self._mapType == shrewData.Map.Ship then   
        self._shrewSwelling = cc.Sprite:createWithSpriteFrameName("second_swelling_red.png") 
        local nx = self._prop:getPositionX() + self._prop:getContentSize().width * 0.11
        local ny = self._prop:getPositionY() + self._prop:getContentSize().height * 0.45 + self._shrewSwelling:getContentSize().height * 0.25
        self._shrewSwelling:setPosition(cc.p(nx, ny)) 
        self._mainLayer:addChild(self._shrewSwelling, shrewData.Zorder.kSwelling) 
        
    elseif self._mapType == shrewData.Map.Space then
        self._shrewSwelling = cc.Sprite:createWithSpriteFrameName("second_swelling_belt.png") 
        local nx = self._prop:getPositionX()
        local ny = self._prop:getPositionY() + self._prop:getContentSize().height * 0.4 + self._shrewSwelling:getContentSize().height * 0.3
        self._shrewSwelling:setPosition(cc.p(nx, ny)) 
        self._mainLayer:addChild(self._shrewSwelling, shrewData.Zorder.kSwelling)
        
    else
        self._shrewSwelling = cc.Sprite:createWithSpriteFrameName("red_swelling.png") 
        self._shrewSwelling:setPosition(cc.p(self._frameSize.width * 0.5, self._frameSize.height)) 
        self._mainLayer:addChild(self._shrewSwelling, shrewData.Zorder.kSwelling)
        
    end
    

end



return GreenShrew