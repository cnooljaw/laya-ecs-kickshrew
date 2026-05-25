local a = {
	
	x = 1,
	y =2
}

local b = {
	
	m = 3,
	n = 4
}

local c = {a, b}

local d = c[1]

d.u = 5



for index, value in pairs(c) do
	if type(value) == "table" then
		for i, v in pairs(value) do
		end
	end
	Log.i(index, value)
end

ss = c[1].mm

Log.i(ss) 



