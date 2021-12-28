package game.skill;

import game.actor.ActorDamage;
import game.actor.ActorInBattle;
import game.BattleOrder;

/**
 * 龙腾
 */
public class Skill1200 extends Skill {

    public Skill1200() {
        id = 1200;
        name = "蛟龙出海";
    }

    @Override
    public void release() {
        ActorInBattle target = self.battleDriver.findActor(self.operateTargetID);
        if (target == null || !self.battleDriver.isActorCanHit(target)) {
            target = self.battleDriver.randomTargetThatCanHit(self);
        }
        if (target == null) return;
        BattleOrder magicOrder = self.magic();
        BattleOrder showSkillEffectOrder = target.showSkillEffect();
        showSkillEffectOrder.put_value(22115);
        magicOrder.addOnFrameEvent(showSkillEffectOrder);

        BattleOrder showValueOnBodyOrder = self.showValueOnBody();
        showValueOnBodyOrder.put_type(ActorInBattle.BodyValueType.Skill);
        showValueOnBodyOrder.put_value(name);
        magicOrder.addOnStart(showValueOnBodyOrder);

        ActorDamage damage = new ActorDamage();
        damage.attacker = self;
        damage.type = ActorDamage.Type.Magic;
        damage.atk = self.state.atkMG;
        damage.ratio = 3000;
        damage.fatal = self.state.fatalMG;
        damage.srcType = ActorDamage.SrcType.ActiveSkill;
        target.inputDamage(damage, showSkillEffectOrder);
    }
}
