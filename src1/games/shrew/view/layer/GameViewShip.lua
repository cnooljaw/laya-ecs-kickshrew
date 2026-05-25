--[[
船地图
@author lsd
]]

local GameViewShip = class("GameViewShip",shrew.view.GameView)

function GameViewShip:ctor()

    GameViewShip.super.ctor(self)
    
    self:init()
end

function GameViewShip:init()

    GameViewShip.super.init(self)

    --加载资源列表
    cc.SpriteFrameCache:getInstance():addSpriteFrames("kickshrew_game_view_corsair.plist")
    cc.SpriteFrameCache:getInstance():addSpriteFrames("kickshrew_game_view_corsairbg.plist")

    self._mapType = shrewData.Map.Ship
    self:setScene()


end


function GameViewShip:onExit()

    GameViewShip.super.onExit(self)

    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("kickshrew_game_view_corsair.plist")
    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("kickshrew_game_view_corsairbg.plist")

end


function GameViewShip:setScene()
    
    --天空背景
    local sky = cc.Sprite:createWithSpriteFrameName("corsair_bg01.png")
    sky:setPosition(self._winSize.width * 0.5,self._winSize.height - sky:getContentSize().height * 0.5)
    self._backLayer:addChild(sky, 1)
    
    --云
    local skySize = sky:getBoundingBox()
    local cloud1 = cc.Sprite:createWithSpriteFrameName("corsair_cloud_1.png")
    local cloud2 = cc.Sprite:createWithSpriteFrameName("corsair_cloud_3.png")   
    cloud1:setPosition(skySize.width * 0.25, skySize.height * 0.5)
    cloud2:setPosition(skySize.width * 0.5, skySize.height * 0.7)
    sky:addChild(cloud1)
    sky:addChild(cloud2)
    
    --云动画
    local mAction1 = cc.MoveBy:create(60,cc.p(skySize.width * 0.6, 0))
    local mAction2 = cc.MoveBy:create(60,cc.p(-skySize.width * 0.7, 0))
    cloud1:runAction(cc.RepeatForever:create(mAction1))     --无限循环动画
    cloud2:runAction(cc.RepeatForever:create(mAction2))
    
    --船背景
    local shipBg = cc.Sprite:createWithSpriteFrameName("corsair_bg02.png")
    local px = self._winSize.width - shipBg:getContentSize().width * 0.3
    local py = self._winSize.height - shipBg:getContentSize().height * 0.465
    shipBg:setPosition(px, py)
    self._backLayer:addChild(shipBg, 2)
    
    --船浮动动画
    local down = cc.MoveBy:create(3, cc.p(0, self._winSize.height * 0.015))
    local up = down:reverse()
    local action1 = cc.Sequence:create(down, up)
    shipBg:runAction(cc.RepeatForever:create(action1))
    
    --背景
    local bg = cc.Sprite:createWithSpriteFrameName("corsair_bg03.png")
    bg:setPosition(self._winSize.width/2, self._winSize.height/2)
    self._backLayer:addChild(bg, 3)
    
    
    --蒙版，为了遮住地鼠
    local boundingSize = bg:getBoundingBox() --boundingSize为素材实际放大的尺寸， 可以超出屏幕外

    local cover1 = cc.Sprite:createWithSpriteFrameName("corsair_3.png")
    cover1:setAnchorPoint(cc.p(0,0))
    cover1:setPosition(cc.p(0, 0))
    bg:addChild(cover1, 7)

    local cover2 = cc.Sprite:createWithSpriteFrameName("corsair_2.png")
    cover2:setAnchorPoint(cc.p(0,0))
    cover2:setPosition(cc.p(0, cover1:getBoundingBox().height))
    bg:addChild(cover2, 5)

    local cover3 = cc.Sprite:createWithSpriteFrameName("corsair_1.png")
    cover3:setAnchorPoint(cc.p(0,0))
    cover3:setPosition(cc.p(0, cover1:getBoundingBox().height + cover2:getBoundingBox().height))
    bg:addChild(cover3, 3)


    --显示地鼠
    self:showRandShrew(self._mapType)

    local x = boundingSize.width
    local y = boundingSize.height   
    local holePositionX = {0.286*x, 0.498*x, 0.715*x, 0.276*x, 0.5*x, 0.732*x, 0.265*x, 0.5*x, 0.745*x}
    local holePositionY = {0.55*y, 0.55*y, 0.55*y, 0.365*y, 0.365*y, 0.365*y, 0.15*y, 0.15*y, 0.15*y}

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
--]]
function GameViewShip:doChangeScene()

   

end

return GameViewShip