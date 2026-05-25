local SendMessage = require("message.SendMessage")

local SendMessageFactory = {}
require "iconv"

function SendMessageFactory.createBeatMessage()
    local sendMessage = SendMessage.new(ProtocolCommand.REQ_HEART_BEAT_CMD)
    sendMessage:getBody():writeShort(0)
    sendMessage:getBody():writeInt(0)
    sendMessage:buildData()
    return sendMessage
end



function SendMessageFactory.createLoginMessage(name,password,version)
    Log.i("==========【发送登陆请求】=============")
    --logintype,loginmode,name,password,mac1,mac2,version,macroId,serialid,carrierid
    local logintype = 0x00
    local loginmode = 0x20
    name = iconv.luaiconv(name,"UTF-8","GBK") --发送前中文内容先转码
    local namepack = network.ByteArray.new()
    namepack:writeString(name)
    for i=1, 32-string.len(name) do
        namepack:writeByte(0)	
    end 
    
    local passpack = network.ByteArray.new()
    passpack:writeString(password)
    for i=1, 32-string.len(password) do
        passpack:writeByte(0)   
    end 
    
    local mac1 = "mac1"
    local mac2 = "mac2"
    
    local mac1pack = network.ByteArray.new()
    mac1pack:writeString(mac1)
    for i=1, 8-string.len(mac1) do
        mac1pack:writeByte(0)   
    end 
    
    local mac2pack = network.ByteArray.new()
    mac2pack:writeString(mac2)
    for i=1, 8-string.len(mac2) do
        mac2pack:writeByte(0)   
    end 
    
    local macroIdpack = network.ByteArray.new()
    for i=1, 64 do
        macroIdpack:writeByte(0)   
    end 
    
    local serialidpack = network.ByteArray.new()
    for i=1, 64 do
        serialidpack:writeByte(0)   
    end 
    
    local carrieridpack = network.ByteArray.new()
    for i=1, 16 do
        carrieridpack:writeByte(0)   
    end 
   
    return SendMessageFactory.createFullLoginMessageEx(logintype,loginmode,namepack,passpack,mac1pack,mac2pack,version,macroIdpack,serialidpack,carrieridpack)                      
end

--[[创建QQ和新浪登陆的登陆消息包  @zero
@parm  openid        ->string
@parm  name          ->string
@parm  platFomrId    ->short
@param version       ->int
--]]
function SendMessageFactory.createSnsLoginMessage(cbType, cbMode, userName, password, version, pMacroID,
                                                  pSerialID, pCarrierID)
    local sendMessage = SendMessage.new(ProtocolCommand.REQ_LOGIN_CMD)
    
    
    --printf("snslogin message:cbType:%0x, cbMode:%0x, userName:%s, password:%s, version:%d, macroID:%s, serialID:%s, carrierId:%s", cbType,cbMode,userName, password, version, pMacroID, pSerialID, pCarrierID)
    
      
    userName = iconv.luaiconv(userName,"UTF-8","GBK") --发送前中文内容先转码
    local namepack = network.ByteArray.new()
    namepack:writeString(userName)
    for i=1, 32-string.len(userName) do
        namepack:writeByte(0)   
    end 
    
    password = iconv.luaiconv(password,"UTF-8","GBK")
    local passpack = network.ByteArray.new()
    passpack:writeString(password)
    for i=1, 32-string.len(password) do
        passpack:writeByte(0)   
    end 
    
    local mac1 = "mac1"
    local mac2 = "mac2"

    local mac1pack = network.ByteArray.new()
    mac1pack:writeString(mac1)
    for i=1, 8-string.len(mac1) do
        mac1pack:writeByte(0)   
    end 

    local mac2pack = network.ByteArray.new()
    mac2pack:writeString(mac2)
    for i=1, 8-string.len(mac2) do
        mac2pack:writeByte(0)   
    end 
 
    local macroIdpack = network.ByteArray.new()  
    macroIdpack:writeString(pMacroID)
    if pMacroID == "" then
        for i=1, 64  do
            macroIdpack:writeByte(0)   
        end 
    else
        for i=1, 64 - string.len(pMacroID) do
            macroIdpack:writeByte(0)
        end   
    end 

    local serialidpack = network.ByteArray.new()
    serialidpack:writeString(pSerialID)  
    if  pSerialID == "" then
        for i=1, 64 do
            serialidpack:writeByte(0)   
        end
    else    
         for i=1, 64 - string.len(pSerialID) do
            serialidpack:writeByte(0)
         end   
    end 

    local carrieridpack = network.ByteArray.new()
    carrieridpack:writeString(pCarrierID)    
    for i=1, 16 - string.len(pCarrierID) do
        carrieridpack:writeByte(0)   
    end 

    return SendMessageFactory.createFullLoginMessage(cbType,cbMode,namepack,passpack,mac1pack,mac2pack,version,macroIdpack,serialidpack,carrieridpack)                      
