local GameViewMediator = class("GameViewMediator",common.view.BaseMediator)
GameViewMediator.NAME = "shrew.view.mediator.GameViewMediator"

local scheduler = require "network.scheduler"

function GameViewMediator:listNotificationInterests()
    return {       
        
        AppEvents.shrew.fromServer.standup,
        AppEvents.shrew.fromServer.sitdown,
        network.SocketTCP.EVENT_CONNECT_FAILURE,
        AppEvents.shrew.redPacket,
        AppEvents.shrew.redPacketreward,
    }
end

--[[
监听服务器端发来的消息
--]]
function GameViewMediator:handleNotification(note)

    if note:getName() == AppEvents.shrew.fromServer.standup then   
        self:standUp(note:getBody()[1])
        
    elseif note:getName() == AppEvents.shrew.fromServer.sitdown then
       -- self:sitDown(note:getBody()[3], note:getBody()[2] ,note:getBody()[1])  --{tableId, seatId, playerId}
        
    elseif note:getName() == AppEvents.shrew.fromServer.gameready then
        self:playerReady(note:getBody()[1])
        
    elseif note:getName() == AppEvents.shrew.fromServer.playerunready then
        self:playerUnReady(note:getBody()[1], note:getBody()[2] )  --{playerId, tableId}
    elseif note:getName() == network.SocketTCP.EVENT_CONNECT_FAILURE then
        --当发生网络错误时，跳到断线重连界面，然后重新进当前房间，走断线重连流程
        sdks.umeng:onEvent("SHREWNetworkError")
        self:doNetWorkErr()
    elseif note:getName() == AppEvents.shrew.redPacket then
        Log.i("收到服务器消息，显示红包")
        local GameProxy = self.facade:retrieveProxy(shrew.model.GameProxy.NAME)
        GameProxy._rewardID = note:getBody()
        self:getViewComponent():showRedPacketBtn()
    elseif note:getName() == AppEvents.shrew.redPacketreward then
        Log.i("红包奖励来了")
        for k,v in pairs(note:getBody()) do
            Log.i(k,v)
        end
        if note:getBody().frtn == 0 then 
            self:getViewComponent():showRedpacketGrabed()
            self:showRedPacketInfo()
        elseif note:getBody().frtn == 1 then
            Log.i("note:getBody().rewardType",note:getBody().rewardType)
            Log.i("note:getBody().result",note:getBody().result)
            self:getViewComponent():showBigRedpacket(note:getBody().rewardType,note:getBody().result)
            self:showRedPacketInfo(note:getBody().result)
            Log.i("更新红包银子")
            local proxy = self.facade:retrieveProxy(shrew.model.GameProxy.NAME)
            Log.i("proxy._myMoney",proxy._myMoney)
            Log.i("result",note:getBody().result)

            self:setPalyerMoney(proxy._myMoney+note:getBody().result)

        end
    end
    
end

--[[
监听客户端发来的消息
--]]
function GameViewMediator:onViewClick(event) 

    local eventData  = event.data
    if eventData == "gotoroom" then
        sdks.umeng:onEvent("SHREWGameOver")
        self:goRoom()
        return
        
    elseif eventData[1] == "kickshrew" then
        self:sendNotification(AppEvents.shrew.fromView.kickShrew, eventData[2])
        return 
        
    elseif eventData[1] == "changeHammer" then
        sdks.umeng:onEvent("SHREWChangeHammer")
        self:getViewComponent():setTouchHammer(eventData[2])
        return
           
    elseif eventData == "gameexit" then
        self:sendNotification(AppEvents.shrew.fromView.gameExit)
        return  
    elseif eventData == "onMsgOk" then
        cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("res/common/avatarlist1.plist")
        cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("res/common/avatarlist2.plist")           

        local designSize = cc.Director:getInstance():getOpenGLView():getFrameSize()
        local scale = getSysScale(designSize,{width=1334,height=750})
        cc.Director:getInstance():setContentScaleFactor(scale)

        cc.SpriteFrameCache:getInstance():addSpriteFrames("res/common/avatarlist1.plist")
        cc.SpriteFrameCache:getInstance():addSpriteFrames("res/common/avatarlist2.plist")
        self.facade:changeMediator(self,lobby.view.LobbyViewMediator.new())

    elseif eventData[1] == "redpacket" then
        Log.i("我点击到了2")
        local clickredpackettime = os.time()
        local proxy = self.facade:retrieveProxy(shrew.model.GameProxy.NAME)
        if proxy._shrewdeadtime ~= nil and clickredpackettime - proxy._shrewdeadtime < 5 then
            local globalproxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
            local roomId = globalproxy._currentRoom.roomId
            local httpProxy = self.facade:retrieveProxy(common.model.HttpProxy.NAME)
            httpProxy:reqRedPacket(roomId)
            Log.i("正常发送")
        else
            self:getViewComponent():showRedpacketGrabed()
            self:showRedPacketInfo()
            Log.i("等红包的不抢")
        end 
    end

    self:onViewClickEx(eventData)
