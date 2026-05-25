SoundRes = SoundRes or {}
local sound_card = "res/sound/sound_card/"
local sound_common = "res/sound/sound_common/"
local sound_fhmj = "res/sound/sound_fhmj/"
local sound_nbddz = "res/sound/sound_nbddz/"
local sound_nbmj = "res/sound/sound_nbmj/"
local sound_shrew = "res/sound/sound_shrew/"
local sound_ssd = "res/sound/sound_ssd/"
local sound_xsmj = "res/sound/sound_xsmj/"
local sound_refuseclassification = "res/sound/sound_refuseclassification/"
local sound_catchgold = "res/sound/sound_catchgold/"

local catchgold_cardType = catchgold_cardType or {}
	
	catchgold_cardType.CT_NONE				= 0x00		--无牌
	catchgold_cardType.CT_SILVER_ONE		= 0x11		--银牌牛一
	catchgold_cardType.CT_SILVER_TWO		= 0x12		--银牌牛二
	catchgold_cardType.CT_SILVER_THREE		= 0x13		--银牌牛三
	catchgold_cardType.CT_SILVER_FOUR		= 0x14		--银牌牛四
	catchgold_cardType.CT_SILVER_FIVE		= 0x15		--银牌牛五
	catchgold_cardType.CT_SILVER_SIX		= 0x16		--银牌牛六
	catchgold_cardType.CT_SILVER_SEVEN		= 0x17		--银牌牛七
	catchgold_cardType.CT_SILVER_EIGHT		= 0x18		--银牌牛八
	catchgold_cardType.CT_SILVER_NINE		= 0x19		--银牌牛九

	catchgold_cardType.CT_GOLD_ONE			= 0x21		--金牌牛一
	catchgold_cardType.CT_GOLD_TWO			= 0x22		--金牌牛二
	catchgold_cardType.CT_GOLD_THREE		= 0x23		--金牌牛三
	catchgold_cardType.CT_GOLD_FOUR		    = 0x24		--金牌牛四
	catchgold_cardType.CT_GOLD_FIVE		    = 0x25		--金牌牛五
	catchgold_cardType.CT_GOLD_SIX			= 0x26		--金牌牛六
	catchgold_cardType.CT_GOLD_SEVEN		= 0x27		--金牌牛七
	catchgold_cardType.CT_GOLD_EIGHT		= 0x28		--金牌牛八
	catchgold_cardType.CT_GOLD_NINE		    = 0x29		--金牌牛九

	catchgold_cardType.CT_SILVER_BIG		= 0x31		--大银牌
	catchgold_cardType.CT_GOLD_BIG			= 0x32		--大金牌
	catchgold_cardType.CT_FOUR_FLOWERS		= 0x33		--四花
	catchgold_cardType.CT_FIVE_FLOWERS		= 0x34		--五花
	catchgold_cardType.CT_THREE_TWO		    = 0x35		--葫芦
	catchgold_cardType.CT_FIVE_SMALL		= 0x36		--五小
	catchgold_cardType.CT_BOMB				= 0x37		--炸弹

--[[
时钟倒计时
--]]
SoundRes.clock = SoundRes.clock or {}

SoundRes.clock[1] = sound_common.."1.wav"
SoundRes.clock[2] = sound_common.."2.wav"
SoundRes.clock[3] = sound_common.."3.wav"
SoundRes.clock[4] = sound_common.."4.wav"
SoundRes.clock[5] = sound_common.."5.wav"
SoundRes.clockTickTack = sound_common.."time.wav"

--[[
宁波地主
--]]
SoundRes.nbddz = SoundRes.nbddz or {}

SoundRes.nbddz.gameStart 	= sound_card.."game_start.wav"
SoundRes.nbddz.noCall 		= sound_nbddz.."no_call.wav"
SoundRes.nbddz.oneCall 		= sound_nbddz.."one_call.wav"
SoundRes.nbddz.twoCall 		= sound_nbddz.."two_call.wav"
SoundRes.nbddz.threeCall 	= sound_nbddz.."three_call.wav"
SoundRes.nbddz.outCard 		= sound_card.."out_card.wav"
SoundRes.nbddz.pass 		= sound_card.."pass.wav"
SoundRes.nbddz.bomb 		= sound_card.."bomb.wav"
SoundRes.nbddz.bigBomb 		= sound_card.."big_bomb.wav"
SoundRes.nbddz.win 			= sound_card.."game_win.wav"
SoundRes.nbddz.lose 		= sound_card.."game_lose.wav"


