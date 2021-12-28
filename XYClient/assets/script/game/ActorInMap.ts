import { ActorAction } from "../config/GameDefine";
import MapGuider, { MapRectType } from "../core/MapGuider";
import GameMgr from "../manager/GameMgr";
import MapMgr from "../manager/MapMgr";
import Actor from "./Actor";
import Movie from "../core/Movie";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ActorInMap extends Actor {
    moveSpeed = 240;
    movePath: {x: number, y: number}[] = [];
    banMoveByPath = false;

    update(dt: number) {
        this.updateSyncData();
        this.updateMovePath(dt);
        this.updateOpacity();
        this.updateZIndex();
    }

    private updateMovePath(dt: number) {
        if (this.movePath.length > 0) {
            let nextPosition = MapGuider.nextPosition(this.node.getPosition(), this.movePath, this.moveSpeed, dt);
            let oldFace = this.face;
            this.lookAt(nextPosition);
            if (oldFace != this.face || this.preAction != ActorAction.Run) {
                this.playAction(ActorAction.Run);
            }
            this.node.setPosition(nextPosition);
        } else {
            if (this.syncData && !this.syncData.keepRunningInTeam) {
                let oldFace = this.face;
                this.face = this.syncData.face;
                if (oldFace != this.face || this.preAction != ActorAction.Stand) {
                    this.playAction(ActorAction.Stand);
                }
            }
        }
    }

    private updateOpacity() {
        if (MapGuider.ins.getRectType(this.node.x, this.node.y) == MapRectType.BLUE) {
            this.node.opacity = 155;
        } else {
            this.node.opacity = 255;
        }
    }

    private updateZIndex() {
        if (MapGuider.ins.basePoint) {
            this.node.zIndex = MapGuider.ins.basePoint.y - this.node.y;
        }
    }

    syncData: ActorInMapSyncData;
    syncDataCache: ActorInMapSyncData;
    syncDataCacheCount = 0;
    
    initSyncData(data) {
        this.syncData = data;
        this.actorID = data.actorID;
        this.weaponID = data.weaponID;
        this.node.setPosition(data.position.x, data.position.y);
        this.updateNicknameLabel(data.nickname);
        this.playAction(ActorAction.Stand);
    }

    pushSyncData(data) {
        this.syncDataCache = data;
        this.syncDataCacheCount++;
    }

    private updateSyncData() {
        let data = this.syncDataCache;
        let cacheIsTooLong = this.syncDataCacheCount >= 3;
        if (this.syncDataCacheCount > 0) {
            this.syncDataCache = null;
            this.syncDataCacheCount = 0;
        } else {
            return;
        }
        try {
            if (cacheIsTooLong) {
                this.node.x = data.position.x;
                this.node.y = data.position.y;
            }
            this.moveToDestination(data, cacheIsTooLong);
        } catch (e) {
            console.error(e);
        }
        this.syncData = data;
        this.updateTeamToken();
        this.actorID = data.actorID;
        this.weaponID = data.weaponID;
        if (this.movieNoClip) {
            this.playAction(this.preAction);
        }
    }

    moveToDestination(data, mustFindPath) {
        let destination = data.destination ? data.destination : data.position;
        if (this.node.position.x == destination.x && this.node.position.y == destination.y) {
            if (this.movePath.length > 0) {
                this.movePath = [];
            }
            return;
        }
        if (!mustFindPath) {
            if (this.movePath.length > 0) {
                let endPosition = this.movePath[this.movePath.length - 1];
                if (endPosition.x == destination.x && endPosition.y == destination.y) {
                    return;
                }
            }
        }
        this.movePath = MapGuider.ins.getPath(this.node.getPosition(), cc.v2(destination.x, destination.y));
    }

    teamToken: cc.Node;
    teamTokenID: number;
    updateTeamToken() {
        if (this.syncData.teamMemberIndex != 0) {
            if (this.teamToken && this.teamToken.isValid) {
                this.teamToken.destroy();
                this.teamToken = null;
                this.teamTokenID = 0;
            }
            return;
        }
        let tokenID = this.syncData.teamID == MapMgr.ins().myActor.syncData.teamID ? 1 : 2;
        if (tokenID == this.teamTokenID) return;
        let oldTeamToken = this.teamToken;
        let node = new cc.Node("TeamToken");
        node.y = 170;
        this.node.addChild(node);
        let movie = node.addComponent(Movie);
        Movie.playClips({
            clipNames: [tokenID == 1 ? "effect/zudui" : "effect/zudui2"],
            movies: [movie],
            wrapMode: cc.WrapMode.Loop,
            frameRate: 15,
            onStart: () => {
                if (oldTeamToken && oldTeamToken.isValid) oldTeamToken.destroy();
            }
        });
        this.node.on(Actor.CustomEvent.ScaleX, (scaleX: number) => {
            node.scaleX = (scaleX < 0 ? -1 : 1) * Math.abs(node.scaleX);
        }, node);
        this.teamToken = node;
        this.teamTokenID = tokenID;
    }
}
declare global {
    interface ActorInMapSyncData {
        id: number;
        isRole: boolean;
        isNpc: boolean;
        roleID: number;
        actorID: number;
        weaponID: number;
        nickname: string;
        level: number;
        position: {x: number, y: number};
        destination: {x: number, y: number};
        keepRunningInTeam: boolean;
        face: number;
        teamID: number;
        teamMemberIndex: number;
    }
}
