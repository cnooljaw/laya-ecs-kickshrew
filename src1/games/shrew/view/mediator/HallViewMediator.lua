local scheduler = require("network.scheduler")
local HallViewMediator = class("HallViewMediator",common.view.BaseMediator)
HallViewMediator.NAME = "shrew.view.mediator.HallViewMediator"

function HallViewMediator:listNotificationInterests()
    return {
        network.SocketTCP.EVENT_CONNECT_FAILURE,
        AppEvents.shrew.goRoomFromHall,
        AppEvents.shrew.enterRoomFail,
        } --侦听事件列表
end

function HallViewMediator:handleNotification(note)
    if note:getName() == network.SocketTCP.EVENT_CONNECT_FAILURE  then 
        self:doNetErr() 
    elseif note:getName() == AppEvents.shrew.goRoomFromHall  then 

        local globalProxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
        local myPlayer = globalProxy._myPlayerVo
        if note:getBody():getState() == 0 then
          
            if myPlayer.serverID ~= 0 then
                self:goRoom()  
            end
        
        else
            --进入房间失败时
            if note:getBody():getState() then
                doMsgBox(self:getViewComponent(),note:getBody():getResult())
            else
                doMsgBox(self:getViewComponent(),ErrorDefines.HALL_ENTER_ROOM_FAIL)
            end
            
        end
        
        myPlayer.serverID = 0
        myPlayer.chairID = -1
        globalProxy:setMyPlayerVo(myPlayer)
    elseif  note:getName() == AppEvents.shrew.enterRoomFail then
        self:removeLoadingBox()
        self:doEnterRoomFail(note:getBody())
    end
end

function HallViewMediator:goRoom()
    local TableSeatProxy = self.facade:retrieveProxy(common.model.TableSeatProxy.NAME)
    local playerProxy = self.facade:retrieveProxy(common.model.PlayerProxy.NAME)
    TableSeatProxy:reset()
    playerProxy:reset()


    local proxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
    local roomId = proxy._currentRoom.roomId
    if roomId == 61002 or roomId == 61003 then
        Log.i("shrew.roomId",roomId)
        self.facade:changeMediator(self, shrew.view.RoomViewMediator.new())
    elseif roomId == 61011 then
        self.facade:changeMediator(self, shrew.view.ChallengeMatchRoomViewMediator.new())  
    end
end


function HallViewMediator:onViewClick(event) 
    local eventData  = event.data
    if eventData == "backtohall" then
        self.facade:changeMediator(self,lobby.view.LobbyViewMediator.new())
        return

    end
    if eventData.remarks ~= nil then
        Log.i(eventData.roomId)
        sdks.umeng:onEvent("SHREWEnterRoom")
        local globalProxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
        globalProxy:setCurrentRoom(eventData)
        self:sendNotification(AppEvents.shrew.fromView.goRoom,eventData)
        self:showLoadingBox()
    end
    if eventData == "goTaskView" then
        self.facade:changeMediator(self,shrew.view.TaskViewMediator.new())
        return
        
    elseif eventData == "goSettingView" then
        self.facade:changeMediator(self,lobby.view.SettingViewMediator.new())
        return
        
    elseif eventData == "gotoshop" then
        local targetPlatform = cc.Application:getInstance():getTargetPlatform()
        if targetPlatform == cc.PLATFORM_OS_IPHONE or targetPlatform == cc.PLATFORM_OS_IPAD then
            self.facade:changeMediator(self,lobby.view.PayViewIosMediator.new()) 
        elseif targetPlatform == cc.PLATFORM_OS_ANDROID then
            self.facade:changeMediator(self,lobby.view.PayViewAndroidMediator.new()) 
        end
        return
    
    elseif eventData == "goPresentView" then
        self.facade:changeMediator(self,lobby.view.PresentViewMediator.new())       
    end
    if event.data[1] == "gotoPersonalInfo" then
        local globalProxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
        local logintype = globalProxy:getLoginType()
        if logintype == BaisonConfig.ObjectLoginType.ObjectLoginType_Name then
            self.facade:changeMediator(self,lobby.view.PersonalInfoViewMediator.new())
        elseif logintype == BaisonConfig.ObjectLoginType.ObjectLoginType_Tial then 
            self.facade:changeMediator(self,lobby.view.VisitroPersonalInfoViewMediator.new())
        else
            self.facade:changeMediator(self,lobby.view.PersonalInfoViewMediator.new())
        end
    end
    if event.data == "onMsgOkThenDo" then
        self.facade:changeMediator(self,lobby.view.LoginViewMediator.new())
    end
