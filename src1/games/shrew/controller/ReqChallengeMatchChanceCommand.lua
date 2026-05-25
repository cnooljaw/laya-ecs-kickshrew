local ReqChallengeMatchChanceCommand = class("ReqChallengeMatchChanceCommand",puremvc.SimpleCommand)

function ReqChallengeMatchChanceCommand:execute(note)
    Log.i("ReqChallengeMatchChanceCommand:execute")
    
    local proxy = self.facade:retrieveProxy(shrew.model.GameProxy.NAME)
    proxy:doChallengeMatchChance() 
    
end

return ReqChallengeMatchChanceCommand