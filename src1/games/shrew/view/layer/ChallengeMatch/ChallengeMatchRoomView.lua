--[[
挑战赛房间类
@author pjchow
@data 15-09-17
]]
local awardInfoTable = {}
awardInfoTable[1] = {}
awardInfoTable[1].rankinfo = "第1名"
awardInfoTable[1].awardinfo = "10000银子"
awardInfoTable[2] = {}
awardInfoTable[2].rankinfo = "第2名"
awardInfoTable[2].awardinfo = "5000银子"
awardInfoTable[3] = {}
awardInfoTable[3].rankinfo = "第3名"
awardInfoTable[3].awardinfo = "2000银子"
awardInfoTable[4] = {}
awardInfoTable[4].rankinfo = "第4-10名"
awardInfoTable[4].awardinfo = "1000银子"
awardInfoTable[5] = {}
awardInfoTable[5].rankinfo = "第10-30名"
awardInfoTable[5].awardinfo = "500银子"


local ChallengeMatchRoomView = class("ChallengeMatchRoomView",common.view.BaseView)

function ChallengeMatchRoomView:ctor(room)
    self._room = room
    ChallengeMatchRoomView.super.ctor(self)
  
    self._awardInfoMoneyLabel = {}

    self._frameL = nil --awardInfo
    self._titleLabel = nil
    self._winSize = nil
    self:showIslandRoomView()

    self:refreshAwardInfo(awardInfoTable)
end

function ChallengeMatchRoomView:onEnter()
    self:printOnEnter()
end

function ChallengeMatchRoomView:onExit()
    self:printOnExit()

end


function ChallengeMatchRoomView:showIslandRoomView()
    self._winSize = cc.Director:getInstance():getWinSize()
    cc.SpriteFrameCache:getInstance():addSpriteFrames("res/ddz/ddz_islandroomview.plist")
    cc.SpriteFrameCache:getInstance():addSpriteFrames("res/kickshrew/kickshrew_roomView.plist")
    local islandRoomViewBg = cc.Sprite:create("res/ddz/ddz_islandroomview_bg.png")

    islandRoomViewBg:setPosition(self._winSize.width/2, self._winSize.height/2)
    self:addChild(islandRoomViewBg)
    self:setScaleBg(islandRoomViewBg)

    self:showTitle()
    self:showInfo()
    self:addButton()
end

function ChallengeMatchRoomView:showTitle()
    self._titleFrame = cc.Sprite:createWithSpriteFrameName("ddz_islandroomview_frame_title.png")
    self._titleLabel = cc.Sprite:createWithSpriteFrameName("kickshrew_roomview_title.png")
    self._titleFrame:setPosition(self._winSize.width/2,self._winSize.height - self._titleFrame:getBoundingBox().height*0.83)
    self:addChild(self._titleFrame)   
    self._titleLabel:setPosition(self._titleFrame:getBoundingBox().width/2,self._titleFrame:getBoundingBox().height/2)
    self._titleFrame:addChild(self._titleLabel)

    local treeL = cc.Sprite:createWithSpriteFrameName("ddz_islandroomview_icon_treeL.png")
    treeL:setAnchorPoint(cc.p(0,1))
    treeL:setPosition(0,self._winSize.height)
    self:addChild(treeL)

    self:addTitleLabel()
end

function ChallengeMatchRoomView:addTitleLabel()
 
end


