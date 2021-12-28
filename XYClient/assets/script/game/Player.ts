import BattleMgr from "../manager/BattleMgr";
import MapMgr from "../manager/MapMgr";
import NoticeMgr from "../manager/NoticeMgr";
import { JCEntity } from "../core/JCEngine";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Player extends JCEntity {
    static ins: Player;

    onLoad() {
        Player.ins = this;
        (window as any).player = this;

        this.parts.set("MapMgr", MapMgr.ins());
        this.parts.set("NoticeMgr", NoticeMgr.ins());
        this.parts.set("BattleMgr", BattleMgr.ins());
    }

    onDestroy() {
        Player.ins = null;
    }

    roleData;
    setRoleData(data) {
        this.roleData = data;
        Player.eventBox.emit(Player.Event_setRoleData);
    }
    
    petData;
    setPetData(data) {
        this.petData = data;
        Player.eventBox.emit(Player.Event_setPetData);
    }

    team;
    setTeam(team) {
        this.team = team;
        Player.eventBox.emit(Player.Event_setTeam);
    }

    static eventBox: cc.Node = new cc.Node();
    static Event_setRoleData: string = "setRoleData";
    static Event_setPetData: string = "setPetData";
    static Event_setTeam: string = "setTeam";
}
