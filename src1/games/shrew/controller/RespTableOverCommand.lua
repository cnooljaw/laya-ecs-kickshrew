local RespTableOverCommand = class("RespTableOverCommand",puremvc.SimpleCommand)


function RespTableOverCommand:execute(note)
    --Log.i("RespTableOverCommand:execute")
    local proxy = self.facade:retrieveProxy(shrew.model.RoomProxy.NAME)
    local mediator = self.facade:retrieveMediator(shrew.view.RoomViewMediator.NAME)
    local message = note:getBody()

    local tableId = message:getTableId()

    local TableSeatProxy = self.facade:retrieveProxy(common.model.TableSeatProxy.NAME)
    local globalProxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
    local playerProxy = self.facade:retrieveProxy(common.model.PlayerProxy.NAME)

    if (tableId >= 0 and tableId < AppMacros.MAX_TABLE)   then          
        TableSeatProxy:updateTableState(tableId, 0)
        self:sendNotification(AppEvents.ssd.mediator.tableover, {tableId})
        for i = 0, AppMacros.MAX_SEATS - 1 do
            local playerId = TableSeatProxy:getPlayerId(tableId, i)
            local player = playerProxy:getPlayer(playerId)
            if (player ~= nil) then
                player.mGameState = 0
                self:sendNotification(AppEvents.shrew.fromServer.playerunready, {playerId})
            end
        end
    end
end

return RespTableOverCommand