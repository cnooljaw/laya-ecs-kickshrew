local ReqGameReadyCommand = class("ReqGameReadyCommand",puremvc.SimpleCommand)

function ReqGameReadyCommand:execute(note)
    --Log.i("ReqGameReady:execute")
    local proxy = self.facade:retrieveProxy(shrew.model.GameProxy.NAME)
    proxy:doGameReady() 
end

return ReqGameReadyCommand