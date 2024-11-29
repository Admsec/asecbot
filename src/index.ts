import type {EventHandleMap} from "node-napcat-ts";
import {NCWebsocket} from "node-napcat-ts";
import {join} from "path";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "fs";
import * as winston from "winston";
import {parse} from "yaml";
import axios from "axios";
import {createJiti} from "jiti"
import {readdirSync} from "node:fs";
import * as cron from "node-cron";

// Config
export function getConfig(): Config {
    initConfig()
    return parse(readFileSync(join(process.cwd(), "config.yaml"), "utf-8"))
}

export function initConfig(): void {
    const configPath = join(process.cwd(), "config.yaml")
    if (!existsSync(configPath)) {
        writeFileSync(configPath, defaultConfig, "utf-8");
    }
}

const defaultConfig = `\
napcat:
  baseUrl: 'ws://localhost:3001'
  accessToken: ''
  throwPromise: false  # 是否需要在触发 socket.error 时抛出错误，默认关闭
  reconnection_enable: true
  reconnection_attempts: 10
  reconnection_delay: 5000  # 单位可能是毫秒（ms）
  debug: false

self:
  master: [1447007223]  # 这一项是一个数字数组的首项包含了单个数字“1447007223” \
`

export interface Config {
    napcat: {
        baseUrl: string,
        accessToken: string,
        throwPromise: boolean
        reconnection: {
            enable: boolean,
            attempts: number
            delay: number
        },
        debug: boolean
    },
    self: {
        master: Array<number>
    }
}

