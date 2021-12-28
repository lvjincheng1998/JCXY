package game.skill;

import game.actor.ActorDamage;
import game.actor.ActorInBattle;
import game.BattleOrder;

import java.util.ArrayList;

public class Skill1301 extends Skill {

    public Skill1301() {
        id = 1301;
        name = "血海深仇";
    }

    @Override
    public void release() {
        ArrayList<ActorInBattle> targets = self.battleDriver.findActorsForAOE(self, self.operateTargetID, 7);

        if (targets.size() == 0) return;
        BattleOrder magicOrder = self.magic();
        BattleOrder showSkillEffectOrder = targets.get(0).showSkillEffect();
        showSkillEffectOrder.put_value(24230);
        magicOrder.addOnFrameEvent(showSkillEffectOrder);

        BattleOrder showValueOnBodyOrder = self.showValueOnBody();
        showValueOnBodyOrder.put_type(ActorInBattle.BodyValueType.Skill);
        showValueOnBodyOrder.put_value(name);
        magicOrder.addOnStart(showValueOnBodyOrder);

        for (ActorInBattle target : targets) {
            ActorDamage damage = new ActorDamage();
            damage.attacker = self;
            damage.type = ActorDamage.Type.Magic;
            damage.atk = self.state.atkMG;
            damage.fatal = self.state.fatalMG;
            damage.srcType = ActorDamage.SrcType.ActiveSkill;
            target.inputDamage(damage, showSkillEffectOrder);
        }
    }
}
