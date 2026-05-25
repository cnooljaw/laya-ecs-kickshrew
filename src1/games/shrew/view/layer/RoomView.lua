--[[
房间视图类
@author lsd
]]
local PlayerSprite = require("games.passcard.view.ui.PlayerSprite")
local BaseRoomView = require("common.view.layer.BaseRoomView")
local TableSprite = common.view.TableSprite
local SeatSprite = common.view.SeatSprite
local RoomView = class("RoomView",BaseRoomView)
local ProblemView = require("common.view.ui.ProblemView")

function RoomView:ctor()
    RoomView.super.ctor(self)

end


function RoomView:showTitle()
    cc.SpriteFrameCache:getInstance():addSpriteFrames("res/common/common_hallView_label.plist")
    local treeL = cc.Sprite:createWithSpriteFrameName("treeL.png")
    treeL:setAnchorPoint(cc.p(0,1))
    treeL:setPosition(0,self._winSize.height)
    self._frontLayer:addChild(treeL)

    self._titleSprite = cc.Sprite:createWithSpriteFrameName("room_title.png")
    self._titleSprite:setPosition(self._winSize.width* 0.5,self._winSize.height - self._titleSprite:getContentSize().height* 0.8)
    self._frontLayer:addChild(self._titleSprite)


    local roomName = cc.Sprite:createWithSpriteFrameName("shrew_room_name.png")
    roomName:setPosition(self._titleSprite:getContentSize().width/2,self._titleSprite:getContentSize().height/2)
    self._titleSprite:addChild(roomName)

end

function RoomView:showTableItemList()
    local maxTables = self._maxTable
    local tableSeatProxy = myAppFacade:retrieveProxy(common.model.TableSeatProxy.NAME)
    --for varTable=0, 2 do
    for varTable=0, maxTables - 1 do
        local tableSprite = TableSprite.new(varTable)
        tableSprite:setPosition((varTable + 1)*self._tableContainerWidth-self._tableContainerWidth*0.5,self._winSize.height*0.46)
        self._middleLayer:addChild(tableSprite)
        table.insert(self._tableSpriteTable,varTable,tableSprite)
        local maxSits = 2
        for varSeat=0, maxSits - 1 do
            local seatSprite = SeatSprite.new(maxSits, varTable,varSeat,tableSprite:getContentSize())
            --            seatSprite:setAnchorPoint(cc.p(0,0))
            tableSprite:addChild(seatSprite)
            local seatIdx = (varTable) * maxSits + varSeat
            table.insert(self._seatSpriteTable,seatIdx+1,seatSprite)

            local tableSeatProxy = myAppFacade:retrieveProxy(common.model.TableSeatProxy.NAME)
            local playerId = tableSeatProxy:getPlayerId(varTable, varSeat)            
            if playerId ~= nil then
                self:sitDown(varTable, varSeat, playerId)
                local playerProxy = myAppFacade:retrieveProxy(common.model.PlayerProxy.NAME)
                local player = playerProxy:getPlayer(playerId)
                if player and player.mGameState == 2 then
                    self:playerReady(playerId)
                end
            end

            local tableState = tableSeatProxy:getTableState(varTable)
            if tableState == 1 then
                tableSprite:setState(true)
            else
                tableSprite:setState(false)
            end
        end
    end
    self:onTouch()
end

--function RoomView:showPlayersInTable()
--    Log.i("RoomView:showPlayersInTable")
--    local tableSeatProxy = myAppFacade:retrieveProxy(common.model.TableSeatProxy.NAME)
--    for varTable = 0, self._maxTable -1 do
--        for varSeat=0, 1 do
--            local playerId = tableSeatProxy:getPlayerId(varTable, varSeat)
--            if playerId > 0 then
--                self:sitDown(varTable, varSeat, playerId)
--            end
--        end
--    end
--end

function RoomView:onEnter()
    self:printOnEnter()
end

function RoomView:onExit()
    self:printOnExit()
    --    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile()
end


function RoomView:sitDown(tableId, seatId, playerId)
    --位置数量
    local tablePlayer = 2
    local index  = 0
    if tableId > 1 then
        index = (tableId-1) * tablePlayer + seatId
    else
        index = seatId
    end

    if tableId >= 65535 or seatId >= 65535 then
        return 
    end 

    local seatSprite = self._seatSpriteTable[index+1]
    if seatSprite then
        local playerProxy = myAppFacade:retrieveProxy(common.model.PlayerProxy.NAME)
        local player = playerProxy:getPlayer(playerId)
        if player ~= nil then
            local playerSprite = PlayerSprite.new(player, seatId)

            local pointX, pointY = seatSprite:getPosition()
            playerSprite:setPosition(pointX, pointY)
            if self._tableSpriteTable ~= nil then
                --Log.i("tableid is :", tableId)
                self._tableSpriteTable[tableId]:addChild(playerSprite)
                self._playerSpriteTable[playerId] = playerSprite
            end
        end
    end
end




function RoomView:goGame()

end


function RoomView:standUp(playerId)
    local playerSprite = self._playerSpriteTable[playerId]
    if playerSprite then
        playerSprite:removeFromParent()
        self._playerSpriteTable[playerId] = nil
    end
end

function RoomView:onMenuQuickStartBtnItem()
    Log.i("quickStartBtn-shrew")
end

function RoomView:onMenuBackBtnItem()
    Log.i("backBtn-shrew")
end


function RoomView:onMenuProblemBtnItem()
    self:onViewClickCallBack("goRoomInfoView")
end

function RoomView:showRoomInfoView()

    local roomProxy = myAppFacade:retrieveProxy(shrew.model.RoomProxy.NAME)   
    local problemview = ProblemView.new("",roomProxy._roomInfo)
    self._backLayer:addChild(problemview)
end


return RoomView

