package game.skill;

import game.actor.ActorDamage;
import game.actor.ActorInBattle;
import game.BattleOrder;

public class Skill1000 extends Skill {

    public Skill1000() {
        this.id = 1000;
        this.name = "攻击";
    }

    @Override
    public void release() {
        ActorInBattle target = self.battleDriver.findActor(self.operateTargetID);
        if (target == null || !self.battleDriver.isActorCanHit(target)) {
            target = self.battleDriver.randomTargetThatCanHit(self);
        }
        if (target == null) return;

        self.runTo(target);

        BattleOrder attackOrder = self.attack();

        ActorDamage damage = new ActorDamage();
        damage.attacker = self;
        damage.atk = self.state.atkPS;
        damage.fatal = self.state.fatalPS;

        target.inputDamage(damage, attackOrder);

        if (self.state.hp > 0) self.runBack();
    }
}