// Index

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
const logPath = join(process.cwd(), "log")
if (!existsSync(logPath)) mkdirSync(logPath);
const logFileName = join(logPath, new Date().toLocaleString().split(" ")[0].replace(/\//g, "-") + ".log")
const alignColorsAndTime = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({

        format: "YY-MM-DD HH:mm:ss"
    }),
    winston.format.colorize({
        all: true,
    }),
    winston.format.printf(
        info => `${info.level} ${info.timestamp} ${info.message}`
    )
);
export const log = winston.createLogger({
    level: "info",
    transports: [
        new (winston.transports.Console)({
            format: winston.format.combine(winston.format.colorize(), alignColorsAndTime)
        }),
        new winston.transports.File({filename: logFileName}) // 文件输出
    ],
});


export class Bot {
    private bot: NCWebsocket;
    private config: Config;
    private pluginManager: PluginManager;
    private plugins: {} | null;

    constructor() {
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

    async start() {
        log.info(logo)
        this.bot.on("socket.open", (ctx) => {
            log.info("[*]开始连接: " + this.config.napcat.baseUrl)
        })
        this.bot.on("socket.error", (ctx) => {
            log.error("[-]websocket 连接错误: " + ctx.error_type)
        })
        this.bot.on("socket.close", (ctx) => {
            log.error("[-]websocket 连接关闭: " + ctx.code)
        })
        this.bot.on("meta_event.lifecycle", (ctx) => {
            if (ctx.sub_type == "connect")
                log.info(`[+]连接成功: ${this.config.napcat.baseUrl}`)
        })
        this.bot.on("meta_event.heartbeat", (ctx) => {
            log.info(`[*]心跳包♥`)
        })
        this.bot.on("message", (ctx) => {
            log.info("[*]receive message: " + ctx.raw_message)
        })
        this.bot.on("api.response.failure", (ctx) => {
            log.error(`[-]ApiError, status: ${ctx.status}, message: ${ctx.message}`)
        })
        this.bot.on("api.preSend", (ctx) => {
            log.info(`[*]${ctx.action}: ${JSON.stringify(ctx.params)}`)
        })
        this.plugins = await this.pluginManager.init()
        await this.bot.connect()
    }
}


// Plugin
export function definePlugin(plugin: KoiPlugin): KoiPlugin {
    return plugin;
}

interface PluginInfo {
    version: string,
    description: string
    setup: {
        enable: boolean,
        listeners: Array<listener>;
        cron: Array<any>;
    }
}

interface listener {
    event: keyof EventHandleMap,
    fn: any;
}


interface pluginUtil {
    getPlugins: () => Map<string, PluginInfo>;
    onPlugin: (pluginName: string) => string;
    offPlugin: (pluginName: string) => string;
    reloadPlugin: (pluginName: string) => Promise<string>;
    getPluginsFromDir: () => string[];
    loadPlugin: (pluginName: string) => Promise<string>;
}


interface KoiPluginContext {
    config: Config;
    /** axios 实例 */
    http: typeof axios;
    bot: NCWebsocket;
    plugin: pluginUtil;
    /** cron 定时任务 */
    cron: (
        expression: string,
        func: () => any
    ) => any;
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
}

interface KoiPlugin {
    /** 插件 ID */
    name: string;
    /** 插件版本 */
    version?: string;
    /** 插件描述 */
    description?: string;
    /** 插件初始化，可返回一个函数用于清理 */
    setup?: (ctx: KoiPluginContext) => any;
}


export class PluginManager {
    public plugins: Map<string, PluginInfo>;
    public bot: NCWebsocket;
    public ctx: KoiPluginContext;
    private tempListener: Array<listener>;
    private tempCronJob: Array<any>;
    private jiti: any;

    constructor(bot: NCWebsocket, config: Config) {
        this.plugins = new Map<string, PluginInfo>();
        // @ts-ignore
        this.jiti = createJiti(import.meta.url, {moduleCache: false})
        this.bot = bot;
        this.tempListener = [];
        this.tempCronJob = [];
        this.ctx = {
            config: config,
            http: axios,
            bot: this.bot,
            cron: (expression, func) => {
                    if(!cron.validate(expression)){
                        this.tempCronJob.push(false)
                    }
                    this.tempCronJob.push(cron.schedule(expression, func, {
                        scheduled: false
                    }))
            },
            plugin: {
                getPlugins: () => {
                    return this.getPlugins();
                },
                onPlugin: (pluginName: string) => {
                    return this.onPlugin(pluginName)
                },
                offPlugin: (pluginName: string) => {
                    return this.offPlugin(pluginName)
                },
                reloadPlugin: (pluginName: string): Promise<string> => {
                    return this.reloadPlugin(pluginName)
                },
                getPluginsFromDir: (): string[] => {
                    return this.getPluginsFromDir();
                },
                loadPlugin: (pluginName: string): Promise<any> => {
                    return this.loadPlugin(pluginName);
                }
            },
            handle: (eventName: any, func) => {
                const obj = {
                    event: eventName,
                    fn: func
                }
                this.tempListener.push(obj)
            },
            isMaster: (e) => {
                if (typeof e === 'number' && !isNaN(e)) {
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
        const pluginList = this.getPluginsFromDir();
        let success = 0,
            fail = 0;
        for (const p of pluginList) {
            const pluginPath = join(process.cwd(), "plugins", p, "index.ts");
            try {
                await this.loadPlugin(pluginPath);
                success++;
            } catch (err) {
                log.error(`[-]插件${p}导入失败: ${err}`);
                fail++;
            }
        }
        log.info(
            `[+]插件加载完毕, 一共导入${
                success + fail
            }个插件, 成功: ${success}, 失败: ${fail}`
        );
        return this.plugins;
    }

    getPluginsFromDir(): string[] {
        const path_ = join(process.cwd(), "plugins");
        if (!existsSync(path_)) {
            log.warn(`[-]插件文件夹不存在, 自动创建插件文件夹: plugins`);
            mkdirSync(path_);
        }
        return readdirSync(path_)
    }


    async loadPlugin(pluginPath: string): Promise<any> {
        const plugin = await this.jiti.import(pluginPath)
        try {
            plugin.default.setup(this.ctx)
            this.plugins.set(plugin.default.name, {
                version: plugin.default.version || "0.1.0",
                description: plugin.default.description || "",
                setup: {
                    enable: false,
                    listeners: this.tempListener,
                    cron: this.tempCronJob
                }
            })
            log.info(this.onPlugin(plugin.default.name))
            this.tempListener = [];
            this.tempCronJob = [];
            return plugin;
        } catch (err) {
            log.error(`[-]插件${pluginPath}导入失败, 原因: ${err}`)
            return false
        }

    }

    getPlugins() {
        return this.plugins
    }

    offPlugin(pluginName: string) {
        const map = this.plugins.get(pluginName) as PluginInfo;
        if (!this.plugins.has(pluginName)) {
            return "[-]该插件不存在"
        }
        if (!map?.setup && map.setup?.enable) {
            return "[-]该插件没有启用"
        }
        for (const p of map.setup.listeners) {
            this.bot.off(p.event, p.fn)
        }
        for (const p of map.setup.cron) {
            p.stop()
        }
        map.setup.enable = false;
        return `[+]插件${pluginName}已禁用`
    }

    onPlugin(pluginName: string) {
        const map = this.plugins.get(pluginName) as PluginInfo;
        if (!this.plugins.has(pluginName)) {
            return "[-]该插件不存在"
        }
        if (map?.setup && map.setup?.enable) {
            return "[-]该插件没有被禁用"
        }
        // 插件函数
        for (const p of map.setup.listeners) {
            this.bot.on(p.event, p.fn)
        }
        // 定时任务
        for (const p of map.setup.cron) {
            if(!p){
                return `[-]插件${pluginName}的定时任务启动出错, 请检查一下cron表达式`
            }
            p.start()
        }
        map.setup.enable = true;
        return `[+]插件${pluginName}已启用`
    }

    async reloadPlugin(pluginName: string): Promise<any> {
        const pluginPath = join(process.cwd(), "plugins", pluginName, "index.ts");
        if (!this.plugins.has(pluginName) && !existsSync(pluginPath)) {
            return "[-]该插件不存在"
        }
        const map = this.plugins.get(pluginName) as PluginInfo;
        // 如果缓存有
        // 如果插件目前是开启的
        if (map?.setup && map.setup?.enable) {
            log.info(this.offPlugin(pluginName));
        }
        return await this.loadPlugin(pluginPath)
    }


}

