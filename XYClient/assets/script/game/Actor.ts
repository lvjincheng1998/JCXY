import GameConfig from "../config/GameConfig";
import { ActorAction, FourFace } from "../config/GameDefine";
import Movie from "../core/Movie";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Actor extends cc.Component {
    /**固定宽度 */
    fixedWidth = 450;
    /**固定高度 */
    fixedHeight = 450;

    /**动画帧率 */
    frameRate: number = 15;
    /**身体动画 */
    bodyMovie: Movie;
    /**特效动画 */
    efMovie: Movie;
    /**武器动画 */
    wpMovie: Movie;

    /**预动作（已发出播放请求，但处于加载中） */
    preAction: ActorAction = ActorAction.Stand;
    /**动作（正在播放） */
    action: ActorAction = ActorAction.Stand; 
    /**面向 */
    face: FourFace = FourFace.RightDown;
    
    /**角色资源ID */
    _actorID;
    set actorID(v) {
        let isDif = v != this._actorID;
        this._actorID = v;
        if (isDif) {
            this.createBodyMovie();
            this.createWeaponMovie();
        }
    } 
    get actorID() {
        return this._actorID;
    }
    /**武器资源ID */
    _weaponID;
    set weaponID(v) {
        let isDif = v != this._weaponID;
        this._weaponID = v;
        if (isDif) {
            this.createWeaponMovie();
        }
    } 
    get weaponID() {
        return this._weaponID;
    }
    /**资源是否发生变化 */
    _bodyMovieNoClip: boolean = false;
    _weaponMovieNoClip: boolean = false;
    get movieNoClip() {
        return this._bodyMovieNoClip || this._weaponMovieNoClip;
    }
    set movieNoClip(v) {
        this._bodyMovieNoClip = v;
        this._weaponMovieNoClip = v;
    }

    /**自定义事件 */
    static CustomEvent = {
        ActionFinish: "ActionFinish",
        ActionFrameEvent: "ActionFrameEvent",
        ScaleX: "ScaleX"
    }

    createBodyMovie() {
        if (this.bodyMovie) {
            this.bodyMovie.node.destroy();
            this.bodyMovie = null;
        }
        if (!this.actorID) return;
        this._bodyMovieNoClip = true;
        let bodyNode = new cc.Node("Body");
        bodyNode.anchorY = GameConfig.ResAnchor[this.actorID].anchorY;
        this.bodyMovie = bodyNode.addComponent(Movie);
        this.node.addChild(bodyNode);
        this.bodyMovie.on(cc.Animation.EventType.PLAY, () => {
            this.bodyMovie.node.scaleX = this.fixedWidth / this.bodyMovie.node.width;
            this.bodyMovie.node.scaleY = this.fixedHeight / this.bodyMovie.node.height;
        });
        this.bodyMovie.on(cc.Animation.EventType.FINISHED, () => {
            if (this.action == ActorAction.Attack) {
                this.on_attack_finish();
            } else if (this.action == ActorAction.Magic) {
                this.on_magic_finish();
            } else if (this.action == ActorAction.Die) {
                this.on_die_finish();
            }
        });
        this.bodyMovie.node.on(Movie.CustomEvent.FrameEvent, this.on_action_frame_event, this);
    }

    /**用于播放攻击和法术动作的附带特效（是人物特效，非技能特效） */
    createEffectMovie() {
        let efNode = new cc.Node("EF");
        efNode.anchorY = 0.4;
        efNode.zIndex = 1;
        this.efMovie = efNode.addComponent(Movie);
        this.node.addChild(efNode);
        this.efMovie.on(cc.Animation.EventType.PLAY, () => {
            this.efMovie.node.scaleX = this.fixedWidth / this.efMovie.node.width;
            this.efMovie.node.scaleY = this.fixedHeight / this.efMovie.node.height;
        });
        this.efMovie.on(cc.Animation.EventType.FINISHED, () => {
            this.efMovie.currentClip = null;
            this.efMovie.getComponent(cc.Sprite).spriteFrame = null;
        });
    }

    createWeaponMovie() {
        if (this.wpMovie) {
            this.wpMovie.node.destroy();
            this.wpMovie = null;
        }
        if (!this.weaponID) return;
        this._weaponMovieNoClip = true;
        let wpNode = new cc.Node("WP");
        wpNode.anchorY = GameConfig.ResAnchor[this.actorID].anchorY;
        this.wpMovie = wpNode.addComponent(Movie);
        this.bodyMovie.node.addChild(wpNode);
        this.wpMovie.on(cc.Animation.EventType.PLAY, () => {
            this.wpMovie.node.scaleX = this.wpMovie.node.parent.width / this.wpMovie.node.width;
            this.wpMovie.node.scaleY = this.wpMovie.node.parent.height / this.wpMovie.node.height;
        });
        this.wpMovie.on(cc.Animation.EventType.FINISHED, () => {
            this.wpMovie.currentClip = null;
            this.wpMovie.getComponent(cc.Sprite).spriteFrame = null;
        });
    }

    playAction(action: ActorAction) {
        this.movieNoClip = false;
        this.preAction = action;
        
        let wrapMode = [
            ActorAction.Stand, 
            ActorAction.Run, 
            ActorAction.Hit
        ].includes(action) ? cc.WrapMode.Loop : cc.WrapMode.Normal;

        let face = this.face;
        let faceNum = 1;
        if (face == FourFace.LeftUp || face == FourFace.RightUp) {
            faceNum = 3;
        }

        let clipNames = [];
        let movies = []
        if (this.bodyMovie && this.bodyMovie.isValid) {
            let clipName = `actor/${this.actorID}/${action}_${faceNum}`;
            clipNames.push(clipName);
            movies.push(this.bodyMovie);
        }
        if (this.efMovie && this.efMovie.isValid) {
            if (action == ActorAction.Attack || action == ActorAction.Magic) {
                let clipName = `actor/${this.actorID}/${action}_${faceNum}_ef`;
                clipNames.push(clipName);
                movies.push(this.efMovie);
            }
        }
        if (this.wpMovie && this.wpMovie.isValid) {
            let clipName = `weapon/${this.actorID}/${this.weaponID}_${action}_${faceNum}_wp`;
            clipNames.push(clipName)
            movies.push(this.wpMovie);
        }
        Movie.playClips({
            clipNames: clipNames,
            movies: movies,
            wrapMode: wrapMode,
            frameRate: this.frameRate,
            context: this,
            framesHandler: (frames, movie) => {
                if (movie != this.efMovie) {
                    return frames;
                }
                //通过添加空白帧，解决ef帧数和人物动作不协调的问题
                let texture = new cc.Texture2D();
                texture.width = 2048;
                texture.height = 2048;
                texture.loaded = true;
                let frame = new cc.SpriteFrame(
                    texture, 
                    undefined, 
                    undefined,
                    undefined,
                    frames[0].getOriginalSize()
                );
                let emptyFrames = [];
                let frameCount = this.bodyMovie.getFrameCount();
                for (let i = 0; i < frameCount - frames.length; i++) {
                    emptyFrames.push(frame);
                }
                return emptyFrames.concat(frames);
            },
            clipHandler: (clip, movie) => {
                if (movie == this.bodyMovie) {
                    if (action == ActorAction.Attack || action == ActorAction.Magic) {
                        Movie.addFrameEvent(clip, [GameConfig.ActionKeyFrame[this.actorID][action]]);
                    }
                }
                return clip;
            },
            onStart: () => {
                this.action = action;
                cc.Tween.stopAllByTarget(this.bodyMovie.node);
                this.bodyMovie.node.setPosition(cc.Vec2.ZERO);
                if (action == ActorAction.Hit) {
                    let vec = cc.v2(12, -6);
                    if (face == FourFace.RightDown || face == FourFace.LeftDown) {
                        vec = cc.v2(-12, 6);
                    }
                    cc.tween(this.bodyMovie.node).sequence(
                        cc.moveTo(0.45, vec).easing(cc.easeOut(3.0)),
                        cc.moveTo(0.15, cc.Vec2.ZERO).easing(cc.easeIn(3.0)),
                        cc.callFunc(this.on_hit_finish, this)
                    ).start();
                }
                if (face == FourFace.LeftDown || face == FourFace.RightUp) {
                    this.node.scaleX = -Math.abs(this.node.scaleX);
                } else {
                    this.node.scaleX = Math.abs(this.node.scaleX);
                }
                this.node.emit(Actor.CustomEvent.ScaleX, this.node.scaleX);
            }
        });
    }

    on_attack_finish() {
        this.playAction(ActorAction.Stand);
        this.node.emit(Actor.CustomEvent.ActionFinish, ActorAction.Attack);
    }   

    on_magic_finish() {
        this.playAction(ActorAction.Stand);
        this.node.emit(Actor.CustomEvent.ActionFinish, ActorAction.Magic);
    } 

    on_hit_finish() {
        this.playAction(ActorAction.Stand);
        this.node.emit(Actor.CustomEvent.ActionFinish, ActorAction.Hit);
    } 

    on_die_finish() {
        this.node.emit(Actor.CustomEvent.ActionFinish, ActorAction.Die);
    } 

    on_action_frame_event(frame: number) {
        this.node.emit(Actor.CustomEvent.ActionFrameEvent, this.action, frame);
    }

    lookAt(target: cc.Node | cc.Vec2 | cc.Vec3) {
        let vector: cc.Vec2;
        if (target instanceof cc.Node) {
            vector = target.getPosition().subSelf(this.node.getPosition());
        } else if (target instanceof cc.Vec2) {
            vector = target.sub(this.node.getPosition());
        } else if (target instanceof cc.Vec3) {
            vector = cc.v2(target.x, target.y).subSelf(this.node.getPosition());
        }
        if (vector.mag() == 0) {
            return;
        }
        this.face = this.getFaceByVector(vector);
    }

    getFaceByVector(v: cc.Vec2): FourFace {
        let face = this.face;
        if (v.mag() > 0) {
            if (v.x >= 0 && v.y > 0) face = FourFace.RightUp;
            if (v.x >= 0 && v.y <= 0) face = FourFace.RightDown;
            if (v.x < 0 && v.y > 0) face = FourFace.LeftUp;
            if (v.x < 0 && v.y <= 0) face = FourFace.LeftDown;
        }
        return face;
    }

    drawAnchorPoint(node: cc.Node, color = cc.Color.RED) {
        let childNode = new cc.Node();
        node.addChild(childNode);
        let graphics = childNode.addComponent(cc.Graphics);
        graphics.fillColor = color;
        graphics.circle(0, 0, 3);
        graphics.fill();
    }

    nicknameLabel: cc.Label = null;
    updateNicknameLabel(nickname: string) {
        if (!this.nicknameLabel) {
            let node = new cc.Node();
            node.anchorY = 1;
            node.color = cc.Color.GREEN;
            this.nicknameLabel = node.addComponent(cc.Label);
            this.nicknameLabel.fontSize = 22;
            this.node.addChild(node);
            let outline = node.addComponent(cc.LabelOutline);
            outline.color = cc.Color.BLACK;
            outline.width = 0.6;
            node.scaleX = this.fixedWidth / 450;
            node.scaleY = this.fixedHeight / 450;
            this.node.on(Actor.CustomEvent.ScaleX, (scaleX: number) => {
                node.scaleX = scaleX * Math.abs(node.scaleX);
            });
        }
        if (nickname != this.nicknameLabel.string) {
            this.nicknameLabel.string = nickname;
        }
    }    

    intersectPoint(point: cc.Vec2) {
        let checkWidth = 80;
        let checkHeight = 150;
        let minX = this.node.x - checkWidth / 2;
        let minY = this.node.y; 
        let maxX = this.node.x + checkWidth / 2;
        let maxY = this.node.y + checkHeight;
        return point.x > minX && point.y > minY && point.x < maxX && point.y < maxY;
    }
}