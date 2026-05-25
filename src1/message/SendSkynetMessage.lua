local SendMessage = require("message.SendMessage")
local SendSkynetMessage = class("SendSkynetMessage",SendMessage)

function SendSkynetMessage:ctor(cmdType)
	-- SendSkynetMessage.super.ctor(self,cmdType)
    self._data = network.ByteArray.new(network.ByteArray.ENDIAN_BIG)
    self._body = network.ByteArray.new(network.ByteArray.ENDIAN_BIG)
    self._cmdtype = cmdType
end



function SendSkynetMessage:buildData()

    local msgData = network.ByteArray.new(network.ByteArray.ENDIAN_BIG)             

    
    local bodylen = self._body:getLen()
    --总长度
    local totallen = bodylen + 12
    --write header
    msgData:writeShort(self.MESSAGE_TAG) --tag
        :writeShort(bodylen) --bodylen
        :writeChar(0) --checkcode
        :writeChar(SendMessage.ENCRYPT_TYPE) --messagever
        :writeUInt(self._cmdtype) --cmdtype
        :writeShort(0)  --reverved
        :writeBytes(self._body)  --body
--    Log.i("skynet加密前:", msgData:toString())

    --write body
    if SendMessage.ENCRYPT_TYPE == SendMessage.ENCRYPT_TYPE_DES then
        ---[[加密
        local desStr,deslen = my.DataEncode:desEncryptBytes(msgData:getPack(),msgData:getLen()) --加密
        -- local desStr,deslen =  my.DataEncode:des_encode(srcStr,nil,#srcStr)
        totallen = deslen
        self._data:writeUShort(totallen)
        self._data:writeBuf(desStr)
        Log.i("skynet加密后长度：",totallen)
--        Log.i(self._data:getLen())
    else
        Log.i("写数据")
        self._data:writeUShort(totallen)
        self._data:writeBuf(msgData:getPack())
    end
end


return SendSkynetMessage