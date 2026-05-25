--[[
左边弹出框类
@author lsd
]]

local GameInfoTableView = class("GameInfoTableView",function ()
    return cc.Layer:create()
end)

function GameInfoTableView:ctor(callback)
    
    self._callBack = callback
    self._winSize = cc.Director:getInstance():getWinSize()
    --加载资源
    cc.SpriteFrameCache:getInstance():addSpriteFrames("kickshrew_game_view_drawer.plist")
    
    self:init()
end

function GameInfoTableView:init()

    self._viewBg = cc.Sprite:createWithSpriteFrameName("game_drawerBg.png")
    self._viewBgSize = self._viewBg:getContentSize()
    self:addChild(self._viewBg)
    self._viewBg:setAnchorPoint(cc.p(0,0))
    self._viewBg:setPosition(- self._viewBg:getContentSize().width, self._winSize.height * 0.1)
    
    self._tableBg = cc.Sprite:createWithSpriteFrameName("game_table_bg.png")
    self._tableBgSize = self._tableBg:getContentSize()
    self._viewBg:addChild(self._tableBg)
    self._tableBg:setPosition(self._viewBgSize.width * 0.5, self._viewBgSize.height * 0.4)
    
    self:addBtn()

   
    --个人获奖信息
    self._rewardInfoView = shrew.view.RewardInfoView.new()
    self._tableBg:addChild(self._rewardInfoView)
    self._rewardInfoView:setPosition(self._tableBgSize.width * 0.005, -self._tableBgSize.height * 0.012)
    
end

function GameInfoTableView:onExit()

    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("kickshrew_game_view_drawer.plist")
end

--[[
更新每周排名信息

--]]
function GameInfoTableView:updataWeekRankView(rankInfo)
    if self._weekRankView ~= nil then
        self._weekRankView:removeFromParent()
        self._weekRankView = nil
    end
    
    self._weekRankView = shrew.view.WeekRankView.new(rankInfo)
    self._tableBg:addChild(self._weekRankView)
    self._weekRankView:setPosition(self._tableBgSize.width * 0.005, self._tableBgSize.height * 0.015)
    self._weekRankView:setVisible(false)
    
end

--[[
更新个人信息数据
--]]
function GameInfoTableView:updataRewardInfo(rewardInfo)

    self._rewardInfoView:updataRewardInfo(rewardInfo)
end

