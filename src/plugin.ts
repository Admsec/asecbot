import { join } from "path";
import { existsSync, mkdirSync, readdirSync } from "fs";
import { NCWebsocket, Structs } from "node-napcat-ts";
import axios from "axios";
import type { EventHandleMap } from "node-napcat-ts";
import { Config } from "./config";
import {createJiti} from "jiti"
import {logger} from "./index";

// export declare function definePlugin(plugin: KoiPlugin): KoiPlugin;
export function definePlugin(plugin: KoiPlugin): KoiPlugin {
  return plugin;
}

interface PluginInfo{
  version: string,
  description: string
  setup: {
    enable: boolean,
    listeners: Array<listener>;
  }
}
interface listener{
  event: keyof EventHandleMap,
  fn:any;
}

export class PluginManager {
  public plugins: Map<string, PluginInfo>;
  public bot: NCWebsocket;
  public ctx: KoiPluginContext;
  private tempListener: Array<listener>;
  private jiti: any;
  constructor(bot: NCWebsocket, config: Config) {
    this.plugins = new Map<string, PluginInfo>();
    // @ts-ignore
    this.jiti = createJiti(import.meta.url, { moduleCache: false})
    this.bot = bot;
    this.tempListener = [];
    this.ctx = {
      config: config,
      http: axios,
      bot: this.bot,
      plugin: {
        getPlugins: () => {
          return this.getPlugins();
        },
        onPlugin: (pluginName: string) => {
          return this.onPlugin(pluginName)
        },
        offPlugin: (pluginName: string)=> {
          return this.offPlugin(pluginName)
        },
        restart: () =>{
          return this.restart()
        },
        reloadPlugin: (pluginName: string): Promise<string>=> {
          return this.reloadPlugin(pluginName)
        },
      },
      handle: (eventName: any, func) => {
        const obj = {
          event: eventName,
          fn: func
        }
        this.tempListener.push(obj)
      },
      isMaster: (e) => {
        if(typeof e === 'number' && !isNaN(e)){
          return this.ctx.config.self.master.includes(e)
        }
          // 检查 e 是否是对象并获取 user_id
        if (typeof e === 'object' && e.sender && typeof e.sender.user_id === 'number') {
          return this.ctx.config.self.master.includes(e.sender.user_id);
        }
        return false; // 如果都不是，返回 false
      }
    };
  }

  async init() {
      const path_ = join(process.cwd(), "plugins");
      if (!existsSync(path_)) {
        logger.warn(`[-]插件文件夹不存在, 自动创建插件文件夹: plugins`);

        mkdirSync(path_);
      }
      // 初始化 ctx
      
      const pluginList = readdirSync(path_);
      let success = 0,
        fail = 0;
      
      for (const p of pluginList) {
        const pluginPath = join(path_, p, "index.ts");
        try {
          await this.loadPlugin(pluginPath);
          success++;
        } catch (err) {
          console.error(`[-]插件${p}导入失败: ${err}`);
          fail++;
        }
      }
      logger.info(
        `[+]插件加载完毕, 一共导入${
          success + fail
        }个插件, 成功: ${success}, 失败: ${fail}`
      );
      return this.plugins;
  }

  restart() {

  }

  async loadPlugin(pluginPath: string) {
    // const plugin = await import(`file://${pluginPath}`)
    const plugin = await this.jiti.import(pluginPath)
    plugin.default.setup(this.ctx)
    this.plugins.set(plugin.default.name, {
      version: plugin.default.version || "0.1.0",
      description: plugin.default.description || "",
      setup: {
        enable: false,
        listeners: this.tempListener
      }
    })
    logger.info(this.onPlugin(plugin.default.name))
    this.tempListener = [];
    return plugin;

  }
  getPlugins(){
    return this.plugins
  }

  offPlugin(pluginName: string){
    const map = this.plugins.get(pluginName) as PluginInfo ;
    if(!this.plugins.has(pluginName)){
      return "[-]该插件不存在"
    }
    if(!this.pluginIsEnabled(map)){
      return "[-]该插件没有启用"
    }
    for (const p of map.setup.listeners){
        this.bot.off(p.event, p.fn)
    }
    map.setup.enable = false;
    return `[+]插件${pluginName}已禁用`
  }

  onPlugin(pluginName: string){
    const map = this.plugins.get(pluginName) as PluginInfo ;
    if(!this.plugins.has(pluginName)){
      return "[-]该插件不存在"
    }
    if(this.pluginIsEnabled(map)){
      return "[-]该插件没有被禁用"
    }
    for (const p of map.setup.listeners){
      this.bot.on(p.event, p.fn)
    }
    map.setup.enable = true;
    return `[+]插件${pluginName}已启用`
  }

  reloadPlugin(pluginName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if(!this.plugins.has(pluginName)){
        resolve("[-]该插件不存在")
      }
      const pluginPath = join(process.cwd(), "plugins" ,pluginName, "index.ts");
      if(!existsSync(pluginPath)){
        resolve(`[-]重载失败, 请确认插件文件是否存在: ${pluginPath}`)
      }
      // @ts-ignore
      if(this.plugins.get(pluginName).setup.enable){
        logger.info(this.offPlugin(pluginName));
      }

      this.loadPlugin(pluginPath).then((result) => {
        resolve(`[+]插件${pluginName}已重载`);
        logger.info(result)

      })
    })
  }


  pluginIsEnabled(plugin: PluginInfo){
    return plugin.setup.enable;
  }
  
}



interface pluginUtil{
  getPlugins: () => Map<string, PluginInfo>;
  onPlugin: (pluginName: string) => string;
  offPlugin: (pluginName: string) => string;
  restart: () => void;
  reloadPlugin: (pluginName: string) => Promise<string>;
}
// interface plugins{
//   listener: Array<object>,
//   version: string,
//   description: string;
// }
// interface
interface KoiPluginContext {
  config: Config;
  /** axios 实例 */
  http: typeof axios;
  bot: NCWebsocket;
  plugin: pluginUtil;
  /** 注册事件处理器 */
  handle: <EventName extends keyof EventHandleMap>(
    eventName: EventName,
    handler: EventHandleMap[EventName]
  ) => any;
  /** 是否为主人 */
  isMaster: (
    id:
      | number
      | {
          sender: {
            user_id: number;
          };
        }
  ) => boolean;
  /** 是否有权限，即：主人或管理员 */
  // hasRight: (
  //   id:
  //     | number
  //     | {
  //         sender: {
  //           user_id: number;
  //         };
  //       }
  // ) => boolean;
}

interface KoiPlugin {
  /** 插件 ID */
  name: string;
  /** 插件版本 */
  version?: string;
  /** 插件描述 */
  description?: string;
  /** cron 定时任务 */
  cron?: [
    string,
    (ctx: KoiPluginContext, now: Date | "manual" | "init") => any
  ][];
  /** 插件初始化，可返回一个函数用于清理 */
  setup?: (ctx: KoiPluginContext) => any;
}

