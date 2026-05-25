local RespHammerListCommand = class("RespHammerListCommand",puremvc.SimpleCommand)



function RespHammerListCommand:execute(note)
    Log.i("-------RespHammerListCommand:execute")

    local proxy = self.facade:retrieveProxy(shrew.model.GameProxy.NAME)
    local mediator = self.facade:retrieveMediator(shrew.view.GameViewMediator.NAME)
    local message = note:getBody()

    proxy._hammerList = proxy._hammerList or {}
    --减1是除去雷神锤
    for i = 1, #message._hammerList - 1 do  
    
        if message._hammerList[i] ~= nil then
            mediator:updataHammerListItem(i, message._hammerList[i]._id, message._hammerList[i]._price)
            mediator:updataFreeHammer(i, message._hammerList[i]._hammerUsable._id, message._hammerList[i]._hammerUsable._count)
            proxy._hammerList[i] = message._hammerList[i]
        end

    end
    
    local preHammerID = cc.UserDefault:getInstance():getIntegerForKey(AppMacros.shrew.preHammerID)
    if preHammerID == 0 then
        preHammerID = 1
    end
    mediator:updataSelectedHammer(preHammerID)
end

return RespHammerListCommand