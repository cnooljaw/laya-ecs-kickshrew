local RespLeaveRoomCommand = class("RespLeaveRoomCommand",puremvc.SimpleCommand)


function RespLeaveRoomCommand:execute(note)
    --Log.i("RespLeaveRoomCommand:execute")      
    local proxy = self.facade:retrieveProxy(shrew.model.RoomProxy.NAME)
    local mediator = self.facade:retrieveMediator(shrew.view.RoomViewMediator.NAME)
    local message = note:getBody()

    local playerId = message:getLeaveUserId()
    local reason = message:getLeaveReason()

    local TableSeatProxy = self.facade:retrieveProxy(common.model.TableSeatProxy.NAME)
    local globalProxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
    local playerProxy = self.facade:retrieveProxy(common.model.PlayerProxy.NAME)
    local player = playerProxy:getPlayer(playerId)
    if player ~=  nil then
        local oldTableId = player.mTableId
        local oldSeatId = player.mSeatId

        if (oldTableId >= 0 and oldTableId < AppMacros.MAX_TABLE)  and (oldSeatId >= 0 and oldSeatId < AppMacros.MAX_SEATS) then
            TableSeatProxy:updateStateWithTableId(oldTableId, oldSeatId, 0)          
        end
        if playerId ~= globalProxy._myPlayerVo.playerId then
            self:sendNotification(AppEvents.Common.ForceleaveRoom, playerId)
            playerProxy:removePlayer(playerId)
        end
        if playerId == globalProxy._myPlayerVo.playerId then
        end
    end
end

return RespLeaveRoomCommand