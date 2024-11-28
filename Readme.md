## KoiBot - 一个基于 node-napcat-ts 的 QQ 机器人

使用方法：

1. 下载并配置 napcat, 并配置 NapCat 端为 websocket 服务端

   [NapCat: NapCatQQ现代化的基于 NTQQ 的 Bot 协议端实现](https://napneko.github.io/)

2. [napcat]/config/onebot11_*.json 文件内容如下

```json
{
  "network": {
    "httpServers": [],
    "httpClients": [],
    "websocketServers": [
      {
        "name": "main",
        "enable": true,
        "host": "0.0.0.0",
        "port": 3001,
        "messagePostFormat": "array",
        "reportSelfMessage": false,
        "token": "",
        "enableForcePushEvent": true,
        "debug": false,
        "heartInterval": 30000
      }
    ],
    "websocketClients": []
  },
  "musicSignUrl": "",
  "enableLocalFile2Url": false
}
```

3. 下载该项目

```
npm install koibot
# or
cnpm install koibot
```

4. 安装依赖

```
npm install
# or
cnpm install 
```

5. 填写 config.yaml 文件

```
napcat:
  baseUrl: 'ws://localhost:3001'
  accessToken: ''
  throwPromise: false  # 是否需要在触发 socket.error 时抛出错误，默认关闭
  reconnection:
    enable: true
    attempts: 10
    delay: 5000  # 单位可能是毫秒（ms）
  debug: false

self:
  master: []  # 主人
```

6. koibot 启动！

```
npm start
```

