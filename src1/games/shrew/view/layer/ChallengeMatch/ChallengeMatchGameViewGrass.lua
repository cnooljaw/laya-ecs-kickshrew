--[[
草地地图
@author pjchow
]]

local ChallengeMatchGameViewGrass = class("ChallengeMatchGameViewGrass",shrew.view.ChallengeMatchGameView)

function ChallengeMatchGameViewGrass:ctor()

    ChallengeMatchGameViewGrass.super.ctor(self)
    self:init()
end

function ChallengeMatchGameViewGrass:init()

    ChallengeMatchGameViewGrass.super.init(self)
     
    --加载资源列表
    cc.SpriteFrameCache:getInstance():addSpriteFrames("game_view_grass.plist")
    cc.SpriteFrameCache:getInstance():addSpriteFrames("game_view_grassbg.plist")
    
    self._mapType = shrewData.Map.Meadow
    self:setScene()
    --隐藏银子和雷锤
    self._playerinfo:setChallengeMatchView()
end

function ChallengeMatchGameViewGrass:onExit()

    ChallengeMatchGameViewGrass.super.onExit(self)
    
    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("game_view_grass.plist")
    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("game_view_grassbg.plist")
   
end

function ChallengeMatchGameViewGrass:setScene()

    local bg = cc.Sprite:createWithSpriteFrameName("shrew_grass_bg.png")
    bg:setPosition(cc.p(self._winSize.width * 0.5, self._winSize.height * 0.5))
    self._backLayer:addChild(bg, 0)

    
    local boundingSize = bg:getBoundingBox() --boundingSize为素材实际放大的尺寸， 可以超出屏幕外
    
    --蒙版，为了遮住地鼠
    local cover1 = cc.Sprite:createWithSpriteFrameName("grass_cover_1.png")
    cover1:setAnchorPoint(cc.p(0,0))
    cover1:setPosition(cc.p(0, 0))
    bg:addChild(cover1, 7)
    
    local cover2 = cc.Sprite:createWithSpriteFrameName("grass_cover_2.png")
    cover2:setAnchorPoint(cc.p(0,0))
    cover2:setPosition(cc.p(0, cover1:getBoundingBox().height))
    bg:addChild(cover2, 5)
    
    local cover3 = cc.Sprite:createWithSpriteFrameName("grass_cover_3.png")
    cover3:setAnchorPoint(cc.p(0,0))
    cover3:setPosition(cc.p(0, cover1:getBoundingBox().height + cover2:getBoundingBox().height))
    bg:addChild(cover3, 3)
    
    local bird = cc.Sprite:create("shrew_ladybird.png")
    cover1:addChild(bird)
    bird:setPosition(cc.p(cover1:getBoundingBox().width*0.52, cover1:getBoundingBox().height*0.62))
    
    --显示地鼠
    self:showRandShrew(self._mapType)
    
    local x = boundingSize.width
    local y = boundingSize.height   
    local holePositionX = {0.2855*x, 0.496*x, 0.714*x, 0.275*x, 0.501*x, 0.732*x, 0.2645*x, 0.5052*x, 0.749*x}
    local holePositionY = {0.56*y, 0.56*y, 0.56*y, 0.37*y, 0.37*y, 0.37*y, 0.162*y, 0.165*y, 0.165*y}
    
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
    

            --测试用，显示可敲区域   
            -- local hitArea_x = shrew:convertToWorldSpace(cc.p(0,0)).x
            -- local hitArea_y = shrew:convertToWorldSpace(cc.p(0,0)).y
            -- local hitArea_width = shrew:getBoundingBox().width*1.2
            -- local hitArea_height = shrew:getBoundingBox().height                
            -- local hitArea = cc.rect(hitArea_x, hitArea_y, hitArea_width, hitArea_height)
            
            -- local drawNode = cc.DrawNode:create()
            -- drawNode:drawLine( cc.p(hitArea_x,hitArea_y), cc.p(hitArea_x, hitArea_y + hitArea_height), cc.c4f(1,1,1,1))
            -- drawNode:drawLine( cc.p(hitArea_x,hitArea_y), cc.p(hitArea_x + hitArea_width, hitArea_y), cc.c4f(1,1,1,1))
            -- drawNode:drawLine( cc.p(hitArea_x + hitArea_width, hitArea_y), cc.p(hitArea_x + hitArea_width, hitArea_y + hitArea_height), cc.c4f(1,1,1,1))
            -- drawNode:drawLine( cc.p(hitArea_x, hitArea_y+hitArea_height), cc.p(hitArea_x +hitArea_width, hitArea_y + hitArea_height), cc.c4f(1,1,1,1))
            -- self:addChild(drawNode,999999)
        end
       
        
    end
    

    
end

--[[
--]]
function ChallengeMatchGameViewGrass:doChangeScene()

     for i = 1, #self._hole do
        if self._hole[i] then
        	self._hole[i]:removeAllChildren()
        end
     end
     
end

return ChallengeMatchGameViewGrass