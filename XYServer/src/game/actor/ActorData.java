package game.actor;

import pers.jc.engine.JCEngine;
import java.util.ArrayList;
import java.util.List;

public class ActorData {
    public int id;
    public String nickname;
    public int actorID;
    public int weaponID;
    public int level;
    public ActorState state = new ActorState();
    public List<Integer> skills = new ArrayList<>();

    public static ActorData createForTestRole(int playerID) {
        ActorData actorData = new ActorData();
        actorData.id = playerID + 100000;
        actorData.nickname = "测试玩家" + playerID;
        int[] actorIDs = {1031, 2004, 2033, 2034, 4017, 4018, 4037, 4038};
        actorData.actorID = actorIDs[(actorData.id - 1) % actorIDs.length];
        actorData.weaponID = 1000;
        actorData.level = 100;
        actorData.state.setLevel(actorData.level);
        actorData.state.setWeapon(actorData.weaponID);
        actorData.state.refresh();
        actorData.skills.add(1301);
        actorData.skills.add(1400);
        return actorData;
    }

    public static ActorData createForTestPet() {
        ActorData actorData = new ActorData();
        actorData.id = JCEngine.getAutoIncrementID("TestPet");
        actorData.nickname = "测试宠物" + actorData.id;
        actorData.actorID = 6088;
        actorData.weaponID = 0;
        actorData.level = 100;
        actorData.state.setLevel(actorData.level);
        actorData.state.refresh();
        actorData.skills.add(1200);
        actorData.skills.add(1202);
        return actorData;
    }
}
