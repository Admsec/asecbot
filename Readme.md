## KoiBot - 一个基于 node-napcat-ts 的 QQ 机器人

使用方法：

1. 下载该项目

```
npm install koibot
# or
cnpm install koibot
```

2. 安装依赖

```
npm install
# or
cnpm install 
```

3. 填写 config.yaml 文件

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



3. koibot 启动！

```
npm start
```

