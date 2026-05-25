local RespChallengeMatchRankCommand = class("RespChallengeMatchRankCommand",puremvc.SimpleCommand)



function RespChallengeMatchRankCommand:execute(note)
    --Log.i("RespChallengeMatchRankCommand:execute")

    local proxy = self.facade:retrieveProxy(shrew.model.GameProxy.NAME)
    local mediator = self.facade:retrieveMediator(shrew.view.GameViewMediator.NAME)
    local message = note:getBody()
    
    proxy._rankList = proxy._rankList or {}
    proxy._rankList = message._rankList
    mediator:updataWeekRankView(proxy._rankList)
end

return RespChallengeMatchRankCommand