--[[
增加按钮
]]
function GameInfoTableView:addBtn()

    local menu = cc.Menu:create()
    menu:setPosition(0 ,0)
   
    --退出游戏按钮
    local btnExit_Normal = cc.Sprite:createWithSpriteFrameName("game_back_up.png")
    local btnExit_Down = cc.Sprite:createWithSpriteFrameName("game_back_down.png")
    self._menuExitBtnItem = cc.MenuItemSprite:create(btnExit_Normal, btnExit_Down)

    self._menuExitBtnItem:registerScriptTapHandler(handler(self,self.onMenuExitBtnItem))
    self._menuExitBtnItem:setAnchorPoint(cc.p(0,0))
    self._menuExitBtnItem:setPosition(self._viewBgSize.width * 0.03,self._viewBgSize.height * 0.79)
    menu:addChild(self._menuExitBtnItem)
    
    --小耳朵按钮
    local btnEar_Normal = cc.Sprite:createWithSpriteFrameName("game_drawer_handles_up.png")
    local btnEar_Down = cc.Sprite:createWithSpriteFrameName("game_drawer_handles_down.png")
    self._menuEarBtnItem = cc.MenuItemSprite:create(btnEar_Normal, btnEar_Down)

    self._menuEarBtnItem:registerScriptTapHandler(handler(self,self.onMenuEarBtnItem))
    self._menuEarBtnItem:setAnchorPoint(cc.p(0,0))
    self._menuEarBtnItem:setPosition(self._viewBgSize.width * 1, (self._viewBgSize.height - self._menuEarBtnItem:getContentSize().height)/2)
    menu:addChild(self._menuEarBtnItem)


    local proxy = myAppFacade:retrieveProxy(common.model.GlobalProxy.NAME)
    local roomId = proxy._currentRoom.roomId
    local titleNormalFile = "game_weekRank_title_normal.png"
    local titleSelectedFile = "game_weekRank_title_selected.png"
    if roomId == 61011 then
        titleNormalFile = "game_currentRank_title_normal.png"
        titleSelectedFile = "game_currentRank_title_selected.png"
    end
    --每周排行按钮
    local btnWeekRank_Normal = cc.Sprite:createWithSpriteFrameName(titleNormalFile)
    local btnWeekRank_Down = cc.Sprite:createWithSpriteFrameName(titleSelectedFile)
    self._menuWeekRankBtnItem = cc.MenuItemSprite:create(btnWeekRank_Normal, btnWeekRank_Down)

    self._menuWeekRankBtnItem:registerScriptTapHandler(handler(self,self.onMenuWeekRankBtnItem))
    self._menuWeekRankBtnItem:setAnchorPoint(cc.p(0,0))
    self._menuWeekRankBtnItem:setPosition(self._viewBgSize.width * 0.3,self._viewBgSize.height * 0.773)
    menu:addChild( self._menuWeekRankBtnItem)
    


    --个人信息按钮
    local btnPlayerInfo_Normal = cc.Sprite:createWithSpriteFrameName("game_playerInfo_title_normal.png")
    local btnPlayerInfo_Down = cc.Sprite:createWithSpriteFrameName("game_playerInfo_title_selected.png")
    self._menuPlayerInfoBtnItem = cc.MenuItemSprite:create(btnPlayerInfo_Normal, btnPlayerInfo_Down)

    self._menuPlayerInfoBtnItem:registerScriptTapHandler(handler(self,self.onMenuPlayerInfoBtnItem))
    self._menuPlayerInfoBtnItem:setAnchorPoint(cc.p(0,0))
    self._menuPlayerInfoBtnItem:setPosition(self._viewBgSize.width * 0.63,self._viewBgSize.height * 0.773)
    menu:addChild(self._menuPlayerInfoBtnItem)
    self._menuPlayerInfoBtnItem:selected()

    self._viewBg:addChild(menu,2)

end

--[[
退出游戏按钮回调函数
]]
function GameInfoTableView:onMenuExitBtnItem()
    Log.i("GameInfoTableView:onMenuExitBtnItem()")
    self._callBack("gameexit")
end


--[[
每周排行按钮回调函数
]]
function GameInfoTableView:onMenuWeekRankBtnItem()

    self._menuWeekRankBtnItem:selected() 
    self._menuPlayerInfoBtnItem:unselected()  
    
    if self._weekRankView ~= nil then
        self._weekRankView:setVisible(true)
    end
    
    if self._rewardInfoView ~= nil then
        self._rewardInfoView:setVisible(false)
    end
    

end

--[[
个人信息按钮回调函数
]]
function GameInfoTableView:onMenuPlayerInfoBtnItem()

    self._menuPlayerInfoBtnItem:selected() 
    self._menuWeekRankBtnItem:unselected()  
    
    
    if self._weekRankView ~= nil then
        self._weekRankView:setVisible(false)
    end

    if self._rewardInfoView ~= nil then
        self._rewardInfoView:setVisible(true)
    end

end

--[[
小耳朵按钮回调函数
]]
function GameInfoTableView:onMenuEarBtnItem()
        
    --动画
    local newPoint
    if  self._viewBg:getPositionX() == 0 then
        newPoint = cc.p(- self._viewBg:getContentSize().width, self._winSize.height * 0.1)
    else
        newPoint = cc.p(0, self._winSize.height * 0.1)
    end
    
    local actionMove = cc.MoveTo:create(0.2,newPoint)
    local moveAction = cc.Sequence:create(actionMove,nil)
    self._viewBg:runAction(moveAction)
    
end


return GameInfoTableView