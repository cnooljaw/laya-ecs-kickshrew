--[[
加载界面
@author lsd
]]

local LoadingView = class("LoadingView",common.view.BaseView)

function LoadingView:ctor()
    LoadingView.super.ctor(self)
    
    self._winSize = cc.Director:getInstance():getWinSize()
    
    --加载资源列表
    cc.SpriteFrameCache:getInstance():addSpriteFrames("common_loading_view.plist")
    
    
    self:init()
    
end

function LoadingView:onExit()

    --释放资源
    cc.SpriteFrameCache:getInstance():removeSpriteFramesFromFile("common_loading_view.plist")
    
end

function LoadingView:init()

    --背景
    self._bg = cc.Sprite:create("tile_dark_bk.png")
    self._bg:setTextureRect(cc.rect(0,0,self._winSize.width,self._winSize.height))
    self._bg:setAnchorPoint(cc.p(0,0))
    self._bg:setPosition(0,0)
    self:addChild(self._bg)
    self._bg:getTexture():setTexParameters(0x2601, 0x2601, 0x812f, 0x812f) 
    
    --地鼠图标
    self._iconShrew = cc.Sprite:createWithSpriteFrameName("shrew.png")
    self._bg:addChild(self._iconShrew)
    self._iconShrew:setPosition(self._winSize.width/2, self._winSize.height * 0.6)
    
    --文字1
    self._font1 = cc.Sprite:createWithSpriteFrameName("loading_font1.png")
    self._bg:addChild(self._font1)
    self._font1:setPosition(self._winSize.width * 0.5, self._winSize.height * 0.4)
    
    --加载动画
    local animFrames = {}
    for i = 1, 3 do
        local resName = string.format("loading_action_pt%d.png",i)
        local pFrame = cc.SpriteFrameCache:getInstance():getSpriteFrame(resName)
        animFrames[i] = pFrame
    end

    self._actionSprite = cc.Sprite:createWithSpriteFrame(animFrames[1])
    self._actionSprite:setPosition(self._winSize.width * 0.5 + self._font1:getBoundingBox().width*0.6, self._winSize.height * 0.4)
    self._bg:addChild(self._actionSprite)

    local animation = cc.Animation:createWithSpriteFrames(animFrames, 0.5) --这里定义了每一帧，和动画的间隔时间
    local animate = cc.Animate:create(animation) --这里创建了动画的Action 
    self._actionSprite:runAction(cc.RepeatForever:create(animate))
    
    
    -- --文字2
    -- self._font2 = cc.Sprite:createWithSpriteFrameName("loading_font2.png")
    -- self:addChild(self._font2)
    -- self._font2:setPosition(self._winSize.width * 0.5, self._winSize.height * 0.32)
    
end

function LoadingView:setVisiable()
	self._bg:setVisible(false)
end

function LoadingView:showMsgBox(info)
    doMsgBox(self, info,handler(self, self.onViewClickCallBack))
end

return LoadingView