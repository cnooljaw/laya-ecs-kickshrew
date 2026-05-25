shrew = shrew or {}


--结构体及宏
require("games.shrew.model.vo.ShrewData")
require("games.shrew.model.vo.ShrewRes")

--界面
shrew.view = shrew.view or {}
shrew.view.BaseNode = require("games.shrew.view.layer.BaseNode")
shrew.view.BaseView = require("games.shrew.view.layer.BaseView")
shrew.view.GameView = require("games.shrew.view.layer.GameView")
shrew.view.GameViewGrass = require("games.shrew.view.layer.GameViewGrass")
shrew.view.GameViewShip = require("games.shrew.view.layer.GameViewShip")
shrew.view.GameViewSpace = require("games.shrew.view.layer.GameViewSpace")
shrew.view.GameViewSewer = require("games.shrew.view.layer.GameViewSewer")
shrew.view.RoomView = require("games.shrew.view.layer.RoomView")
shrew.view.LoadingView = require("games.shrew.view.layer.LoadingView")
shrew.view.HallView = require("games.shrew.view.layer.HallView")
shrew.view.ChallengeMatchRoomView = require("games.shrew.view.layer.ChallengeMatch.ChallengeMatchRoomView")
shrew.view.ChallengeMatchGameView = require("games.shrew.view.layer.ChallengeMatch.ChallengeMatchGameView")
shrew.view.ChallengeMatchGameViewGrass = require("games.shrew.view.layer.ChallengeMatch.ChallengeMatchGameViewGrass")
shrew.view.ChallengeMatchGameViewShip = require("games.shrew.view.layer.ChallengeMatch.ChallengeMatchGameViewShip")
shrew.view.ChallengeMatchGameViewSpace = require("games.shrew.view.layer.ChallengeMatch.ChallengeMatchGameViewSpace")
shrew.view.ChallengeMatchGameViewSewer = require("games.shrew.view.layer.ChallengeMatch.ChallengeMatchGameViewSewer")


shrew.view.RoomTableView = require("games.shrew.view.ui.RoomTableView")
shrew.view.RoomTableItem = require("games.shrew.view.ui.RoomTableItem")

--Mediator
shrew.view.HallViewMediator = require("games.shrew.view.mediator.HallViewMediator")
shrew.view.RoomViewMediator = require("games.shrew.view.mediator.RoomViewMediator")
shrew.view.GameViewMediator = require("games.shrew.view.mediator.GameViewMediator")
shrew.view.ChallengeMatchRoomViewMediator = require("games.shrew.view.mediator.ChallengeMatchRoomViewMediator")
shrew.view.ChallengeMatchGameViewMediator = require("games.shrew.view.mediator.ChallengeMatchGameViewMediator")
shrew.view.TaskViewMediator = require("games.shrew.view.mediator.TaskViewMediator")

--地鼠
shrew.view.BaseShrew = require("games.shrew.view.ui.Shrew.BaseShrew")
shrew.view.RedShrew = require("games.shrew.view.ui.Shrew.RedShrew")
shrew.view.GreenShrew = require("games.shrew.view.ui.Shrew.GreenShrew")
shrew.view.YellowShrew = require("games.shrew.view.ui.Shrew.YellowShrew")
shrew.view.BlueShrew = require("games.shrew.view.ui.Shrew.BlueShrew")

--其他控件
shrew.view.GoldParticle = require("games.shrew.view.ui.GoldParticle")
shrew.view.PlayerInfo = require("games.shrew.view.ui.PlayerInfo")
shrew.view.HammerListTableItem = require("games.shrew.view.ui.HammerListTableItem")
shrew.view.HammerListTableView = require("games.shrew.view.ui.HammerListTableView")
shrew.view.HammerListView = require("games.shrew.view.ui.HammerListView")
shrew.view.GameInfoTableView = require("games.shrew.view.ui.GameInfoTableView")
shrew.view.WeekRankView = require("games.shrew.view.ui.WeekRankView")
shrew.view.WeekRankItem = require("games.shrew.view.ui.WeekRankItem")
shrew.view.RewardInfoView = require("games.shrew.view.ui.RewardInfoView")
shrew.view.RewardInfoItem = require("games.shrew.view.ui.RewardInfoItem")
shrew.view.GoldParticle = require("games.shrew.view.ui.GoldParticle")
shrew.view.ChallengeMatchCountdown = require("games.shrew.view.ui.ChallengeMatchCountdown")
shrew.view.ChallengeMatchGameOverBox = require("games.shrew.view.ui.ChallengeMatchGameOverBox")
shrew.view.ChallengeMatchTopInfo = require("games.shrew.view.ui.ChallengeMatchTopInfo")
shrew.view.ChallengeMatchBeginBox = require("games.shrew.view.ui.ChallengeMatchBeginBox")

