local ReqGameExitCommand = class("ReqGameExit",puremvc.SimpleCommand)

function ReqGameExitCommand:execute(note)
    Log.i("ReqGameExit:execute")
    
    local proxy = self.facade:retrieveProxy(shrew.model.GameProxy.NAME)
    local mediator = self.facade:retrieveMediator(shrew.view.GameViewMediator.NAME)
    proxy:doGameExit(note:getBody()) 
    
end

return ReqGameExitCommand