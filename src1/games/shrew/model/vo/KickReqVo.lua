--[[
地鼠敲击后的要发送的数据包结构体
--]]
local KickReqVo = class("KickReqVo")

local ShrewReqVo = require("games/shrew/model/vo/ShrewReqVo")

function KickReqVo:ctor()

    self.hammerType = 0  --锤子类型
    self.bKickShrew = 0  --是否打中地鼠
    self.numOfShrew = 0  --打中的地鼠数量
    
    self.shrews     = {}   --地鼠属性    
    for i = 1, 10 do
        self.shrews[i] = ShrewReqVo.new()
    end
    
    self.comboID     = {}   --连击编号
end

return KickReqVo