end

function GameViewMediator:onViewClickEx()

end

function GameViewMediator:onRegister()

    --加载资源列表
    cc.SpriteFrameCache:getInstance():addSpriteFrames("kickshrew_role_red.plist")
    cc.SpriteFrameCache:getInstance():addSpriteFrames("kickshrew_role_second.plist")
    cc.SpriteFrameCache:getInstance():addSpriteFrames("kickshrew_role_yellow.plist")
    cc.SpriteFrameCache:getInstance():addSpriteFrames("kickshrew_boss_hat.plist")
    cc.SpriteFrameCache:getInstance():addSpriteFrames("kickshrew_role_boss.plist")
    cc.SpriteFrameCache:getInstance():addSpriteFrames("shrew_dizzy_star.plist")
    cc.SpriteFrameCache:getInstance():addSpriteFrames("kickshrew_game_view.plist")
    cc.SpriteFrameCache:getInstance():addSpriteFrames("kickshrew_combo_lighting.plist")
    cc.SpriteFrameCache:getInstance():addSpriteFrames("kickshrew_hammer_effect.plist")
    cc.SpriteFrameCache:getInstance():addSpriteFrames("kickshrew_treasue_effect.plist")
    cc.SpriteFrameCache:getInstance():addSpriteFrames("kickshrew_angry_hammer_effect.plist")
    cc.SpriteFrameCache:getInstance():addSpriteFrames("kickshrew_treasure_box.plist")   
    cc.SpriteFrameCache:getInstance():addSpriteFrames("common_trumpet_msg.plist")
    cc.SpriteFrameCache:getInstance():addSpriteFrames("kickshrew/kickshrew_gameOverBox.plist")
    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("kickshrew_challengeMatch_countdownBox.plist")
    cc.SpriteFrameCache:getInstance():addSpriteFrames("kickshrew_challengeMatch_countdownBox.plist")
    cc.SpriteFrameCache:getInstance():addSpriteFrames("kickshrew/kickshrew_challengeMatch_beginBox.plist")
 
    
    self:setGameViewAndProxy()
    GameViewMediator.super.onRegister(self)
    --注册消息
    self.facade:registerCommand(AppEvents.shrew.fromView.gameReady, shrew.command.ReqGameReadyCommand)
    self.facade:registerCommand(AppEvents.shrew.fromView.gameStart, shrew.command.ReqGameStartCommand)    
    self.facade:registerCommand(AppEvents.shrew.fromView.gameExit, shrew.command.ReqGameExitCommand)
    self.facade:registerCommand(AppEvents.shrew.fromView.kickShrew, shrew.command.ReqKickShrewCommand)  --打地鼠请求
    self.facade:registerCommand(AppEvents.shrew.fromView.gameScene, shrew.command.ReqGameSceneCommand)  -- 断线重连请求
    self.facade:registerCommand(AppEvents.shrew.fromView.challengeMatchChance, shrew.command.ReqChallengeMatchChanceCommand)
    self:onRegisterEx()
   
end

function GameViewMediator:setGameViewAndProxy()
    self._proxy = shrew.model.GameProxy.new() --保持一个proxy的引用  
    self.facade:registerProxy(self._proxy)
    self._gameScene = {shrew.view.GameViewGrass, shrew.view.GameViewShip, shrew.view.GameViewSpace, shrew.view.GameViewSewer}
    self._preSceneIndex = 1
    self:setViewComponent(self._gameScene[self._preSceneIndex].new())  
    self._changeSceneHandle = scheduler.scheduleGlobal(handler(self,self.doChangeSceneMovie), 100)  --切换场景的定时器
    
end


function GameViewMediator:onRegisterEx()

    local globalProxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
    if globalProxy._isResume == true then
        --请求gameScene
        self:sendNotification(AppEvents.shrew.fromView.gameScene)
    elseif  globalProxy._isResume == false then
        --发送准备包
        self:sendNotification(AppEvents.shrew.fromView.gameReady)
        --发送游戏开始包
        self:sendNotification(AppEvents.shrew.fromView.gameStart)
    end

