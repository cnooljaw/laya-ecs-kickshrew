--[[
下水道地图
@author lsd
]]

local GameViewSewer = class("GameViewSewer",shrew.view.GameView)

function GameViewSewer:ctor()

    GameViewSewer.super.ctor(self)
    self:init()
end

function GameViewSewer:init()

    GameViewSewer.super.init(self)

    --加载资源列表
    cc.SpriteFrameCache:getInstance():addSpriteFrames("kickshrew_game_view_sewerbg_01.plist")
    cc.SpriteFrameCache:getInstance():addSpriteFrames("kickshrew_game_view_sewerbg_02.plist")
    cc.SpriteFrameCache:getInstance():addSpriteFrames("kickshrew_game_view_sewer.plist")
    cc.SpriteFrameCache:getInstance():addSpriteFrames("kickshrew_swear_animation.plist")

    self._mapType = shrewData.Map.Sewer
    self:setScene()

end

function GameViewSewer:onExit()

    GameViewSewer.super.onExit(self)

    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("kickshrew_game_view_sewerbg_01.plist")
    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("kickshrew_game_view_sewerbg_02.plist")
    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("kickshrew_game_view_sewer.plist")
    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("kickshrew_swear_animation.plist")

end

function GameViewSewer:setScene()

    self._bg = cc.Sprite:createWithSpriteFrameName("sewer_viewBg.png")
    self._bg:setPosition(cc.p(self._winSize.width * 0.5, self._winSize.height * 0.5))
    self._backLayer:addChild(self._bg, 0)

    self._bgBoundingSize = self._bg:getBoundingBox() --boundingSize为素材实际放大的尺寸， 可以超出屏幕外
    
    local bg1 = cc.Sprite:createWithSpriteFrameName("sewer_bg.png")
    bg1:setPosition(cc.p(self._bgBoundingSize.width*0.5, self._bg:getPositionY()))
    self._bg:addChild(bg1, 1)
    
    local water = cc.Sprite:createWithSpriteFrameName("sewer_wheelWater.png")
    water:setPosition(cc.p(self._bgBoundingSize.width * 0.61, self._bgBoundingSize.height * 0.43))
    self._bg:addChild(water, 13)
    
    local wheel = cc.Sprite:createWithSpriteFrameName("sewer_wheel.png")
    wheel:setPosition(cc.p(self._bgBoundingSize.width * 0.61, self._bgBoundingSize.height * 0.48))
    self._bg:addChild(wheel, 12)
    
    local animFrames = {}
    for i = 1, 32 do
        local resName = string.format("ripples_%d.png",i)
        local pFrame = cc.SpriteFrameCache:getInstance():getSpriteFrame(resName)
        animFrames[i] = pFrame
    end
    
    local sprite1 = cc.Sprite:createWithSpriteFrame(animFrames[1])
    sprite1:setPosition(cc.p(self._bgBoundingSize.width * 0.49, self._bgBoundingSize.height * 0.68))
    self._bg:addChild(sprite1)
    
    local animation = cc.Animation:createWithSpriteFrames(animFrames, 0.2) --这里定义了每一帧，和动画的间隔时间
    local animate = cc.Animate:create(animation) --这里创建了动画的Action
    sprite1:runAction(animate)
    
    local sprite2 = cc.Sprite:createWithSpriteFrame(animFrames[1])
    sprite2:setPosition(cc.p(self._bgBoundingSize.width * 0.575, self._bgBoundingSize.height * 0.69))
    self._bg:addChild(sprite2)

    local animation2 = cc.Animation:createWithSpriteFrames(animFrames, 0.3) --这里定义了每一帧，和动画的间隔时间
    local animate2 = cc.Animate:create(animation2) --这里创建了动画的Action
    sprite2:runAction(animate2)
    
    self:showBubble1()
    self:showBubble2()
    
    local roate = cc.RotateBy:create(20,360)
    wheel:runAction(cc.RepeatForever:create(roate))
    
    --蒙版，为了遮住地鼠
    local cover11 = cc.Sprite:createWithSpriteFrameName("sewer_1.png")
    cover11:setPosition(self._bgBoundingSize.width*0.5, self._bgBoundingSize.height*0.55)
    self._bg:addChild(cover11, 2)


    local cover1 = cc.Sprite:createWithSpriteFrameName("sewer_1_1.png")
    cover1:setPosition(self._bgBoundingSize.width*0.5, self._bgBoundingSize.height*0.58)
    self._bg:addChild(cover1, 4)

   
    local cover22 = cc.Sprite:createWithSpriteFrameName("sewer_2.png")
    cover22:setPosition(self._bgBoundingSize.width*0.5, self._bgBoundingSize.height*0.378)
    self._bg:addChild(cover22, 6)
    
    local cover2 = cc.Sprite:createWithSpriteFrameName("sewer_2_1.png")
    cover2:setPosition(self._bgBoundingSize.width*0.5, self._bgBoundingSize.height*0.38)
    self._bg:addChild(cover2, 8)
    
    local cover33 = cc.Sprite:createWithSpriteFrameName("sewer_3.png")
    cover33:setPosition(self._bgBoundingSize.width*0.5, self._bgBoundingSize.height*0.14)
    self._bg:addChild(cover33, 10)
    
    local cover3 = cc.Sprite:createWithSpriteFrameName("sewer_3_1.png")
    cover3:setPosition(self._bgBoundingSize.width*0.5, self._bgBoundingSize.height*0.14)
    self._bg:addChild(cover3, 12)
   

    --显示地鼠
    self:showRandShrew(self._mapType)

    local x = self._bgBoundingSize.width
    local y = self._bgBoundingSize.height   
    local holePositionX = {0.285*x, 0.5*x, 0.71*x, 0.271*x, 0.5*x, 0.7345*x, 0.265*x, 0.505*x, 0.75*x}
    local holePositionY = {0.55*y, 0.55*y, 0.55*y, 0.355*y, 0.355*y, 0.355*y, 0.15*y, 0.15*y, 0.15*y}

    local tempOrder = 0
    for i = 1, #self._hole do
        local shrew = self._hole[i]:getChildByTag(1)

        if shrew then
            local nx = holePositionX[i] - shrew:getBoundingBox().width*0.5
            local ny = holePositionY[i]
            self._hole[i]:setPosition(cc.p(nx, ny))
            shrew:setCanSeeViewRect()
            tempOrder = math.floor((i - 1) / 3)

            if tempOrder == 0 then
                self._bg:addChild(self._hole[i], 3)
            elseif tempOrder == 1 then           
                self._bg:addChild(self._hole[i], 7)
            else
                self._bg:addChild(self._hole[i], 11)
            end

        end

    end

