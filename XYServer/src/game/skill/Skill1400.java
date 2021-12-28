package game.skill;

import game.actor.ActorDamage;
import game.actor.ActorInBattle;
import game.BattleOrder;

/**
 * 横扫千军
 */
public class Skill1400 extends Skill {

    public Skill1400() {
        id = 1400;
        name = "横扫千军";
    }

    @Override
    public void release() {
        ActorInBattle target = self.battleDriver.findActor(self.operateTargetID);
        if (target == null || !self.battleDriver.isActorCanHit(target)) {
            target = self.battleDriver.randomTargetThatCanHit(self);
        }
        if (target == null) return;

        self.runTo(target);

        for (int i = 0; i < 3; i++) {
            if (target.state.hp <= 0) continue;
            BattleOrder attackOrder = self.attack();

            if (i == 0) {
                BattleOrder showValueOnBodyOrder = self.showValueOnBody();
                showValueOnBodyOrder.put_type(ActorInBattle.BodyValueType.Skill);
                showValueOnBodyOrder.put_value(name);
                attackOrder.addOnStart(showValueOnBodyOrder);
            }

            ActorDamage damage = new ActorDamage();
            damage.attacker = self;
            damage.atk = self.state.atkPS;
            damage.ratio = 1000 + 100 * i;
            damage.fatal = self.state.fatalPS;
            damage.srcType = ActorDamage.SrcType.ActiveSkill;

            target.inputDamage(damage, attackOrder);
            BattleOrder showSkillEffectOrder = target.showSkillEffect();
            showSkillEffectOrder.put_value(2700);
            attackOrder.addOnFrameEvent(showSkillEffectOrder);
        }

        self.runBack();
    }
}
