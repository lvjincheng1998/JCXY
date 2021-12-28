import MapGuider, { MapRectType } from "../core/MapGuider";
import SingleClass from "../core/SingleClass";
import ActorInMap from "../game/ActorInMap";
import GameView from "../view/GameView";
import Movie from "../core/Movie";
import Player from "../game/Player";

export default class MapMgr extends SingleClass {

    static ins(): MapMgr {
        return super.ins();
    }

    mapLoaded: boolean = false;
    mapID: number = 0;
    myActor: ActorInMap = null;
    actors: Map<number, ActorInMap> = new Map();

    enterMap(myActorData) {
        //加载完成标识-false
        this.mapLoaded = false;
        //记录之前的MapGuider
        let oldMapGuider = MapGuider.ins;
        //创建MapGuider
        let mapGuider = new cc.Node(MapGuider.name).addComponent(MapGuider);
        mapGuider.path = "map/tile/" + myActorData.mapID;
        cc.find("Canvas").addChild(mapGuider.node);
        mapGuider.node.setSiblingIndex(0);
        //监听MapGuider加载完成后继续操作
        MapGuider.ins.node.on(MapGuider.EventType.Loaded, () => {
            //加载完成标识-true
            this.mapLoaded = true;
            //销毁之前的MapGuider
            if (oldMapGuider && cc.isValid(oldMapGuider.node, true)) {
                oldMapGuider.node.destroy();
            }
            //重置相关记录
            this.mapID = myActorData.mapID;
            this.actors.clear();
            //创建我的角色
            let actor = this.addMyActor(myActorData);
            //让地图镜头追踪我的角色
            MapGuider.ins.initCamera(cc.find("Canvas/Main Camera"), actor.node);
            //监听地图点击事件
            MapGuider.ins.node.on(MapGuider.EventType.ClickPoint, (endPos: cc.Vec2) => {
                // //点击除自己外的其它角色，弹出点击中的角色昵称列表
                let actorList: ActorInMap[] = [];
                this.actors.forEach((actorInMap) => {
                    if (actorInMap.intersectPoint(endPos) && actorInMap.syncData.id != this.myActor.syncData.id) {
                        actorList.push(actorInMap);
                    }
                });
                actorList.sort((a, b) => b.node.zIndex - a.node.zIndex);
                GameView.ins.renderRoleClickPanel(actorList.length > 0 ? actorList[0].syncData : null);
                //如果点击的目的地可以到达
                if (MapGuider.ins.isCanReach(endPos.x, endPos.y)) {
                    //添加点击特效
                    this.addTouchMapEffect(endPos, MapGuider.ins.node);
                    //向后台发送移动请求
                    actor.node.x = actor.node.x << 0;
                    actor.node.y = actor.node.y << 0;
                    endPos.x = endPos.x << 0;
                    endPos.y = endPos.y << 0;
                    Player.ins.call("move", [actor.node.x, actor.node.y, endPos.x, endPos.y, actor.face]);
                }
            });    
        });
    }

    syncActorsInMap(mapID, dataMap) {
        if (!this.mapLoaded) return;
        if (this.mapID != mapID) return;
        this.actors.forEach((actor, i) => {
            let data = dataMap[i];
            if (data) {
                actor.pushSyncData(data);
            } else {
                if (i != this.myActor.syncData.id) {
                    this.actors.delete(i);
                    actor.node.destroy();
                }
            } 
        })
        for (let i in dataMap) {
            let id = parseInt(i);
            if (id == this.myActor.syncData.id) continue;
            if (!this.actors.get(id)) {
                this.addActor(dataMap[i]);
            }
        }
    }   

    syncMyActorInMap(data) {
        if (!this.mapLoaded) return;
        if (this.mapID != data.mapID) return;
        this.myActor.pushSyncData(data);
    }

    private addActor(data): ActorInMap {
        let actor = new cc.Node(ActorInMap.name + data.id).addComponent(ActorInMap);
        MapGuider.ins.node.addChild(actor.node);
        actor.initSyncData(data);
        this.actors.set(data.id, actor);
        return actor;
    }

    private addMyActor(data): ActorInMap {
        let actor = this.addActor(data);
        this.myActor = actor;
        return actor;
    }

    private addTouchMapEffect(position: cc.Vec2, parent: cc.Node) {
        let node = new cc.Node("TouchMap");
        node.setPosition(position);
        parent.addChild(node);
        let movie = node.addComponent(Movie);
        Movie.playClips({
            clipNames: ["effect/touchmap"],
            movies: [movie],
            wrapMode: cc.WrapMode.Normal,
            frameRate: 15
        });
        movie.on(Movie.EventType.FINISHED, () => {
            node.destroy();
        });
    }

    private bfs(pos: cc.Vec2) {
        let srcPos = [MapGuider.ins.getRow(pos.y), MapGuider.ins.getColumn(pos.x)];
        let points = [srcPos];
        let keySet = new Set<string>();
        keySet.add(srcPos[0] + "," + srcPos[1]);
        let iii = 0;
        while (points.length > 0) {
            let list = [];
            while (points.length > 0) {
                let point = points.shift();
                for (let i = 0; i < 4; i++) {
                    let r = point[0];
                    let c = point[1];
                    if (i == 0) r += 1;
                    if (i == 1) r -= 1;
                    if (i == 2) c += 1;
                    if (i == 3) c -= 1;
                    let key = r + "," + c;
                    if (keySet.has(key)) continue;
                    let rt = MapGuider.ins.getRectType2(r, c);
                    if (rt == MapRectType.OUT_BOUND || rt == MapRectType.RED) {
                        continue;
                    }
                    list.push([r, c]);
                    keySet.add(key);
                }
            }
            points = list;
            iii++;
            if (iii == 30) break;
        }
        let posList = [];
        keySet.forEach(v => {
            let rc = v.split(",");
            let r = parseInt(rc[0]);
            let c = parseInt(rc[1]);
            posList.push(MapGuider.ins.getPosition(r, c));
        });
        MapGuider.ins.drawPath(posList);
    }
}
