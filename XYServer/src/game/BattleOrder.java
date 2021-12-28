package game;

import java.util.ArrayList;
import java.util.HashMap;

public class BattleOrder {
    public final int id;
    public String name;
    public HashMap<String, Object> params = new HashMap<>();
    public ArrayList<Integer> onStart;
    public ArrayList<Integer> onFinish;
    public ArrayList<Integer> onFrameEvent;

    public BattleOrder(BattleDriver battleDriver) {
        this.id = battleDriver.generateOrderID();
    }

    public void addOnStart(BattleOrder order) {
        if (onStart == null) onStart = new ArrayList<>();
        onStart.add(order.id);
    }

    public void addOnFinish(BattleOrder order) {
        if (onFinish == null) onFinish = new ArrayList<>();
        onFinish.add(order.id);
    }

    public void addOnFrameEvent(BattleOrder order) {
        if (onFrameEvent == null) onFrameEvent = new ArrayList<>();
        onFrameEvent.add(order.id);
    }

    public static final String Name_runTo = "runTo";
    public static final String Name_runBack = "runBack";
    public static final String Name_attack = "attack";
    public static final String Name_magic = "magic";
    public static final String Name_hit = "hit";
    public static final String Name_die = "die";
    public static final String Name_showValueOnBody = "showValueOnBody";
    public static final String Name_updateState = "updateState";
    public static final String Name_showSkillEffect = "showSkillEffect";
    public static final String Name_updateRoundCount = "updateRoundCount";
    public static final String Name_updateWaitTime = "updateWaitTime";
    public static final String Name_startWaitOperate = "startWaitOperate";
    public static final String Name_endWaitOperate = "endWaitOperate";
    public static final String Name_nextRound = "nextRound";
    public static final String Name_over = "over";

    public void put_selfID(int value) {
        this.params.put("selfID", value);
    }

    public void put_targetID(int value) {
        this.params.put("targetID", value);
    }

    public void put_fatal(boolean value) {
        this.params.put("fatal", value);
    }

    public void put_value(Object value) {
        this.params.put("value", value);
    }

    public void put_type(int value) {
        this.params.put("type", value);
    }

    public void put_hp(int value) {
        this.params.put("hp", value);
    }

    public void put_mp(int value) {
        this.params.put("mp", value);
    }
}
