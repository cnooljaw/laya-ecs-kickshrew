local ReqSitDownCommand = class("ReqSitDownCommand",puremvc.SimpleCommand)

function ReqSitDownCommand:execute(note)
    Log.i("ReqSitDownCommand:execute")
    local Proxy = self.facade:retrieveProxy(shrew.model.RoomProxy.NAME) 
    Proxy:doSitDown(note:getBody())
end

return ReqSitDownCommand