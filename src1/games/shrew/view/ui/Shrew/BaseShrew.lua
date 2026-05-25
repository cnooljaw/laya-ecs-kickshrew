--[[
地鼠基础类
@author lsd
]]
local scheduler = require "network.scheduler"
local BaseShrew = class("BaseShrew",shrew.view.BaseNode)

function BaseShrew:ctor()
    
    BaseShrew.super.ctor(self)
    
    self._shrewType         = shrewData.Type.red
    self._shrewAction       = shrewData.Action.None
    self._mapType           = shrewData.Map.None

    self._shrewBody         = nil   --主体资源
    self._shrewHandLeft     = nil   --手臂左资源
    self._shrewHandRight    = nil   --手臂左资源
    self._shrewEarLeft      = nil   --左耳朵资源
    self._shrewEarRight     = nil   --右耳朵资源
    self._shrewFace         = nil   --脸
    self._shrewSwelling     = nil
    
   
    self._isCanClick = false    --是否是可敲击状态
   
    self._handle = scheduler.scheduleGlobal(handler(self,self.heartBeat), 0.1) 
end

function BaseShrew:onExit()

    scheduler.unscheduleGlobal(self._handle)
end
--[[

--]]
function BaseShrew:initBaseShrew(shrewType)


    local proxy = myAppFacade:retrieveProxy(common.model.GlobalProxy.NAME)
    local roomId = proxy._currentRoom.roomId
    if roomId == 61002 then
        self._shrewAction       = shrewData.Action.None
    elseif roomId == 61011 then
        local proxy = myAppFacade:retrieveProxy(shrew.model.GameProxy.NAME)
        if proxy and proxy._isChallengeMatchStart == true  then
            self._shrewAction  = shrewData.Action.None
        else
            self._shrewAction = shrewData.Action.Sleep
        end
    end
    self:setShrewType(shrewType)
    self:comShrew()  

end

--[[
设置地鼠数据
--]]
function BaseShrew:setShrewType(shrewType)
     self._shrewType = shrewType
    self._shrewData = shrewRes[self._shrewType]    
end

--[[
初始化公共资源
--]]
function BaseShrew:comShrew()
    
    self._mainLayer = cc.Layer:create()
    --身子
    self._shrewBody = cc.Sprite:createWithSpriteFrameName(self._shrewData.bodyNormalResIndex)          
    self._mainLayer:addChild(self._shrewBody)
    self:setContentSize(cc.p(self._shrewBody:getContentSize().width, self._shrewBody:getContentSize().height))
            
    --脸
    self._shrewFace = cc.Sprite:createWithSpriteFrameName(self._shrewData.faceNormalResIndex)          
    self._mainLayer:addChild(self._shrewFace)
   
    --手臂左
    self._shrewHandLeft = cc.Sprite:createWithSpriteFrameName(self._shrewData.leftHandNormalResIndex)         
    self._mainLayer:addChild(self._shrewHandLeft)
    
    --手臂右
    self._shrewHandRight = cc.Sprite:createWithSpriteFrameName(self._shrewData.rightHandNormalResIndex)         
    self._mainLayer:addChild(self._shrewHandRight)
 
    
    --左耳
    self._shrewEarLeft = cc.Sprite:createWithSpriteFrameName(self._shrewData.LeftEarResIndex)         
    self._mainLayer:addChild(self._shrewEarLeft)
   
    
    --右耳
    self._shrewEarRight = cc.Sprite:createWithSpriteFrameName(self._shrewData.RightEarResIndex)         
    self._mainLayer:addChild(self._shrewEarRight)
            
end


--[[

--]]
function BaseShrew:getFrame()

    if self._shrewBody then
        return self._shrewBody
    else
        return nil
    end
end

--[[
心跳检测
dizzyAction 和 heartBeat分开处理
新创建的地鼠为ACTION_WAIT状态， 执行完动作序列后为ACTION_NONE 状态
放在control中控制，若为ACTION_NONE 状态，可以销毁地鼠
--]]
function BaseShrew:heartBeat()
    --如果当前有动作正在执行，则跳过本轮的心跳检测  
    if self:getNumberOfRunningActions() > 0 or self._shrewAction == shrewData.Action.Delay then
    	return
    end
    
    if self._shrewAction == shrewData.Action.None then
    
    	 self:doActionWait()
   	 
    elseif self._shrewAction == shrewData.Action.Wait then
    
        self:doActionUP()
       
    elseif self._shrewAction == shrewData.Action.Up then
    
        self:doActionStand()
        
    elseif self._shrewAction == shrewData.Action.Stand then
    
        self:doActionDown()

        
    elseif self._shrewAction == shrewData.Action.Down then
    
        self:doActionDown()
        -- local proxy = myAppFacade:retrieveProxy(common.model.GlobalProxy.NAME)
        -- local roomType = proxy._currentRoom.roomType
        -- if roomType == 7 then
        --     if proxy._isChallengeMatchStart == false  then
        --         self._shrewAction = shrewData.Action.Sleep
        --     end
        -- end
    elseif self._shrewAction == shrewData.Action.Sleep then
        return
    end
      
end

--[[
控制地鼠的出洞时间
--]]
function BaseShrew:doActionWait()
    local proxy = myAppFacade:retrieveProxy(common.model.GlobalProxy.NAME)
    local roomId = proxy._currentRoom.roomId
    local delayTime = 0
    if roomId == 61002 then
        delayTime = 7
    elseif roomId == 61011 then
         delayTime = 2
    end
    math.newrandomseed()
    local num = math.random(0,delayTime)  
    
    local action = cc.DelayTime:create(num + 1)
    self:runAction(action)
    
    self._shrewAction = shrewData.Action.Wait
    
