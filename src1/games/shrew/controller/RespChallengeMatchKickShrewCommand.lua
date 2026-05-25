local RespChallengeMatchKickShrewCommand = class("RespChallengeMatchKickShrewCommand",puremvc.SimpleCommand)



function RespChallengeMatchKickShrewCommand:execute(note)
    --Log.i("RespChallengeMatchKickShrewCommand:execute")
    
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
                local temp = string.format("[%s] 您获得了%d积分！", time, message._shrewResp[i]._reward)                                      
                proxy._rewardInfoCount = proxy._rewardInfoCount + 1
                proxy._rewardInfo[proxy._rewardInfoCount] = temp
           end                            
        end        
        mediator:updataRewardInfo(proxy._rewardInfo)
    end

    if message._ret == 0 then
        --更新排名
        mediator:updateMatchRank(message._rank, message._playerNum)
        --更新分数
        mediator:updateMatchMyScore(message._score)
        --更新最高分
        mediator:updateMatchMaxScore(message._maxScore)

        
    elseif message._ret == -1 and proxy._isChallengeMatchStart == true then
        mediator:showMsgBox(message._szReason)
    end
    
end
return RespChallengeMatchKickShrewCommand