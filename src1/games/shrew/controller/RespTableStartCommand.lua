local RespTableStartCommand = class("RespTableStartCommand",puremvc.SimpleCommand)


function RespTableStartCommand:execute(note)
    --Log.i("RespTableStartCommand:execute")
    local proxy = self.facade:retrieveProxy(shrew.model.RoomProxy.NAME)
    local mediator = self.facade:retrieveMediator(shrew.view.RoomViewMediator.NAME)
    local message = note:getBody()

    local tableId = message:getTableId()

    local TableSeatProxy = self.facade:retrieveProxy(common.model.TableSeatProxy.NAME)
    local globalProxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
    local playerProxy = self.facade:retrieveProxy(common.model.PlayerProxy.NAME)

    if (tableId >= 0 and tableId < AppMacros.MAX_TABLE)  then          
        TableSeatProxy:updateTableState(tableId, 1)
        self:sendNotification(AppEvents.shrew.fromServer.tablestart, {tableId})
        for i = 0, AppMacros.MAX_SEATS - 1 do
            local playerId = TableSeatProxy:getPlayerId(tableId, i)
            local player = playerProxy:getPlayer(playerId)
            if (player ~= nil) then
                player.mGameState = 3
                self:sendNotification(AppEvents.shrew.fromServer.playerunready, {playerId, tableId})
            end
        end
    end
end

return RespTableStartCommand