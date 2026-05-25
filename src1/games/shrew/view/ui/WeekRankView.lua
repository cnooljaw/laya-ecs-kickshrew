--[[
每周排行
@author lsd
]]
local WeekRankView = class("WeekRankView",function ()
    return cc.Layer:create()
end)

function WeekRankView:ctor(rankInfo)
    self._rankInfo = rankInfo
    self._winSize = cc.Director:getInstance():getWinSize()
    self:init()
end

function WeekRankView:init()

    local scrollView = cc.ScrollView:create()
    self._contentLayer = cc.Layer:create()
    
        
    self._items = {}
    local nItemsHeight
   
    for i = 1, 10 do

        self._items[i] = shrew.view.WeekRankItem.new(self._rankInfo[i]._num, self._rankInfo[i]._name, self._rankInfo[i]._score)
        self._contentLayer:addChild(self._items[i])  
        
        nItemsHeight = self._items[1]:getItemHeight() * 1.03 * 10 
        local nOffy =  self._items[1]:getItemHeight() * 1.03 * 9  
        self._items[i]:setPosition(0,nOffy -(i - 1) * self._items[i]:getItemHeight() * 1.03)
    end
    
    
    --实现滚动效果
    self._contentLayer:setContentSize(cc.size(self._winSize.width,nItemsHeight))

    scrollView:setViewSize(cc.size(self._winSize.width * 0.7, self._items[1]:getItemHeight() * 1.03 * 5))
    scrollView:setAnchorPoint(cc.p(0,1))
    scrollView:setPosition(0,0)
    scrollView:updateInset()
    scrollView:setContainer(self._contentLayer)

    scrollView:setDirection(1)
    scrollView:setClippingToBounds(true)
    scrollView:setBounceable(true)


    local nContainerSizeY = scrollView:getContentSize().height
    local nViewSizeY = scrollView:getViewSize().height
    scrollView:setContentOffset(cc.p(0, nViewSizeY - nContainerSizeY))
    scrollView:setDelegate()

    self:addChild(scrollView)
    
end

return WeekRankView