local ReqKickShrewCommand = class("ReqKickShrewCommand",puremvc.SimpleCommand)

function ReqKickShrewCommand:execute(note)
    --Log.i("ReqKickShrewCommand:execute")

    local proxy = self.facade:retrieveProxy(shrew.model.GameProxy.NAME)    
    proxy:doKickShrew(note:getBody()) 

end

return ReqKickShrewCommand