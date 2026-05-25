--[[
红色地鼠类
@author lsd
]]


local RedShrew = class("RedShrew",shrew.view.BaseShrew)

function RedShrew:ctor(shrewType, map_type)
    
    RedShrew.super.ctor(self)
    
    self._prop = nil
    
    --加载资源列表
    cc.SpriteFrameCache:getInstance():addSpriteFrames("kickshrew_role_red.plist")
    
    self:init(shrewType, map_type)
end

--[[
初始化地鼠
--]]
function RedShrew:init(shrewType, map_type)
            
    RedShrew.super.initBaseShrew(self, shrewType) 
    --初始数据
    self._hp = 1
	self._mapType = map_type
	self._frameSize = self._shrewBody:getContentSize()
	self:setContentSize(self._frameSize)
	self:setComPos()
	self:setComOrder()
	
    --根据不同的地图场景设置不同的道具
	if self._mapType == shrewData.Map.Meadow then  	
		self._prop = cc.Sprite:createWithSpriteFrameName(self._shrewData.prop1)
		self._prop:setPosition(cc.p(self._frameSize.width * 0.53, self._frameSize.height * 1.06))   
		    		
	elseif self._mapType == shrewData.Map.Ship then
	   self._prop = cc.Sprite:createWithSpriteFrameName(self._shrewData.prop2)
        self._prop:setPosition(cc.p(self._frameSize.width * 0.5, self._frameSize.height * 0.86))    
	
	elseif self._mapType == shrewData.Map.Sewer then
	   self._prop = cc.Sprite:createWithSpriteFrameName(self._shrewData.prop3)
        self._prop:setPosition(cc.p(self._frameSize.width * 0.5, self._frameSize.height * 0.68))    
	
	elseif self._mapType == shrewData.Map.Space then
	   self._prop = cc.Sprite:createWithSpriteFrameName(self._shrewData.prop4)
        self._prop:setPosition(cc.p(self._frameSize.width * 0.5, self._frameSize.height * 0.51))    

	else
	
	end    	
    self._mainLayer:addChild(self._prop, shrewData.Zorder.kprops)
        
end

--[[
--]]
function RedShrew:setComPos()
    
    self._shrewBody:setPosition(cc.p(self._frameSize.width * 0.5, self._frameSize.height * 0.5))
    self._shrewFace:setPosition(cc.p(self._frameSize.width * 0.5, self._frameSize.height * 0.6))
    self._shrewEarLeft:setPosition(cc.p(self._frameSize.width * 0.1, self._frameSize.height * 0.8))
    
    if self._mapType == shrewData.Map.Ship then
    	self._shrewEarRight:setSpriteFrame("red_ear_right_up1.png")
    end
    self._shrewEarRight:setPosition(cc.p(self._frameSize.width * 0.88, self._frameSize.height * 0.8))
    
    self._shrewHandLeft:setPosition(cc.p(self._shrewBody:getPositionX() - self._frameSize.width * 0.55, self._frameSize.height * 0.42))
    self._shrewHandRight:setPosition(cc.p(self._shrewBody:getPositionX() + self._frameSize.width * 0.55, self._frameSize.height * 0.42))
    
end

--[[
设置各个元素的层次
--]]
function RedShrew:setComOrder()
    
     self._shrewBody:setLocalZOrder(shrewData.Zorder.kbody)
     self._shrewFace:setLocalZOrder(shrewData.Zorder.kface)
     self._shrewEarLeft:setLocalZOrder(shrewData.Zorder.kear)
     self._shrewEarRight:setLocalZOrder(shrewData.Zorder.kear)
     self._shrewHandLeft:setLocalZOrder(shrewData.Zorder.khand)
     self._shrewHandRight:setLocalZOrder(shrewData.Zorder.khand)
     
end

--[[
--]]
function RedShrew:setSwelling()
    
    self._shrewFace:setSpriteFrame("red_face_cry.png")
    self._shrewSwelling = cc.Sprite:createWithSpriteFrameName("red_swelling.png") 
    self._shrewSwelling:setPosition(cc.p(self._frameSize.width * 0.65, self._frameSize.height))  
    self._mainLayer:addChild(self._shrewSwelling, shrewData.Zorder.kSwelling)
    
 end


function RedShrew:doActionDown()
  
    self._shrewEarLeft:setSpriteFrame("red_ear_left_down.png")
    
    if self._mapType == shrewData.Map.Ship then
        self._shrewEarRight:setSpriteFrame("red_ear_right_down.png")
    else
    	self._shrewEarRight:setSpriteFrame("red_ear_right_down1.png")
    end
    
    RedShrew.super.doActionDown(self)
    
end


function  RedShrew:doActionUP()
    
    local nOffy = self:getContentSize().height *1.5
 
    local up = cc.MoveBy:create(0.31, cc.p(0, nOffy))
    local a4 = cc.CallFunc:create(handler(self,self.scaleToSmall))
    local a5 = cc.DelayTime:create(0.1)
    local a6 = cc.CallFunc:create(handler(self,self.scaleToNormal))

    local action = cc.Sequence:create(up, a4, a5, a6, cc.CallFunc:create(handler(self,self.upCallBack)))
    
    
    self:runAction(action)
    
    self._shrewAction = shrewData.Action.Up
    
end


function RedShrew:upCallBack()
       
    self._shrewEarLeft:setSpriteFrame("red_ear_left_normal.png")
    
    if self._mapType ~= shrewData.Map.Ship then
    	 self._shrewEarRight:setSpriteFrame("red_ear_right_normal.png")
    else
         self._shrewEarRight:setSpriteFrame("red_ear_right_normal1.png")
    end
end


return RedShrew