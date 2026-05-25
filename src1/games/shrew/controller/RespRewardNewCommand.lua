local RespRewardNewCommand = class("RespRewardNewCommand",puremvc.SimpleCommand)


function RespRewardNewCommand:execute(note)
    Log.i("RespRewardNewCommand:execute")
    
    local proxy = self.facade:retrieveProxy(shrew.model.GameProxy.NAME)
    local mediator = self.facade:retrieveMediator(shrew.view.GameViewMediator.NAME)
    local message = note:getBody()
        
    mediator:showPlayerAward(message._username,message._hammerName, message._value)

end

return RespRewardNewCommand
