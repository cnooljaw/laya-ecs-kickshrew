--[[
自己的获奖信息Item
@author lsd
]]
local RewardInfoItem = class("RewardInfoItem",function ()
    return cc.Layer:create()
end)

function RewardInfoItem:ctor()

    self._winSize = cc.Director:getInstance():getWinSize()

    self:init()
end

function RewardInfoItem:init()
 
    --分割线
    self._line = cc.Sprite:createWithSpriteFrameName("line.png")
    self:addChild(self._line)
    self._line:setAnchorPoint(cc.p(0,0))
    self._line:setVisible(false)
    
    --具体获奖信息
    self._itemInfo = cc.LabelTTF:create("", "Arial", self._winSize.height * 0.042)
    self:addChild(self._itemInfo)
    self._itemInfo:setColor(cc.c3b(80, 122, 160))
    self._itemInfo:setAnchorPoint(cc.p(0,0))
    self._itemInfo:setPosition(self._winSize.width * 0.005, self._line:getContentSize().height * 4.5)
   
      
end


--[[
获取item的高
--]]
function RewardInfoItem:getItemHeight()

    local nHeight = self._line:getContentSize().height * 7 + self._winSize.height * 0.042
    return nHeight
end


--[[
更新数据
--]]
function RewardInfoItem:updataItem(itemInfo)
    self._itemInfo:setString(itemInfo)
    self._line:setVisible(true)
end

return RewardInfoItem