local RespKickShrewCommand = class("RespKickShrewCommand",puremvc.SimpleCommand)


function RespKickShrewCommand:execute(note)
    --Log.i("==========RespKickShrewCommand:execute")
    
    local proxy = self.facade:retrieveProxy(shrew.model.GameProxy.NAME)
    local mediator = self.facade:retrieveMediator(shrew.view.GameViewMediator.NAME)
    local message = note:getBody()
    
    local globalProxy = self.facade:retrieveProxy(common.model.GlobalProxy.NAME)
    local myPlayerId = globalProxy._myPlayerVo.playerId    
    local playerProxy = self.facade:retrieveProxy(common.model.PlayerProxy.NAME) 
    local myPlayer = playerProxy:getPlayer(myPlayerId)
    
    --设置连击数据（闪电链）
    mediator:setNCombo(message._combo)
    mediator:setNComboID(message._comboId)
    
    --打中的话
    if message._numOfShrew >= 1 then
    
        --更新免费锤子的数目
        local freeHammerCount = 0
        for i = 1, 6 do
            if proxy._hammerList[i]._hammerUsable._id == message._hammerId and proxy._hammerList[i]._hammerUsable._count > 0 then
                proxy._hammerList[i]._hammerUsable._count = proxy._hammerList[i]._hammerUsable._count -1
                mediator:updataFreeHammer(i, proxy._hammerList[i]._hammerUsable._id, proxy._hammerList[i]._hammerUsable._count)
            end
        end
        
                
        if message._hammerId == 99 then 
            --雷神的回包，播放宝箱动画
            mediator:playTreasueMovie(message._reward)
                
        else
            --显示金币洒落动画  
            mediator:showGoldAnimation(message._shrewResp)
            
        end
              	
        --更新个人获奖信息（左边弹出框）
        proxy._rewardInfo = proxy._rewardInfo or {}
        proxy._rewardInfoCount = proxy._rewardInfoCount or 0
        
        for i = 1, 10 do      
            if message._shrewResp[i]._reward > 0 then
        	
                local time = os.date("%X")
                local temp = string.format("[%s] 您获得了%d银子！", time, message._shrewResp[i]._reward)                                      
                proxy._rewardInfoCount = proxy._rewardInfoCount + 1
                proxy._rewardInfo[proxy._rewardInfoCount] = temp
           end                            
        end        
        mediator:updataRewardInfo(proxy._rewardInfo)
    end

    if message._ret == 0 then
        
        --显示雷神之锤
        if message._angry >= 1000 then
            sound.playEffect(SoundRes.shrew.leiShen)
            mediator:showAngryHammer()
    	end
    	
    	--更新愤怒值
        mediator:setAngry(message._angry)
        proxy._angry = message._angry
        
        --更新体力值
        proxy._powerTop = proxy._powerTop or 0
        mediator:setPower(message._power, proxy._powerTop)
        proxy._power = message._power
        
        --更新银子
        myPlayer.money = message._money
        proxy._myMoney = message._money
        mediator:setPalyerMoney(myPlayer.money)
        
        --更新等级
        Log.i("=============levelScore=============:", message._levelScore)
        myPlayer.level = message._levelScore       
        mediator:setLevel(myPlayer.level)

        --存储打死地鼠的时间，红包中用到
        Log.i("地鼠死亡时间")
        Log.i("os.time()",os.time())
        proxy._shrewdeadtime = os.time()
        
        
    elseif message._ret == -1 then
        mediator:showMsgBox(message._szReason)
    end
end

return RespKickShrewCommand