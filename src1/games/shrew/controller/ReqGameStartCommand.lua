local ReqGameStartCommand = class("ReqGameStartCommand",puremvc.SimpleCommand)

function ReqGameStartCommand:execute(note)
    Log.i("ReqGameStartCommand:execute")
    local proxy = self.facade:retrieveProxy(shrew.model.GameProxy.NAME)
    local mediator = self.facade:retrieveMediator(shrew.view.GameViewMediator.NAME)
    proxy:doGameStart(note:getBody()) 
end

return ReqGameStartCommand