--[[
明扣
--]]
SoundRes.detain = SoundRes.detain or {}

SoundRes.detain.gameStart 	= sound_card.."game_start.wav"
SoundRes.detain.outCard 	= sound_card.."out_card.wav"
SoundRes.detain.pass 		= sound_card.."pass.wav"
SoundRes.detain.bomb 		= sound_card.."bomb.wav"
SoundRes.detain.bigBomb 	= sound_card.."big_bomb.wav"
SoundRes.detain.win 		= sound_card.."game_win.wav"
SoundRes.detain.lose 		= sound_card.."game_lose.wav"


--[[
超级关牌
--]]
SoundRes.passcard = SoundRes.passcard or {}

SoundRes.passcard.gameStart = sound_card.."game_start.wav"
SoundRes.passcard.outCard 	= sound_card.."out_card.wav"
SoundRes.passcard.pass 		= sound_card.."pass.wav"
SoundRes.passcard.bomb 		= sound_card.."bomb.wav"
SoundRes.passcard.win 		= sound_card.."game_win.wav"
SoundRes.passcard.lose 		= sound_card.."game_lose.wav"


--[[
十三道
--]]
SoundRes.ssd = SoundRes.ssd or {}

SoundRes.ssd.back 			= sound_ssd.."back_ssd"
SoundRes.ssd.gameStart 		= sound_ssd.."start.wav"
SoundRes.ssd.startCompare 	= sound_ssd.."start_compare.wav"
SoundRes.ssd.win 			= sound_ssd.."win.wav"
SoundRes.ssd.lose 			= sound_ssd.."lose.wav"


--[[
宁波麻将
--]]
SoundRes.nbmj = SoundRes.nbmj or {}

SoundRes.nbmj.dice			= sound_nbmj.."dice.wav"
SoundRes.nbmj.cardDown		= sound_nbmj.."carddown.wav"
SoundRes.nbmj.win 			= sound_nbmj.."win.wav"
SoundRes.nbmj.lose 			= sound_nbmj.."lose.wav"

--action
SoundRes.nbmj.buFlower 		= sound_nbmj.."action_buflower.wav"
SoundRes.nbmj.eat 			= sound_nbmj.."action_eat.wav"
SoundRes.nbmj.peng 			= sound_nbmj.."action_peng.wav"
SoundRes.nbmj.gang 			= sound_nbmj.."action_gang.wav"
SoundRes.nbmj.hu 			= sound_nbmj.."action_hu.wav"

--万
SoundRes.nbmj.wan = SoundRes.nbmj.wan or {}
SoundRes.nbmj.wan[1] 			= sound_nbmj.."2001.wav"
SoundRes.nbmj.wan[2] 			= sound_nbmj.."2002.wav"
SoundRes.nbmj.wan[3] 			= sound_nbmj.."2003.wav"
SoundRes.nbmj.wan[4] 			= sound_nbmj.."2004.wav"
SoundRes.nbmj.wan[5] 			= sound_nbmj.."2005.wav"
SoundRes.nbmj.wan[6]			= sound_nbmj.."2006.wav"
SoundRes.nbmj.wan[7] 			= sound_nbmj.."2007.wav"
SoundRes.nbmj.wan[8]			= sound_nbmj.."2008.wav"
SoundRes.nbmj.wan[9] 			= sound_nbmj.."2009.wav"

--筒子
SoundRes.nbmj.tong = SoundRes.nbmj.tong or {}
SoundRes.nbmj.tong[1] 			= sound_nbmj.."2011.wav"
SoundRes.nbmj.tong[2] 			= sound_nbmj.."2012.wav"
SoundRes.nbmj.tong[3] 			= sound_nbmj.."2013.wav"
SoundRes.nbmj.tong[4] 			= sound_nbmj.."2014.wav"
SoundRes.nbmj.tong[5] 			= sound_nbmj.."2015.wav"
SoundRes.nbmj.tong[6]			= sound_nbmj.."2016.wav"
SoundRes.nbmj.tong[7] 			= sound_nbmj.."2017.wav"
SoundRes.nbmj.tong[8]			= sound_nbmj.."2018.wav"
SoundRes.nbmj.tong[9] 			= sound_nbmj.."2019.wav"

