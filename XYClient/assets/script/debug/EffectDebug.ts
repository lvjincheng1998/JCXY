import Movie from "../core/Movie";
import BattleDriver from "../game/BattleDriver";

const {ccclass, property} = cc._decorator;

@ccclass
export default class EffectDebug extends cc.Component {
    @property(cc.Label)
    label: cc.Label = null;

    start () {
        this.node.zIndex = 1000;
        this.initDebugOperation();
        this.showSkillEffect(22216);
        this.scheduleOnce(() => {
            this.effectNode.setPosition(BattleDriver.ins.getStageEffectLeft());
        }, 0.1);
    }

    update() {
        this.label.string = `x:${this.effectNode.x}\ny:${this.effectNode.y}`;
    }

    initDebugOperation() {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, (e: cc.Event.EventKeyboard) => {
            switch (e.keyCode) {
                case cc.macro.KEY.a:
                    this.effectNode.x--;
                    break;
                case cc.macro.KEY.d:
                    this.effectNode.x++;
                    break;
                case cc.macro.KEY.w:
                    this.effectNode.y++;                    
                    break;
                case cc.macro.KEY.s:
                    this.effectNode.y--;
                    break;
                case cc.macro.KEY.q:
                    this.effectNode.zIndex = 0;
                    break;
                case cc.macro.KEY.e:
                    this.effectNode.zIndex = 1000;
                    break;
                case cc.macro.KEY.up:
                    this.effectNode.anchorY += 0.01;
                    break;
                case cc.macro.KEY.down:
                    this.effectNode.anchorY -= 0.01;
                    break;
                case cc.macro.KEY.left:
                    this.effectNode.anchorX -= 0.01;
                    break;
                case cc.macro.KEY.right:
                    this.effectNode.anchorX += 0.01;
                    break;
            }
            console.log(this.effectNode.getAnchorPoint().toString());
        });
    }

    drawAnchorPoint(node: cc.Node, color = cc.Color.RED) {
        let childNode = new cc.Node();
        node.addChild(childNode);
        let graphics = childNode.addComponent(cc.Graphics);
        graphics.fillColor = color;
        graphics.circle(0, 0, 3);
        graphics.fill();
    }

    effectNode: cc.Node = null;

    showSkillEffect(effectID: number) {
        let node = new cc.Node("Effect");
        this.effectNode = node;
        let movie = node.addComponent(Movie);
        node.anchorY = 0.4;
        node.zIndex = this.node.zIndex;
        node.setPosition(this.node.position);
        this.node.parent.addChild(node);
        Movie.playClips({
            clipNames: ["effect/" + effectID],
            movies: [movie],
            wrapMode: cc.WrapMode.Loop,
            frameRate: 15
        });
        this.drawAnchorPoint(node, cc.Color.YELLOW);
        return movie;
    }

    
}
