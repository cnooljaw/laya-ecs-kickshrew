local RespStandUpCommand = class("RespStandUpCommand",puremvc.SimpleCommand)


function RespStandUpCommand:execute(note)
    Log.i("RespStandUpCommand:execute")
    local proxy = self.facade:retrieveProxy(shrew.model.RoomProxy.NAME)
    local mediator = self.facade:retrieveMediator(shrew.view.RoomViewMediator.NAME)
    local message = note:getBody()

    local state = message:getState()
    local playerId = message:getUserId()

    local TableSeatProxy = self.facade:retrieveProxy(common.model.TableSeatProxy.NAME)
    local globalProxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
    local playerProxy = self.facade:retrieveProxy(common.model.PlayerProxy.NAME)
    local player = playerProxy:getPlayer(playerId)

    if player ~= nil then
        local oldTableId = player.mTableId
        local oldSeatId = player.mSeatId

        if (oldTableId >= 0 and oldTableId < AppMacros.MAX_TABLE)  and (oldSeatId >= 0 and oldSeatId < AppMacros.MAX_SEATS) then
            TableSeatProxy:updateStateWithTableId(oldTableId, oldSeatId, 0) 
            self:sendNotification(AppEvents.shrew.fromServer.standup, {playerId})         
        end
        player.mTableId = 65535
        player.mSeatId = 65535
        player.mGameState = 0

    end
end

return RespStandUpCommand