--条子
SoundRes.nbmj.tiao = SoundRes.nbmj.tiao or {}
SoundRes.nbmj.tiao[1] 			= sound_nbmj.."2021.wav"
SoundRes.nbmj.tiao[2] 			= sound_nbmj.."2022.wav"
SoundRes.nbmj.tiao[3] 			= sound_nbmj.."2023.wav"
SoundRes.nbmj.tiao[4] 			= sound_nbmj.."2024.wav"
SoundRes.nbmj.tiao[5] 			= sound_nbmj.."2025.wav"
SoundRes.nbmj.tiao[6]			= sound_nbmj.."2026.wav"
SoundRes.nbmj.tiao[7] 			= sound_nbmj.."2027.wav"
SoundRes.nbmj.tiao[8]			= sound_nbmj.."2028.wav"
SoundRes.nbmj.tiao[9] 			= sound_nbmj.."2029.wav"

--字
SoundRes.nbmj.zi = SoundRes.nbmj.zi or {}
SoundRes.nbmj.zi[1] 			= sound_nbmj.."2031.wav"  	--东
SoundRes.nbmj.zi[2] 			= sound_nbmj.."2032.wav"	--南
SoundRes.nbmj.zi[3] 			= sound_nbmj.."2033.wav"	--西
SoundRes.nbmj.zi[4] 			= sound_nbmj.."2034.wav"	--北
SoundRes.nbmj.zi[5] 			= sound_nbmj.."2041.wav"	--中
SoundRes.nbmj.zi[6]				= sound_nbmj.."2042.wav"	--发
SoundRes.nbmj.zi[7] 			= sound_nbmj.."2043.wav"	--白


--[[
地鼠
--]]
SoundRes.shrew = SoundRes.shrew or {}

SoundRes.shrew.backgroundMusic	= sound_shrew.."back"
SoundRes.shrew.award			= sound_shrew.."Award.wav"
SoundRes.shrew.coin				= sound_shrew.."coin.wav"
SoundRes.shrew.hitOne			= sound_shrew.."Hit_One.wav"
SoundRes.shrew.hitNull			= sound_shrew.."Hit_Null.wav"
SoundRes.shrew.shrewHit1		= sound_shrew.."mouse_1.wav"
SoundRes.shrew.multiKick		= sound_shrew.."multiKick.wav"
SoundRes.shrew.leiShen			= sound_shrew.."Sound_LeiShen1.wav"


--[[
奉化麻将
--]]
SoundRes.fhmj = SoundRes.fhmj or {}

SoundRes.fhmj.dice          = sound_nbmj.."dice.wav"
SoundRes.fhmj.cardDown      = sound_nbmj.."carddown.wav"
SoundRes.fhmj.win           = sound_nbmj.."win.wav"
SoundRes.fhmj.lose          = sound_nbmj.."lose.wav"

--action
SoundRes.fhmj.buFlower      = sound_fhmj.."1051.wav"
SoundRes.fhmj.eat           = sound_fhmj.."1061.wav"
SoundRes.fhmj.peng          = sound_fhmj.."1062.wav"
SoundRes.fhmj.gang          = sound_fhmj.."1063.wav"
SoundRes.fhmj.hu            = sound_fhmj.."1064.wav"

--万
SoundRes.fhmj.wan = SoundRes.fhmj.wan or {}
SoundRes.fhmj.wan[1]            = sound_fhmj.."1001.wav"
SoundRes.fhmj.wan[2]            = sound_fhmj.."1002.wav"
SoundRes.fhmj.wan[3]            = sound_fhmj.."1003.wav"
SoundRes.fhmj.wan[4]            = sound_fhmj.."1004.wav"
SoundRes.fhmj.wan[5]            = sound_fhmj.."1005.wav"
SoundRes.fhmj.wan[6]            = sound_fhmj.."1006.wav"
SoundRes.fhmj.wan[7]            = sound_fhmj.."1007.wav"
SoundRes.fhmj.wan[8]            = sound_fhmj.."1008.wav"
SoundRes.fhmj.wan[9]            = sound_fhmj.."1009.wav"

