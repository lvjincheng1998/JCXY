import { FourFace, ActorAction } from "../config/GameDefine";
import BattleView from "../view/BattleView";
import Actor from "./Actor";
import ActorInBattle from "./ActorInBattle";
import Player from "./Player";

const {ccclass, property} = cc._decorator;

@ccclass
export default class BattleDriver extends cc.Component {
    actors: ActorInBattle[] = [];
    orders: any[] = [];
    inited: boolean = false;

    static ins: BattleDriver;
    
    onLoad() {
        BattleDriver.ins = this;
    }

    onDestroy() {
        if (BattleDriver.ins == this) BattleDriver.ins = null; 
    }

    update() {
        this.checkAndExecuteOrders();
    }

    init(actorDatas: any[], playerActorIDs: Record<string, {role: number, pet: number}>, isPVP: boolean) {
        let selfLeaderPosition = cc.v2(240, -170);
        let otherLeaderPosition = cc.v2(-240, 30);
        let selfForward = cc.v2(-1, Math.tan(30 / 180 * Math.PI)).normalizeSelf();
        let otherForward = cc.v2(1, -Math.tan(30 / 180 * Math.PI)).normalizeSelf();

        let roleActorID =  playerActorIDs[Player.ins.id].role;

        //确认自己在哪个队伍
        let selfTeamID = actorDatas.find(actorData => actorData.id == roleActorID).teamID;
        
        actorDatas.forEach(actorData => {
            let isSelfSide = selfTeamID == actorData.teamID;
            this.createMember({
                data: actorData,
                foward: isSelfSide ? selfForward : otherForward,
                leaderPosition: isSelfSide ? selfLeaderPosition : otherLeaderPosition,
            });
        });

        this.inited = true;
        
        cc.resources.load("audio/bgm/" + (isPVP ? "梦幻西游-比武" : "梦幻西游-战斗"), cc.AudioClip, (error, assets: cc.AudioClip) => {
            if (error) return;
            cc.audioEngine.playMusic(assets, true);
        });
    }

    createMember(args: {
        data: any,
        foward: cc.Vec2,
        leaderPosition: cc.Vec2
    }) {
        let actorID = args.data.actorID;
        let weaponID = args.data.weaponID;
        let nickname = args.data.nickname;
        let id = args.data.id;
        let teamID = args.data.teamID;
        let teamMemberIndex = args.data.teamMemberIndex;
        let state = args.data.state;
        
        let offsetMul = teamMemberIndex;
        if (offsetMul >= 5) {
            offsetMul -= 5;
        }
        if (offsetMul > 0) {
            if (offsetMul % 2 == 0) {
                offsetMul = -offsetMul / 2;
            } else {
                offsetMul = Math.ceil(offsetMul / 2);
            }
        }
        let actorInBattle = new cc.Node().addComponent(Actor).addComponent(ActorInBattle);
        this.node.addChild(actorInBattle.node);
        actorInBattle.actorComp.actorID = actorID;
        actorInBattle.actorComp.weaponID = weaponID;
        actorInBattle.actorComp.updateNicknameLabel(nickname);
        actorInBattle.id = id;
        actorInBattle.teamID = teamID;
        actorInBattle.state = state;
        actorInBattle.forward = args.foward;
        actorInBattle.face = args.foward.x > 0 ? FourFace.RightDown : FourFace.LeftUp;
        let position = args.leaderPosition.add(
            cc.v2(1, Math.tan(30 / 180 * Math.PI))
            .mulSelf(75 * offsetMul)
        );
        if (teamMemberIndex >= 5) {
            position.addSelf(args.foward.mul(95));
        }
        actorInBattle.position = position;
        actorInBattle.node.setPosition(position);
        actorInBattle.lockAtBattleForward();
        actorInBattle.actorComp.playAction(ActorAction.Stand);
        this.actors.push(actorInBattle);
        actorInBattle.driver = this;
    }

    checkAndExecuteOrders() {
        if (!this.inited) return;
        let hasDoing = this.actors.find(valule => valule.doing) ? true : false;
        if (hasDoing) return;
        if (this.orders.length == 0) return;
        let order = this.orders.shift();
        this.excuteOrder(order);
    }

