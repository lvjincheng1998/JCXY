import TeamComp from "../component/TeamComp";
import MapGuider from "../core/MapGuider";
import Player from "../game/Player";
import MapMgr from "../manager/MapMgr";
import PopupMgr from "../manager/PopupMgr";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GameView extends cc.Component {
    @property(cc.Node)
    btnCreateTeam: cc.Node = null;
    @property(cc.Node)
    btnSwitchWeapon: cc.Node = null;
    @property(cc.Node)
    btnEnterBattle: cc.Node = null;
    @property(cc.Node)
    teamMemberPanel: cc.Node = null;
    @property(cc.Node)
    roleClickPanel: cc.Node = null;
    @property(cc.Node)
    mapRecord: cc.Node = null;

    static ins: GameView;

    onLoad() {
        GameView.ins = this;

        Player.eventBox.on(Player.Event_setTeam, this.renderTeamMemberPhotos, this);
        this.renderRoleClickPanel();
        this.renderTeamMemberPhotos();
    }

    start() {
        this.btnCreateTeam.on(cc.Node.EventType.TOUCH_END, () => {
            TeamComp.ins().createTeam();
        });
        this.btnSwitchWeapon.on(cc.Node.EventType.TOUCH_END, () => {
            Player.ins.call("switchWeapon");
        });
        this.btnEnterBattle.on(cc.Node.EventType.TOUCH_END, () => {
            Player.ins.call("debugBattle");
        });
    }

    onEnable() {
        cc.resources.load("audio/bgm/神狐的祝福", cc.AudioClip, (error, assets: cc.AudioClip) => {
            if (error) return;
            cc.audioEngine.playMusic(assets, true);
        });
    }

    onDestroy() {
        GameView.ins = null;
    }

    update() {
        let basePoint: cc.Vec2 = null;
        if (MapGuider.ins) basePoint = MapGuider.ins.basePoint;
        let myActor = MapMgr.ins().myActor;
        if (myActor && myActor.node && myActor.node.isValid) {
            let pos = myActor.node.getPosition().sub(basePoint); 
            pos.y = -pos.y;
            this.renderMyPositionInMap(pos);
        }
    }

    renderRoleClickPanel(data?) {
        if (data) {
            this.roleClickPanel.active = true;
            let infoBox = this.roleClickPanel.getChildByName("InfoBox");
            //渲染头像
            let photo = cc.find("PhotoFrame/Photo", infoBox).getComponent(cc.Sprite);
            let avatarName = "role_" + data.actorID;
            cc.resources.load(`common/rolehead/${avatarName}`, cc.SpriteFrame, (err, res: cc.SpriteFrame) => {
                if (err) return;
                photo.spriteFrame = res;
            });
            //渲染等级
            infoBox.getChildByName("Level").getComponentInChildren(cc.Label).string = data.level;
            //渲染昵称
            infoBox.getChildByName("Line1").getComponentInChildren(cc.Label).string = data.nickname;
            //渲染编号
            infoBox.getChildByName("Line2").getComponentInChildren(cc.Label).string = `编号${data.roleID}`;

            let btnTeam = this.roleClickPanel.getChildByName("BtnTeam");
            if (!Player.ins.team && typeof data.teamMemberIndex == "number") {
                btnTeam.active = true;
                btnTeam.getComponentInChildren(cc.Label).string = "申请入队";
                btnTeam.targetOff(this);
                btnTeam.on(cc.Node.EventType.TOUCH_END, () => {
                    TeamComp.ins().requestJoinTeam(data.teamID, () => {
                        PopupMgr.ins().showTip({
                            content: "已向对方发出申请！"
                        });
                    });
                }, this);
            } else if (Player.ins.team && Player.ins.team.members.length < 5 && typeof data.teamMemberIndex != "number") {
                btnTeam.active = true;
                btnTeam.getComponentInChildren(cc.Label).string = "邀请入队";
                btnTeam.targetOff(this);
                btnTeam.on(cc.Node.EventType.TOUCH_END, () => {
                    TeamComp.ins().inviteJoinTeam(data.id, () => {
                        PopupMgr.ins().showTip({
                            content: "已向对方发出邀请！"
                        });
                    });
                }, this);
            } else {
                btnTeam.active = false;
            }

            let btnAttack = this.roleClickPanel.getChildByName("BtnAttack");
            if (Player.ins.team && Player.ins.team.id == data.teamID) {
                btnAttack.active = false;
            } else {
                btnAttack.active = true;
                btnAttack.targetOff(this);
                btnAttack.on(cc.Node.EventType.TOUCH_END, () => {
                    Player.ins.call("attackOther", [data.id]);
                }, this);
            }
        } else {
            this.roleClickPanel.active = false;
        }
    }

    renderTeamMemberPhotos() {
        this.teamMemberPanel.active = Player.ins && Player.ins.team ? true : false;
        if (Player.ins && Player.ins.team) {
            this.btnCreateTeam.active = false;
            this.teamMemberPanel.children.forEach((node, index) => {
                let member = Player.ins.team.members[index];
                if (member) {
                    let isSelf = member.roleID == Player.ins.roleData.id;
                    let canPleaseLeave = !isSelf && Player.ins.team.members[0].roleID == Player.ins.roleData.id;
                    node.active = true;
                    //渲染头像
                    let photo = node.getChildByName("Photo").getComponent(cc.Sprite);
                    let avatarName = "role_" + member.actorID;
                    cc.resources.load(`common/rolehead/${avatarName}`, cc.SpriteFrame, (err, res: cc.SpriteFrame) => {
                        if (err) return;
                        photo.spriteFrame = res;
                    });
                    //渲染等级
                    node.getChildByName("Level").getComponentInChildren(cc.Label).string = member.level;
                    //功能按钮监听
                    let btn = node.getChildByName("Btn");
                    btn.active = false;
                    btn.targetOff(this);
                    btn.getComponentInChildren(cc.Label).string = isSelf ? "离\n开" : "请\n离";
                    btn.on(cc.Node.EventType.TOUCH_END, () => {
                        if (isSelf) {
                            TeamComp.ins().leaveTeam();
                        } else if (canPleaseLeave) {
                            TeamComp.ins().pleaseLeaveTeam(member.id);
                        }
                    }, this);
                    //头像按钮监听
                    node.targetOff(this);
                    node.on(cc.Node.EventType.TOUCH_END, () => {
                        if (isSelf || canPleaseLeave) btn.active = !btn.active; 
                    }, this);
                } else {
                    node.active = false;
                }
            });
        } else {
            this.btnCreateTeam.active = true;
        }
    }

    noticeRequestJoinTeam(data) {
        let listNode = this.node.getChildByName("TeamRequestList");

        let item = cc.instantiate(listNode.children[0]);
        item.active = true;
        listNode.addChild(item);
        
        let itemHeight = item.height;
        item.x= -item.width;
        if (listNode.childrenCount > 2) item.height = 0;
        cc.tween(item)
            .to(0.3, {x: 10, height: itemHeight})
            .delay(5)
            .to(0.3, {x: -item.width}).to(0.3, {height: 0}).then(cc.destroySelf())
            .start();

        item.getComponentInChildren(cc.RichText).string = 
            `<color=#00FF73>${data.nickname}</c><color=#E9E9E9>申请加入你的队伍</c>`;

        let removeItem = () => {
            cc.Tween.stopAllByTarget(item);
            cc.tween(item).to(0.3, {x: -item.width}).to(0.3, {height: 0}).then(cc.destroySelf()).start();
        };

        item.getChildByName("BtnYes").on(cc.Node.EventType.TOUCH_END, () => {
            TeamComp.ins().acceptRequestJoinTeam(data.id, removeItem);
        });

        item.getChildByName("BtnNo").on(cc.Node.EventType.TOUCH_END, () => {
            TeamComp.ins().rejectRequestJoinTeam(data.id, removeItem);
        });
    }

    renderMyPositionInMap(pos: cc.Vec2) {
        this.mapRecord.active = pos ? true : false;
        if (pos) {
            let posLabel = this.mapRecord.getChildByName("Position").getComponent(cc.Label);
            posLabel.string = `（${pos.x << 0}，${pos.y << 0}）`;
        }
    }
}