end


function SendMessageFactory.createFullLoginMessage(logintype,loginmode,name,password,mac1,mac2,version,macroId,serialid,carrierid)

    Log.i("logintype：",logintype)
    Log.i("loginmode:",loginmode)
    Log.i("name:",name)
    Log.i("password:",password)
    Log.i("mac1:",mac1)
    Log.i("mac2:",mac2)
    Log.i("version:",version)
    Log.i("macroId:",macroId)
    Log.i("serialid:",serialid)
    Log.i("carrierid:",carrierid)
    local sendMessage = SendMessage.new(ProtocolCommand.REQ_LOGIN_CMD)
    sendMessage:getBody():writeByte(logintype)
                        :writeByte(loginmode)
                        :writeBytes(name)
                        :writeBytes(password)
                        :writeBytes(mac1)
                        :writeBytes(mac2)
                        :writeInt(version)
                        :writeBytes(macroId)
                        :writeBytes(serialid)
                        :writeBytes(carrierid)

    sendMessage:buildData()                    
    return sendMessage                      
end

--[[
添加了uuid的登陆信息包
]]
function SendMessageFactory.createFullLoginMessageEx(logintype,loginmode,name,password,mac1,mac2,version,macroId,serialid,carrierid)
    local Bridge = require("sdks.Bridge")
    local uuid = Bridge:getDeviceToken()
    local uuidPack = network.ByteArray.new()
    uuidPack:writeString(uuid)
    for i=1, 32-string.len(uuid) do
        uuidPack:writeByte(0)   
    end 
    
    local sendMessage = SendMessage.new(ProtocolCommand.REQ_LOGIN_CMD)
    sendMessage:getBody():writeByte(logintype)
                        :writeByte(loginmode)
                        :writeBytes(name)
                        :writeBytes(password)
                        :writeBytes(uuidPack)
                        :writeBytes(mac2)
                        :writeInt(version)
                        :writeBytes(macroId)
                        :writeBytes(serialid)
                        :writeBytes(carrierid)
                        :writeBytes(uuidPack)
    sendMessage:buildData()                    
    return sendMessage                      
end


function SendMessageFactory.createReqPlayerInfoMessage(userId, authenticStr)
    local sendMessage = SendMessage.new(ProtocolCommand.REQ_PLAYERINFO_CMD)

    Log.i(userId)
    Log.i(authenticStr)
    sendMessage:getBody():writeInt(userId)
    sendMessage:getBody():writeString(authenticStr)
    for i=1, 16-string.len(authenticStr) do --16个字符不足，以空补全
        sendMessage:getBody():writeByte(0)
    end

    sendMessage:buildData()
    return sendMessage
end

function SendMessageFactory.createReqPlayerCountMessage(gameId)
    local sendMessage = SendMessage.new(ProtocolCommand.REQ_PLAYER_COUNT)

    sendMessage:getBody():writeShort(gameId)

    sendMessage:buildData()
    return sendMessage
end

