

puremvc = puremvc or {}
puremvc.VERSION = '1.0.0'
puremvc.FRAMEWORK_NAME = 'puremvc lua'
puremvc.PACKAGE_NAME = 'puremvc.org.puremvc.lua.multicore'

require(puremvc.PACKAGE_NAME .. '.help.oop')

puremvc.Facade = import(puremvc.PACKAGE_NAME .. '.patterns.facade.Facade')
puremvc.Mediator = import(puremvc.PACKAGE_NAME .. '.patterns.mediator.Mediator')
puremvc.Proxy = import(puremvc.PACKAGE_NAME .. '.patterns.proxy.Proxy')
puremvc.SimpleCommand = import(puremvc.PACKAGE_NAME .. '.patterns.command.SimpleCommand')
puremvc.MacroCommand = import(puremvc.PACKAGE_NAME .. '.patterns.command.MacroCommand')
puremvc.Notifier = import(puremvc.PACKAGE_NAME .. '.patterns.observer.Notifier')
puremvc.Notification = import(puremvc.PACKAGE_NAME .. '.patterns.observer.Notification')
--[[
Log.i("")
Log.i("# FRAMEWORK_NAME           = " .. puremvc.FRAMEWORK_NAME)
Log.i("# VERSION                  = " .. puremvc.VERSION)
Log.i("")
--]]