end

--[[
动画：出洞
--]]
function BaseShrew:doActionUP()
    
    local nOffy = self:getContentSize().height *1.5
    
    local up = cc.MoveBy:create(0.31, cc.p(0, nOffy))
    local a4 = cc.CallFunc:create(handler(self,self.scaleToSmall))
    local a5 = cc.DelayTime:create(0.1)
    local a6 = cc.CallFunc:create(handler(self,self.scaleToNormal))
    
    local action = cc.Sequence:create(up, a4, a5, a6, cc.CallFunc:create(handler(self,self.upCallBack)))
    self._mainLayer:runAction(action)
    
    self._shrewAction = shrewData.Action.Up
end

--[[
是否是可敲击状态
--]]
function BaseShrew:isCanClick()
    
    if self._mainLayer:getPositionY() == 0 then

        return true
    else
        return false
    end
   -- return self._isCanClick
end

--[[
动画：停留时间
--]]
function BaseShrew:doActionStand()
   
    self._isCanClick = true
    local stand = cc.DelayTime:create(2)
    local sep = cc.Sequence:create(stand, cc.CallFunc:create(handler(self,self.standCallBack)))
    self._mainLayer:runAction(sep)
     
end

--[[
动画：进洞
--]]
function BaseShrew:doActionDown()
    
    local nOffy = self:getContentSize().height * 1.5
    
    local down = cc.MoveBy:create(0.31, cc.p(0, -nOffy))
    local action = cc.Sequence:create(down, cc.CallFunc:create(handler(self,self.downCallBack)))
    self._mainLayer:runAction(action)
    

end

--[[
动画：眩晕
--]]
function BaseShrew:doActionDizzy()
    
    self._isCanClick = false
    self:stopAllActions()
    local nOffx = 20
    
    local a1 = cc.MoveBy:create(0.04, cc.p(0, -nOffx))
    local a2 = cc.MoveBy:create(0.06, cc.p(0, nOffx * 2))
    local a3 = cc.MoveBy:create(0.04, cc.p(0, -nOffx))    
    local a4 = cc.Sequence:create(a3, cc.CallFunc:create(handler(self,self.showDizzy)))   
    local action = cc.Sequence:create(a1, a2, a4)
    
    self:runAction(action)

end

function BaseShrew:showDizzy()
   
    self:setSwelling()
    
    local animFrames = {}
    
    for i = 1, 6 do
    
        local resName = string.format("dizzy_star%d.png",i)
        local frame = cc.SpriteFrameCache:getInstance():getSpriteFrame(resName)
        animFrames[i] = frame
         	
    end
    
    if self._dizzySprite ~= nil then
        self._dizzySprite:removeFromParent()
        self._dizzySprite = nil
    end
    self._dizzySprite = cc.Sprite:createWithSpriteFrame(animFrames[1])
    self._dizzySprite:setPosition(cc.p(self._shrewBody:getPositionX(), self._shrewBody:getPositionY() + self._shrewBody:getContentSize().height*0.5))
    self:addChild(self._dizzySprite, shrewData.Zorder.knumber)

    
    local animation = cc.Animation:createWithSpriteFrames(animFrames, 0.2) --这里定义了每一帧，和动画的间隔时间
    local animate = cc.Animate:create(animation) --这里创建了动画的Action
    local seq = cc.Sequence:create(animate, cc.CallFunc:create(handler(self, self.dizzyCallBack)))  
    
    self._shrewAction = shrewData.Action.Delay
    self._dizzySprite:runAction(seq)
        
  
end

function BaseShrew:dizzyCallBack()

    self._dizzySprite:removeFromParent()
    self._dizzySprite = nil
    self._shrewAction = shrewData.Action.Down
    
end

function BaseShrew:scaleToNormal()

    self:setScaleY(0.95)
    self:setScaleX(1.05)
    
end

function BaseShrew:scaleToSmall()

    self:setScaleX(1.0)
    self:setScaleY(1.0)

end


function BaseShrew:upCallBack()
      
    self:setFrontHand()
     
end

function BaseShrew:downCallBack()
    self:setDownHand()
    self._shrewAction = shrewData.Action.Refresh 
end

function BaseShrew:standCallBack()
    
    self._shrewAction = shrewData.Action.Stand
    self._isCanClick = false
end

--[[
设置显示区域
--]]
function BaseShrew:setCanSeeViewRect()
         
    --设置显示区域
    local shap = cc.DrawNode:create()    
    shap:drawSolidRect(cc.p(-self:getContentSize().width * 0.5,0), cc.p(self:getContentSize().width * 1.2, self:getContentSize().height * 1.5), cc.c4f(255,1,0,1)) --创建显示的矩形区域
    local cliper = cc.ClippingNode:create()
    cliper:setStencil(shap)
    cliper:setAnchorPoint(cc.p(0,0))
    local px = 0
    local py = self:getContentSize().height 
    cliper:setPosition(0,0)
    self:addChild(cliper,100)  
    cliper:addChild(self._mainLayer,9999999)
  
    self._mainLayer:setPositionY( - self:getContentSize().height *1.5)
    
end

--[[
空函数，给继承者重写
--]]
function BaseShrew:setFrontHand()
end

--[[
空函数，给继承者重写
--]]
function BaseShrew:setDownHand()
end

--[[
空函数，给继承者重写
--]]
function BaseShrew:setSwelling()
end

--[[
空函数，给继承者重写
--]]
function BaseShrew:setComPos()
end

--[[
空函数，给继承者重写
--]]
function BaseShrew:setComOrder()
end


return BaseShrew