--筒子
SoundRes.fhmj.tong = SoundRes.fhmj.tong or {}
SoundRes.fhmj.tong[1]           = sound_fhmj.."1011.wav"
SoundRes.fhmj.tong[2]           = sound_fhmj.."1012.wav"
SoundRes.fhmj.tong[3]           = sound_fhmj.."1013.wav"
SoundRes.fhmj.tong[4]           = sound_fhmj.."1014.wav"
SoundRes.fhmj.tong[5]           = sound_fhmj.."1015.wav"
SoundRes.fhmj.tong[6]           = sound_fhmj.."1016.wav"
SoundRes.fhmj.tong[7]           = sound_fhmj.."1017.wav"
SoundRes.fhmj.tong[8]           = sound_fhmj.."1018.wav"
SoundRes.fhmj.tong[9]           = sound_fhmj.."1019.wav"

--条子
SoundRes.fhmj.tiao = SoundRes.fhmj.tiao or {}
SoundRes.fhmj.tiao[1]           = sound_fhmj.."1021.wav"
SoundRes.fhmj.tiao[2]           = sound_fhmj.."1022.wav"
SoundRes.fhmj.tiao[3]           = sound_fhmj.."1023.wav"
SoundRes.fhmj.tiao[4]           = sound_fhmj.."1024.wav"
SoundRes.fhmj.tiao[5]           = sound_fhmj.."1025.wav"
SoundRes.fhmj.tiao[6]           = sound_fhmj.."1026.wav"
SoundRes.fhmj.tiao[7]           = sound_fhmj.."1027.wav"
SoundRes.fhmj.tiao[8]           = sound_fhmj.."1028.wav"
SoundRes.fhmj.tiao[9]           = sound_fhmj.."1029.wav"

--字
SoundRes.fhmj.zi = SoundRes.fhmj.zi or {}
SoundRes.fhmj.zi[1]             = sound_fhmj.."1031.wav"    --东
SoundRes.fhmj.zi[2]             = sound_fhmj.."1032.wav"    --南
SoundRes.fhmj.zi[3]             = sound_fhmj.."1033.wav"    --西
SoundRes.fhmj.zi[4]             = sound_fhmj.."1034.wav"    --北
SoundRes.fhmj.zi[5]             = sound_fhmj.."1041.wav"    --中
SoundRes.fhmj.zi[6]             = sound_fhmj.."1042.wav"    --发
SoundRes.fhmj.zi[7]             = sound_fhmj.."1043.wav"    --白


--[[
象山麻将
--]]
SoundRes.xsmj = SoundRes.xsmj or {}

SoundRes.xsmj.dice          = sound_nbmj.."dice.wav"
SoundRes.xsmj.cardDown      = sound_nbmj.."carddown.wav"
SoundRes.xsmj.win           = sound_nbmj.."win.wav"
SoundRes.xsmj.lose          = sound_nbmj.."lose.wav"

--action
SoundRes.xsmj.buFlower      = sound_xsmj.."3051.wav"
SoundRes.xsmj.eat           = sound_xsmj.."3061.wav"
SoundRes.xsmj.peng          = sound_xsmj.."3062.wav"
SoundRes.xsmj.gang          = sound_xsmj.."3063.wav"
SoundRes.xsmj.hu            = sound_xsmj.."3064.wav"

--万
SoundRes.xsmj.wan = SoundRes.xsmj.wan or {}
SoundRes.xsmj.wan[1]            = sound_xsmj.."3001.wav"
SoundRes.xsmj.wan[2]            = sound_xsmj.."3002.wav"
SoundRes.xsmj.wan[3]            = sound_xsmj.."3003.wav"
SoundRes.xsmj.wan[4]            = sound_xsmj.."3004.wav"
SoundRes.xsmj.wan[5]            = sound_xsmj.."3005.wav"
SoundRes.xsmj.wan[6]            = sound_xsmj.."3006.wav"
SoundRes.xsmj.wan[7]            = sound_xsmj.."3007.wav"
SoundRes.xsmj.wan[8]            = sound_xsmj.."3008.wav"
SoundRes.xsmj.wan[9]            = sound_xsmj.."3009.wav"

