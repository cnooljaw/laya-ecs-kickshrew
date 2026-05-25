--[[
金币粒子类
@author lsd
]]

local GoldParticle = class("GoldParticle",function ()
    return cc.Layer:create()
end)

function GoldParticle:ctor(reward)
       
    self._winSize = cc.Director:getInstance():getWinSize()
  
    --音效
--    sound.playEffect(SoundRes.shrew.coin)
    sound.playEffect(SoundRes.shrew.award)
    
    --金币粒子动画
    if reward > 0 and reward <= 1000 then
        self:createWithTotalParticles(5)
        
    elseif reward > 1000 and reward <= 10000 then
        self:createWithTotalParticles(10)
        
    elseif reward > 10000 then
        self:createWithTotalParticles(20)
    end
    
    --金币数目
    self:showGoldNum(reward)
    
end


function GoldParticle:createWithTotalParticles(numberOfParticles)
    
       
    self._emitter = cc.ParticleSystemQuad:createWithTotalParticles(numberOfParticles)
    self._emitter:setTexture( cc.Director:getInstance():getTextureCache():addImage("kickshrew_gold.png"))
    
    self._emitter:setDuration(0.05)
    self._emitter:setEmitterMode(cc.PARTICLE_MODE_GRAVITY)
        
    if self._winSize.height == 768 then
        self._emitter:setGravity(cc.p(0,-300))
    else
        self._emitter:setGravity(cc.p(0,-500))
    end
        
   
    -- angle
    self._emitter:setAngle(90)
    self._emitter:setAngleVar(10)
    
    --life of particles
    self._emitter:setLife(2)
    self._emitter:setLifeVar(1)
    
    -- size, in pixels
    local scale = cc.Director:getInstance():getContentScaleFactor()
    self._emitter:setStartSize(30.0 / scale)
    self._emitter:setStartSizeVar(0)
    self._emitter:setEndSize(30.0 / scale)
    
    -- emits per second
    self._emitter:setEmissionRate(self._emitter:getTotalParticles() / self._emitter:getDuration())
    
    -- color of particles
    self._emitter:setStartColor(cc.c4f(1.0, 1.0, 1.0, 1.0))
    self._emitter:setStartColorVar(cc.c4f(0.0, 0.0, 0.0, 0.0))
    self._emitter:setEndColor(cc.c4f(1.0, 1.0, 1.0, 0.9))
    self._emitter:setEndColorVar(cc.c4f(0.0, 0.0, 0.0, 0.0))

          
    self._emitter:setBlendAdditive(false)
    self._emitter:setAutoRemoveOnFinish(true)
    self._emitter:setSpeed(250)
    self._emitter:setSpeedVar(50)
    
    self:addChild(self._emitter)
    
    
    local delay = cc.DelayTime:create(1)
    local seq = cc.Sequence:create(delay, cc.CallFunc:create(handler(self, self.showGoldCallBack)))  
    self._emitter:runAction(seq)
    
end

function GoldParticle:showGoldCallBack()

    if self._emitter ~= nil then
        self._emitter:removeFromParent()
        self._emitter = nil
    end

end

--[[
显示金币数字
--]]
function GoldParticle:showGoldNum(reward)
        
    self._rewardNum = cc.LabelBMFont:create("", self:getFont())
   
    self:addChild(self._rewardNum)
    self._rewardNum:setString(tostring(reward))
    self._rewardNum:setScale(1.2)
    self._rewardNum:setPosition(cc.p(0, self._rewardNum:getContentSize().height * 2))
    
    local delay = cc.DelayTime:create(1)
    local seq = cc.Sequence:create(delay, cc.CallFunc:create(handler(self, self.showGoldNumCallBack)))  
    self._rewardNum:runAction(seq)
    
end

function GoldParticle:showGoldNumCallBack()

    if self._rewardNum ~= nil then
        self._rewardNum:removeFromParent()
        self._rewardNum = nil
    end
    
end

--[[
获取字体
--]]
function GoldParticle:getFont()

    local font 
    local targetPlatform = cc.Application:getInstance():getTargetPlatform()
    if cc.PLATFORM_OS_IPHONE  == targetPlatform or cc.PLATFORM_OS_IPAD == targetPlatform then
        font = "hammer_price.fnt"
    else
        font = "hammer_price.fnt"
    end

    return font
end

return GoldParticle