function SendMessageFactory.createRegisterAccountMessage(name, password, faceId, sexId)
    local sendMessage = SendMessage.new(ProtocolCommand.REQ_ACCOUNT_REG_CMD)


    sendMessage:getBody():writeString(name)
    for i=1, 32-string.len(name) do --32个字符不足，以空补全
        sendMessage:getBody():writeByte(0)
    end

    sendMessage:getBody():writeString(password)
    for i=1, 32-string.len(password) do --32个字符不足，以空补全
        sendMessage:getBody():writeByte(0)
    end

    sendMessage:getBody():writeInt(faceId)
    sendMessage:getBody():writeInt(sexId)

    sendMessage:buildData()
    return sendMessage
end

function SendMessageFactory.createEnterRoomMessage(userId,serverId,authenticStr,name,password)
    local sendMessage = SendMessage.new(ProtocolCommand.REQ_ENTER_ROOM_CMD)

    sendMessage:getBody():writeInt(userId)
    sendMessage:getBody():writeInt(serverId)
    sendMessage:getBody():writeString(authenticStr)
    for i=1, 16-string.len(authenticStr) do --16个字符不足，以空补全
        sendMessage:getBody():writeByte(0)
    end

    sendMessage:getBody():writeString(name)
    for i=1, 32-string.len(name) do --32个字符不足，以空补全
        sendMessage:getBody():writeByte(0)
    end

    sendMessage:getBody():writeString(password)
    for i=1, 32-string.len(password) do --32个字符不足，以空补全
        sendMessage:getBody():writeByte(0)
    end



--    self._data = network.ByteArray.new()
--    self._body = network.ByteArray.new()
--    self._cmdtype = cmdType

--    Log.i(string.format("cmdtype:%X",cmdtype))

    sendMessage:buildData()
    --Log.i("enterroommessageis:  ".. network.ByteArray.toString(sendMessage:getData():getPack(), 16))   

    return sendMessage

end

function SendMessageFactory.createGameChatMessage(sendUserId,pChatMessage)

    local sendMessage = SendMessage.new(ProtocolCommand.REQ_USER_CHAT_CMD)

    for i=1, 4 do --4个字符不足，以空补全
        sendMessage:getBody():writeByte(0) --fontColor
    end

    sendMessage:getBody():writeInt(sendUserId)

    for i=1, 32 do --32个字符不足，以空补全
        sendMessage:getBody():writeByte(0) --sendUsername
    end

    sendMessage:getBody():writeInt(0) --targetUserID

    sendMessage:getBody():writeString(pChatMessage)
    for i=1, 256-string.len(pChatMessage) do --32个字符不足，以空补全
        sendMessage:getBody():writeByte(0)
    end

    sendMessage:getBody():writeInt(0) --0为用户聊天消息，2为系统消息
    sendMessage:buildData()
    return sendMessage
end


function SendMessageFactory.createSitdownMessage(tableId, seatId, invideCodeStr)
    local sendMessage = SendMessage.new(ProtocolCommand.REQ_SITDOWN_CMD)

    sendMessage:getBody():writeShort(tableId)
    sendMessage:getBody():writeShort(seatId)
    sendMessage:getBody():writeBool(false) --isObserve
    sendMessage:getBody():writeString(invideCodeStr)
    for i=1, 6-string.len(invideCodeStr) do --6个字符不足，以空补全
        sendMessage:getBody():writeByte(0)
    end
    sendMessage:buildData()
    return sendMessage
end

function SendMessageFactory.createleaveRoomMessage()
    local sendMessage = SendMessage.new(ProtocolCommand.REQ_LEAVE_ROOM_CMD)
    sendMessage:buildData()
    return sendMessage
end

function SendMessageFactory.createStandupMessage(tableId, seatId)
    local sendMessage = SendMessage.new(ProtocolCommand.REQ_STAND_UP_CMD)
    sendMessage:getBody():writeShort(tableId)
    sendMessage:getBody():writeShort(seatId)
    sendMessage:buildData()
    return sendMessage
end


function SendMessageFactory.createGameRankMessage(playerId)
    local sendMessage = SendMessage.new(ProtocolCommand.REQ_GAME_RANK_CMD)
    sendMessage:getBody():writeInt(playerId)
    sendMessage:buildData()
    return sendMessage
end

function SendMessageFactory.creatNetworkErrorMessage(errorCode)
    local sendMessage = SendMessage.new(ProtocolCommand.RESP_NetWorkError_CMD)
    sendMessage:getBody():writeInt(errorCode)
    sendMessage:buildData()
    return sendMessage
