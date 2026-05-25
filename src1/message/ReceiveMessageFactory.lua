local ReceiveMessageFactory = class("ReceiveMessageFactory",nil)

local ReceiveMessage = require("message.ReceiveMessage")
local socket = require "socket"

--require("luades")

ReceiveMessageFactory.BUILD_MESSAGE = "ReceiveMessageFactory.BUILD_MESSAGE"

function ReceiveMessageFactory:ctor()
    require("network.EventProtocol").extend(self)
    self._buffer = network.ByteArray.new()
    self._messageTable = self:listMessageTable()
end

function ReceiveMessageFactory:listMessageTable()
    return {
        --无用消息
        [ProtocolCommand.RESP_HEART_BEAT_CMD] = require("message.receiveMessage.HeartBeatServerMessage"),--登录
        [ProtocolCommand.RESP_ACCOUNT_REG_CMD] = require("message.receiveMessage.AccountRegServerMessage"),
        [ProtocolCommand.RESP_LOGIN_CMD] = require("message.receiveMessage.LoginServerMessage"),
        [ProtocolCommand.RESP_RESET_PASSWORD_CMD] = require("message.receiveMessage.ResetPasswordSeverMessage"),
        [ProtocolCommand.RESP_UPDATEUSERPWD_CMD] = require("message.receiveMessage.UpdateUsePwdServerMessage"),
        [ProtocolCommand.RESP_BINDINGPHONE_CMD] = require("message.receiveMessage.BindingPhoneServerMessage"),
        [ProtocolCommand.RESP_UPDATE_PLAYER_CMD] = require("message.receiveMessage.UpdatePlayerInfoServerMessage"),
        [ProtocolCommand.RESP_PLAYER_COUNT_CMD] = require("message.receiveMessage.UpdatePlayerCountServerMessage"),
        [ProtocolCommand.RESP_UPDATE_STATE_CMD] = require("message.receiveMessage.UpdateStateServerMessage"),
        [ProtocolCommand.RESP_TASK_INIT_CMD] = require("message.receiveMessage.TaskInitServerMessage"),
        [ProtocolCommand.RESP_ENTER_ROOM_CMD] = require("message.receiveMessage.EnterRoomServerMessage"),
        [ProtocolCommand.RESP_LEAVE_ROOM_CMD] = require("message.receiveMessage.LeaveRoomServerMessage"),
        [ProtocolCommand.RESP_SITDOWN_CMD] = require("message.receiveMessage.SitDownServerMessage"),
        [ProtocolCommand.RESP_STAND_UP_CMD] = require("message.receiveMessage.StandupServerMessage"),
        [ProtocolCommand.RESP_ROOMREADY_CMD] = require("message.receiveMessage.RoomReadyServerMessage"),
        [ProtocolCommand.RESP_TABLE_START_CMD] = require("message.receiveMessage.TableStartServerMessage"),
        [ProtocolCommand.RESP_TABLE_OVER_CMD] = require("message.receiveMessage.TableOverServerMessage"),
        [ProtocolCommand.RESP_GAME_READY_CMD] = require("message.receiveMessage.GameReadyServerMessage"),
        [ProtocolCommand.RESP_GAME_RANK_CMD] = require("message.receiveMessage.GameRankServerMessage"),
        [ProtocolCommand.RESP_BINDIN_USER_IDCARD_CMD] = require("message.receiveMessage.UserIDCardServerMessage"),
        [ProtocolCommand.RESP_HALL_CHAT_CMD] = require("message.receiveMessage.UserChatServerMessage"),
        [ProtocolCommand.RESP_USER_CHAT_CMD] = require("message.receiveMessage.UserChatServerMessage"),
        [ProtocolCommand.RESP_LOW_GUARANTEE_CMD] = require("message.receiveMessage.RespLowGuaranteeMessage"),
        --无用消息
        [ProtocolCommand.RESP_UPDATEPLAYERCOUNT_CMD] = require("src/message/receiveMessage/UpdatePlayerCountServerMessage.lua")
    }
end


function ReceiveMessageFactory:listReconnetMessageTable()
    return self:listMessageTable()
end

function ReceiveMessageFactory:setMessageTableByReconnect(isReconnect)
    if isReconnect then
    	self._messageTable = self:listReconnetMessageTable()   	
    else
        self._messageTable = self:listMessageTable()
    end
	
end


function ReceiveMessageFactory:getInstance()
    if self._instance == nil then
        self._instance = ReceiveMessageFactory.new()
    end

    return self._instance
end


