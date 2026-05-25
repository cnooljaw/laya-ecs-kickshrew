--[[
左边弹出框类
@author lsd
]]

local HammerListView = class("HammerListView", common.view.BaseView)

function HammerListView:ctor(callback)
    self._callBack = callback
    self._winSize = cc.Director:getInstance():getWinSize()
    --加载资源
    cc.SpriteFrameCache:getInstance():addSpriteFrames("kickshrew_game_view_drawer.plist")
    
    self:init()
end

function HammerListView:onExit()

    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("kickshrew_game_view_drawer.plist")
    
end

function HammerListView:init()
       
    --显示当前使用的锤子按钮
    local preHammerID = cc.UserDefault:getInstance():getIntegerForKey(AppMacros.shrew.preHammerID)
    if preHammerID == 0 then
    	preHammerID = 1
    end
    self:addPreHammerBtn(preHammerID)

    
    --列表界面
    self._hammerList = shrew.view.HammerListTableView.new()
    self._hammerList:setPosition(0,self._hammerList:getViewHeight())
      
    --为列表下放动画确定显示区域
    local shap = cc.DrawNode:create()
    shap:drawSolidRect(cc.p(0,0), cc.p(self._winSize.width,self._hammerList:getViewHeight()), cc.c4f(1,1,0,1)) --创建显示的矩形区域
    local cliper = cc.ClippingNode:create()
    cliper:setStencil(shap)
    cliper:setAnchorPoint(cc.p(0,0))
    cliper:setPosition(0,0)
    self:addChild(cliper)
    cliper:addChild(self._hammerList)
    
    self:addTouchControl()
end

--[[
鼠标事件
--]]
function HammerListView:addTouchControl()

    local  function onTouchBegan(touch, event)
        self._startPoint = touch:getLocation()
        
        for i = 1, 6 do
        
            if self._hammerList._items[i] ~= nil and self:isTouchInRect(self._startPoint, self._hammerList._items[i]._hammerBg) then
                               
                 local preHammerID = self._hammerList._items[i]._hammerID
                 Log.i("点中了：",preHammerID)
                 cc.UserDefault:getInstance():setIntegerForKey(AppMacros.shrew.preHammerID, preHammerID)
                 self:updataSelectedHammer(preHammerID)
                 self._callBack({"changeHammer",preHammerID})
            end
        end
        
                  
        return true
    end

    local function onTouchEnded(touch, event)
        self._endPoint = touch:getLocation()
    end

    local eventDispatcher = cc.Director:getInstance():getEventDispatcher()
    local listener = cc.EventListenerTouchOneByOne:create()
    listener:registerScriptHandler(onTouchBegan,cc.Handler.EVENT_TOUCH_BEGAN )
    listener:registerScriptHandler(onTouchEnded,cc.Handler.EVENT_TOUCH_ENDED )

    eventDispatcher:addEventListenerWithSceneGraphPriority(listener, self)  
end

--[[
显示当前使用的锤子按钮
@param hammerID         number类型   锤子ID
--]]
function HammerListView:addPreHammerBtn(hammerID)

    local fileName = string.format("hammer/hammer_big_%d.png", hammerID)

    self._hammer_1 = cc.Sprite:createWithSpriteFrameName(fileName)
    local hammerBg_up = cc.Sprite:createWithSpriteFrameName("hammer/game_current_hammerBg.png")
    self._hammer_1:setColor(cc.c3b(255,255,255))
    hammerBg_up:setColor(cc.c3b(255,255,255))
    self._hammer_1:setPosition(cc.p(hammerBg_up:getContentSize().width * 0.5, hammerBg_up:getContentSize().height * 0.5))
    hammerBg_up:addChild(self._hammer_1)

    self._hammer_2 = cc.Sprite:createWithSpriteFrameName(fileName)
    local hammerBg_down = cc.Sprite:createWithSpriteFrameName("hammer/game_current_hammerBg.png")
    self._hammer_2:setColor(cc.c3b(166,166,166))
    hammerBg_down:setColor(cc.c3b(166,166,166))
    self._hammer_2:setPosition(cc.p(hammerBg_down:getContentSize().width * 0.5, hammerBg_down:getContentSize().height * 0.5))
    hammerBg_down:addChild(self._hammer_2)


    local menu = cc.Menu:create()
    menu:setPosition(0 ,0)  
    self._menuExitBtnItem = cc.MenuItemSprite:create(hammerBg_up, hammerBg_down)
    local function fun1()
        self:onClickPreHammer()
    end
    self._menuExitBtnItem:registerScriptTapHandler(fun1)
    self._menuExitBtnItem:setAnchorPoint(cc.p(0,0))
    local px = self._winSize.width * 0.9
    local py = self._winSize.height * 0.83
    self._menuExitBtnItem:setPosition(px,py)
    menu:addChild(self._menuExitBtnItem)
    self:addChild(menu, 2)
    
end


function HammerListView:onClickPreHammer()
    
    --动画
    local newPoint
    if  self._hammerList:getPositionY() == 0 then
        newPoint = cc.p(0, self._hammerList:getViewHeight())
    else
        newPoint = cc.p(0, 0)
    end

    local actionMove = cc.MoveTo:create(0.2,newPoint)
    local moveAction = cc.Sequence:create(actionMove,nil)
    self._hammerList:runAction(moveAction)
end

--[[
下拉框是否收起
--]]
function HammerListView:isClosed()
    
    if self._hammerList:getPositionY() == 0 then
    	return false
    else
        return true
    end
    
end

--[[
更新当前选中的锤子
@param hammerID         number类型   锤子ID
--]]
function HammerListView:updataSelectedHammer(hammerID)
    
    --更新当前选中的锤子
    local fileName = string.format("hammer/hammer_big_%d.png", hammerID)
    self._hammer_1:setSpriteFrame(fileName)
    self._hammer_2:setSpriteFrame(fileName)
    
    --更新列表item的选中状态
    self._hammerList:updataSelectedStatus(hammerID)
    
end

--[[
更新Item
@param index            number类型   锤子列表序列号
@param hammerID         number类型   锤子ID
@param hammerPrice      number类型   锤子单次敲击价钱
--]]
function HammerListView:updataItem(index, hammerID, hammerPrice)       
    self._hammerList:updataItem(index, hammerID, hammerPrice)
       
end

--[[
更新免费锤子信息
@param index            number类型   锤子列表序列号
@param hammerID         number类型   锤子ID
@param FreeHammerCount  number类型   免费锤子个数
--]]
function HammerListView:updataFreeHammer(index, hammerID, FreeHammerCount)
    self._hammerList:updataFreeHammer(index, hammerID, FreeHammerCount)
end


return HammerListView