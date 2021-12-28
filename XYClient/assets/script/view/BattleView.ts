import ViewModel from "../core/ViewModel";
import ActorInBattle from "../game/ActorInBattle";
import BattleDriver from "../game/BattleDriver";
import Player from "../game/Player";
import BattleMgr from "../manager/BattleMgr";
import GameView from "./GameView";
import RightTopView from "./RightTopView";


const {ccclass, property} = cc._decorator;

@ccclass
export default class BattleView extends ViewModel {
    @property(cc.Label)
    roundCountLabel: cc.Label = null;
    @property(cc.Label)
    waitTimeLabel: cc.Label = null;
    @property(cc.Node)
    btnsNode: cc.Node = null;
    @property(cc.Node)
    itemPanelNode: cc.Node = null;

    roundCount: number;
    operateWaiting: boolean;
    waitOperateStep: number;
    
    operateType: number;
    operateItemID: number;
    operateTargetID: number;

    static ins: BattleView;

    onLoad() {
        super.onLoad();

        BattleView.ins = this;

        this.waitTimeLabel.node.active = false;
        this.itemPanelNode.active = false;
        this.itemPanelNode.children[0].active = false;
        this.initListeners();
        this.hideOptionBtns();
        this.refreshAutoBattle();
        if (GameView.ins) GameView.ins.node.active = false;
        if (RightTopView.ins) RightTopView.ins.node.active = false;
    }

    onDestroy() {
        if (BattleView.ins == this) BattleView.ins = null;
        if (GameView.ins) GameView.ins.node.active = true;
        if (RightTopView.ins) RightTopView.ins.node.active = true;
    }

