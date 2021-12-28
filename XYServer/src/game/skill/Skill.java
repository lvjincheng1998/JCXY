package game.skill;

import game.actor.ActorInBattle;
import game.BattleOrder;
import java.util.LinkedList;

public abstract class Skill {
    protected int id;
    protected String name;
    protected ActorInBattle self;
    protected int targetID;
    private LinkedList<BattleOrder> orders;

    public abstract void release();

    public void setSelf(ActorInBattle self) {
        this.self = self;
    }

    public void setTargetID(int targetID) {
        this.targetID = targetID;
    }

    public void addOrder(BattleOrder order) {
        if (orders == null) orders = new LinkedList<>();
        orders.add(order);
    }

    public boolean hasOrder() {
        return orders != null && orders.size() > 0;
    }

    public BattleOrder firstOrder() {
        return orders.get(0);
    }
}
