--local RoomTableItem = class("RoomTableItem",function (room,itemSize)
local RoomTableItem = class("RoomTableItem",function ()
    return cc.Sprite:create()
end)


function deepcopy(object)
    local lookup_table = {}
    local function _copy(object)
        if type(object) ~= "table" then
            return object
        elseif lookup_table[object] then
            return lookup_table[object]
        end
        local new_table = {}
        lookup_table[object] = new_table
        for index, value in pairs(object) do
            new_table[_copy(index)] = _copy(value)
        end
        return setmetatable(new_table, getmetatable(object))
    end
    return _copy(object)
end

function RoomTableItem:ctor(room)

    self._winSize = cc.Director:getInstance():getWinSize()
    self._room = deepcopy(room)
    self._startPoint = 0
    self._endPoint = 0
    self:showTableItem()
   
end

--[[
显示房间Item界面
--]]
function RoomTableItem:showTableItem()
    
    --大背景
    local roomBg = cc.Sprite:createWithSpriteFrameName("common_hallView_frame_room.png")

    --根据roomtype获取房间的主背景
    local  index = 0
    if self._room.roomId == 61011 then
        index = 7
    end
    local roomfile = string.format("common_hallView_icon_shrew_room%d.png",index)
    local room = cc.Sprite:createWithSpriteFrameName(roomfile)
    local bgSize = room:getContentSize()
    roomBg:setPosition(bgSize.width/2 ,bgSize.height*0.35)
    
--    --游戏名
--    local gameName = cc.Sprite:createWithSpriteFrameName("passcard_roomitem_title.png")
--    gameName:setPosition(roomBg:getContentSize().width * 0.83, roomBg:getContentSize().height * 0.93)
--    roomBg:addChild(gameName)
    
    --房间名  
    local roomName
    if self._room.name == "打地鼠" then
        roomName = cc.Sprite:createWithSpriteFrameName("shrew_room_name1.png")
    elseif self._room.name == "挑战赛" then
        roomName = cc.Sprite:createWithSpriteFrameName("shrew_room_name2.png")
    else
        roomName = cc.Sprite:createWithSpriteFrameName("shrew_room_name1.png")
    end
    
    roomName:setPosition(roomBg:getContentSize().width * 0.5, roomBg:getContentSize().height * 0.25)
    roomBg:addChild(roomName)
    
    --进入房间的限制条件
    local labelSize = self._winSize.height * 0.023
    local roomEnterLimit = cc.LabelTTF:create("", "Arial", labelSize)
    roomEnterLimit:setPosition(roomBg:getContentSize().width * 0.5, roomBg:getContentSize().height * 0.13)
    roomEnterLimit:setColor(cc.c3b(180,216,235))
    roomBg:addChild(roomEnterLimit)
    roomEnterLimit:setString(self._room.baseScoreText)

    room:addChild(roomBg)
    self:addChild(room)

    
    --按钮消息
    local function onTouchBegan(touch, event)
        Log.i("touch begin")
        self._startPoint = touch:getLocation()
        local point = touch:getLocation()
        if self:isPointInNode(point,roomBg) then
            roomBg:setSpriteFrame("common_hallView_frame_room_down.png")
        end

        return true
    end


    --    local function menuCallback(tag)
    --        local myEvent = cc.EventCustom:new(self:getParent():getParent():getParent():getParent():getParent().__cname .. "." .. AppEvents.Click)
    --        myEvent.data = self._room
    --        cc.Director:getInstance():getEventDispatcher():dispatchEvent(myEvent)
    --    end

    local function onTouchMoved(touch, event)
        Log.i("touch move")
        roomBg:setSpriteFrame("common_hallView_frame_room.png")
    end

    local function onTouchEnded(touch, event)
        Log.i("touch end")

        self._endPoint = touch:getLocation()
        local pos = touch:getLocation()

        local winSize = cc.Director:getInstance():getWinSize()
        local offset = winSize.width/50;
        local distance = cc.pGetDistance(self._endPoint, self._startPoint)
        Log.i("offset, distance", offset, distance)
        if distance > offset then
            return
        end

        local point = touch:getLocation()
        if self:isPointInNode(point,roomBg) then
            roomBg:setSpriteFrame("common_hallView_frame_room.png")
            self._callback(self._room) --处理回调   
            Log.i("self roomType:  ".. self._room.roomType) 
        end
    end
    local eventDispatcher =cc.Director:getInstance():getEventDispatcher()
    local listener = cc.EventListenerTouchOneByOne:create()
    listener:registerScriptHandler(onTouchBegan,cc.Handler.EVENT_TOUCH_BEGAN )
    listener:registerScriptHandler(onTouchMoved,cc.Handler.EVENT_TOUCH_MOVED )
    listener:registerScriptHandler(onTouchEnded,cc.Handler.EVENT_TOUCH_ENDED )

    eventDispatcher:addEventListenerWithSceneGraphPriority(listener, self)  

end


function RoomTableItem:registerCallBack(callback)
    self._callback = callback
end


function RoomTableItem:isPointInNode(pt, node)
    local locationInNode = node:convertToNodeSpace(pt)
    local s = node:getContentSize()
    local rect = cc.rect(0, 0, s.width, s.height)
    if cc.rectContainsPoint(rect, locationInNode) then
        return true
    end
    return false
end

return RoomTableItem