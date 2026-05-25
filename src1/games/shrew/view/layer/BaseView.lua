--[[
打地鼠游戏界面基础类
@author lsd
]]

local BaseView = class("BaseView",common.view.BaseView)

function BaseView:ctor()

    BaseView.super.ctor(self)
    
    self._uiEventListener = nil
    
end

--[[
设置ui事件监听者
--]]
function BaseView:setUiEventListener(pListener)
 
    self._uiEventListener = pListener 
end

--[[
--]]
function BaseView:onEnter()

    self._uiEventListener:retain()
    BaseView.super.onEnter(self)
    
 end  

function BaseView:onExit()

    BaseView.super.onExit(self)
    self._uiEventListener:release()
end
   
return BaseView