end

function GameViewMediator:onRemove()
   -- Log.i("GameViewMediator:onRemove")
    
    --释放资源
    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("kickshrew_role_red.plist")
    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("kickshrew_role_second.plist")
    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("kickshrew_role_yellow.plist")
    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("kickshrew_boss_hat.plist")
    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("kickshrew_role_boss.plist")
    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("shrew_dizzy_star.plist")
    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("kickshrew_game_view.plist")
    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("kickshrew_combo_lighting.plist")
    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("kickshrew_hammer_effect.plist")
    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("kickshrew_treasue_effect.plist")
    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("kickshrew_angry_hammer_effect.plist")
    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("kickshrew_treasure_box.plist")   
    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("common_trumpet_msg.plist")
    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("kickshrew/kickshrew_gameOverBox.plist")
    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("kickshrew_challengeMatch_countdownBox.plist")
    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("kickshrew/kickshrew_challengeMatch_beginBox.plist")
    
    if self._changeSceneHandle ~= nil then
         scheduler.unscheduleGlobal(self._changeSceneHandle)
    end
   
    
    self._proxy = nil
    GameViewMediator.super.onRemove(self)
    
    self.facade:removeCommand(AppEvents.shrew.fromView.gameReady)
    self.facade:removeCommand(AppEvents.shrew.fromView.gameStart)
    self.facade:removeCommand(AppEvents.shrew.fromView.gameExit)
    self.facade:removeCommand(AppEvents.shrew.fromView.kickShrew)
    self.facade:removeCommand(AppEvents.shrew.fromView.gameScene)
    self.facade:removeCommand(AppEvents.shrew.fromView.challengeMatchChance)

    self.facade:removeProxy(shrew.model.GameProxy.NAME)
end


function GameViewMediator:goRoom()

    local globalProxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
    local room = globalProxy._currentRoom        
    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("res/common/avatarlist1.plist")
    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("res/common/avatarlist2.plist")           

    local designSize = cc.Director:getInstance():getOpenGLView():getFrameSize()
    local scale = getSysScale(designSize,{width=1334,height=750})
    cc.Director:getInstance():setContentScaleFactor(scale)
    
    cc.SpriteFrameCache:getInstance():addSpriteFrames("res/common/avatarlist1.plist")
    cc.SpriteFrameCache:getInstance():addSpriteFrames("res/common/avatarlist2.plist")

    self.facade:changeMediator(self,shrew.view.HallViewMediator.new()) 

end

function GameViewMediator:sitDown(playerId, tableId,seatId)
    local globalProxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
    if tableId ==  globalProxy._currentTableId and self:getViewComponent() ~= nil then
        self:getViewComponent():sitDown(playerId, seatId)
    end
end

function GameViewMediator:standUp(playerId)

    if self:getViewComponent() ~= nil then
        self:getViewComponent():standUp(playerId)
    end   
end

function GameViewMediator:playerReady(playerId)

    if self:getViewComponent() ~= nil then
        self:getViewComponent():playerReady(playerId)
    end
end

function GameViewMediator:playerUnReady(playerId, tableId)
    local globalProxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
    if tableId ==  globalProxy._currentTableId and self:getViewComponent() ~= nil then
        self:getViewComponent():playerUnReady(playerId)
    end
end

function GameViewMediator:setNCombo(combo)

    if self:getViewComponent() ~= nil then
        self:getViewComponent():setNCombo(combo)
    end
end

function GameViewMediator:setNComboID(comboID)
    
    if self:getViewComponent() ~= nil then
        self:getViewComponent():setNComboID(comboID)
    end
end

--[[
左侧显示红包结果信息
--]]
function GameViewMediator:showRedPacketInfo(result)
    local proxy = self.facade:retrieveProxy(shrew.model.GameProxy.NAME)
    proxy._rewardInfo = proxy._rewardInfo or {}
    proxy._rewardInfoCount = proxy._rewardInfoCount or 0
    local time = os.date("%X")
    local temp 
    if result then
        if(os.date("%m") == "10" and tonumber(os.date("%d")) >= 1 and tonumber(os.date("%d")) <= 7) then
            temp = string.format("[%s] 恭喜您获得十一红包奖励%d银子！", time, result)  
        else 
            temp = string.format("[%s] 恭喜您获得红包奖励%d银子！", time, result)
        end
    else
        temp = string.format("[%s] 您的红包已被抢走！", time)
    end
                                       
    proxy._rewardInfoCount = proxy._rewardInfoCount + 1
    proxy._rewardInfo[proxy._rewardInfoCount] = temp
    self:updataRewardInfo(proxy._rewardInfo)
