local TaskViewMediator = class("TaskViewMediator",common.view.BaseMediator)
TaskViewMediator.NAME = "shrew.view.mediator.TaskViewMediator"

function TaskViewMediator:listNotificationInterests()
    return {
            AppEvents.shrew.goRoomFromServer,
            AppEvents.respGetRoomTaskList,
            AppEvents.respGetTaskAward

        } --侦听事件列表
end

function TaskViewMediator:handleNotification(note)

    if note:getName() == AppEvents.shrew.goRoomFromServer then
    
        if note:getBody():getState() == 0 then
            self:goRoom()
        end

    elseif note:getName() == AppEvents.respGetRoomTaskList then
    
        self:readTaskInfo(note:getBody())
        
    elseif note:getName() == AppEvents.respGetTaskAward then

        self:readAwardInfo(note:getBody())

    end
end


function TaskViewMediator:onViewClick(event) 
       
    local eventData  = event.data
    if eventData == "goHallView" then
        self.facade:goBackMediator(self)
                
    elseif eventData[1] == "getTaskList" then  
        local httpProxy = self.facade:retrieveProxy(common.model.HttpProxy.NAME)   
        httpProxy:reqGetRoomTaskList(AppMacros.GAMEID_SHREW, eventData[2])     
        
    elseif eventData[1] == "doTask" then
              
        --直接发送进入房间的命令   
        local globalProxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
        local roomListProxy = self.facade:retrieveProxy(common.model.RoomListProxy.NAME) 
        local roomList = roomListProxy:getRoomListData(globalProxy._currentGameId) 
        local TaskProxy = self.facade:retrieveProxy(shrew.model.TaskProxy.NAME)
        local room         
        for i = 1, #roomList do 
            
            if roomList[i].roomId == TaskProxy._taskList[eventData[2]].RoomId then
            	room = roomList[i]
            	break
            end
        end
               
        globalProxy:setCurrentRoom(room)
        self:sendNotification(AppEvents.shrew.goRoomByTask,room)
        
              
    elseif eventData[1] == "getAward" then
        local TaskProxy = self.facade:retrieveProxy(shrew.model.TaskProxy.NAME)
        TaskProxy._preGetAwardIndex = eventData[2]

        local httpProxy = myAppFacade:retrieveProxy(common.model.HttpProxy.NAME) 
        httpProxy:reqGetTaskAward(AppMacros.GAMEID_SHREW, TaskProxy._taskList[eventData[2]].taskid)                
    end
    
end

function TaskViewMediator:onRegister()
   
    --绑定proxy
    self._proxy = shrew.model.TaskProxy.new()
    self.facade:registerProxy(self._proxy)
 
    --创建界面
    local view = require("lobby.view.layer.TaskView").new()
    self:setViewComponent(view)
    
    --更新数据
    local globalProxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
    self:getViewComponent():updataMyMoney(globalProxy._myPlayerVo.money)
    
    --请求每日任务列表信息
    local httpProxy = myAppFacade:retrieveProxy(common.model.HttpProxy.NAME) 
    httpProxy:reqGetRoomTaskList(AppMacros.GAMEID_SHREW, 2)
    
    --注册消息
    self.facade:registerCommand(AppEvents.shrew.goRoomByTask, shrew.command.ReqEnterRoomCommand)
    
    TaskViewMediator.super.onRegister(self)    
end

function TaskViewMediator:onRemove()
      
    --移除消息
    self.facade:removeCommand(AppEvents.shrew.goRoomByTask)
    
    self.facade:removeProxy(shrew.model.TaskProxy.NAME)
    self._proxy = nil
    TaskViewMediator.super.onRemove(self)
end


--[[
读取任务信息
--]]
function TaskViewMediator:readTaskInfo(res)
    Log.i("readTaskInfo")
    local taskProxy = self.facade:retrieveProxy(shrew.model.TaskProxy.NAME)
    taskProxy._taskList = taskProxy._taskList or {}
    taskProxy._taskList = res
    
    self:getViewComponent():updateMianView(taskProxy._taskList)
    
end


--[[
读取领奖信息
--]]
function TaskViewMediator:readAwardInfo(res)
    Log.i(res.text)
    
    if res.item ~= nil and res.re == 1 then
        local TaskProxy = self.facade:retrieveProxy(shrew.model.TaskProxy.NAME)
        
        --更新银子
        local globalProxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
        globalProxy._myPlayerVo.money = globalProxy._myPlayerVo.money + TaskProxy._taskList[TaskProxy._preGetAwardIndex].awardnumber
        self:getViewComponent():updataMyMoney(globalProxy._myPlayerVo.money)
        
        --更新item
        TaskProxy._taskList[TaskProxy._preGetAwardIndex] =  res.item
        self:getViewComponent():updataItem(TaskProxy._preGetAwardIndex, res.item)
               
    end        
end

function TaskViewMediator:goRoom()
    local proxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
    local roomId = proxy._currentRoom.roomId

    local TableSeatProxy = self.facade:retrieveProxy(common.model.TableSeatProxy.NAME)
    local playerProxy = self.facade:retrieveProxy(common.model.PlayerProxy.NAME)
    TableSeatProxy:reset()
    playerProxy:reset()
    if roomId == 61002 then
        self.facade:changeMediator(self,shrew.view.RoomViewMediator.new(true))
    end

end

--[[
更新自己银子
--]]
function TaskViewMediator:updataMyMoney(money)
    self:getViewComponent():updataMyMoney(money)
end

return TaskViewMediator