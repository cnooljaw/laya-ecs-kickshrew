local RespChallengeMatchChanceCommand = class("RespChallengeMatchChanceCommand",puremvc.SimpleCommand)



function RespChallengeMatchChanceCommand:execute(note)
    --Log.i("RespChallengeMatchChanceCommand:execute")
    
    local mediator = self.facade:retrieveMediator(shrew.view.GameViewMediator.NAME)
    local message = note:getBody()
    mediator:doUpdateMatchChance(message._chance, message._maxChance)
end

return RespChallengeMatchChanceCommand