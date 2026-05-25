--[[
地鼠敲击后的要发送的数据包结构体
--]]
local ShrewReqVo = class("ShrewReqVo")

function ShrewReqVo:ctor()

    self.shrewindex = 0   --地鼠位置
    self.protectType = 0  --保护罩类型
end

return ShrewReqVo