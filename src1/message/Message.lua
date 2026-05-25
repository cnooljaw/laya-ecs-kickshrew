local Message = class("Message",nil)

Message.BUF_SIZE = 1024
Message.MESSAGE_TAG = 0x5342
Message.MSG_HEAD_SIZE = 12
Message.NOT_ENCRYPT_SIZE = 6
Message.ENCRYPT_TYPE_NO  =            0x20 --不加密
Message.ENCRYPT_TYPE_PC  =           0x00 --pc加密
Message.ENCRYPT_TYPE_DES =           0x40 --DES加密

--Message.ENCRYPT_TYPE = Message.ENCRYPT_TYPE_NO
Message.ENCRYPT_TYPE = Message.ENCRYPT_TYPE_DES

Message.ENDIAN = nil


return Message
