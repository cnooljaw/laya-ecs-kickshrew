local RespChallengeMatchGameSceneCommand = class("RespChallengeMatchGameSceneCommand",puremvc.SimpleCommand)



function RespChallengeMatchGameSceneCommand:execute(note)
    Log.i("RespChallengeMatchGameSceneCommand:execute")
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
        --更新等级
        mediator:setLevel(myPlayer.level)

        if message._matchState == 1 and proxy._isShowBeginBox == false then

	        --更新排名
	        mediator:updateMatchRank(message._rank, message._playerNum)
	        --更新剩余时间
	        mediator:updateMatchCountdown(message._time)
	        --更新分数
	        mediator:updateMatchMyScore(message._score)
	        --更新最高分
	        mediator:updateMatchMaxScore(message._maxScore)
            if proxy._isChallengeMatchStart == false then
                mediator:startShowRandShrew()
                proxy._isChallengeMatchStart = true
            end 
	    elseif message._matchState == 0  then
            Log.i("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<",proxy._isShowBeginBox)
            if proxy._isShowBeginBox == false then
              mediator:updateMatchDidNotStartCountdown(message._time)
            end
            --更新最高分
            mediator:updateMatchMaxScore(message._maxScore)
            --更新排名
            mediator:updateMatchRank(message._rank, message._playerNum)
            proxy._isChallengeMatchStart = false
	    end
     
    end
       
    globalProxy._isResume = false
end
return RespChallengeMatchGameSceneCommand