--[[
地鼠资源结构体
--]]
local ShrewResVo = class("ShrewResVo")

function ShrewResVo:ctor()

    self.bodyNormalResIndex        = nil       --身体 
    self.faceNormalResIndex        = nil       --脸
    self.leftHandNormalResIndex    = nil       --左手
    self.rightHandNormalResIndex   = nil       --右手
    self.leftEyesNormalResIndex    = nil       --左眼
    self.rightEyesNormalResInde    = nil       --右眼
    self.LeftEarResIndex           = nil       --左耳朵
    self.RightEarResIndex          = nil       --右耳朵
    self.prop1                     = nil
    self.prop2                     = nil
    self.prop3                     = nil
    self.prop4                     = nil

end

return ShrewResVo