
shrewData = shrewData or {}


--地鼠类型  其中只有蓝色地鼠带帽子，要敲2次
shrewData.Type = shrewData.Type or {}

shrewData.Type.red      = 1     --红色地鼠
shrewData.Type.blue     = 2     --蓝色地鼠
shrewData.Type.yellow   = 3     --黄色地鼠
shrewData.Type.green    = 4     --绿色地鼠


--地鼠动作类型
shrewData.Action = shrewData.Action or {}
shrewData.Action.None       = 1
shrewData.Action.Wait       = 2
shrewData.Action.Up         = 3
shrewData.Action.Down       = 4
shrewData.Action.Stand      = 5
shrewData.Action.Dizzy      = 6
shrewData.Action.Refresh    = 7
shrewData.Action.Delay      = 8
shrewData.Action.Max        = 9
shrewData.Action.Sleep 		= 10

--地图类型
shrewData.Map = shrewData.Map or {}
shrewData.Map.None      = 1
shrewData.Map.Meadow    = 2     --草地
shrewData.Map.Ship      = 3     --帆船
shrewData.Map.Sewer     = 4     --下水道
shrewData.Map.Space     = 5     --太空
shrewData.Map.Max       = 6



--各个肢体的的zorder关系定义
shrewData.Zorder = shrewData.Zorder or {}
shrewData.Zorder.khand              = 0
shrewData.Zorder.kear               = 1
shrewData.Zorder.kprops2            = 2
shrewData.Zorder.kbody              = 3
shrewData.Zorder.kfrontear          = 4
shrewData.Zorder.kfrontHand         = 5
shrewData.Zorder.kface              = 6
shrewData.Zorder.keyes              = 7
shrewData.Zorder.kmouth             = 8
shrewData.Zorder.kprops3            = 9
shrewData.Zorder.khat               = 10
shrewData.Zorder.kDizzyProps        = 11
shrewData.Zorder.kprops             = 12
shrewData.Zorder.kDizzyProps2       = 13
shrewData.Zorder.kAfterPropHand     = 14
shrewData.Zorder.kSwelling          = 15
shrewData.Zorder.kSwellingEffect    = 16
shrewData.Zorder.kDizzyStars        = 17
shrewData.Zorder.knumber            = 18