end

--[[
开宝箱动画
--]]
function GameViewMediator:playTreasueMovie(reward)
    self:getViewComponent():playTreasueMovie(reward)
end

--[[
显示金币洒落动画
@param shrewResp         table类型   打中的地鼠信息
--]]
function GameViewMediator:showGoldAnimation(shrewResp)
    self:getViewComponent():showGoldAnimation(shrewResp)
end

--[[
显示雷神锤
--]]
function GameViewMediator:showAngryHammer()
    self:getViewComponent():showAngryHammer()
end

--[[
更新基本信息
@param faceid         number类型   头像ID
@param name           string类型   用户名
--]]
function GameViewMediator:setPalyerBaseInfo(faceid, name)
    self:getViewComponent():updateFace(faceid)
    self:getViewComponent():updateUserName(name)   
end

--[[
更新银子
@param money          number类型   银子
--]]
function GameViewMediator:setPalyerMoney(money)
    self:getViewComponent():updateMoneyBar(money)
end

--[[
更新等级
@param nLuck            number类型   等级分
--]]
function GameViewMediator:setLevel(nLuck)
    self:getViewComponent():updateLevelBar(nLuck)
end

--[[
更新愤怒值
@param angry            number类型   愤怒值
--]]
function GameViewMediator:setAngry(angry)
    self:getViewComponent():updateAngryBar(angry)
end

--[[
更新体力值（HP）
@param power            number类型   当前体力
@param powerTop         number类型   最大体力
--]]
function GameViewMediator:setPower(power, powerTop)
    self:getViewComponent():updateHPBar(power, powerTop)
end

--[[
更新Item
@param index            number类型   锤子列表序列号
@param hammerID         number类型   锤子ID
@param hammerPrice      number类型   锤子单次敲击价钱
--]]
function GameViewMediator:updataHammerListItem(index, hammerID, hammerPrice)  
        
    self:getViewComponent():updataHammerListItem(index, hammerID, hammerPrice)
end

--[[
更新免费锤子信息
@param index            number类型   锤子列表序列号
@param hammerID         number类型   锤子ID
@param FreeHammerCount  number类型   免费锤子个数
--]]
function GameViewMediator:updataFreeHammer(index, hammerID, FreeHammerCount)
    self:getViewComponent():updataFreeHammer(index, hammerID, FreeHammerCount)
end

--[[
更新当前选中的锤子
@param hammerID         number类型   锤子ID
--]]
function GameViewMediator:updataSelectedHammer(hammerID)
    self:getViewComponent():updataSelectedHammer(hammerID)
end

--[[
更新每周排名信息

--]]
function GameViewMediator:updataWeekRankView(rankInfo)
    self:getViewComponent():updataWeekRankView(rankInfo)
end

--[[
更新个人信息数据
--]]
function GameViewMediator:updataRewardInfo(rewardInfo)

    self:getViewComponent():updataRewardInfo(rewardInfo)
end

--[[
底部获奖信息
@param time     string类型   获奖时间
@param name     string类型   获奖人用户名
@param hammer   string类型   所用锤子
@param money    number类型   获奖金额
--]]
function GameViewMediator:showPlayerAward(name, hammer, money)
    self:getViewComponent():showPlayerAward(name, hammer, money)
end