function ChallengeMatchRoomView:showInfo()

    local labelSize = self._winSize.height *0.038

    --左侧
    self._frameL = cc.Sprite:createWithSpriteFrameName("ddz_islandroomview_frame_L.png")
    local frameCaseL1 = cc.Sprite:createWithSpriteFrameName("ddz_islandroomview_frame_caseL1.png")
    local divide = frameCaseL1:getBoundingBox().height*0.5
    

    local awardLabel = cc.Sprite:createWithSpriteFrameName("ddz_islandroomview_label_award.png")
    awardLabel:setPosition(self._winSize.width * 0.33, self._winSize.height * 0.72)
    self:addChild(awardLabel)

    self._frameL:setPosition(self._frameL:getBoundingBox().width/2+divide,self._frameL:getBoundingBox().height/2+divide)
    self:addChild(self._frameL)
    self._frameL:setOpacity(0)
    
    frameCaseL1:setAnchorPoint(0,0)
    frameCaseL1:setPosition(self._winSize.width * 0.08, self._winSize.height * 0.62)
    self:addChild(frameCaseL1)

    self._conditions =  cc.LabelTTF:create("", "", labelSize)
    self._conditions:setColor(cc.c3b(255,255,255))
    self._conditions:setPosition(frameCaseL1:getBoundingBox().width/2,frameCaseL1:getBoundingBox().height/2)
    frameCaseL1:addChild(self._conditions)
    self._conditions:setString("名次\t\t\t\t\t\t\t\t\t\t\t奖励")

    

    --右侧
    local frameR1 = cc.Sprite:createWithSpriteFrameName("ddz_islandroomview_frame_caseR1.png")
    local frameR3 = cc.Sprite:createWithSpriteFrameName("kickshrew_roomview_bg_matchtime.png")
    local frameRWidth = frameR1:getBoundingBox().width
    frameR1:setPosition(self._winSize.width*0.8, self._winSize.height * 0.4)
    self:addChild(frameR1)
    frameR3:setAnchorPoint(cc.p(0.5, 1))
    frameR3:setPosition(self._winSize.width*0.8, self._winSize.height * 0.62 + frameCaseL1:getBoundingBox().height)
    self:addChild(frameR3)

    self._restrictContentLabel = cc.LabelTTF:create("比赛时间：每日10:00-22:00\n每五分钟一场","",labelSize)
    -- self._restrictContentLabel:setHorizontalAlignment(cc.)
    self._restrictContentLabel:setColor(cc.c3b(255,255,255))
    self._restrictContentLabel:setPosition(frameR3:getBoundingBox().width*0.5 ,frameR3:getBoundingBox().height/2)
    frameR3:addChild(self._restrictContentLabel)

    self._changeTimesLabel = cc.LabelTTF:create("剩余挑战次数：0/10","",labelSize)
    self._changeTimesLabel:setAnchorPoint(cc.p(0.5,0.5))
    self._changeTimesLabel:setColor(cc.c3b(255,255,255))
    self._changeTimesLabel:setPosition(frameR1:getBoundingBox().width*0.5 ,frameR1:getBoundingBox().height/2)
    frameR1:addChild(self._changeTimesLabel)

end

function ChallengeMatchRoomView:showAwardInfo()
    local labelSize = self._winSize.height * 0.046
    local scrollViewWidth = self._frameL:getBoundingBox().width
    local scrollViewHeight = self._frameL:getBoundingBox().height
    local islandAwardInfoTable = require("common.view.ui.IslandAwardInfoTable").new(self._rankTable ,self._awardTabel,cc.size(scrollViewWidth,scrollViewHeight))
    islandAwardInfoTable:setPosition(self._winSize.width* 0.08,self._winSize.height* 0.12)
    self:addChild(islandAwardInfoTable)

end


function ChallengeMatchRoomView:buttonClick(ref, type)
    if type == ccui.TouchEventType.ended then
        if ref == self._helpBtn then
            self:onViewClickCallBack({"goRoomInfoView"})
        elseif ref == self._backBtn then
            self:onViewClickCallBack("backtohall")
        elseif ref == self._enterBtn then
            self:onViewClickCallBack({"sitdown", 65535, 65535})
        end
    end
    
end

function ChallengeMatchRoomView:addButton()

    self._helpBtn = ccui.Button:create("ddz_islandroomview_btn_help.png","ddz_islandroomview_btn_help_down.png",nil,1)
    self._helpBtn:addTouchEventListener(handler(self,self.buttonClick))
    self._helpBtn:setPosition(self._winSize.width*0.625,self._winSize.height - self._titleFrame:getBoundingBox().height*0.83)
    self:addChild(self._helpBtn)
    self._backBtn = ccui.Button:create("ddz_islandroomview_btn_back.png","ddz_islandroomview_btn_back_down.png",nil,1)
    self._backBtn:addTouchEventListener(handler(self,self.buttonClick))
    self._backBtn:setPosition(self._winSize.width*0.9,self._winSize.height*0.9)
    self:addChild(self._backBtn)
    self._enterBtn = ccui.Button:create("kickshrew_roomview_btn_challenge.png","kickshrew_roomview_btn_challenge_down.png",nil,1)
    self._enterBtn:addTouchEventListener(handler(self,self.buttonClick))
    self._enterBtn:setPosition(self._winSize.width*0.8,self._winSize.height*0.18)
    self:addChild(self._enterBtn)
end



function ChallengeMatchRoomView:refreshPlayCount(times)
    local timeStr = string.format("剩余挑战次数：%d/10", times)
    if self._changeTimesLabel then
        self._changeTimesLabel:setString(tostring(timeStr))
    end
end


function ChallengeMatchRoomView:refreshAwardInfo(awardInfoTable)
    local rankTable = {}
    local awardTable = {}
    local i = 1
    for key, var in pairs(awardInfoTable) do
        rankTable[i] = var.rankinfo
        awardTable[i] = var.awardinfo
        i = i + 1
    end
    self._awardTabel = awardTable
    self._rankTable = rankTable
    self:showAwardInfo()
end

function ChallengeMatchRoomView:setBaseScoreLabel(scoreStr)
    self._restrictContentLabel:setString(scoreStr)
end

function ChallengeMatchRoomView:setAwardTitleLabel(titleStr)
    self._conditions:setString(titleStr)
end


return ChallengeMatchRoomView