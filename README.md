# 西游类MMORPG

### Java后端
- 需要JDK环境1.8
- 入口类game.Boot.java
- 目录XYServer内的XYServer.jar是打包好的运行包，可用命令行直接运行。

```
java -jar XYServer.jar
```

### CocosCreator前端+TypeScript
- Game场景是游戏主场景，可直接运行。
- 如果先运行HotUpdate场景，会在热更新完成后进入Game场景。（仅适用于安卓）

### 框架插件清单
- 本人的开源Java服务端框架JCEngine
- 本人的开源CocosCreator地图插件MapEditor
- CocosStore下载的热更新插件（热更新manifest生成工具）