import SingleClass from "../core/SingleClass";
import Player from "../game/Player";

export default class TeamComp extends SingleClass {

    static ins(): TeamComp {
        return super.ins();
    }

    createTeam() {
        Player.ins.call("TeamComp.createTeam");
    }

    leaveTeam() {
        Player.ins.call("TeamComp.leaveTeam");
    }

    pleaseLeaveTeam(targetID: number) {
        Player.ins.call("TeamComp.pleaseLeaveTeam", [targetID]);
    }

    inviteJoinTeam(targetID: number, callback: () => void) {
        Player.ins.call("TeamComp.inviteJoinTeam", [targetID], callback);
    }

    acceptInviteJoinTeam(teamID: number) {
        Player.ins.call("TeamComp.acceptInviteJoinTeam", [teamID]);
    }

    rejectInviteJoinTeam(teamID: number) {
        Player.ins.call("TeamComp.rejectInviteJoinTeam", [teamID]);
    }

    requestJoinTeam(teamID: number, callback: () => void) {
        Player.ins.call("TeamComp.requestJoinTeam", [teamID], callback);
    }

    acceptRequestJoinTeam(targetID: number, callback: () => void) {
        Player.ins.call("TeamComp.acceptRequestJoinTeam", [targetID], callback);
    }

    rejectRequestJoinTeam(targetID: number, callback: () => void) {
        Player.ins.call("TeamComp.rejectRequestJoinTeam", [targetID], callback);
    }
}
