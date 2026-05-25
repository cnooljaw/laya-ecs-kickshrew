--[[
太空地图
@author lsd
]]

local GameViewSpace = class("GameViewSpace",shrew.view.GameView)

function GameViewSpace:ctor()

    GameViewSpace.super.ctor(self)
    
    self:init()
end

function GameViewSpace:init()

    GameViewSpace.super.init(self)

    --加载资源列表
    cc.SpriteFrameCache:getInstance():addSpriteFrames("kickshrew_game_view_moon.plist")
    cc.SpriteFrameCache:getInstance():addSpriteFrames("kickshrew_game_view_moonbg.plist")

    self._mapType = shrewData.Map.Space
    self:setScene()
    self._showFrame = false


end


function GameViewSpace:onExit()

    GameViewSpace.super.onExit(self)

    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("kickshrew_game_view_moon.plist")
    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("kickshrew_game_view_moonbg.plist")

end


function GameViewSpace:setScene()
    
    --背景
    local spaceBg = cc.Sprite:createWithSpriteFrameName("moon_bg01.png")
    spaceBg:setPosition(self._winSize.width * 0.5,self._winSize.height - spaceBg:getContentSize().height * 0.5)
    self._backLayer:addChild(spaceBg)
    
    local bg = cc.Sprite:createWithSpriteFrameName("moon_bg02.png")
    bg:setPosition(self._winSize.width * 0.5,self._winSize.height * 0.5)
    self._backLayer:addChild(bg)
    
    --[[
    --火箭
    local rocket = cc.Sprite:createWithSpriteFrameName("moon_rocket_rise01.png") 
    rocket:setPosition(self._winSize.width * 0.5,self._winSize.height * 0.5)
    self._backLayer:addChild(rocket)
    --]]
    local boundingSize = bg:getBoundingBox() --boundingSize为素材实际放大的尺寸， 可以超出屏幕外
    
    --土星
    local saturn1 = cc.Sprite:createWithSpriteFrameName("moon_saturn_1.png") 
    saturn1:setPosition(boundingSize.width*0.34, boundingSize.height*0.835)
    self._backLayer:addChild(saturn1, 2)
    saturn1:setScale(0.7)
    
    local saturn2 = cc.Sprite:createWithSpriteFrameName("moon_saturn_1.png") 
    saturn2:setPosition(boundingSize.width*0.82, boundingSize.height*0.78)
    self._backLayer:addChild(saturn2, 2)
    saturn2:setScale(0.4)
    
    self._saturn = cc.Sprite:createWithSpriteFrameName("moon_saturn_1.png") 
    self._saturn:setPosition(boundingSize.width*0.72, boundingSize.height*0.825)
    self._backLayer:addChild(self._saturn, 2)
    
    --土星光圈转动动画
    local delay = cc.DelayTime:create(0.5)
    local seq = cc.Sequence:create(delay, cc.CallFunc:create(handler(self,self.doRoate)))
    self._saturn:runAction(cc.RepeatForever:create(seq))
    
    --蒙版，为了遮住地鼠
    local cover1 = cc.Sprite:createWithSpriteFrameName("moon_1.png")
    cover1:setAnchorPoint(cc.p(0,0))
    cover1:setPosition(cc.p(0, 0))
    bg:addChild(cover1, 7)

    local cover2 = cc.Sprite:createWithSpriteFrameName("moon_2.png")
    cover2:setAnchorPoint(cc.p(0,0))
    cover2:setPosition(cc.p(0, cover1:getBoundingBox().height))
    bg:addChild(cover2, 5)

    local cover3 = cc.Sprite:createWithSpriteFrameName("moon_3.png")
    cover3:setAnchorPoint(cc.p(0,0))
    cover3:setPosition(cc.p(0, cover1:getBoundingBox().height + cover2:getBoundingBox().height))
    bg:addChild(cover3, 3)


    --显示地鼠
    self:showRandShrew(self._mapType)

    local x = boundingSize.width
    local y = boundingSize.height   
    local holePositionX = {0.2852*x, 0.4963*x, 0.713*x, 0.275*x, 0.5*x, 0.732*x, 0.263*x, 0.505*x, 0.745*x}
    local holePositionY = {0.555*y, 0.555*y, 0.555*y, 0.365*y, 0.365*y, 0.365*y, 0.155*y, 0.155*y, 0.155*y}

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
                bg:addChild(self._hole[i], 2)
            elseif tempOrder == 1 then           
                bg:addChild(self._hole[i], 4)
            else
                bg:addChild(self._hole[i], 6)
            end

        end

    end
end


--[[
土星动画
--]]
function GameViewSpace:doRoate()
    
    if self._showFrame == true then
        self._showFrame = false
        if self._saturn then
            self._saturn:setSpriteFrame("moon_saturn_1.png")
        end
        
    elseif self._showFrame == false then
        self._showFrame = true
        if self._saturn then
            self._saturn:setSpriteFrame("moon_saturn_2.png")
        end
    end
     
end

return GameViewSpace