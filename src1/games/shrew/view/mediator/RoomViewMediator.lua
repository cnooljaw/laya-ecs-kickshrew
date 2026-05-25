local RoomViewMediator = class("RoomViewMediator",common.view.BaseMediator)
RoomViewMediator.NAME = "shrew.view.mediator.RoomViewMediator"

function RoomViewMediator:listNotificationInterests()
    return {
        AppEvents.shrew.fromView.goGame,
        
        AppEvents.shrew.fromServer.standup,
        AppEvents.shrew.fromServer.sitdown,
        AppEvents.shrew.fromServer.gameready,
        AppEvents.shrew.fromServer.playerunready,
        AppEvents.shrew.fromServer.tableover,
        AppEvents.shrew.fromServer.tablestart,
        AppEvents.respGetRoomInfo,
        AppEvents.Common.ForceleaveRoom
    }
end

function RoomViewMediator:handleNotification(note)
    if note:getName() == AppEvents.shrew.fromView.goGame then
        self:goGame()

    elseif note:getName() == AppEvents.Common.ForceleaveRoom then
        self:standUp(note:getBody())

    elseif note:getName() == AppEvents.shrew.fromServer.standup then
        self:standUp(note:getBody()[1])

    elseif note:getName() == AppEvents.shrew.fromServer.sitdown then
        self:sitDown(note:getBody()[1], note:getBody()[2], note:getBody()[3])

    elseif note:getName() == AppEvents.shrew.fromServer.gameready then
        self:playerReady(note:getBody()[1])

    elseif note:getName() == AppEvents.shrew.fromServer.playerunready then
        self:playerUnReady(note:getBody()[1])

    elseif note:getName() == AppEvents.shrew.fromServer.tableover  then
        self:tableOver(note:getBody()[1])

    elseif note:getName() == AppEvents.shrew.fromServer.tablestart  then
        self:tableStart(note:getBody()[1])

    elseif note:getName() == AppEvents.respGetRoomInfo  then
        self._proxy._roomInfo = note:getBody()
        self:getViewComponent():showRoomInfoView()
    end
end

function RoomViewMediator:goGame()

    local designSize = cc.Director:getInstance():getOpenGLView():getFrameSize()
    local scale = 640/designSize.height
    cc.Director:getInstance():setContentScaleFactor(scale)
    --cc.Director:getInstance():getOpenGLView():setDesignResolutionSize(1136, 640, cc.ResolutionPolicy.FIXED_HEIGHT)
    self.facade:changeMediator(self,shrew.view.GameViewMediator.new())
  
end

function RoomViewMediator:onViewClick(event) 
    local eventData  = event.data
    if eventData[1] == "sitdown" then
        Log.i("RoomViewMediator: sitdown")    
        self:sendNotification(AppEvents.shrew.fromView.sitDown, {eventData[2], eventData[3]})

    elseif eventData == "backtohall" then 
        self:sendNotification(AppEvents.Common.leaveRoom)
        local socketProxy = self.facade:retrieveProxy(common.model.SocketProxy.NAME)
        socketProxy:close()
        self.facade:changeMediator(self,shrew.view.HallViewMediator.new())

    elseif eventData == "goRoomInfoView" then
        --获取房间问号信息
        local httpProxy = self.facade:retrieveProxy(common.model.HttpProxy.NAME) 
        httpProxy:reqGetRoomInfo()
    elseif eventData == "onMsgOk" then
        self:sendNotification(AppEvents.Common.leaveRoom)
        local socketProxy = self.facade:retrieveProxy(common.model.SocketProxy.NAME)
        socketProxy:close()
        self.facade:changeMediator(self,shrew.view.HallViewMediator.new())
    end
end

function RoomViewMediator:onRegister()
    Log.i("RoomViewMediator:onRegister") 
    

    self:setRoomView()

    self._proxy = shrew.model.RoomProxy.new() --保持一个proxy的引用
    self.facade:registerProxy(self._proxy)
    RoomViewMediator.super.onRegister(self)
    self.facade:registerCommand(AppEvents.shrew.fromView.sitDown, shrew.command.ReqSitDownCommand)
    self.facade:registerCommand(AppEvents.Common.leaveRoom, common.command.ReqLeaveRoomCommand)
    

    self:sendEvent()

end

function RoomViewMediator:sendEvent()
    self:sendNotification(AppEvents.shrew.fromView.sitDown, {65535, 65535})
end

function RoomViewMediator:setRoomView()
    self:setViewComponent(shrew.view.LoadingView.new())
end

function RoomViewMediator:onRemove()
    Log.i("RoomViewMediator:onRemove")
    self.facade:removeCommand(AppEvents.shrew.fromView.sitDown)
    self.facade:removeCommand(AppEvents.Common.leaveRoom)
    self.facade:removeProxy(shrew.model.RoomProxy.NAME)
    self._proxy = nil
    RoomViewMediator.super.onRemove(self)
end


function RoomViewMediator:sitDown(tableId, seatId, playerId)  
    -- self:getViewComponent():sitDown(tableId, seatId, playerId)  
      
end

function RoomViewMediator:standUp(playerId)
    -- self:getViewComponent():standUp(playerId) 
end

function RoomViewMediator:tableStart(tableId)
    -- self:getViewComponent():tableStart(tableId) 
end

function RoomViewMediator:tableOver(tableId)
    -- self:getViewComponent():tableOver(tableId) 
end

function RoomViewMediator:playerReady(playerId)
    -- self:getViewComponent():playerReady(playerId) 
end

function RoomViewMediator:playerUnReady(playerId)
    -- self:getViewComponent():playerUnReady(playerId) 
end

function RoomViewMediator:showMsgBox(info)

   self:getViewComponent():showMsgBox(info)
end

return RoomViewMediator
