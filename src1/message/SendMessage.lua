local Message = require("message.Message")
local SendMessage = class("SendMessage",Message)
--require "luades"

function SendMessage:ctor(cmdType)
    self._data = network.ByteArray.new()
    self._body = network.ByteArray.new()
    self._cmdtype = cmdType
end


function SendMessage:getBody()
    return self._body
end

function SendMessage:getData()
	return self._data
end

function SendMessage:buildData()



    local msgData = network.ByteArray.new()             

    
    local bodylen = self._body:getLen()
    --write header
    msgData:writeShort(self.MESSAGE_TAG) --tag
        :writeShort(bodylen) --bodylen
        :writeChar(0) --checkcode
        :writeChar(self.ENCRYPT_TYPE) --messagever
        :writeUInt(self._cmdtype) --cmdtype
        :writeShort(0)  --reverved
        :writeBytes(self._body)  --body

    --write body
    if SendMessage.ENCRYPT_TYPE == SendMessage.ENCRYPT_TYPE_DES then
        ---[[加密
        local desStr,deslen = my.DataEncode:desEncryptBytes(msgData:getPack(),msgData:getLen()) --加密
        self._data:writeBuf(desStr)
        Log.i("加密后长度：",deslen)
--        Log.i(self._data:getLen())
        else
--            Log.i("写数据")
            self._data = msgData
        end
end

function SendMessage:getPack()   
    return self._data:getPack()
end
function SendMessage:toString()   
    return self._data:toString()
end

return SendMessage