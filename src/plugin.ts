import type { NCWebsocket } from "node-napcat-ts";
import { join } from "path";
import { existsSync, mkdirSync, readdirSync } from "fs";
import * as cron from "node-cron";
import axios from "axios";
import { createJiti } from "jiti";
import { log } from "./log";
import type {
  PluginInfo,
  Listener,
  PluginUtil,
  AsecPluginContext,
  AsecPlugin
} from "./types/plugin.d";

export function definePlugin(plugin: AsecPlugin): AsecPlugin {
  return plugin;
}

export class PluginManager {
  public plugins: Map<string, PluginInfo>;
  public bot: NCWebsocket;
  public ctx: AsecPluginContext;
  private tempListener: Array<Listener>;
  private tempCronJob: Array<any>;
  private jiti: any;

  constructor(bot: NCWebsocket, config: any) {
    this.plugins = new Map<string, PluginInfo>();
    // @ts-ignore
    this.jiti = createJiti(import.meta.url, { moduleCache: false });
    this.bot = bot;
    this.tempListener = [];
    this.tempCronJob = [];
    this.ctx = {
      config: config,
      http: axios,
      bot: this.bot,
      cron: (expression, func) => {
        if (!cron.validate(expression)) {
          this.tempCronJob.push(false);
        }
        this.tempCronJob.push(
          cron.schedule(expression, func, {
            scheduled: false,
          })
        );
      },
      plugin: {
        getPlugins: () => {
          return this.getPlugins();
        },
        onPlugin: (pluginName: string) => {
          return this.onPlugin(pluginName);
        },
        offPlugin: (pluginName: string) => {
          return this.offPlugin(pluginName);
        },
        reloadPlugin: (pluginName: string) => {
          return this.reloadPlugin(pluginName);
        },
        getPluginsFromDir: () => {
          return this.getPluginsFromDir();
        },
        loadPlugin: (pluginName: string) => {
          return this.loadPlugin(pluginName);
        },
      },
      handle: (eventName: any, func) => {
        const obj = {
          event: eventName,
          fn: func,
        };
        this.tempListener.push(obj);
      },
      isMaster: (e) => {
        if (typeof e === "number" && !isNaN(e)) {
          return this.ctx.config.self.master.includes(e);
        }
        if (
          typeof e === "object" &&
          e.sender &&
          typeof e.sender.user_id === "number"
        ) {
          return this.ctx.config.self.master.includes(e.sender.user_id);
        }
        return false;
      },
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
      `[+]插件加载完毕, 一共导入${success + fail}个插件, 成功: ${success}, 失败: ${fail}`
    );
    return this.plugins;
  }

  getPluginsFromDir(): string[] {
    const path_ = join(process.cwd(), "plugins");
    if (!existsSync(path_)) {
      log.warn(`[-]插件文件夹不存在, 自动创建插件文件夹: plugins`);
      mkdirSync(path_);
    }
    return readdirSync(path_);
  }

  async loadPlugin(pluginPath: string): Promise<any> {
    const plugin = await this.jiti.import(pluginPath);
    try {
      plugin.default.setup(this.ctx);
      this.plugins.set(plugin.default.name, {
        version: plugin.default.version || "0.1.0",
        description: plugin.default.description || "",
        admin: plugin.default.admin || false,
        usage: plugin.default.usage || "",
        setup: {
          enable: false,
          listeners: this.tempListener,
          cron: this.tempCronJob,
        },
      });
      log.info(this.onPlugin(plugin.default.name));
      this.tempListener = [];
      this.tempCronJob = [];
      return plugin;
    } catch (err) {
      log.error(`[-]插件${pluginPath}导入失败, 原因: ${err}`);
      return false;
    }
  }

  getPlugins() {
    return this.plugins;
  }

  offPlugin(pluginName: string) {
    if (!this.plugins.has(pluginName)) {
      return "[-]该插件不存在";
    }
    const map = this.plugins.get(pluginName);
    if (!map?.setup || !map.setup?.enable) {
      return "[-]该插件没有启用";
    }
    for (const p of map?.setup?.listeners || [] ) {
      this.bot.off(p.event, p.fn);
    }
    for (const p of map?.setup?.cron || []) {
      p.stop();
    }
    map.setup.enable = false;
    return `[+]插件${pluginName}已禁用`;
  }

  onPlugin(pluginName: string) {
    if (!this.plugins.has(pluginName)) {
      return "[-]该插件不存在";
    }
    const map = this.plugins.get(pluginName) as PluginInfo;
    if (map?.setup && map.setup?.enable) {
      return "[-]该插件没有被禁用";
    }
    for (const p of map?.setup?.listeners || []) {
      this.bot.on(p.event, p.fn);
    }
    for (const p of map?.setup?.cron || []) {
      if (!p) {
        return `[-]插件${pluginName}的定时任务启动出错, 请检查一下cron表达式`;
      }
      p.start();
    }
    map.setup.enable = true;
    return `[+]插件${pluginName}已启用`;
  }

  async reloadPlugin(pluginName: string): Promise<{ result: boolean; msg: string }> {
    const pluginPath = join(process.cwd(), "plugins", pluginName, "index.ts");
    if (!existsSync(pluginPath)) {
      return { result: false, msg: "[-]该插件不存在" };
    }
    this.offPlugin(pluginName);
    if (this.jiti && this.jiti.cache) {
      delete this.jiti.cache[pluginPath];
    }
    try {
      const resolved = require.resolve(pluginPath);
      if (require.cache[resolved]) {
        delete require.cache[resolved];
      }
    } catch (e) {}
    const loadResult = await this.loadPlugin(pluginPath);
    if (!loadResult) {
      return { result: false, msg: `[-]插件${pluginName}重新导入失败` };
    }
    return { result: true, msg: `[+]插件${pluginName}已重载` };
  }
}
