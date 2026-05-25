--[[
每周排行
@author lsd
]]
local RewardInfoView = class("WeekRankView",function ()
    return cc.Layer:create()
end)

function RewardInfoView:ctor()

    self._winSize = cc.Director:getInstance():getWinSize()
    self:init()
end

function RewardInfoView:init()

    local scrollView = cc.ScrollView:create()
    self._contentLayer = cc.Layer:create()


    self._items = {}
    local nItemsHeight

    for i = 1, 10 do
        self._items[i] = shrew.view.RewardInfoItem.new()
        self._contentLayer:addChild(self._items[i])  

        nItemsHeight = self._items[1]:getItemHeight() * 10 
        local nOffy =  self._items[1]:getItemHeight() * 9  
        self._items[i]:setPosition(0,nOffy -(i - 1) * self._items[i]:getItemHeight())
    end


    --实现滚动效果
    self._contentLayer:setContentSize(cc.size(self._winSize.width,nItemsHeight))

    scrollView:setViewSize(cc.size(self._winSize.width * 0.7, self._items[1]:getItemHeight() * 4.9 ))
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

--[[
更新个人信息数据
--]]
function RewardInfoView:updataRewardInfo(rewardInfo)
    
    local safeCount = 10   --保留的条数
    if #rewardInfo > safeCount then
        --保留最新的10条信息
        for i = 1, safeCount do     
            self._items[i]:updataItem(rewardInfo[(#rewardInfo - safeCount) + (i - 1)])    
        end
    else
        for i = 1, #rewardInfo do     
            self._items[i]:updataItem(rewardInfo[i])    
        end
    end
    
end

return RewardInfoView