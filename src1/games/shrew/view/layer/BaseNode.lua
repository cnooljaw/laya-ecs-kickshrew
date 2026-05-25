--[[
地鼠基础Node类
@author lsd
]]

local BaseNode = class("BaseNode",function ()
    return cc.Node:create()
end)

function BaseNode:ctor()
      
    self._bSwallowsTouches  = false
    self._bTouchEnable      = false
    self._priority          = -1

    local function onNodeEvent(tag)
        if tag == "enter" then
            self:onEnter()
        elseif tag == "exit" then
            self:onExit()
        end
    end

    self:registerScriptHandler(onNodeEvent)

end

function BaseNode:onEnter()
  --  Log.i("BaseNode:onEnter()")
end

function BaseNode:onExit()
  --  Log.i("BaseNode:onExit()")
end


function BaseNode:isTouchInRect(pNode, pTouch)
    
    local touchLocation = pNode:getParent():convertTouchToNodeSpace(pTouch)   
    return self:getRect(pNode):containsPoint(touchLocation)    
    
end

--[[
移除节点
@param fatherNode    父节点
@param childNode     要移除的子节点
]]
function BaseNode:removeChild(fatherNode, childNode)
    if  childNode ~= nil then
        fatherNode:removeChild(childNode)
        childNode = nil
    end
end



return BaseNode