--筒子
SoundRes.xsmj.tong = SoundRes.xsmj.tong or {}
SoundRes.xsmj.tong[1]           = sound_xsmj.."3011.wav"
SoundRes.xsmj.tong[2]           = sound_xsmj.."3012.wav"
SoundRes.xsmj.tong[3]           = sound_xsmj.."3013.wav"
SoundRes.xsmj.tong[4]           = sound_xsmj.."3014.wav"
SoundRes.xsmj.tong[5]           = sound_xsmj.."3015.wav"
SoundRes.xsmj.tong[6]           = sound_xsmj.."3016.wav"
SoundRes.xsmj.tong[7]           = sound_xsmj.."3017.wav"
SoundRes.xsmj.tong[8]           = sound_xsmj.."3018.wav"
SoundRes.xsmj.tong[9]           = sound_xsmj.."3019.wav"

--条子
SoundRes.xsmj.tiao = SoundRes.xsmj.tiao or {}
SoundRes.xsmj.tiao[1]           = sound_xsmj.."3021.wav"
SoundRes.xsmj.tiao[2]           = sound_xsmj.."3022.wav"
SoundRes.xsmj.tiao[3]           = sound_xsmj.."3023.wav"
SoundRes.xsmj.tiao[4]           = sound_xsmj.."3024.wav"
SoundRes.xsmj.tiao[5]           = sound_xsmj.."3025.wav"
SoundRes.xsmj.tiao[6]           = sound_xsmj.."3026.wav"
SoundRes.xsmj.tiao[7]           = sound_xsmj.."3027.wav"
SoundRes.xsmj.tiao[8]           = sound_xsmj.."3028.wav"
SoundRes.xsmj.tiao[9]           = sound_xsmj.."3029.wav"

--字
SoundRes.xsmj.zi = SoundRes.xsmj.zi or {}
SoundRes.xsmj.zi[1]             = sound_xsmj.."3031.wav"    --东
SoundRes.xsmj.zi[2]             = sound_xsmj.."3032.wav"    --南
SoundRes.xsmj.zi[3]             = sound_xsmj.."3033.wav"    --西
SoundRes.xsmj.zi[4]             = sound_xsmj.."3034.wav"    --北
SoundRes.xsmj.zi[5]             = sound_xsmj.."3041.wav"    --中
SoundRes.xsmj.zi[6]             = sound_xsmj.."3042.wav"    --发
SoundRes.xsmj.zi[7]             = sound_xsmj.."3043.wav"    --白

--[[
垃圾分类
--]]
SoundRes.refuseclassification = SoundRes.refuseclassification or {}

SoundRes.refuseclassification.backgroundSound 	= sound_refuseclassification.."backgroundSound"
SoundRes.refuseclassification.errorSound 	= sound_refuseclassification.."errorSound.wav"
SoundRes.refuseclassification.rightSound 	= sound_refuseclassification.."rightSound.wav"


--抢金牌
SoundRes.catchgold = SoundRes.catchgold or {}
SoundRes.catchgold.cardType = SoundRes.catchgold.cardType or {}
SoundRes.catchgold.cardType[catchgold_cardType.CT_SILVER_ONE]     = sound_catchgold.."silver_one.wav"        --银牌1
SoundRes.catchgold.cardType[catchgold_cardType.CT_SILVER_TWO]     = sound_catchgold.."silver_two.wav"        --银牌2
SoundRes.catchgold.cardType[catchgold_cardType.CT_SILVER_THREE]   = sound_catchgold.."silver_three.wav"      --银牌3
SoundRes.catchgold.cardType[catchgold_cardType.CT_SILVER_FOUR]    = sound_catchgold.."silver_four.wav"       --银牌4
SoundRes.catchgold.cardType[catchgold_cardType.CT_SILVER_FIVE]    = sound_catchgold.."silver_five.wav"       --银牌5
SoundRes.catchgold.cardType[catchgold_cardType.CT_SILVER_SIX]     = sound_catchgold.."silver_six.wav"        --银牌6
SoundRes.catchgold.cardType[catchgold_cardType.CT_SILVER_SEVEN]   = sound_catchgold.."silver_seven.wav"      --银牌7
SoundRes.catchgold.cardType[catchgold_cardType.CT_SILVER_EIGHT]   = sound_catchgold.."silver_eight.wav"      --银牌8
SoundRes.catchgold.cardType[catchgold_cardType.CT_SILVER_NINE]    = sound_catchgold.."silver_nine.wav"       --银牌9
SoundRes.catchgold.cardType[catchgold_cardType.CT_NONE]           = sound_catchgold.."none.wav"

