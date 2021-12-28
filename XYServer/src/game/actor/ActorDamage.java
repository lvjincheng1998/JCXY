package game.actor;

public class ActorDamage {
    public Type type = Type.Physic;
    public SrcType srcType = SrcType.CommonAttack;
    public int atk = 1;
    public int ratio = 1000;
    public int fatal = 0;
    public ActorInBattle attacker;
    
    public enum Type {
        Physic, Magic
    }
    public enum SrcType {
        CommonAttack, ActiveSkill, PassiveSkill
    }
}
