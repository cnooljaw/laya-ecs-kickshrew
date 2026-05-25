local RespGameSceneCommand = class("RespGameSceneCommand",puremvc.SimpleCommand)



function RespGameSceneCommand:execute(note)
    Log.i("-------RespGameSceneCommand:execute")
    
  
    local proxy = self.facade:retrieveProxy(shrew.model.GameProxy.NAME)
    local mediator = self.facade:retrieveMediator(shrew.view.GameViewMediator.NAME)
    local message = note:getBody()  

    local globalProxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
    local myPlayerId = globalProxy._myPlayerVo.playerId    
    local playerProxy = self.facade:retrieveProxy(common.model.PlayerProxy.NAME) 
    local myPlayer = playerProxy:getPlayer(myPlayerId)
    
    if myPlayer ~= nil then
    	
    	--更新用户名，头像
        mediator:setPalyerBaseInfo(myPlayer.face, myPlayer.username)
        
        --更新银子
        proxy._myMoney  = message._money
        mediator:setPalyerMoney(message._money)
        
        --更新等级
        mediator:setLevel(myPlayer.level)
        
        --更新体力值
        mediator:setPower(message._power, message._powerTop)
        proxy._power = message._power
        proxy._powerTop = message._powerTop
        
        --更新愤怒值      
        mediator:setAngry(message._angry)
        proxy._angry = message._angry

        for i = 1, #message._hammerUsable do  
        
            if message._hammerUsable[i] ~= nil then
                mediator:updataFreeHammer(i, message._hammerUsable[i]._id, message._hammerUsable[i]._count)
                -- print("免费锤子数：", message._hammerUsable[i]._count)
            end

        end      
    end

       
    globalProxy._isResume = false
end

return RespGameSceneCommand