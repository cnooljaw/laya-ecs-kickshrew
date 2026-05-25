local ChallengeMatchRoomViewMediator = class("ChallengeMatchRoomViewMediator", shrew.view.RoomViewMediator)


--function ChallengeMatchRoomViewMediator:setRoomView()
--    self:setViewComponent(shrew.view.ChallengeMatchRoomView.new())
--end

--function ChallengeMatchRoomViewMediator:sendEvent()
--    --重写父类
--    
--end

function ChallengeMatchRoomViewMediator:goGame()

    local designSize = cc.Director:getInstance():getOpenGLView():getFrameSize()
    local scale = 640/designSize.height
    cc.Director:getInstance():setContentScaleFactor(scale)
    --cc.Director:getInstance():getOpenGLView():setDesignResolutionSize(1136, 640, cc.ResolutionPolicy.FIXED_HEIGHT)
    self.facade:changeMediator(self,shrew.view.ChallengeMatchGameViewMediator.new())
  
end

return ChallengeMatchRoomViewMediator