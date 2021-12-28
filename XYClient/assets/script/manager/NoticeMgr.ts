import TeamComp from "../component/TeamComp";
import SingleClass from "../core/SingleClass";
import GameView from "../view/GameView";
import PopupMgr from "./PopupMgr";

export default class NoticeMgr extends SingleClass {

    static ins(): NoticeMgr {
        return super.ins();
    }

    showTip(content) {
        PopupMgr.ins().showTip({
            content: content 
        });
    }

    inviteJoinTeam(data) {
        PopupMgr.ins().showModal({
            title: "队伍提示",
            content: `【${data.nickname}】\n邀请你加入队伍，是否接受？`,
            confirm: () => {
                TeamComp.ins().acceptInviteJoinTeam(data.teamID);
            },
            cancel: () => {
                TeamComp.ins().rejectInviteJoinTeam(data.id);
            }
        });
    }

    noticeRequestJoinTeam(data) {
        GameView.ins.noticeRequestJoinTeam(data);
    }

    eventBox: cc.Node = new cc.Node();
    static Event_inviteJoinTeam: string = "inviteJoinTeam";
}
