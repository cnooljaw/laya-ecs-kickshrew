local RespChallengeMatchRewardCommand = class("RespChallengeMatchRewardCommand",puremvc.SimpleCommand)

function RespChallengeMatchRewardCommand:execute(note)
    --Log.i("RespChallengeMatchRewardCommand:execute")
    local proxy = self.facade:retrieveProxy(shrew.model.GameProxy.NAME)
    local mediator = self.facade:retrieveMediator(shrew.view.GameViewMediator.NAME)
    local message = note:getBody()
	if proxy._isShowBeginBox == false then
        proxy._isShowBeginBox = true
    	mediator:showMatchOverBox(message._rank, message._reward, message._userName, message._matchName)
    end
    proxy._isChallengeMatchStart = false
end

return RespChallengeMatchRewardCommand