    initListeners() {
        this.btnsNode.getChildByName("Return").on(cc.Node.EventType.TOUCH_END, () => {
            this.waitOperateForAny();
        });
        this.btnsNode.getChildByName("NoAuto").on(cc.Node.EventType.TOUCH_END, () => {
            Player.ins.call("setAutoBattle", [false]);
        });
        this.btnsNode.getChildByName("DoAuto").on(cc.Node.EventType.TOUCH_END, () => {
            Player.ins.call("setAutoBattle", [true]);
        });
        //攻击按钮监听
        this.btnsNode.getChildByName("ListH").children[0].on(cc.Node.EventType.TOUCH_END, () => {
            this.operateType = 1;
            this.operateItemID = 0;
            this.enterTargetSelecting();
        });
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTargetSelecting, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTargetSelecting, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTargetSelected, this);
    }

    private enterTargetSelecting() {
        this.targetSelecting = true;
        this.itemPanelNode.active = false;
        this.hideOptionBtns();
        this.activeBtnReturn();
    }

    /**目标选择中 */
    private _targetSelecting: boolean = false;
    private set targetSelecting(v) {
        this._targetSelecting = v;
        this.clearActorSelectedRecord();
    }
    private get targetSelecting() {
        return this._targetSelecting;
    }
    /**当前选中的演员 */
    private actorSelected: ActorInBattle = null;
    /**演员中心点到触点的距离 */
    private actorDistance: number = null;
    /**演员的相对中心点 */
    private actorCenterPoint: cc.Vec2 = cc.v2(0, 60);
    
    private onTargetSelecting(e: cc.Event.EventTouch) {
        if (!this.targetSelecting) return;
        this.clearActorSelectedRecord();
        let touchPoint = this.node.convertToNodeSpaceAR(e.getLocation());
        BattleDriver.ins.actors.forEach(actor => {
            let actorCenterPoint = actor.node.getPosition().addSelf(this.actorCenterPoint);
            let distance = actorCenterPoint.subSelf(touchPoint).mag();
            if (distance > 60) return;
            if (this.actorDistance == null || distance < this.actorDistance) {
                this.actorDistance = distance;
                this.actorSelected = actor;
            }
        });
        if (this.actorSelected == null) return;
        this.actorSelected.actorComp.bodyMovie.node.color = cc.Color.YELLOW;
    }

    private onTargetSelected() {
        if (!this.targetSelecting) return;
        if (this.actorSelected == null) return;
        this.operateTargetID = this.actorSelected.id;
        this.clearActorSelectedRecord();
        this.submitOperate();
    }

    private clearActorSelectedRecord() {
        if (this.actorSelected != null) {
            try {
                this.actorSelected.actorComp.bodyMovie.node.color = cc.Color.WHITE;
            } catch (e) {}
        }
        this.actorSelected = null;
        this.actorDistance = null;
    }

    submitOperate() {
        Player.ins.call("submitOperate", [
            this.roundCount, this.waitOperateStep, this.operateType, this.operateItemID, this.operateTargetID
        ]);
    }

    updateRoundCount(num: number) {
        this.roundCount = num;
        this.roundCountLabel.string = `第 ${num} 回 合`;
    }

    updateWaitTime(time: number) {
        this.waitTimeLabel.string = time.toString();
    }

    startWaitOperate() {
        this.operateWaiting = true;
        this.waitTimeLabel.node.active = true;
        this.waitOperateForRole();
    }

    waitOperateForRole() {
        if (!this.operateWaiting) return;
        this.waitOperateStep = 1;
        if (BattleMgr.ins().autoBattle) return;
        this.targetSelecting = false;
        this.itemPanelNode.active = false;
        this.activeBtnDoAuto();
        this.showOptionBtns();
    }

    waitOperateForPet() {
        if (!this.operateWaiting) return;
        this.waitOperateStep = 2;
        if (BattleMgr.ins().autoBattle) return;
        this.targetSelecting = false;
        this.itemPanelNode.active = false;
        this.activeBtnDoAuto();
        this.showOptionBtns();
    }

    waitOperateForAny() {
        if (this.waitOperateStep == 1) this.waitOperateForRole();
        if (this.waitOperateStep == 2) this.waitOperateForPet();
    }

    endWaitOperate() {
        this.operateWaiting = false;
        this.targetSelecting = false;
        this.waitTimeLabel.node.active = false;
        this.itemPanelNode.active = false;
        this.hideOptionBtns();
        this.refreshAutoBattle();
    }

    private showOptionBtns() {
        this.btnsNode.getChildByName("ListH").active = true;
        //渲染技能按钮
        let skillIDs: number[] = [];
        if (this.waitOperateStep == 1) {
            skillIDs = Player.ins.roleData.skills;
        }
        if (this.waitOperateStep == 2) {
            skillIDs = Player.ins.petData.skills;
        }
        let listH = this.btnsNode.getChildByName("ListH");
        let skillBtns = listH.children.slice(1);
        skillBtns.forEach(e => e.active = false);
        skillIDs.forEach((skillID, i) => {
            let btnNode = skillBtns[i];
            if (!btnNode) {
                btnNode = cc.instantiate(skillBtns[0]);
                listH.addChild(btnNode);
            }
            cc.resources.load(`common/skill/${skillID}`, cc.SpriteFrame, (err, res: cc.SpriteFrame) => {
                if (err) return;
                cc.find("Mask/Sprite", btnNode).getComponent(cc.Sprite).spriteFrame = res;
                btnNode.active = true;
            });
            btnNode.targetOff(this);
            btnNode.on(cc.Node.EventType.TOUCH_END, () => {
                this.operateType = 2;
                this.operateItemID = skillID;
                this.enterTargetSelecting();
            }, this);
        });
    }

    private hideOptionBtns() {
        this.btnsNode.getChildByName("ListH").active = false;
    }

    private activeBtnReturn() {
        this.btnsNode.getChildByName("Return").active = true;
        this.btnsNode.getChildByName("NoAuto").active = false;
        this.btnsNode.getChildByName("DoAuto").active = false;
    }

    private activeBtnNoAuto() {
        this.btnsNode.getChildByName("Return").active = false;
        this.btnsNode.getChildByName("NoAuto").active = true;
        this.btnsNode.getChildByName("DoAuto").active = false;
    }

    private activeBtnDoAuto() {
        this.btnsNode.getChildByName("Return").active = false;
        this.btnsNode.getChildByName("NoAuto").active = false;
        this.btnsNode.getChildByName("DoAuto").active = true;
    }

    refreshAutoBattle() {
        let isAutoBattle = BattleMgr.ins().autoBattle;
        if (isAutoBattle) {
            this.activeBtnNoAuto();
            this.hideOptionBtns();
            this.itemPanelNode.active = false;
        } else {
            this.activeBtnDoAuto();
        }
        this.waitOperateForAny();
    }
}
