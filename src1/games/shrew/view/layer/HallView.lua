--[[
房间选择大厅类
@author pjchow
@data 15-09-16
]]

local BaseHallView = require("common.view.layer.BaseHallView")
local HallView = class("HallView", BaseHallView)

function HallView:ctor(roomListData, myPlayer)

    self._roomList = roomListData
    self._player = myPlayer
    HallView.super.ctor(self)
    self._winSize = cc.Director:getInstance():getWinSize()
    self:showMainView()
end

--[[
显示主界面
--]]
function HallView:showMainView()

    self._batchNode = cc.SpriteBatchNode:create("res/common/common_gamelistview.png")
    self._middleLayer:addChild(self._batchNode)

    self._roomItemsLayer = cc.Sprite:create()
    self:addChild(self._roomItemsLayer)

    --背景
    local bg = cc.Sprite:create("res/common/common_gamelistview_bg.png")
    bg:setPosition(self._winSize.width/2,self._winSize.height/2)
    self:addChild(bg)
    self:setScaleBg(bg)
    --添加标题栏的按钮
    self:reAddTopButtons()
    --更新用户信息
    self:refreshPersonalInfo()
    --更新银子
    self:updateMoney()

    local function menuCallbackEnterRoom(room)
        self:onViewClickCallBack(room)
        Log.i("----------menuCallbackEnterRoom")
    end

    --房间列表
    local roomSize = cc.size(self._winSize.width,self._winSize.height*0.45)
    local roomTable =  shrew.view.RoomTableView.new(self._roomList, roomSize, menuCallbackEnterRoom)
    roomTable:setPosition(0,self._winSize.height * 0.2)
    self:addChild(roomTable)

    local topBg = cc.Sprite:createWithSpriteFrameName("common_gamelistview_bg_top.png")
    topBg:setPosition(self._winSize.width/2, self._winSize.height - topBg:getContentSize().height/2)
    self:addChild(topBg)

    local title = cc.Sprite:createWithSpriteFrameName("shrew_hallview_title.png")
    title:setPosition(self._winSize.width/2, self._winSize.height - topBg:getContentSize().height/2)
    self:addChild(title)

end

function HallView:doEnterRoomFail(msg)
    doMsgBox(self,msg ,handler(self,self.onViewClickCallBack), "thenDo")
end

function HallView:onEnter()
    self:printOnEnter()
end

function HallView:onExit()
    self:printOnExit()
    --cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("res/common/common_hallView_label.plist")
    --cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("res/common/common_gamelistview.plist")
--    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("res/common/common_hallView.plist")
end

return HallView