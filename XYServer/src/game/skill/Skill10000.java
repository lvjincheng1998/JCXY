package game.skill;

import game.actor.ActorDamage;
import game.actor.ActorInBattle;
import game.BattleOrder;

/**
 * 反击
 */
public class Skill10000 extends Skill {

    public Skill10000() {
        id = 10000;
        name = "反击";
    }

    @Override
    public void release() {
        ActorInBattle target = self.battleDriver.findActor(targetID);
        if (target == null || !self.battleDriver.isActorCanHit(target)) {
            target = self.battleDriver.randomTargetThatCanHit(self);
        }
        if (target == null) return;

        BattleOrder attackOrder = self.attack();
        addOrder(attackOrder);

        BattleOrder showValueOnBodyOrder = self.showValueOnBody();
        showValueOnBodyOrder.put_type(ActorInBattle.BodyValueType.Skill);
        showValueOnBodyOrder.put_value(name);
        attackOrder.addOnStart(showValueOnBodyOrder);

        ActorDamage damage = new ActorDamage();
        damage.attacker = self;
        damage.atk = self.state.atkPS;
        damage.fatal = self.state.fatalPS;
        damage.srcType = ActorDamage.SrcType.PassiveSkill;

        target.inputDamage(damage, attackOrder);
    }
}
