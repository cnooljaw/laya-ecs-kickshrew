local RespGameReadyCommand = class("RespGameReadyCommand",puremvc.SimpleCommand)


function RespGameReadyCommand:execute(note)
    --Log.i("RespGameReadyCommand:execute")
    local proxy = self.facade:retrieveProxy(shrew.model.RoomProxy.NAME)
    local mediator = self.facade:retrieveMediator(shrew.view.RoomViewMediator.NAME)
    local message = note:getBody()
    local playerId = message:getPlayerId()

    local TableSeatProxy = self.facade:retrieveProxy(common.model.TableSeatProxy.NAME)
    local globalProxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
    local playerProxy = self.facade:retrieveProxy(common.model.PlayerProxy.NAME)

    local player = playerProxy:getPlayer(playerId)

    if player ~= nil then
        player.mGameState = 2
        self:sendNotification(AppEvents.ssd.fromServer.gameready, {playerId})
        --mediator:playerReady(playerId)
    end
end

return RespGameReadyCommand