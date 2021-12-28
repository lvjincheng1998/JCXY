package game;

import core.value_type.Vec2;
import game.actor.ActorData;
import game.actor.ActorInMap;
import game.actor.RoleInMap;
import pers.jc.engine.JCEntity;
import pers.jc.network.SocketFunction;
import java.util.concurrent.ConcurrentHashMap;

public class Player extends JCEntity {
    public static ConcurrentHashMap<Integer, Player> playerMap = new ConcurrentHashMap<>();

    public ActorData roleData;
    public ActorData petData;

    @Override
    public void onLoad() {
        playerMap.put(id, this);
        roleData = ActorData.createForTestRole(id);
        petData = ActorData.createForTestPet();
        roleInMap = new RoleInMap(this, 1010, new Vec2(-450, 10));
        call(PlayerClientAPI.setRoleData, roleData);
        call(PlayerClientAPI.setPetData, petData);
    }

    @Override
    public void onDestroy() {
        if (roleInMap != null) roleInMap.destroy();
        playerMap.remove(id, this);
    }

    //切换武器
    @SocketFunction
    public void switchWeapon() {
        if (roleData != null) {
            int weaponID = roleData.weaponID;
            if (weaponID >= 1000 && weaponID < 1003) weaponID++;
            else weaponID = 1000;
            roleData.weaponID = weaponID;
            roleData.state.setWeapon(weaponID);
            roleData.state.refresh();
        }
    }

    //地图角色控制API
    public RoleInMap roleInMap;

    @SocketFunction
    public void move(double x1, double y1, double x2, double y2, int face) {
        roleInMap.move(x2, y2);
    }

    //战斗控制API
    public BattleDriver battleDriver;

    @SocketFunction
    public void attackOther(int targetID) {
        if (roleInMap == null) return;
        if (roleInMap.team != null) {
            if (!roleInMap.team.isHeader(roleInMap)) {
                call(PlayerClientAPI.showTip, "你不是队长，无法执行该操作！");
                return;
            }
        }
        if (battleDriver != null && !battleDriver.isOver) {
            call(PlayerClientAPI.showTip, "你正在战斗，无法执行该操作！");
            return;
        }
        RoleInMap target = (RoleInMap) ActorInMap.actorMap.get(targetID);
        Player targetPlayer = target.player;
        if (targetPlayer.battleDriver != null && !targetPlayer.battleDriver.isOver) {
            call(PlayerClientAPI.showTip, "对方正在战斗，无法执行该操作！");
            return;
        }
        new BattleDriver().pvp(this, target);
    }

    @SocketFunction
    public void debugBattle() {
        if (roleInMap == null) return;
        if (roleInMap.team != null) {
            if (!roleInMap.team.isHeader(roleInMap)) {
                call(PlayerClientAPI.showTip, "你不是队长，无法执行该操作！");
                return;
            }
        }
        new BattleDriver().debug(this);
    }

    @SocketFunction
    public void nextRound(int currentRoundCount) {
        battleDriver.openNewRound(currentRoundCount);
    }

    public boolean autoBattle = false;

    @SocketFunction
    public void setAutoBattle(boolean value) {
        autoBattle = value;
        call(PlayerClientAPI.setAutoBattle, autoBattle);
    }

    @SocketFunction
    public void submitOperate(int currentRoundCount, int step, int operateType, int operateItemID, int operateTargetID) {
        battleDriver.submitOperate(id, currentRoundCount, step,operateType, operateItemID, operateTargetID);
    }
}