function ReceiveMessageFactory:createPureReceiveMessage(msgData,msgLen)
    local messageBytes = network.ByteArray.new()
    messageBytes:writeBuf(msgData)
    local body = network.ByteArray.new()
    messageBytes:setPos(ReceiveMessage.NOT_ENCRYPT_SIZE  +1)
    local cmdtype = messageBytes:readUInt() --读取消息命令字
    messageBytes:setPos(ReceiveMessage.MSG_HEAD_SIZE + 1)
    messageBytes:readBytes(body,1 ) --读取body 
    printf(">>>>>>>>>>>>>>>>>>>>>>>%X",cmdtype)
    local receiveMessage = nil
    local MessageType = self._messageTable[cmdtype]
    if MessageType ~= nil then
        receiveMessage = MessageType.new(cmdtype,body)
    else
        Log.i(string.format("cmdtype:unhandle  %X",cmdtype))
    end

    return receiveMessage
end

function ReceiveMessageFactory:createReceiveMessage(msgVer,messageBytes)
    
    local body = network.ByteArray.new()

    messageBytes:setPos(ReceiveMessage.NOT_ENCRYPT_SIZE  +1)
    
    local cmdtype
    
    
    if msgVer == ReceiveMessage.ENCRYPT_TYPE_DES then
        --[[解密
        local encryptData = network.ByteArray.new() 
        messageBytes:readBytes(encryptData,1 ) --读取到需解密字串  
        local decodeData,decodeDatalen = luades.ldesdecode(encryptData:getPack(),encryptData:getLen())
        local decodeByteArray = network.ByteArray.new()
        decodeByteArray:writeBuf(decodeData)
        decodeByteArray:setPos(1)
        cmdtype = messageBytes:readUInt() 
        messageBytes:setPos(ReceiveMessage.MSG_HEAD_SIZE - ReceiveMessage.NOT_ENCRYPT_SIZE + 1)
        messageBytes:readBytes(body,1 ) --读取body 
        --]]
    else
        --不加密  
        cmdtype = messageBytes:readUInt() --读取消息命令字
        messageBytes:setPos(ReceiveMessage.MSG_HEAD_SIZE + 1)
        messageBytes:readBytes(body,1 ) --读取body 
    end
    
    
    
--    Log.i(string.format("cmdtype:        %X",cmdtype))
    --Log.i(network.ByteArray.toString(messageBytes, 16))   
    
    
    
    local receiveMessage = nil
    local MessageType = self._messageTable[cmdtype]
    if MessageType ~= nil then
        receiveMessage = MessageType.new(cmdtype,body)
    else
        Log.i(string.format("cmdtype:unhandle  %X",cmdtype))
    end
    
    return receiveMessage
        
end

function ReceiveMessageFactory:parsePackets(__byteString)
    local _pos = 0
    self._buffer:setPos(self._buffer:getLen() + 1)
    self._buffer:writeBuf(__byteString)  --receive data to buffer
    self._buffer:setPos(1)
    
    --开始解包头
    while self._buffer:getAvailable() >= ReceiveMessage.MSG_HEAD_SIZE do
--        local s = socket.gettime()
        repeat
        	local tag = self._buffer:readShort()
        	if tag == ReceiveMessage.MESSAGE_TAG then
        	   break;
        	end
        	self._buffer:setPos(self._buffer:getPos() -1)       	
        until true
        local bodylen = self._buffer:readShort()
        local checkCode = self._buffer:readChar()
        local msgVer = self._buffer:readChar()
        local msglen = bodylen + ReceiveMessage.MSG_HEAD_SIZE
        
        self._buffer:setPos(self._buffer:getPos() - ReceiveMessage.NOT_ENCRYPT_SIZE)
        --header前6位不加密
        if  msglen > self._buffer:getAvailable()  then
        	break
        end
        
        local messageBytes=nil
        messageBytes = network.ByteArray.new()   --实现一个反射
        self._buffer:readBytes(messageBytes,1,msglen)

        local message = self:createReceiveMessage(msgVer,messageBytes)
--        local e = socket.gettime()
--        if message then
--            printf("cmd %s",message.__cname)
--        end
--        printf("used time1: %f seconds",e-s)
--        local co = coroutine.create(
--            function ()
--                self:dispatchEvent({name = ReceiveMessageFactory.BUILD_MESSAGE,data = message})
--                coroutine.yield()
--            end)
--        coroutine.resume(co)
        --coroutine.yield()
        self:dispatchEvent({name = ReceiveMessageFactory.BUILD_MESSAGE,data = message})
        
--        printf("used time2: %f seconds",socket.gettime()-e)
        
    end
    
    -- clear buffer on exhausted
    if self._buffer:getAvailable() <= 0 then
        self._buffer = network.ByteArray.new()
    else
        -- some datas in buffer yet, write them to a new blank buffer.
        local tmp = network.ByteArray.new()
        self._buffer:readBytes(tmp, 1, self._buffer:getAvailable())
        self._buffer = tmp
    end
    

end

return ReceiveMessageFactory