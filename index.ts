import { logger, NCWebsocket, Structs } from "node-napcat-ts";
import { Config, getConfig } from "./config";
import { KoiPlugin, PluginManager } from "./plugin";


const logo = `
_______________#########_______________________ 
______________############_____________________ 
______________#############____________________ 
_____________##__###########___________________ 
____________###__######_#####__________________ 
____________###_#######___####_________________ 
___________###__##########_####________________ 
__________####__###########_####_______________ 
________#####___###########__#####_____________ 
_______######___###_########___#####___________ 
_______#####___###___########___######_________ 
______######___###__###########___######_______ 
_____######___####_##############__######______ 
____#######__#####################_#######_____ 
____#######__##############################____ 
___#######__######_#################_#######___ 
___#######__######_######_#########___######___ 
___#######____##__######___######_____######___ 
___#######________######____#####_____#####____ 
____######________#####_____#####_____####_____ 
_____#####________####______#####_____###______ 
______#####______;###________###______#________ 
________##_______####________####______________ 
KoiBot 一个基于 node-napcat-ts 的 QQ 机器人
参考: kivibot@viki && Abot@takayama
@auther: Admsec github: https://github.com/Admsec\
`


export class Bot{
  private bot: NCWebsocket;
  private config: Config;
  private pluginManager: PluginManager;
  private plugins: {} | null;
  constructor(){
    this.config = getConfig();
    this.bot = new NCWebsocket({
      "baseUrl": this.config.napcat.baseUrl,
      "accessToken": this.config.napcat.accessToken,
      "reconnection": {
        "enable": this.config.napcat.reconnection.enable,
        "attempts": this.config.napcat.reconnection.attempts,
        "delay": this.config.napcat.reconnection.delay
      }
    }, this.config.napcat.debug);
    this.pluginManager = new PluginManager(this.bot, this.config);
    this.plugins = null;
  }
  async start(){
    // logger.warn(logo)
    console.info(logo)
    this.bot.on("socket.open", (ctx) => {
      logger.dir("[*]开始连接 " + this.config.napcat.baseUrl)
    })
    this.bot.on("socket.error", (ctx) => {
      logger.warn("[-]websocket 连接错误: " + ctx.error_type)
    })
    this.bot.on("socket.close", (ctx) => {
      logger.warn("[-]websocket 连接关闭: " + ctx.code)
    })
    this.plugins = await this.pluginManager.init()
    await this.bot.connect()
  }
}
new Bot().start()
