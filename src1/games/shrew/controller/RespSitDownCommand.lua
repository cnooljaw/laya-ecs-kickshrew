local RespSitDownCommand = class("RespSitDownCommand",puremvc.SimpleCommand)

function RespSitDownCommand:execute(note)
    Log.i("RespSitDownCommand:execute")
    local proxy = self.facade:retrieveProxy(shrew.model.RoomProxy.NAME)
    local mediator = self.facade:retrieveMediator(shrew.view.RoomViewMediator.NAME)
    local message = note:getBody()

    local state = message:getState()
    local playerId = message:getUserId()
    local tableId = message:getTableId()
    local seatId = message:getSeatId()
    local result = message:getResultInfo()
    local isObserver = message:getIsObserver()

   
    local TableSeatProxy = self.facade:retrieveProxy(common.model.TableSeatProxy.NAME)
    local globalProxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
    local playerProxy = self.facade:retrieveProxy(common.model.PlayerProxy.NAME)

    if isObserver == false then
    
        if state == 0 then
            local player = playerProxy:getPlayer(playerId)
            if player ~= nil then
                local oldTableId = player.mTableId
                local oldSeatId = player.mSeatId

                if (oldTableId >= 0 and oldTableId < AppMacros.MAX_TABLE)  and (oldSeatId >= 0 and oldSeatId < AppMacros.MAX_SEATS) then        
                    TableSeatProxy:updateStateWithTableId(oldTableId, oldSeatId, 0)
                    self:sendNotification(AppEvents.shrew.fromServer.standup, {playerId})
                end
                player.mTableId = tableId
                player.mSeatId = seatId
                player.mGameState = 1;

                TableSeatProxy:updateStateWithTableId(tableId, seatId, playerId)
                if tableId <  globalProxy._currentRoom.maxTables then
                    --Log.i( "sitdown  >>>>>>  tableId: " .. tableId .. "seatId: " .. seatId .. "playerId: " .. "playerName: " .. player.username)
                    self:sendNotification(AppEvents.shrew.fromServer.sitdown, {tableId, seatId, playerId})
                end 

                if playerId == globalProxy._myPlayerVo.playerId then
                  
                    globalProxy._currentTableId = tableId
                    self:sendNotification(AppEvents.shrew.fromView.goGame)
                end           
            end

--        elseif state == 1 then
--            Log.i(ErrorDefines.SITDOWN_ERROR_EXIST)
--        elseif state == 4 then
--            Log.i(ErrorDefines.SITDOWN_ERROR_PLAYING)
--        elseif state == 6 then
--            Log.i(ErrorDefines.ROOM_FULL_ERROR)
       else
           mediator:showMsgBox(result)
       end 
    end
   
end

return RespSitDownCommand