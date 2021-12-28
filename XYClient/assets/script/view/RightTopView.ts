import Player from "../game/Player";
import PopupMgr from "../manager/PopupMgr";

const {ccclass, property} = cc._decorator;

@ccclass
export default class RightTopView extends cc.Component {
    static ins: RightTopView;

    onLoad() {
        RightTopView.ins = this;

        Player.eventBox.on(Player.Event_setRoleData, this.renderRolePanel, this);
        Player.eventBox.on(Player.Event_setPetData, this.renderPetPanel, this);

        this.renderRolePanel();
        this.renderPetPanel();
    }

    start() {
        this.node.getChildByName("RolePanel").on(cc.Node.EventType.TOUCH_END, () => {
            PopupMgr.ins().showTip({
                content: "这是你的角色！"
            });
        });
        this.node.getChildByName("PetPanel").on(cc.Node.EventType.TOUCH_END, () => {
            PopupMgr.ins().showTip({
                content: "这是你的宠物！"
            });
        });
    }

    renderRolePanel() {
        if (!Player.ins) return;
        let roleData = Player.ins.roleData;
        if (roleData) {
            let panel = this.node.getChildByName("RolePanel");
            let photo = cc.find("PhotoFrame/Photo", panel).getComponent(cc.Sprite);
            let avatarName = "role_" + roleData.actorID;
            if (!photo.spriteFrame || photo.spriteFrame.name != avatarName) {
                cc.resources.load(`common/rolehead/${avatarName}`, cc.SpriteFrame, (err, res: cc.SpriteFrame) => {
                    if (err) return;
                    photo.spriteFrame = res;
                })
            }
            cc.find("Level/Label", panel).getComponent(cc.Label).string = roleData.level;
            cc.find("HpBar", panel).getComponent(cc.ProgressBar).progress = roleData.state.hp / roleData.state.hpMax;
            cc.find("MpBar", panel).getComponent(cc.ProgressBar).progress = roleData.state.mp / roleData.state.mpMax;
        }
    }

    renderPetPanel() {
        if (!Player.ins) return;
        let petData = Player.ins.petData;
        let panel = this.node.getChildByName("PetPanel");
        let photo = cc.find("PhotoFrame/Photo", panel).getComponent(cc.Sprite);
        let avatarName = petData ? "" + petData.actorID : "default";
        if (!photo.spriteFrame || photo.spriteFrame.name != avatarName) {
            cc.resources.load(`common/pethead/${avatarName}`, cc.SpriteFrame, (err, res: cc.SpriteFrame) => {
                if (err) return;
                photo.spriteFrame = res;
            })
        }
        cc.find("Level/Label", panel).getComponent(cc.Label).string = petData ? petData.level : "";
        cc.find("HpBar", panel).getComponent(cc.ProgressBar).progress = petData ? petData.state.hp / petData.state.hpMax : 0;
        cc.find("MpBar", panel).getComponent(cc.ProgressBar).progress = petData ? petData.state.mp / petData.state.mpMax : 0;
    }
}
