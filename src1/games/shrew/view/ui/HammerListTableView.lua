--[[
锤子列表类
@author lsd
]]

local HammerListTableView = class("HammerListTableView",function ()
    return cc.Layer:create()
end)

function HammerListTableView:ctor()
    
    self._winSize = cc.Director:getInstance():getWinSize()
    self._maxHammerCount = 6 --最大锤子个数
    
    self:init()
    
end

function HammerListTableView:init()
    
    
    --列表背景  
    self._mHammerListBg = cc.Sprite:createWithSpriteFrameName("game_hammerList_Bg.png")
    self:addChild(self._mHammerListBg)
    self._mHammerListBg:setAnchorPoint(cc.p(0,0))
    self._mHammerListBg:setPosition(self._winSize.width * 0.9,self._winSize.height * 0)
    
    self:setContentSize(cc.size(self._mHammerListBg:getContentSize().width, self._mHammerListBg:getContentSize().height))
    self._tableSize = cc.size(self._mHammerListBg:getContentSize().width, self._mHammerListBg:getContentSize().height * 0.91)
    

  
    local scrollView = cc.ScrollView:create()
    self._contentLayer = cc.Layer:create()
    
    --列表item
    self._items = {}
    local nItemsHeight = 0
    for i = 1, self._maxHammerCount do
        self._items[i] = shrew.view.HammerListTableItem.new(self._tableSize)
        self._contentLayer:addChild(self._items[i])
        
        nItemsHeight = self._items[1]:getItemHeight() * 1.03 * self._maxHammerCount
        local nOffy = self._mHammerListBg:getPositionY() + self._items[1]:getItemHeight() * 1.03 * (2.5 - (6 - self._maxHammerCount))
        self._items[i]:setPosition(0, nOffy - (i - 1) * self._items[i]:getItemHeight() * 1.03)
    end
            
    --实现滚动效果
    self._contentLayer:setContentSize(cc.size(self._winSize.width,nItemsHeight))

    scrollView:setViewSize(cc.size(self._winSize.width, self._items[1]:getItemHeight() * 1.03 * 6))
    scrollView:setAnchorPoint(cc.p(0,1))
    scrollView:setPosition(self._mHammerListBg:getPositionX(),self._items[1]:getItemHeight() * 0.05)
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
更新Item
@param index            number类型   锤子列表序列号
@param hammerID         number类型   锤子ID
@param hammerPrice      number类型   锤子单次敲击价钱
--]]
function HammerListTableView:updataItem(index, hammerID, hammerPrice)
    
    if index <= self._maxHammerCount then
        self._items[index]:updataItem(hammerID, hammerPrice)
    end           
end

--[[
更新Item选中状态
@param hammerID         number类型   被选中锤子ID
--]]
function HammerListTableView:updataSelectedStatus(hammerID)    
    
    for i = 1, self._maxHammerCount do
       
        if self._items[i]._hammerID == hammerID then
            self._items[i]:updataSelectedStatus(true)
        else
            self._items[i]:updataSelectedStatus(false)
        end
    end
    
end

--[[
更新免费锤子信息
@param index            number类型   锤子列表序列号
@param hammerID         number类型   锤子ID
@param FreeHammerCount  number类型   免费锤子个数
--]]
function HammerListTableView:updataFreeHammer(index, hammerID, FreeHammerCount)

    if index <= self._maxHammerCount then
        self._items[index]:updataFreeHammer(hammerID, FreeHammerCount)
    end
end

--[[
获取界面高
--]]
function HammerListTableView:getViewHeight()

    return self._mHammerListBg:getContentSize().height
end



return HammerListTableView