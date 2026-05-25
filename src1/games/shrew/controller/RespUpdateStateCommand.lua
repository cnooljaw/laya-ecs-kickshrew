local RespUpdateStateCommand = class("RespUpdateStateCommand",puremvc.SimpleCommand)


function RespUpdateStateCommand:execute(note)
    --Log.i("RespUpdateStateCommand:execute")
    local proxy = self.facade:retrieveProxy(shrew.model.RoomProxy.NAME)
    local mediator = self.facade:retrieveMediator(shrew.view.RoomViewMediator.NAME)
    local message = note:getBody()

    local tableSeatProxy = self.facade:retrieveProxy(common.model.TableSeatProxy.NAME)
    local globalProxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
    local playerProxy = self.facade:retrieveProxy(common.model.PlayerProxy.NAME)

    local gameState = message:getGameState()
    local playerId = message:getPlayerId()
    local tableId = message:getTableId()
    local seatId = message:getSeatId()
    local player = playerProxy:getPlayer(playerId)

    local playerDict = playerProxy.playerDict
    local oldPlayerId =  tableSeatProxy:getPlayerId(tableId, seatId)

    if  oldPlayerId > 0 then
        local oldPlayer = playerProxy:getPlayer(oldPlayerId)
        if oldPlayer ~= nil then
            oldPlayer.mTableId = 65535
            oldPlayer.mSeatId = 65535
            oldPlayer.mGameState = 0
            playerProxy:updatePlayer(oldPlayerId,  oldPlayer) 
        end
        if mediator~= nil and globalProxy._currentRoom.roomId == 61002 then
            mediator:standUp(playerId)
            --self:sendNotification(AppEvents.ssd.mediator.standup, {playerId}) 
        end
    end

    if player ~= nil then
        player.mTableId = tableId
        player.mSeatId = seatId
        player.mGameState = gameState
        playerProxy:updatePlayer(playerId,  player) 
        if (tableId >= 0 and tableId < globalProxy._currentRoom.maxTables)  then          
            if gameState > 2 then
                tableSeatProxy:updateTableState(tableId,1) 
            end  
            Log.i( "updateState  >>>>>>  tableId: " .. tableId .. "seatId: " .. seatId .. "playerId: " .. playerId)
            tableSeatProxy:updateStateWithTableId(tableId, seatId, playerId)        
        end
        if tableId <  globalProxy._currentRoom.maxTables  and playerId ~= globalProxy._myPlayerVo.playerId  then
            if globalProxy._currentRoom.roomId == 61002 and mediator ~= nil then
                mediator:sitDown(tableId, seatId, playerId)
                --self:sendNotification(AppEvents.ssd.mediator.sitdown, {tableId, seatId, playerId})
            end
        end 
        --判断断线重连
        if playerId == globalProxy._myPlayerVo.playerId then
            if (tableId >= 0 and tableId < AppMacros.MAX_TABLE) and (seatId >= 0 and seatId < AppMacros.MAX_SEATS)  then
                globalProxy._currentTableId = tableId
                globalProxy._isResume = true  
            end            
        end
    end  
end

return RespUpdateStateCommand