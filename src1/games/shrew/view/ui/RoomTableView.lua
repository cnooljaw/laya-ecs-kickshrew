local RoomTableView = class("RoomTableView", function ()
    return cc.Layer:create()
end)

local roomList = {}
local roomNum = nil
local ItemSize = nil

local callBackLocal = nil --用来给tableItem注册回调事件

function RoomTableView:ctor(RoomList, tableSize, callback)
    roomNum = #RoomList
    roomList = RoomList
    self._winSize = cc.Director:getInstance():getWinSize()
    local tableSize = cc.size(self._winSize.width,self._winSize.height*0.45)
    ItemSize = tableSize
    
    callBackLocal = callback
    
    self._tableSize = cc.size(tableSize.width,tableSize.height*0.97)


    --限制高度
    self._tableView = cc.TableView:create(cc.size(tableSize.width,tableSize.height*0.97))
    self._tableView:setDirection(cc.SCROLLVIEW_DIRECTION_HORIZONTAL)
    self._tableView:setDelegate()
    self:addChild(self._tableView)

    self._tableView:registerScriptHandler(self.scrollViewDidScroll,cc.SCROLLVIEW_SCRIPT_SCROLL)
    self._tableView:registerScriptHandler(self.scrollViewDidZoom,cc.SCROLLVIEW_SCRIPT_ZOOM)
    self._tableView:registerScriptHandler(self.tableCellTouched,cc.TABLECELL_TOUCHED)
    self._tableView:registerScriptHandler(self.cellSizeForTable,cc.TABLECELL_SIZE_FOR_INDEX)
    self._tableView:registerScriptHandler(self.tableCellAtIndex,cc.TABLECELL_SIZE_AT_INDEX)
    self._tableView:registerScriptHandler(self.numberOfCellsInTableView,cc.NUMBER_OF_CELLS_IN_TABLEVIEW)  
    
    self._tableView:reloadData()

end


function RoomTableView.scrollViewDidScroll(view)
    Log.i("scrollViewDidScroll")
end

function RoomTableView.scrollViewDidZoom(view)
    Log.i("scrollViewDidZoom")
end

function RoomTableView.tableCellTouched(table,cell)
    Log.i("cell touched at index: " .. cell:getIdx())
end

function RoomTableView.cellSizeForTable(table,idx) 
    if roomNum == 1 then
        return ItemSize.height,ItemSize.width
    elseif roomNum == 2 then
        return ItemSize.height,ItemSize.width*0.5
    else
        return ItemSize.height,ItemSize.width*0.32 
    end
end

function RoomTableView.tableCellAtIndex(table, idx)
    --Log.i(roomList[idx+1]..idx)
    --local strValue = string.format("ddz_ddzCircleView_icon_room%d.png",idx)
    local cell = table:dequeueCell()
    local label = nil
    if nil == cell then
        cell = cc.TableViewCell:new()
    else
        cell:removeFromParent(true)
        cell = cc.TableViewCell:new()

    end
    local winSize = cc.Director:getInstance():getWinSize()
    local itemSize = cc.size(ItemSize.width*0.25,ItemSize.height )
    local item = shrew.view.RoomTableItem.new(roomList[idx+1]) 
    local cellHeight,cellWidth = RoomTableView.cellSizeForTable(table,idx)
    item:setPosition(cellWidth * 0.5, cellHeight*0.6)
--    item:setPosition(winSize.width * 0.5 , itemSize.height*0.6)
    item:registerCallBack(callBackLocal)
    cell:addChild(item)

    return cell
end
--设置cells数量
function RoomTableView.numberOfCellsInTableView(table)
    return roomNum
end


return RoomTableView