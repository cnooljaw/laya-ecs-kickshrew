--
-- Created by IntelliJ IDEA.
-- User: baison
-- Date: 15/3/24
-- Time: 下午5:48
-- To change this template use File | Settings | File Templates.
--

local superClass = require("message.ReceiveMessageFactory")

local ReceiveMessageFactory = class("shrew.ReceiveMessageFactory",superClass)

function ReceiveMessageFactory:listMessageTable()

    local tb = ReceiveMessageFactory.super:listMessageTable()
    tb[ProtocolCommand.shrew.RESP_HAMMER_LIST_CMD] = require("message.shrew.ReceiveMessage.HammerListServerMessage")
    tb[ProtocolCommand.shrew.RESP_GAME_KICK_SHREW_CMD] = require("message.shrew.ReceiveMessage.KickShrewServerMessage")
    tb[ProtocolCommand.shrew.RESP_UPDATE_POWER_CMD] = require("message.shrew.ReceiveMessage.UpdatePowerServerMessage")
    tb[ProtocolCommand.shrew.RESP_GAME_REWARD_TOP_CMD] = require("message.shrew.ReceiveMessage.RewardTopServerMessage")
    tb[ProtocolCommand.shrew.RESP_GAME_REWARD_NEW_CMD] = require("message.shrew.ReceiveMessage.RewardNewServerMessage")
--    tb[ProtocolCommand.shrew.RESP_GAME_DAY_RANK_CMD] = require("message.shrew.ReceiveMessage.DayRankServerMessage")
    tb[ProtocolCommand.shrew.RESP_GAME_WEEK_RANK_CMD] = require("message.shrew.ReceiveMessage.WeekRankServerMessage")
    tb[ProtocolCommand.shrew.RESP_GAME_SETTLE_ACCOUNT_CMD] = require("message.shrew.ReceiveMessage.SettleAccountServerMessage")
    tb[ProtocolCommand.shrew.RESP_GAME_SCENE_CMD] = require("message.shrew.ReceiveMessage.GameSceneServerMessage")
    --挑战赛
    tb[ProtocolCommand.shrew.RESP_CHALLENGEMATCH_KICK_SHREW_CMD] = require("message.shrew.ReceiveMessage.ChallengeMatchKickShrewServerMessage")
    tb[ProtocolCommand.shrew.RESP_CHALLENGEMATCH_SCENE_CMD] = require("message.shrew.ReceiveMessage.ChallengeMatchGameSceneServerMessage")
    tb[ProtocolCommand.shrew.RESP_CHALLENGEMATCH_RANK_CMD] = require("message.shrew.ReceiveMessage.ChallengeMatchRankServerMessage")
    tb[ProtocolCommand.shrew.RESP_CHALLENGEMATCH_REWARD_CMD] = require("message.shrew.ReceiveMessage.ChallengeMatchRewardServerMessage")
    tb[ProtocolCommand.shrew.RESP_CHALLENGEMATCH_CHANCE_CMD] = require("message.shrew.ReceiveMessage.ChallengeMatchChanceServerMessage")
    return tb

end

function ReceiveMessageFactory:getInstance()
    if self.instance == nil then
        self.instance = self:new()
    end

    return self.instance
end

return ReceiveMessageFactory