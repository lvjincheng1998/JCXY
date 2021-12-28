package game.actor;

import com.alibaba.fastjson.annotation.JSONField;
import game.BattleDriver;
import game.BattleOrder;
import game.Player;
import game.skill.SkillMgr;
import game.skill.Skill;

public class ActorInBattle {
    @JSONField(serialize = false)
    public Player player;
    @JSONField(serialize = false)
    public BattleDriver battleDriver;
    public final int id;
    public int actorID;
    public int weaponID;
    public String nickname;
    public int teamID;
    public int teamMemberIndex;
    public ActorState state;
    @JSONField(serialize = false)
    public boolean isPlayerRole = false;
    @JSONField(serialize = false)
    public boolean isPlayerPet = false;
    /**是否已经退场 */
    @JSONField(serialize = false)
    public boolean isOut = false;
    /**
     * 当前回合是否已经收到用户操作
     */
    @JSONField(serialize = false)
    public boolean hasOperate;
    @JSONField(serialize = false)
    public int operateType;
    @JSONField(serialize = false)
    public int operateItemID;
    @JSONField(serialize = false)
    public int operateTargetID;

    public ActorInBattle(BattleDriver battleDriver) {
        this.id = battleDriver.generateActorID();
    }

    public void inputDamage(ActorDamage damage, BattleOrder sourceOrder) {
        int damageValue = 1;
        if (damage.type == ActorDamage.Type.Physic) damageValue = damage.atk - this.state.defPS;
        if (damage.type == ActorDamage.Type.Magic) damageValue = damage.atk - this.state.defMG;
        damageValue *= damage.ratio / 1000.0;
        if (damageValue < 1) damageValue = 1;
        boolean isFatal = false;
        if (Math.random() * 1000 < damage.fatal) {
            isFatal = true;
            damageValue *= 2;
        }

        BattleOrder hitOrder = hit();

        boolean isToDie = false;
        int newHpValue = this.state.hp - damageValue;
        if (newHpValue <= 0) {
            this.state.hp = 0;
            isToDie = true;
        } else {
            this.state.hp = newHpValue;
        }

        BattleOrder showValueOnBodyOrder = showValueOnBody();
        showValueOnBodyOrder.put_type(isFatal ? ActorInBattle.BodyValueType.Fatal : ActorInBattle.BodyValueType.Hurt);
        showValueOnBodyOrder.put_value(damageValue);

        BattleOrder updateStateOrder = updateState();
        updateStateOrder.put_hp(this.state.hp);

        sourceOrder.addOnFrameEvent(hitOrder);
        sourceOrder.addOnFrameEvent(showValueOnBodyOrder);
        sourceOrder.addOnFrameEvent(updateStateOrder);

        if (damage.srcType == ActorDamage.SrcType.CommonAttack && !isToDie && Math.random() < 0) {
            Skill attackBack = SkillMgr.ins().getSkill(10000);
            attackBack.setSelf(this);
            attackBack.setTargetID(damage.attacker.id);
            attackBack.release();
            if (attackBack.hasOrder()) {
                hitOrder.addOnFinish(attackBack.firstOrder());
            }
        }

        if (isToDie) {
            BattleOrder dieOrder = die();
            hitOrder.addOnFinish(dieOrder);
            if (!isPlayerRole) {
                battleDriver.setActorOut(this);
                dieOrder.addOnFinish(quit());
            }
        }
    }

    public void submitOperate(int operateType, int operateItemID, int operateTargetID) {
        this.hasOperate = true;
        this.operateType = operateType;
        this.operateItemID = operateItemID;
        this.operateTargetID = operateTargetID;
    }

    public void onRoundPrepare() {
        this.hasOperate = false;
        this.operateType = OperateType.Attack;
        this.operateItemID = 0;
        this.operateTargetID = 0;
    }

    public void onRoundStart() {

    }

    public void onRoundProcess() {
        if (isDead()) return;
        if (
            !this.hasOperate ||
            operateType == OperateType.Attack
        ) {
            Skill attack = SkillMgr.ins().getSkill(1000);
            attack.setSelf(this);
            attack.setTargetID(operateTargetID);
            attack.release();
            return;
        }
        if (operateType == OperateType.Skill) {
            Skill skill = SkillMgr.ins().getSkill(operateItemID);
            if (skill != null) {
                skill.setSelf(this);
                skill.setTargetID(operateTargetID);
                skill.release();
            }
        }
    }

    public void onRoundEnd() {

    }

    public boolean isAlive() {
        return this.state.hp > 0;
    }

    public boolean isDead() {
        return this.state.hp <= 0;
    }

    // ------ Generate Orders ------

    public BattleOrder runTo(ActorInBattle target) {
        BattleOrder order = new BattleOrder(this.battleDriver);
        order.name = BattleOrder.Name_runTo;
        order.put_selfID(this.id);
        order.put_targetID(target.id);
        this.battleDriver.orders.add(order);
        return order;
    }

    public BattleOrder attack() {
        BattleOrder order = new BattleOrder(this.battleDriver);
        order.name = BattleOrder.Name_attack;
        order.put_selfID(this.id);
        this.battleDriver.orders.add(order);
        return order;
    }

    public BattleOrder runBack() {
        BattleOrder order = new BattleOrder(this.battleDriver);
        order.name = BattleOrder.Name_runBack;
        order.put_selfID(this.id);
        this.battleDriver.orders.add(order);
        return order;
    }

    public BattleOrder magic() {
        BattleOrder order = new BattleOrder(this.battleDriver);
        order.name = BattleOrder.Name_magic;
        order.put_selfID(this.id);
        this.battleDriver.orders.add(order);
        return order;
    }

    public BattleOrder hit() {
        BattleOrder order = new BattleOrder(this.battleDriver);
        order.name = BattleOrder.Name_hit;
        order.put_selfID(this.id);
        this.battleDriver.orders.add(order);
        return order;
    }

    public BattleOrder die() {
        BattleOrder order = new BattleOrder(this.battleDriver);
        order.name = BattleOrder.Name_die;
        order.put_selfID(this.id);
        this.battleDriver.orders.add(order);
        return order;
    }

    public BattleOrder showValueOnBody() {
        BattleOrder order = new BattleOrder(this.battleDriver);
        order.name = BattleOrder.Name_showValueOnBody;
        order.put_selfID(this.id);
        this.battleDriver.orders.add(order);
        return order;
    }

    public BattleOrder updateState() {
        BattleOrder order = new BattleOrder(this.battleDriver);
        order.name = BattleOrder.Name_updateState;
        order.put_selfID(this.id);
        this.battleDriver.orders.add(order);
        return order;
    }

    public BattleOrder showSkillEffect() {
        BattleOrder order = new BattleOrder(this.battleDriver);
        order.name = BattleOrder.Name_showSkillEffect;
        order.put_selfID(this.id);
        this.battleDriver.orders.add(order);
        return order;
    }

    public BattleOrder quit() {
        BattleOrder order = new BattleOrder(this.battleDriver);
        order.name = "quit";
        order.put_selfID(this.id);
        this.battleDriver.orders.add(order);
        return order;
    }

    private static class OperateType {
        public static final int Attack = 1;
        public static final int Skill = 2;
    }

    public static class BodyValueType {
        public static final int Hurt = 0;
        public static final int Fatal = 1;
        public static final int Cure = 2;
        public static final int Skill = 3;
    }
}
