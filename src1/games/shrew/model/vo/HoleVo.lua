--[[
地鼠洞的结构
--]]
local HoleVo = class("HoleVo")

function HoleVo:ctor()

    self.x = 0   --所在行
    self.y = 0   --所在列
end

return HoleVo