end


function GameViewSewer:showBubble1()

    local animFrames = {}
    for i = 1, 13 do
        local resName = string.format("bubble_%d.png",i)
        local pFrame = cc.SpriteFrameCache:getInstance():getSpriteFrame(resName)
        animFrames[i] = pFrame
    end

    self._bubble1 = cc.Sprite:createWithSpriteFrame(animFrames[1])
    
    math.newrandomseed()
    local num = math.random(0,10)  
    local temp =num/10
    self._bubble1:setPosition(cc.p(self._bgBoundingSize.width * temp, self._bgBoundingSize.height * (0.56 + temp *0.15)))
    self._bg:addChild(self._bubble1)
    self._bubble1:setTag(23)
    
    local animation = cc.Animation:createWithSpriteFrames(animFrames, 0.25) --这里定义了每一帧，和动画的间隔时间
    local animate = cc.Animate:create(animation) --这里创建了动画的Action
    local seq = cc.Sequence:create(animate, cc.CallFunc:create(handler(self, self.bubble_callBack1)))  
    self._bubble1:runAction(seq)
    
end

function GameViewSewer:showBubble2()

    local animFrames = {}
    for i = 1, 10 do
        local resName = string.format("bubble_2_%d.png",i)
        local pFrame = cc.SpriteFrameCache:getInstance():getSpriteFrame(resName)
        animFrames[i] = pFrame
    end

    self._bubble2 = cc.Sprite:createWithSpriteFrame(animFrames[1])

    math.newrandomseed()
    local num = math.random(1,10)  
    local temp = num/10
    self._bubble2:setPosition(cc.p(self._bgBoundingSize.width * temp, self._bgBoundingSize.height * (0.56 + temp *0.15)))
    self._bg:addChild(self._bubble2)
    self._bubble2:setTag(22)

    local animation = cc.Animation:createWithSpriteFrames(animFrames, 0.25) --这里定义了每一帧，和动画的间隔时间
    local animate = cc.Animate:create(animation) --这里创建了动画的Action
    local seq = cc.Sequence:create(animate, cc.CallFunc:create(handler(self, self.bubble_callBack2)))  
    self._bubble2:runAction(seq)

end

function GameViewSewer:bubble_callBack1()
   
    self._bg:removeChildByTag(23)
    self:showBubble1()
     
end

function GameViewSewer:bubble_callBack2()

    self._bg:removeChildByTag(22)
    self:showBubble2()
    
end
return GameViewSewer