SoundRes.catchgold.cardType[catchgold_cardType.CT_GOLD_ONE]       = sound_catchgold.."gold_one.wav"          --金牌牛一
SoundRes.catchgold.cardType[catchgold_cardType.CT_GOLD_TWO]       = sound_catchgold.."gold_two.wav"          --金牌牛二
SoundRes.catchgold.cardType[catchgold_cardType.CT_GOLD_THREE]     = sound_catchgold.."gold_three.wav"        --金牌牛三
SoundRes.catchgold.cardType[catchgold_cardType.CT_GOLD_FOUR]      = sound_catchgold.."gold_four.wav"         --金牌牛四
SoundRes.catchgold.cardType[catchgold_cardType.CT_GOLD_FIVE]      = sound_catchgold.."gold_five.wav"         --金牌牛五
SoundRes.catchgold.cardType[catchgold_cardType.CT_GOLD_SIX]       = sound_catchgold.."gold_six.wav"          --金牌牛六
SoundRes.catchgold.cardType[catchgold_cardType.CT_GOLD_SEVEN]     = sound_catchgold.."gold_seven.wav"        --金牌牛七
SoundRes.catchgold.cardType[catchgold_cardType.CT_GOLD_EIGHT]     = sound_catchgold.."gold_eight.wav"        --金牌牛八
SoundRes.catchgold.cardType[catchgold_cardType.CT_GOLD_NINE]      = sound_catchgold.."gold_nine.wav"         --金牌牛九

SoundRes.catchgold.cardType[catchgold_cardType.CT_SILVER_BIG]     = sound_catchgold.."silver_big.wav"        --大银牌
SoundRes.catchgold.cardType[catchgold_cardType.CT_GOLD_BIG]       = sound_catchgold.."gold_big.wav"          --大金牌
SoundRes.catchgold.cardType[catchgold_cardType.CT_FOUR_FLOWERS]   = sound_catchgold.."four_flowers.wav"      --四花
SoundRes.catchgold.cardType[catchgold_cardType.CT_FIVE_FLOWERS]   = sound_catchgold.."five_flowers.wav"      --五花
SoundRes.catchgold.cardType[catchgold_cardType.CT_THREE_TWO]      = sound_catchgold.."three_two.wav"         --葫芦
SoundRes.catchgold.cardType[catchgold_cardType.CT_FIVE_SMALL]     = sound_catchgold.."five_small.wav"        --五小
SoundRes.catchgold.cardType[catchgold_cardType.CT_BOMB]           = sound_catchgold.."bomb_cardType.wav"     --炸弹

SoundRes.catchgold.isGrab = SoundRes.catchgold.isGrab or {}
SoundRes.catchgold.isGrab[1]                                      = sound_catchgold.."catch_banker.wav"      --抢庄
SoundRes.catchgold.isGrab[0]                                      = sound_catchgold.."not_catch.wav"         --不抢

SoundRes.catchgold.tipAnimation = SoundRes.catchgold.tipAnimation or {}
SoundRes.catchgold.tipAnimation[1]                                = sound_catchgold.."tomato.wav"            --番茄
SoundRes.catchgold.tipAnimation[2]                                = sound_catchgold.."flower.wav"            --花
SoundRes.catchgold.tipAnimation[3]                                = sound_catchgold.."bomb.wav"              --炸弹
SoundRes.catchgold.tipAnimation[4]                                = sound_catchgold.."wolf.wav"              --狼

SoundRes.catchgold.win                                            = sound_catchgold.."win.wav"               --赢钱
SoundRes.catchgold.lose                                           = sound_catchgold.."lose.wav"              --没赢钱
SoundRes.catchgold.touchCard                                      = sound_catchgold.."touch_card.wav"        --配牌
SoundRes.catchgold.cardsDone                                      = sound_catchgold.."cards_done.wav"        --配牌完成
SoundRes.catchgold.cardsOpen                                      = sound_catchgold.."cards.wav"             --摊牌
SoundRes.catchgold.gameStart                                      = sound_catchgold.."game_start.wav"        --游戏开始
