--[[
锤子列表Item
@author lsd
]]


local HammerListTableItem = class("HammerListTableItem",shrew.view.BaseNode)

function HammerListTableItem:ctor(size)
    HammerListTableItem.super.ctor(self)
    
    --self._info = info
    self._size = size
    self._hammerID = 0
       
    self:init()
end

function HammerListTableItem:init()

    --是否选中背景
    self._hammerBg = cc.Sprite:createWithSpriteFrameName(self:loadIsSelected(false))
    self._hammerBg:setPosition(cc.p(self._size.width * 0.5, self._size.height * 0.5))
    self:addChild(self._hammerBg)
    self._hammerBg:setVisible(false)
    
    --锤子图标
    self._mHammerSprite = cc.Sprite:createWithSpriteFrameName(self:loadHammerSmall(1))
    self._mHammerSprite:setPosition(cc.p(self._hammerBg:getContentSize().width * 0.5, self._hammerBg:getContentSize().height * 0.5))
    self._hammerBg:addChild(self._mHammerSprite)
    
    --锤子价格
    self._moneyLabel_up = cc.LabelBMFont:create("", self:getPriceNumFont())
    self._moneyLabel_up:setPosition(cc.p(self._hammerBg:getContentSize().width * 0.5, self._hammerBg:getContentSize().height * 0.2))
    self._hammerBg:addChild(self._moneyLabel_up)
    
    --添加 免费锤子数背景 显示
    self._hammerFreeBg = cc.Sprite:createWithSpriteFrameName("game_hammer_countBg.png")
    self._hammerFreeBg:setPosition(cc.p(self._hammerBg:getContentSize().width * 0.1, self._hammerBg:getContentSize().height * 0.8))
    self._hammerBg:addChild(self._hammerFreeBg)
    self._hammerFreeBg:setVisible(false)
    
    --添加 免费锤子数 显示   
    self._hammerFreeCount = cc.LabelTTF:create("", "Arial", self._hammerFreeBg:getContentSize().height * 0.65)
    self._hammerFreeCount:setPosition(cc.p(self._hammerFreeBg:getContentSize().width * 0.48, self._hammerFreeBg:getContentSize().height * 0.5))
    self._hammerFreeBg:addChild(self._hammerFreeCount)
   
   
end

--[[
更新Item
@param hammerID         number类型   锤子ID
@param hammerPrice      number类型   锤子单次敲击价钱 
--]]
function HammerListTableItem:updataItem(hammerID, hammerPrice)
       
    if hammerID > 0 and hammerID < 7 then
        self._hammerID = hammerID
        self._hammerBg:setVisible(true)
        
        self._mHammerSprite:setSpriteFrame(self:loadHammerSmall(hammerID))              
        self._moneyLabel_up:setString(tostring(hammerPrice))

    else
        self._hammerBg:setVisible(false)
    end
end

--[[
更新Item选中状态
@param bSelected        bool类型     是否被选中
--]]
function HammerListTableItem:updataSelectedStatus(bSelected)
    self._hammerBg:setSpriteFrame(self:loadIsSelected(bSelected))
end

--[[
更新免费锤子信息
@param hammerID         number类型   锤子ID
@param freeHammerCount  number类型   免费锤子个数
--]]
function HammerListTableItem:updataFreeHammer(hammerID, freeHammerCount)
    
    if hammerID == self._hammerID then
        
        self._hammerFreeCount:setString(tostring(freeHammerCount))
        if freeHammerCount > 10 then
            self._hammerFreeCount:setScale(0.82)
        end

        if freeHammerCount > 0 then
            self._hammerFreeBg:setVisible(true)
        else
            self._hammerFreeBg:setVisible(false)
        end
        
    end
        
end

--[[
获取锤子价钱的数字字体
--]]
function HammerListTableItem:getPriceNumFont()
    
    local font 
    local targetPlatform = cc.Application:getInstance():getTargetPlatform()
    if cc.PLATFORM_OS_IPHONE  == targetPlatform or cc.PLATFORM_OS_IPAD == targetPlatform then
       font = "hammer_price.fnt"
    else
       font = "fonts/hammer_price.fnt"
    end
    
    return font
end


--[[
加载小锤子资源
@param nHammerId  number类型   锤子ID
--]]
function HammerListTableItem:loadHammerSmall(nHammerId)
   
    local tmpFrameName = string.format("hammer/hammer_small_%d.png",nHammerId)
    return tmpFrameName
end

--[[
加载资源
@param bSelected  bool类型   是否选中状态
--]]
function HammerListTableItem:loadIsSelected(bSelected)

    if bSelected == true then
    	return "hammer/hammer_seleted_ItemBg.png"
    else
        return "hammer/hammer_normal_ItemBg.png"
    end
end

--[[
获取item的高
--]]
function HammerListTableItem:getItemHeight()

    return self._hammerBg:getContentSize().height
end


return HammerListTableItem