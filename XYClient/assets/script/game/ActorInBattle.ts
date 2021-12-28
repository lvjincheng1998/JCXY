import GameConfig from "../config/GameConfig";
import { ActorAction, FourFace } from "../config/GameDefine";
import BattleDriver from "../game/BattleDriver";
import Actor from "./Actor";
import Movie from "../core/Movie";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ActorInBattle extends cc.Component {

    onLoad() {
        this.actorComp.fixedWidth = 360;
        this.actorComp.fixedHeight = 360;
        this.actorComp.createEffectMovie();
        // this.actorComp.drawAnchorPoint(this.node);
    }

    start() {
        this.addHpBar();
    }

    update() {
        this.node.zIndex = cc.winSize.height - this.node.y;
    }

    hpBar: cc.ProgressBar = null;
    addHpBar() {
        cc.resources.load("prefab/HpBar", cc.Prefab, (error, asset: cc.Prefab) => {
            if (error) return;
            let hpBarNode = cc.instantiate(asset) as cc.Node;
            let hpBarHeight = GameConfig.HpBarHeight[this.actorComp.actorID];
            hpBarNode.y = typeof hpBarHeight == "number" ? hpBarHeight : 124
            this.node.addChild(hpBarNode);
            this.hpBar = hpBarNode.getComponent(cc.ProgressBar);
            this.hpBar.progress = this.state.hp / this.state.hpMax;
            this.node.on(Actor.CustomEvent.ScaleX, (scaleX: number) => {
                hpBarNode.scaleX = (scaleX < 0 ? -1 : 1) * Math.abs(hpBarNode.scaleX);
            });
        });
    }

    state = {
        hp: 1000,
        hpMax: 1000
    }
    setHpByTween(hp: number) {
        if (!this.hpBar) return;
        this.state.hp = hp;
        cc.tween(this.hpBar.getComponent(cc.ProgressBar)).to(0.1, {progress: this.state.hp / this.state.hpMax}).start();
    }

    /**战斗ID */
    id = 0;
    /**队伍ID */
    teamID = 0;
    /**是否行动中 */
    private _doing = new Set();
    get doing() {
        return this._doing.size > 0;
    }
    /**移动速度 */
    moveSpeed = 750;
    /**初始朝向 */
    forward = cc.Vec2.ZERO;
    /**初始位置 */
    position = cc.Vec2.ZERO;
    /**初始面向 */
    face = FourFace.LeftUp;
    /**驱动管理器 */
    driver: BattleDriver = null;

    runTo(target: ActorInBattle) {
        let doingLock = {};
        this._doing.add(doingLock);
        let position = this.getPositionForAttack(target);
        let costTime = this.node.getPosition().sub(position).mag() / this.moveSpeed;
        this.actorComp.lookAt(position);
        this.actorComp.playAction(ActorAction.Run);
        cc.tween(this.node).sequence(
            cc.moveTo(costTime, position),
            cc.callFunc(() => {
                this._doing.delete(doingLock);
                this.actorComp.lookAt(target.node);
                this.actorComp.playAction(ActorAction.Stand);
            })
        ).start();
    }

    runBack() {
        let doingLock = {};
        this._doing.add(doingLock);
        let position = this.position;
        let costTime = this.node.getPosition().sub(position).mag() / this.moveSpeed;
        this.actorComp.lookAt(this.position);
        this.actorComp.playAction(ActorAction.Run);
        cc.tween(this.node).sequence(
            cc.moveTo(costTime, position),
            cc.callFunc(() => {
                this._doing.delete(doingLock);
                this.lockAtBattleForward();
                this.actorComp.playAction(ActorAction.Stand);  
            })
        ).start();
    }

    attack() {
        let doingLock = {};
        this._doing.add(doingLock);
        this.actorComp.playAction(ActorAction.Attack);
        this.node.once(Actor.CustomEvent.ActionFinish, () => {
            this._doing.delete(doingLock);
        });
    }

    magic() {
        let doingLock = {};
        this._doing.add(doingLock);
        this.actorComp.playAction(ActorAction.Magic);
        this.node.once(Actor.CustomEvent.ActionFinish, () => {
            this._doing.delete(doingLock);
        });
    }

    hit() {
        let doingLock = {};
        this._doing.add(doingLock);
        this.actorComp.playAction(ActorAction.Hit);
        this.node.once(Actor.CustomEvent.ActionFinish, () => {
            this._doing.delete(doingLock);
        });
        let path = "audio/挨打-通用";
        if (this.actorComp.actorID < 5000) {
            path = "audio/挨打-" + (this.actorComp.actorID % 2 == 1 ? "男" : "女");
        }
        cc.resources.load(path, cc.AudioClip, (error, assets: cc.AudioClip) => {
            if (error) return;
            cc.audioEngine.playEffect(assets, false);
        });
    }

    die() {
        let doingLock = {};
        this._doing.add(doingLock);
        this.actorComp.playAction(ActorAction.Die);
        this.node.once(Actor.CustomEvent.ActionFinish, () => {
            this._doing.delete(doingLock);
        });
        if (this.actorComp.actorID < 5000) {
            let path = "audio/死亡-" + (this.actorComp.actorID % 2 == 1 ? "男" : "女");
            cc.resources.load(path, cc.AudioClip, (error, assets: cc.AudioClip) => {
                if (error) return;
                cc.audioEngine.playEffect(assets, false);
            });
        }
    }

    lockAtBattleForward() {
        this.actorComp.lookAt(this.node.getPosition().add(this.forward));
    }

    getPositionForAttack(target: ActorInBattle) {
        return target.node.getPosition().addSelf(target.forward.mul(95)).addSelf(cc.v2(0, -1));
    }

    bodyValueNode: cc.Node = null;
    showValueOnBody(value: string | number, type: number) {
        let fontColor: cc.Color = cc.Color.WHITE;
        switch(type) {
            case 0:
                fontColor = cc.color(255, 0, 0); 
                break;
            case 1:
                fontColor = cc.color(255, 0, 255); 
                break;
            case 2:
                fontColor = cc.color(0, 255, 0); 
                break;
            case 3:
                if (["蛟龙出海", "九龙冰封"].includes(value as string)) {
                    fontColor = cc.color(0, 155, 255);
                } else if (value == "血海深仇") {
                    fontColor = cc.color(215, 55, 0);   
                } else if (value == "横扫千军") {
                    fontColor = cc.color(55, 188, 188);
                }
                break;
        }

        cc.resources.load("font/华文行楷字体", cc.Font, (err, font: cc.Font) => {
            if (err) return;

            let layoutNode = new cc.Node();
            layoutNode.zIndex = 1000;
            let layout = layoutNode.addComponent(cc.Layout);
            layout.type = cc.Layout.Type.HORIZONTAL;
            layout.resizeMode = cc.Layout.ResizeMode.CONTAINER;
            this.node.parent.addChild(layoutNode);

            if (type == 3) {
                layout.spacingX = 3;
                layoutNode.setPosition(this.node.getPosition());
                layoutNode.y += this.hpBar.node.y + 15;
                if (this.hpBar) {
                    layoutNode.y += 10;
                }
            } else {
                layout.spacingX = -6;
                if (this.bodyValueNode && this.bodyValueNode.isValid) {
                    layoutNode.setPosition(this.bodyValueNode.getPosition());
                    layoutNode.y += 30;
                } else {
                    layoutNode.setPosition(this.node.getPosition());
                    layoutNode.y += 60;    
                }
            }
            
            if (type == 0 || type == 1 || type == 2) {
                this.bodyValueNode = layoutNode;
            }

            for (let str of value.toString()) {
                let labelNode = new cc.Node();
                labelNode.color = fontColor;
                let label = labelNode.addComponent(cc.Label);
                label.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
                label.fontSize = label.lineHeight = labelNode.width = type == 3 ? 24 : 30;
                label.font = font;
                label.string = str;
                label.verticalAlign = cc.Label.VerticalAlign.CENTER
                label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
                let labelOutline = labelNode.addComponent(cc.LabelOutline);
                labelOutline.width = 1;
                labelOutline.color = cc.Color.WHITE;
                layoutNode.addChild(labelNode);
            }
    
            layoutNode.children.forEach((node, index) => {
                cc.tween(node).sequence(
                    cc.delayTime(index * 0.1),
                    cc.moveBy(0.2, cc.v2(0, 30)).easing(cc.easeIn(3.0)),
                    cc.moveBy(0.2, cc.v2(0, -30)).easing(cc.easeOut(3.0)),
                    cc.delayTime(0.2),
                    cc.callFunc(() => {
                        if (index == layoutNode.childrenCount - 1) {
                            cc.tween(layoutNode).sequence(
                                cc.fadeOut(0.1),
                                cc.destroySelf()
                            ).start();
                        }
                    })
                ).start();
            });
        });
    }

    showSkillEffect(effectID: number | string) {
        let doingLock = {};
        this._doing.add(doingLock);
        let node = new cc.Node("Effect");
        let movie = node.addComponent(Movie);
        node.anchorY = 0.4;
        node.zIndex = this.node.zIndex;
        let adaptStage = () => {
            if (this.face == FourFace.RightDown) {
                node.setPosition(this.driver.getStageEffectLeft());
            } else if (this.face == FourFace.LeftUp) {
                node.setPosition(this.driver.getStageEffectRight());
            }
        };
        if (effectID == 22216) {
            node.zIndex = 1000;
            node.anchorY = 0.26;
            adaptStage();
            this.node.parent.addChild(node);
        }
        else if (effectID == 24230) {
            node.zIndex = 1000;
            node.anchorY = 0.36;
            adaptStage();
            this.node.parent.addChild(node);
        }
        else if (effectID == 22115) {
            this.node.addChild(node);
        }
        else if (effectID == 2700) {
            this.node.addChild(node);
        }
        Movie.playClips({
            clipNames: ["effect/" + effectID],
            movies: [movie],
            wrapMode: cc.WrapMode.Normal,
            frameRate: 15,
            clipHandler: (clip) => {
                Movie.addFrameEvent(clip, [GameConfig.EffectKeyFrame[effectID]]);
                return clip;
            }
        });
        movie.node.on(Movie.CustomEvent.FrameEvent, () => {
            movie.node.emit(Actor.CustomEvent.ActionFrameEvent);
        });
        movie.once(cc.Animation.EventType.FINISHED, () => {
            node.destroy();
            this._doing.delete(doingLock);
            movie.node.emit(Actor.CustomEvent.ActionFrameEvent);
        });
        cc.resources.load("audio/effect/" + effectID, cc.AudioClip, (error, assets: cc.AudioClip) => {
            if (error) return;
            cc.audioEngine.playEffect(assets, false);
        });
        // this.actorComp.drawAnchorPoint(node, cc.Color.YELLOW);
        return movie;
    }

    quit() {
        let doingLock = {};
        this._doing.add(doingLock);
        cc.tween(this.node).then(cc.fadeOut(0.5)).then(cc.callFunc(() => {
            this.node.destroy();
            this._doing.delete(doingLock);
            this.driver.actors.splice(this.driver.actors.indexOf(this), 1);
        })).start();
    }

    // ------ GetterAndSetter ------
    
    _actorComp: Actor = null;
    get actorComp() {
        if (!this._actorComp) {
            this._actorComp = this.getComponent(Actor);
        }
        return this._actorComp;
    }
}