--[[
切换场景地图
--]]
function GameViewMediator:changeScene()

    --播放切换场景动画
    --self:doChangeSceneMovie()
     
    --移除上一个场景  
    --同时移除事件监听
    cc.Director:getInstance():getEventDispatcher():removeCustomEventListeners(self.viewComponent.__cname .. "." .. AppEvents.Click)     
    self:getViewComponent():removeFromParent()


    

        
    --重新设置新场景
    if self._preSceneIndex == 4 then
        self._preSceneIndex = 1
    else 
        self._preSceneIndex = self._preSceneIndex + 1
    end
    
    self:setViewComponent(self._gameScene[self._preSceneIndex].new())
    --注册新的viewclick的监听事件 
    local listener = cc.EventListenerCustom:create(self.viewComponent.__cname .. "." .. AppEvents.Click,handler(self,self.onViewClick))
    cc.Director:getInstance():getEventDispatcher():addEventListenerWithFixedPriority(listener,1); --侦听cocos事件   

    cc.Director:getInstance():getRunningScene():addChild(self.viewComponent)
    
    --更新新界面数据
    local proxy = self.facade:retrieveProxy(shrew.model.GameProxy.NAME)
    local globalProxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
    local myPlayerId = globalProxy._myPlayerVo.playerId    
    local playerProxy = self.facade:retrieveProxy(common.model.PlayerProxy.NAME) 
    local myPlayer = playerProxy:getPlayer(myPlayerId)
    
    if myPlayer ~= nil then

        --更新用户名，头像
        self:setPalyerBaseInfo(myPlayer.face, myPlayer.username)

       --更新银子
       self:setPalyerMoney(proxy._myMoney)

       --更新等级
       self:setLevel(myPlayer.level)

       --更新体力值
       self:setPower(proxy._power, proxy._powerTop)
  
       --更新愤怒值
       self:setAngry(proxy._angry)

    end
    
    --个人获奖信息（左边弹出框）     
    if proxy._rewardInfo ~= nil then
        self:updataRewardInfo(proxy._rewardInfo)
    end  
   
    --每周排名信息（左边弹出框）
    if proxy._rankList ~= nil then
        self:updataWeekRankView(proxy._rankList)
    end
       
    --锤子列表
    for i = 1, 6 do  

        if proxy._hammerList[i] ~= nil then
            self:updataHammerListItem(i, proxy._hammerList[i]._id, proxy._hammerList[i]._price)
            self:updataFreeHammer(i, proxy._hammerList[i]._hammerUsable._id, proxy._hammerList[i]._hammerUsable._count)
        end

    end

    local preHammerID = cc.UserDefault:getInstance():getIntegerForKey(AppMacros.shrew.preHammerID)
    if preHammerID == 0 then
        preHammerID = 1
    end
    self:updataSelectedHammer(preHammerID)
    
end

--[[
切换场景动画
--]]
function GameViewMediator:doChangeSceneMovie()

    local runningScene = cc.Director:getInstance():getRunningScene()

    local nOffValue = 800
    self._winSize = cc.Director:getInstance():getWinSize()
    
    --切换动画1
    self._sceneShadow = cc.Sprite:create("kickshrew_shadow.png")
    runningScene:addChild(self._sceneShadow,999)
    self._sceneShadow:setPosition(self._winSize.width/2 - nOffValue, self._winSize.height/2 - nOffValue)
    self._sceneShadow:setRotation(-45)
    self._sceneShadow:setScale(2.5)

    local actionIn = cc.MoveBy:create(0.5,cc.p(nOffValue,nOffValue))
    local actionOut = actionIn:reverse()    
    local delay = cc.DelayTime:create(0.1)
    local delay2 = cc.DelayTime:create(0.5)

    local a1 = cc.Sequence:create(delay, actionIn, delay2, actionOut, cc.CallFunc:create(handler(self,self.removeShadow1)))
    self._sceneShadow:runAction(a1)

    --切换动画2
    self._sceneShadow2 = cc.Sprite:create("kickshrew_shadow.png")
    runningScene:addChild(self._sceneShadow2,999)
    self._sceneShadow2:setPosition(self._winSize.width/2 + nOffValue, self._winSize.height/2 + nOffValue)
    self._sceneShadow2:setRotation(135)
    self._sceneShadow2:setScale(2.5)

    local actionIn2 = cc.MoveBy:create(0.5,cc.p(-nOffValue,-nOffValue))
    local actionOut2 = actionIn:reverse() 

    local a2 = cc.Sequence:create(delay, actionIn2, delay2, cc.CallFunc:create(handler(self,self.removeShadow2)), actionOut2)
    self._sceneShadow2:runAction(a2)
end

function GameViewMediator:removeShadow1()

    if self._sceneShadow ~= nil then
        self._sceneShadow:removeFromParent()
        self._sceneShadow = nil
    end

end

function GameViewMediator:removeShadow2()

    if self._sceneShadow2 ~= nil then
        self._sceneShadow2:removeFromParent()
        self._sceneShadow2 = nil
    end
    
    self:changeScene()
end

--[[
提示信息
@param info         string类型   提示信息
--]]
function GameViewMediator:showMsgBox(info)

   self:getViewComponent():showMsgBox(info)
end

function GameViewMediator:doNetWorkErr()
	self:getViewComponent():doNetWorkErr()
end

return GameViewMediator