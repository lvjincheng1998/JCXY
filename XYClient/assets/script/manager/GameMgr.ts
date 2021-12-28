import GameConfig from "../config/GameConfig";
import { JCEngine } from "../core/JCEngine";
import Player from "../game/Player";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GameMgr extends cc.Component {
    static ins: GameMgr;

    onLoad() {
        GameMgr.ins = this;

        cc.debug.setDisplayStats(false);

        cc.view.setOrientation(cc.macro.ORIENTATION_LANDSCAPE);
        
        JCEngine.boot(GameConfig.wsURL, Player)
    }
}
