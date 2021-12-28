package game.skill;

public class SkillMgr {

    public Skill getSkill(int skillID) {
        try {
            return (Skill) Class.forName("game.skill.Skill" + skillID).newInstance();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    private SkillMgr() {}
    private static SkillMgr instance = new SkillMgr();
    public static SkillMgr ins() {
        return instance;
    }
}
