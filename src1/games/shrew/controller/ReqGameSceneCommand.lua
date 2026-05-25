local ReqGameSceneCommand = class("ReqGameSceneCommand",puremvc.SimpleCommand)

function ReqGameSceneCommand:execute(note)
    Log.i("-------------ReqGameSceneCommand:execute")
    local proxy = self.facade:retrieveProxy(shrew.model.GameProxy.NAME)
    proxy:doGameScene() 
end

return ReqGameSceneCommand