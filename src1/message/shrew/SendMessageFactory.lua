--
-- Created by IntelliJ IDEA.
-- User: baison
-- Date: 15/3/24
-- Time: 下午5:49
-- To change this template use File | Settings | File Templates.
--
local superClass = require("message.SendMessageFactory")
local SendMessage = require("message.SendMessage")
local SendMessageFactory = class("shrew.SendMessageFactory",superClass)

function SendMessageFactory.createGameStartMessage(playerId)
    local sendMessage = SendMessage.new(ProtocolCommand.shrew.REQ_GAME_START_CMD)
    sendMessage:buildData()
    return sendMessage
end

function SendMessageFactory.createGameReadyMessage(playerId)
    local sendMessage = SendMessage.new(ProtocolCommand.shrew.REQ_GAME_READY_CMD)
    sendMessage:getBody():writeInt(playerId)
    sendMessage:buildData()
    return sendMessage
end



function SendMessageFactory.createKickShrewMessage(kickReq)
    local sendMessage = SendMessage.new(ProtocolCommand.shrew.REQ_GAME_KICK_SHREW_CMD)

    sendMessage:getBody():writeInt(kickReq.hammerType)
    sendMessage:getBody():writeInt(kickReq.bKickShrew)
    sendMessage:getBody():writeInt(kickReq.numOfShrew)
    

    for i = 1, 10  do
        if kickReq.shrews[i] ~= nil then      
            sendMessage:getBody():writeInt(kickReq.shrews[i].shrewindex)
            sendMessage:getBody():writeInt(kickReq.shrews[i].protectType)
        end
    end
    
    sendMessage:getBody():writeInt(kickReq.comboID)

    sendMessage:buildData()
    return sendMessage
end

function SendMessageFactory.createChallengeMatchKickShrewMessage(kickReq)
    local sendMessage = SendMessage.new(ProtocolCommand.shrew.REQ_CHALLENGEMATCH_KICK_SHREW_CMD)

    sendMessage:getBody():writeInt(kickReq.hammerType)
    sendMessage:getBody():writeInt(kickReq.bKickShrew)
    sendMessage:getBody():writeInt(kickReq.numOfShrew)
    

    for i = 1, 10  do
        if kickReq.shrews[i] ~= nil then      
            sendMessage:getBody():writeInt(kickReq.shrews[i].shrewindex)
            sendMessage:getBody():writeInt(kickReq.shrews[i].protectType)
        end
    end
    
    sendMessage:getBody():writeInt(kickReq.comboID)

    sendMessage:buildData()
    return sendMessage
end


function SendMessageFactory.createGameReconnectMessage()
    local sendMessage = SendMessage.new(ProtocolCommand.shrew.REQ_GAME_RECONNECT_CMD)
    sendMessage:buildData()
    return sendMessage
end

function SendMessageFactory.createChallengeMatchChanceMessage()
    local sendMessage = SendMessage.new(ProtocolCommand.shrew.REQ_CHALLENGEMATCH_CHANCE_CMD)
    sendMessage:buildData()
    return sendMessage
end

function SendMessageFactory.createChallengeMatchUpdateDataMessage()
    local sendMessage = SendMessage.new(ProtocolCommand.shrew.REQ_GAME_UPDATE_DATA_CMD)
    sendMessage:buildData()
    return sendMessage
end


return SendMessageFactory