    excuteOrder(order) {
        console.log(order);
        let self: ActorInBattle = null;
        let listener: cc.Node = null;
        if (typeof order.params.selfID == "number") {
            self = this.actors.find(value => value.id == order.params["selfID"]);
            listener = self.node;
        }
        if (order.name == "runTo") {
            let target = this.actors.find(value => value.id == order.params["targetID"]);
            self.runTo(target);
        } else if (order.name == "runBack") {
            self.runBack();
        } else if (order.name == "attack") {
            self.attack();
        } else if (order.name == "magic") {
            self.magic();
        } else if (order.name == "runback") {
            self.runBack();
        } else if (order.name == "die") {
            self.die();
        } else if (order.name == "hit") {
            self.hit();
        } else if (order.name == "updateState") {
            for (let key in order.params) {
                let val = order.params[key];
                if (key == "hp") self.setHpByTween(val);
            }
        } else if (order.name == "showValueOnBody") {
            self.showValueOnBody(order.params.value, order.params.type);
        } else if (order.name == "showSkillEffect") {
            listener = self.showSkillEffect(order.params.value).node;
        } else if (order.name == "quit") {
            self.quit();
        } else if (order.name == "over") {
            BattleView.ins.node.destroy();
        } else if (order.name == "updateRoundCount") {
            BattleView.ins.updateRoundCount(order.params.value);
        } else if (order.name == "updateWaitTime") {
            BattleView.ins.updateWaitTime(order.params.value);
        } else if (order.name == "startWaitOperate") {
            BattleView.ins.startWaitOperate();
        } else if (order.name == "endWaitOperate") {
            BattleView.ins.endWaitOperate();
        } else if (order.name == "nextRound") {
            Player.ins.call("nextRound", [order.params.value]);
        }

        if (order.onStart instanceof Array) {
            for (let orderID of order.onStart) {
                for (let i = this.orders.length - 1; i >= 0; i--) {
                    let nextOrder = this.orders[i];
                    if (nextOrder.id == orderID) {
                        this.orders.splice(i, 1);
                        this.scheduleOnce(() => {
                            this.excuteOrder(nextOrder);
                        });
                        break;
                    }
                }
            }
        }

        if (order.onFinish instanceof Array) {
            for (let orderID of order.onFinish) {
                for (let i = this.orders.length - 1; i >= 0; i--) {
                    let nextOrder = this.orders[i];
                    if (nextOrder.id == orderID) {
                        this.orders.splice(i, 1);
                        listener.once(Actor.CustomEvent.ActionFinish, () => {
                            this.excuteOrder(nextOrder);
                        });
                        break;
                    }
                }
            }
        }

        if (order.onFrameEvent instanceof Array) {
            for (let orderID of order.onFrameEvent) {
                for (let i = this.orders.length - 1; i >= 0; i--) {
                    let nextOrder = this.orders[i];
                    if (nextOrder.id == orderID) {
                        this.orders.splice(i, 1);
                        listener.once(Actor.CustomEvent.ActionFrameEvent, () => {
                            this.excuteOrder(nextOrder);
                        });
                        break;
                    }
                }
            }
        }
    }

    initDebugOperation() {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, (e: cc.Event.EventKeyboard) => {
            switch (e.keyCode) {
                case cc.macro.KEY.a:
                    for (let actor of this.actors) {
                        let c = 0;
                        for (let i in ActorAction) {
                            this.scheduleOnce(() => {
                                actor.actorComp.playAction(ActorAction[i]);
                            }, c * 1.5);
                            c++;
                        }
                    }
                    break;
                case cc.macro.KEY.s:
                    let ws = [1000, 10001, 1002, 1003];
                    for (let actor of this.actors) {
                        let index = ws.indexOf(actor.actorComp.weaponID);
                        if (index == ws.length - 1) {
                            index = 0;
                        } else {
                            index++;
                        }
                        actor.actorComp.weaponID = ws[index];
                        actor.actorComp.playAction(ActorAction.Stand);
                    }
                    break;
            }
        });
    }

    getStageEffectLeft() {
        let leaderPosition = cc.v2(-240, 30);
        let forward = cc.v2(1, -Math.tan(30 / 180 * Math.PI)).normalizeSelf();
        return leaderPosition.addSelf(forward.mulSelf(47.5));
    }

    getStageEffectRight() {
        let leaderPosition = cc.v2(240, -170);
        let forward = cc.v2(-1, Math.tan(30 / 180 * Math.PI)).normalizeSelf();
        return leaderPosition.addSelf(forward.mulSelf(47.5));
    }
}
