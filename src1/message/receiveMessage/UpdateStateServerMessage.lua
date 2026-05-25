local ReceiveMessage = require("message.ReceiveMessage")

local UpdateStateServerMessage = class("UpdateStateServerMessage",ReceiveMessage)



function UpdateStateServerMessage:unPackMessage()

    self._playerid = 0
    self._tableid = 65535
    self._seatid = 65535
    self._gameState = -1
    
    self._playerid = self._body:readInt() --int
    

    
    while self._body:getAvailable() > 0 do
    	local idx = self._body:readShort()
    	local value = self._body:readInt()
    	
    	if idx == 1 then
           self._tableid = value
    	elseif idx == 13 then
           self._seatid = value    	   
        elseif idx == 3 then
    	   self._gameState = value
    	else
    	
    	end
    end

end

function UpdateStateServerMessage:getPlayerId()
	return self._playerid
end

function UpdateStateServerMessage:getTableId()
	return self._tableid
end

function UpdateStateServerMessage:getSeatId()
	return self._seatid
end

function UpdateStateServerMessage:getGameState()
	return self._gameState
end

return UpdateStateServerMessage