--Proxy 
shrew.model = shrew.model or {}
shrew.model.HallProxy = require("games.shrew.model.proxy.HallProxy")
shrew.model.RoomProxy = require("games.shrew.model.proxy.RoomProxy")
shrew.model.GameProxy = require("games.shrew.model.proxy.GameProxy")
shrew.model.ChallengeMatchGameProxy = require("games.shrew.model.proxy.ChallengeMatchGameProxy")
shrew.model.TaskProxy = require("games.shrew.model.proxy.TaskProxy")

--command
shrew.command = shrew.command or {}

--发包
shrew.command.ReqSitDownCommand = require("games/shrew/controller/ReqSitDownCommand")
shrew.command.ReqEnterRoomCommand = require("games/shrew/controller/ReqEnterRoomCommand")
shrew.command.ReqGameExitCommand = require("games/shrew/controller/ReqGameExitCommand")
shrew.command.ReqGameReadyCommand = require("games/shrew/controller/ReqGameReadyCommand")
shrew.command.ReqGameStartCommand = require("games/shrew/controller/ReqGameStartCommand")
shrew.command.ReqKickShrewCommand = require("games/shrew/controller/ReqKickShrewCommand")
shrew.command.ReqGameSceneCommand = require("games/shrew/controller/ReqGameSceneCommand")


--收包
shrew.command.RespEnterRoomCommand = require("games/shrew/controller/RespEnterRoomCommand")
shrew.command.RespSitDownCommand = require("games/shrew/controller/RespSitDownCommand")
shrew.command.RespStandUpCommand = require("games/shrew/controller/RespStandUpCommand")
shrew.command.RespLeaveRoomCommand = require("games/shrew/controller/RespLeaveRoomCommand")
shrew.command.RespUpdateStateCommand = require("games/shrew/controller/RespUpdateStateCommand")
shrew.command.RespTableStartCommand = require("games/shrew/controller/RespTableStartCommand")
shrew.command.RespTableOverCommand = require("games/shrew/controller/RespTableOverCommand")
shrew.command.RespGameReadyCommand = require("games.shrew.controller.RespGameReadyCommand")
shrew.command.RespGameSceneCommand = require("games.shrew.controller.RespGameSceneCommand")
shrew.command.RespKickShrewCommand = require("games.shrew.controller.RespKickShrewCommand")
shrew.command.RespHammerListCommand = require("games.shrew.controller.RespHammerListCommand")
shrew.command.RespWeekRankCommand = require("games.shrew.controller.RespWeekRankCommand")
shrew.command.RespRewardNewCommand = require("games.shrew.controller.RespRewardNewCommand")
shrew.command.RespRoomReadyCommand = require("games.shrew.controller.RespRoomReadyCommand")

--挑战赛
shrew.command.ReqChallengeMatchChanceCommand = require("games.shrew.controller.ReqChallengeMatchChanceCommand")
shrew.command.RespChallengeMatchChanceCommand = require("games.shrew.controller.RespChallengeMatchChanceCommand")
shrew.command.RespChallengeMatchGameSceneCommand = require("games.shrew.controller.RespChallengeMatchGameSceneCommand")
shrew.command.RespChallengeMatchKickShrewCommand = require("games.shrew.controller.RespChallengeMatchKickShrewCommand")
shrew.command.RespChallengeMatchRankCommand = require("games.shrew.controller.RespChallengeMatchRankCommand")
shrew.command.RespChallengeMatchRewardCommand = require("games.shrew.controller.RespChallengeMatchRewardCommand")
