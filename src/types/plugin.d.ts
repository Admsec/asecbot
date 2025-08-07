import type { EventHandleMap } from "node-napcat-ts";
import type { NCWebsocket } from "node-napcat-ts";
import type { Config } from "../index";
import type axios from "axios";

export interface PluginInfo {
  version: string;
  description: string;
  admin: boolean;
  usage: string;
  setup: {
    enable: boolean;
    listeners: Array<Listener>;
    cron: Array<any>;
  };
}

export interface Listener {
  event: keyof EventHandleMap;
  fn: any;
}

export interface PluginUtil {
  getPlugins: () => Map<string, PluginInfo>;
  onPlugin: (pluginName: string) => string;
  offPlugin: (pluginName: string) => string;
  reloadPlugin: (pluginName: string) => Promise<{ result: boolean; msg: string }>;
  getPluginsFromDir: () => string[];
  loadPlugin: (pluginName: string) => Promise<string>;
}

export interface AsecPluginContext {
  config: Config;
  http: typeof axios;
  bot: NCWebsocket;
  plugin: PluginUtil;
  cron: (expression: string, func: () => any) => any;
  handle: <EventName extends keyof EventHandleMap>(
    eventName: EventName,
    handler: EventHandleMap[EventName]
  ) => any;
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

export interface AsecPlugin {
  name: string;
  version?: string;
  description?: string;
  usage?: string;
  admin?: boolean;
  setup?: (ctx: AsecPluginContext) => any;
}
