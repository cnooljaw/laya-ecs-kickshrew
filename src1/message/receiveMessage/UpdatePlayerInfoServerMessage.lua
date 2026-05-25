local ReceiveMessage = require("message.ReceiveMessage")
local iconv = require("iconv")
local PlayerVo = require("lobby.model.vo.PlayerVo")


local UpdatePlayerInfoServerMessage = class("UpdatePlayerInfoServerMessage",ReceiveMessage)


local IntValueEnum = {--int elements
    money = 4, -- Kreuz
    score = 5,
    numOfWin  = 7, -- PIK
    numOfLost = 8,
    numOfDraw = 9,
    face = 11,
    sexid = 12,
    vip = 16,
    level = 15,
    withSameip=17,
    withBlack = 18,     --  18,(新的游戏还没再用)
    friendCanSameIP = 19,-- ObjectPlayer_FriendCanSameIP= 19,(新的游戏还没再用)
    numOfEscape = 21,   --  ObjectPlayer_NumOfEscape    = 21,(新的游戏还没再用)
    limitMask= 25,    --    ObjectPlayer_LimitMask      = 25,
    gold = 30,--    ObjectPlayer_Gold           = 30,
    vipDeadline = 31, --    ObjectPlayer_VipDeadline    = 31,到期日
    moneyBank = 35,
    monthCardEnd = 85,
    monthCardPer = 86,
    monthCardHas = 87,
    monthCardNot = 88,
    serverID = 80,
    chairID = 81,
    }
    
local StringValueEnum = {
    -- string elements
    username = 10,
    userlevel = 14,
    tablePwd = 20, --   ObjectPlayer_TablePWD       = 20,(新的游戏还没再用)
    bosskey = 23,
    passwd =24 ,
    userface =26,
    usergroup =27,
    userjob =28,
--    usersign= 29,-- ObjectPlayer_UserSign       = 29,星级用户 忽略

    mobile= 32,     --binding player's  mobile
    realname= 33,     --binding ID player's  真实姓名
    idcard= 34,     --binding player's  ID 身份证号码
    }



function UpdatePlayerInfoServerMessage:isIntValue(idx)
    for k,v in pairs(IntValueEnum) do

    	if v == idx then
    		return true,k
    	end
    end
    
    return false,nil
end

function UpdatePlayerInfoServerMessage:isStringValue(idx)
    for k,v in pairs(StringValueEnum) do
        if v == idx then
            return true,k
        end
    end

    return false,nil
end


--将解析到的player存储到单例的playermanager
function UpdatePlayerInfoServerMessage:unPackMessage()
    self._playerVo = PlayerVo.new()
    local idx = self._body:readShort()
    local playerId = self._body:readUInt()
    self._playerVo.playerId = playerId
    
    while self._body:getAvailable() > 2 do
        idx = self._body:readShort()
        local re,key = self:isIntValue(idx) 
        
        if re == true then
            local value = self._body:readInt()
            self._playerVo[key] = value
--            Log.i("playerVo key:" .. key  .. ",value:"..value)
        else

            local re,key = self:isStringValue(idx) 
            if re == true then
            	local strlen = self._body:readShort()
                local value = self._body:readString(strlen)
            
                value = iconv.luaiconv(value,"GBK","UTF-8") 
                
                Log.i("playerVo key:" .. key  .. ",value:"..value)
                self._playerVo[key] = value
            else
                Log.i("not find :"..idx)
            end
        end
    end
end

return UpdatePlayerInfoServerMessage