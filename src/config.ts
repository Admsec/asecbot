import {existsSync, readFileSync, writeFileSync} from 'fs';
import {join} from 'path';
import {parse} from 'yaml';


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