end

function SendMessageFactory.createTaskSubmitMessage(userId, authenticStr, taskInfo)
    local sendMessage = SendMessage.new(ProtocolCommand.REQ_TASK_SUBMIT_CMD)
    sendMessage:getBody():writeInt(userId)
    sendMessage:getBody():writeString(authenticStr)
    for i=1, 16-string.len(authenticStr) do --16个字符不足，以空补全
        sendMessage:getBody():writeByte(0)
    end
    sendMessage:getBody():writeByte(0) --taskTypeId
    sendMessage:getBody():writeShort(string.len(taskInfo))
    sendMessage:getBody():writeString(taskInfo)
    sendMessage:buildData()
    return sendMessage
end

function SendMessageFactory.createRestPassword(userName)
    local sendMessage = SendMessage.new(ProtocolCommand.REQ_RESET_PASSWORD_CMD)
    sendMessage:getBody():writeInt(errorCode)
    sendMessage:getBody():writeString(userName)
    for i=1, 32-string.len(userName) do --32个字符不足，以空补全
        sendMessage:getBody():writeByte(0)
    end
    sendMessage:buildData()
    return sendMessage
end

function SendMessageFactory.createUpdateUsePwd(playerId, oldPwd, newPwd, authenticStr)
    local sendMessage = SendMessage.new(ProtocolCommand.REQ_UPDATEUSERPWD_CMD)
    sendMessage:getBody():writeInt(playerId)
    sendMessage:getBody():writeString(oldPwd)
    for i=1, 32-string.len(oldPwd) do --32个字符不足，以空补全
        sendMessage:getBody():writeByte(0)
    end


    sendMessage:getBody():writeString(newPwd)
    for i=1, 32-string.len(newPwd) do --32个字符不足，以空补全
        sendMessage:getBody():writeByte(0)
    end

    sendMessage:getBody():writeString(authenticStr)
    for i=1, 16-string.len(authenticStr) do --16个字符不足，以空补全
        sendMessage:getBody():writeByte(0)
    end
    sendMessage:buildData()
    return sendMessage
end


function SendMessageFactory.createBindingPhone(playerId, mobilePhone, authenticStr, codeType)
    local sendMessage = SendMessage.new(ProtocolCommand.REQ_BINDINGPHONE_CMD)
    sendMessage:getBody():writeInt(playerId)

    sendMessage:getBody():writeString(authenticStr)
    for i=1, 16-string.len(authenticStr) do --16个字符不足，以空补全
        sendMessage:getBody():writeByte(0)
    end


    sendMessage:getBody():writeString(mobilePhone)
    for i=1, 32-string.len(mobilePhone) do --32个字符不足，以空补全
        sendMessage:getBody():writeByte(0)
    end

    sendMessage:getBody():writeShort(codeType)
    sendMessage:buildData()
    return sendMessage
end

function SendMessageFactory.createUserIDCard(playerId, authenticStr, realName, IDCrad)
    local sendMessage = SendMessage.new(ProtocolCommand.REQ_BINDIN_USER_IDCARD_CMD)
    sendMessage:getBody():writeInt(playerId)

    sendMessage:getBody():writeString(authenticStr)
    for i=1, 16-string.len(authenticStr) do --16个字符不足，以空补全
    sendMessage:getBody():writeByte(0)
    end


    sendMessage:getBody():writeString(realName)
    for i=1, 32-string.len(realName) do --32个字符不足，以空补全
    sendMessage:getBody():writeByte(0)
    end

    sendMessage:getBody():writeString(IDCrad)
    for i=1, 32-string.len(IDCrad) do --32个字符不足，以空补全
    sendMessage:getBody():writeByte(0)
    end

    sendMessage:buildData()
    return sendMessage
end


function SendMessageFactory.createLowGuaranteeMessage()
    local sendMessage = SendMessage.new(ProtocolCommand.REQ_LOW_GUARANTEE_CMD)
    sendMessage:buildData()
    return sendMessage
end


return SendMessageFactory