--[[
每周排行Item
@author lsd
]]
local WeekRankItem = class("WeekRankItem",function ()
    return cc.Layer:create()
end)

function WeekRankItem:ctor(rank, name, xingyun)

    self._winSize = cc.Director:getInstance():getWinSize()
    self._rank = rank

    if #name >12 then
        self._name = GetShortName(name,12) .. ".."
    else
        self._name = name
    end
    
    self._xingyun = xingyun
    
    self:init()
end

function WeekRankItem:init()
 
   
    --背景前部分
    self._itemBgQian = cc.Sprite:createWithSpriteFrameName("game_table_bg_qian.png")
    self:addChild(self._itemBgQian)
    self._itemBgQian:setAnchorPoint(cc.p(0,0))
    
    --排名
    if self._rank <= 3 and self._rank > 0 then
        local temp = string.format("item/item_%d.png",self._rank)
        self._iconRank = cc.Sprite:createWithSpriteFrameName(temp)       
    elseif self._rank > 3 and self._rank < 11 then
        self._iconRank = cc.LabelBMFont:create(self._rank, self:getRankNumFont())
    else
        self._iconRank = cc.LabelBMFont:create("", self:getRankNumFont())
    end
    
    self._itemBgQian:addChild(self._iconRank)
    self._iconRank:setAnchorPoint(cc.p(0,0))
    local px = (self._itemBgQian:getContentSize().width - self._iconRank:getContentSize().width)/2
    local py = (self._itemBgQian:getContentSize().height - self._iconRank:getContentSize().height)/2
    self._iconRank:setPosition(px, py)
    
    --背景后部分
    self._itemBgHou= cc.Sprite:createWithSpriteFrameName("game_table_bg_hou.png")
    self:addChild(self._itemBgHou)
    self._itemBgHou:setAnchorPoint(cc.p(0,0))
    self._itemBgHou:setPosition(self._itemBgQian:getContentSize().width, 0)
    
    --排名具体信息
    self._itemInfo = cc.LabelTTF:create("", "Arial", self._itemBgHou:getContentSize().height * 0.48)
    self._itemBgHou:addChild(self._itemInfo)
    self._itemInfo:setColor(cc.c3b(80, 122, 160))
    self._itemInfo:setAnchorPoint(cc.p(0,0))
    self._itemInfo:setPosition(self._itemBgHou:getContentSize().width * 0.03, self._itemBgHou:getContentSize().height * (1 - 0.48)/2)

    local proxy = myAppFacade:retrieveProxy(common.model.GlobalProxy.NAME)
    local roomId = proxy._currentRoom.roomId
    local temp = nil
    if roomId == 61002 then
        temp = string.format("[%s]幸运值:%d",self._name, self._xingyun)
    elseif roomId == 61011 then
        temp = string.format("[%s]得分:%d",self._name, self._xingyun)
    else
        temp = string.format("[%s]幸运值:%d",self._name, self._xingyun)
    end
    if self._name == "" then temp = "" end
    self._itemInfo:setString(temp)
end


--[[
获取排名数字字体
--]]
function WeekRankItem:getRankNumFont()

    local font 
    local targetPlatform = cc.Application:getInstance():getTargetPlatform()
    if cc.PLATFORM_OS_IPHONE  == targetPlatform or cc.PLATFORM_OS_IPAD == targetPlatform then
        font = "weekrank_id.fnt"
    else
        font = "fonts/weekrank_id.fnt"
    end

    return font
end

--[[
获取item的高
--]]
function WeekRankItem:getItemHeight()
    
    return self._itemBgHou:getContentSize().height
end

   

return WeekRankItem