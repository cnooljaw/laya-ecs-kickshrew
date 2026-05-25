sound = sound or {}
--
--AudioEngine.preloadEffect(SoundRes.shrew.backgroundMusic)
--AudioEngine.preloadEffect(SoundRes.shrew.awavd)
--AudioEngine.preloadEffect(SoundRes.shrew.coin)
--AudioEngine.preloadEffect(SoundRes.shrew.hitOne)
--AudioEngine.preloadEffect(SoundRes.shrew.hitNull)
--AudioEngine.preloadEffect(SoundRes.shrew.shrewHit1)
--AudioEngine.preloadEffect(SoundRes.shrew.multiKick)
--AudioEngine.preloadEffect(SoundRes.shrew.leiShen)
local targetPlatform = cc.Application:getInstance():getTargetPlatform()

local function doSoundPlay(resName)
    if targetPlatform == cc.PLATFORM_OS_IPHONE or targetPlatform == cc.PLATFORM_OS_IPAD then
        local luaoc = require "cocos.cocos2d.luaoc"
        local className = "LuaBridgeTool"
        local resName = {resName = resName}
        local ret = luaoc.callStaticMethod(className, "doIosSoundPlay", resName)

    elseif targetPlatform == cc.PLATFORM_OS_ANDROID then
        AudioEngine.playEffect(resName)
    else
        return nil
    end
end

local function doBackgroundMusicPlay(resName)
    if targetPlatform == cc.PLATFORM_OS_IPHONE or targetPlatform == cc.PLATFORM_OS_IPAD then
        local luaoc = require "cocos.cocos2d.luaoc"
        local className = "LuaBridgeTool"
        local resName = {resName = resName}
        local ret = luaoc.callStaticMethod(className, "doIosBackgroundMusicPlay", resName)

    elseif targetPlatform == cc.PLATFORM_OS_ANDROID then
        AudioEngine.playMusic(resName..".wav", true)
    else
        return nil
    end
end


local function doStopBackgroundMusicPlay()
    if targetPlatform == cc.PLATFORM_OS_IPHONE or targetPlatform == cc.PLATFORM_OS_IPAD then
        local luaoc = require "cocos.cocos2d.luaoc"
        local className = "LuaBridgeTool"
        local ret = luaoc.callStaticMethod(className, "doIosStopBackgroundMusicPlay")

    elseif targetPlatform == cc.PLATFORM_OS_ANDROID then
        AudioEngine.stopMusic()
    else
        return nil
    end
end


--[[
播放背景音乐
@param resName: 声音资源名
--]]
function sound.playBackgroundMusic(resName)
    if cc.UserDefault:getInstance():getBoolForKey(AppMacros.sound.backgroundMusic, true) == true then
        doBackgroundMusicPlay(resName)
    end
    
end
--[[
停止播放背景音乐
@param resName: 声音资源名
--]]
function sound.stopBackgroundMusic() 

    Log.i("=======关闭背景音乐=======：")
    doStopBackgroundMusicPlay()
end

--[[
播放普通音效
@param resName: 声音资源名
--]]
function sound.playEffect(resName)

    if cc.UserDefault:getInstance():getBoolForKey(AppMacros.sound.soundEffect, true) == true then
        doSoundPlay(resName)
    end

end

--soundCount = 0
--[[
播放麻将出牌音效
@param cardVale: 牌值
--]]
function sound.playMjOutCardEffect(cardVale)


    if cc.UserDefault:getInstance():getBoolForKey(AppMacros.sound.soundEffect, true) == true then

        local gameLogicProxy = myAppFacade:retrieveProxy(nbmj.model.GameLogicProxy.NAME)

        local cardColor = gameLogicProxy:getCardColor(cardVale)
        local cardLocalVale = gameLogicProxy:getCardValue(cardVale)

--        soundCount = soundCount + 1
--        print(soundCount.."声音:"..cardColor..cardLocalVale)
        local soundRes = nil
        local proxy = myAppFacade:retrieveProxy(common.model.GlobalProxy.NAME)
        if proxy._currentGameId == AppMacros.GAMEID_MJ then
            soundRes = SoundRes.nbmj
        elseif proxy._currentGameId == AppMacros.GAMEID_XSMJ then 
            soundRes = SoundRes.xsmj
        elseif proxy._currentGameId == AppMacros.GAMEID_FHMJ then
            soundRes = SoundRes.fhmj
        end
        
        if cardColor == 0 then
            -- AudioEngine.playEffect(soundRes.wan[cardLocalVale])
            doSoundPlay(soundRes.wan[cardLocalVale])
        elseif cardColor == 1 then
            -- AudioEngine.playEffect(soundRes.tong[cardLocalVale])
            doSoundPlay(soundRes.tong[cardLocalVale])
        elseif cardColor == 2 then
            -- AudioEngine.playEffect(soundRes.tiao[cardLocalVale])
            doSoundPlay(soundRes.tiao[cardLocalVale])
        elseif cardColor == 3 then
            -- AudioEngine.playEffect(soundRes.zi[cardLocalVale])
            doSoundPlay(soundRes.zi[cardLocalVale])
        end
        -- AudioEngine.playEffect(soundRes.cardDown)
        doSoundPlay(soundRes.cardDown)
    end

end