end

function HallViewMediator:onRegister() 
    Log.i("HallViewMediator:onRegister")

    self._proxy = shrew.model.HallProxy.new()
    self.facade:registerProxy(self._proxy)
    -- self:setViewComponent(shrew.view.LoadingView.new())

    --获取房间数据    
    local globalProxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
    local roomListProxy = self.facade:retrieveProxy(common.model.RoomListProxy.NAME) 
    self:setViewComponent(shrew.view.HallView.new(roomListProxy:getRoomListData(globalProxy._currentGameId), globalProxy._myPlayerVo))
        
    self.facade:registerCommand(AppEvents.shrew.fromView.goRoom,shrew.command.ReqEnterRoomCommand)
    -- --直接发送进入房间的命令   
    -- local globalProxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
    -- local roomListProxy = self.facade:retrieveProxy(common.model.RoomListProxy.NAME) 
    -- local roomList = roomListProxy:getRoomListData(globalProxy._currentGameId) 
    -- local room = roomList[1]
    -- globalProxy:setCurrentRoom(room)
    -- globalProxy._movePx = 0
    -- self:sendNotification(AppEvents.shrew.fromView.goRoom,room)
    HallViewMediator.super.onRegister(self)
end

function HallViewMediator:onRemove()
    Log.i("HallViewMediator:onRemove")

    self.facade:removeCommand(AppEvents.shrew.fromView.goRoom)
    self.facade:removeProxy(shrew.model.HallProxy.NAME)

    self._proxy = nil
    HallViewMediator.super.onRemove(self)
end

function HallViewMediator:doNetErr()
    -- self:getViewComponent():setVisible()
    -- --发生网络错误时，直接跳回LoginView
    -- local loadingView = require("common.view.layer.ComLoadingView").new(3)
    -- self:getViewComponent():addChild(loadingView)    
    -- local function update(dt)
    --     if self._scheduler then
    --         scheduler.unscheduleGlobal(self._scheduler)
    --         self._scheduler = nil
    --     end
    --     self.facade:changeMediator(self,lobby.view.LobbyViewMediator.new())
    -- end
    -- self._scheduler = scheduler.scheduleGlobal(update, 4)
    
    self:removeLoadingBox()
    local globalProxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
    if globalProxy._reconnect == true  then
        globalProxy._reconnect  = false
        self._loadingView:removeFromParent()
        self._loadignView = nil
        --发生网络错误时，直接跳回LoginView
        local loadingView = require("common.view.layer.ComLoadingView").new(2)
        self:getViewComponent():addChild(loadingView)    
        local function update(dt)
            if self._scheduler then
                scheduler.unscheduleGlobal(self._scheduler)
                self._scheduler = nil
            end
            loadingView:removeFromParent()
        end
        self._scheduler = scheduler.scheduleGlobal(update, 4)
    else
        doMsgBox(self:getViewComponent(),ErrorDefines.NET_WORK_BROKEN_ERROR)
    end
end


function HallViewMediator:doEnterRoomFail(msg)
    --账号登陆过期 其他地方登陆 返回登陆界面重新登陆
    self:getViewComponent():doEnterRoomFail(msg)
end

return HallViewMediator
