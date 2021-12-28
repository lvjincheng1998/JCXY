import { ActorAction } from "../config/GameDefine";
import SingleClass from "../core/SingleClass";

export default class SkillMgr extends SingleClass {
    skillClasses: Record<number, new() => SkillTemplate> = {};
    skillObjects: Record<number, SkillTemplate> = {};

    static ins(): SkillMgr {
        return super.ins();
    }

    constructor() {
        super();
        this.addSkill(Skill1100);
        this.addSkill(Skill1101);
        this.addSkill(Skill1102);
        this.addSkill(Skill1103);
        this.addSkill(Skill1200);
        this.addSkill(Skill1201);
        this.addSkill(Skill1202);
        this.addSkill(Skill1203);
        this.addSkill(Skill1204);
        this.addSkill(Skill1300);
        this.addSkill(Skill1301);
        this.addSkill(Skill1302);
        this.addSkill(Skill1303);
        this.addSkill(Skill1304);
        this.addSkill(Skill1400);
        this.addSkill(Skill1401);
        this.addSkill(Skill1402);
    }

    addSkill(template: new() => SkillTemplate) {
        let ins = new template();
        this.skillClasses[ins.id] = template;
        this.skillObjects[ins.id] = ins;
    }

    getSkill(id: number) {
        return this.skillObjects[id];
    }

    newSkill(id: number) {
        return new this.skillClasses[id]();
    }
}

enum SkillType {
    Physic, //物理 
    Magic //法术
}

enum SkillScope {
    Single, //单体
    Group //群体
}

enum SkillMode {
    Active, //主动
    Passive //被动
}

enum SkillAim {
    Enemy, // 敌方
    Self // 己方
}

enum SkillLocation {
    Body, //身体
    Stage //舞台
}

/**技能模板 */
export class SkillTemplate {
    id: number = 0; //技能ID
    name: string = ""; //技能名称
    hasFace: boolean = false; //是否区分方向
    renderOnFront: boolean = true; //技能特效渲染在目标上面
    type: SkillType = SkillType.Physic; //技能类型
    action: ActorAction = ActorAction.Magic; //播放人物动作
    scope: SkillScope = SkillScope.Single; //技能释放范围
    mode: SkillMode = SkillMode.Active; //技能释放模式
    aim: SkillAim = SkillAim.Enemy; //技能作用目标
    location: SkillLocation = SkillLocation.Body; //技能作用位置
    correctX: number = 0; //纠正相对显示位置X
    correctY: number = 0; //纠正相对显示位置Y
    level: number = 0; //技能等级

    getIntro(): string { 
        return "技能简介";
     }
}
export class Skill1100 extends SkillTemplate {

    constructor() {
        super();
        this.id = 1100;
        this.name = "雷鸣咒";
        this.type = SkillType.Magic;
    }

    getIntro() {
        return "催动霹雳鬼神惊，斩妖除魔仗雷霆。对多个敌方目标造成法术伤害。";
    }
}
export class Skill1101 extends SkillTemplate {

    constructor() {
        super();
        this.id = 1101;
        this.name = "烈火咒";
        this.type = SkillType.Magic;
    }

    getIntro() {
        return "此乃纯阳灭妖神火，可焚尽世间污秽之物。对多个敌方目标造成法术伤害。";
    }
}
export class Skill1102 extends SkillTemplate {

    constructor() {
        super();
        this.id = 1102;
        this.name = "迷魂咒";
        this.type = SkillType.Magic;
    }

    getIntro() {
        return "令敌人如同醉酒，昏昏欲睡。使多个敌方目标进入昏睡状态。";
    }
}
export class Skill1103 extends SkillTemplate {

    constructor() {
        super();
        this.id = 1103;
        this.name = "冰封咒";
        this.type = SkillType.Magic;
    }

    getIntro() {
        return "以强大的法术封住对手，使其完全无法动弹。对单个敌方目标进行封印。";
    }
}
export class Skill1200 extends SkillTemplate {

    constructor() {
        super();
        this.id = 1200;
        this.name = "蛟龙出海";
        this.type = SkillType.Magic;
    }

    getIntro() {
        return "龙腾四方，浩大声势让世人惊叹。对单个敌方目标造成法术伤害。";
    }
}
export class Skill1201 extends SkillTemplate {

    constructor() {
        super();
        this.id = 1201;
        this.name = "风卷沙尘";
        this.type = SkillType.Magic;
    }

    getIntro() {
        return "狂风走石，退避三舍。对单个敌方目标造成法术伤害。";
    }
}
export class Skill1202 extends SkillTemplate {

    constructor() {
        super();
        this.id = 1202;
        this.name = "九龙冰封";
        this.type = SkillType.Magic;
    }

    getIntro() {
        return "九龙出水鬼神惊，扶摇直上云霄里。对多个敌方目标造成法术伤害。";
    }
}
export class Skill1203 extends SkillTemplate {

    constructor() {
        super();
        this.id = 1203;
        this.name = "袖里乾坤";
        this.type = SkillType.Magic;
    }

    getIntro() {
        return "乾坤袖一抖就令天地动容，风云变色，伤人于无形。对多个敌方目标造成法术伤害。";
    }
}
export class Skill1204 extends SkillTemplate {

    constructor() {
        super();
        this.id = 1204;
        this.name = "自在心法";
        this.type = SkillType.Magic;
    }

    getIntro() {
        return "逍遥自在，心无旁骛，法相天地。临时提高自身的法术伤害。";
    }
}
export class Skill1300 extends SkillTemplate {

    constructor() {
        super();
        this.id = 1300;
        this.name = "阎罗追命";
        this.type = SkillType.Magic;
    }

    getIntro() {
        return "利用阎王的力量消减对手的生命值。对多个敌方目标造成固定的法术伤害。";
    }
}
export class Skill1301 extends SkillTemplate {

    constructor() {
        super();
        this.id = 1301;
        this.name = "血海深仇";
        this.type = SkillType.Magic;
    }

    getIntro() {
        return "以仇恨之力召唤血海，一切生灵终将湮灭于此。对多个敌方目标造成固定的法术伤害。";
    }
}
export class Skill1302 extends SkillTemplate {

    constructor() {
        super();
        this.id = 1302;
        this.name = "魔神附体";
        this.type = SkillType.Magic;
    }

    getIntro() {
        return "借用战斗魔神的力量。临时提高多个友方目标的物理伤害。";
    }
}
export class Skill1303 extends SkillTemplate {

    constructor() {
        super();
        this.id = 1303;
        this.name = "含情脉脉";
        this.type = SkillType.Magic;
    }

    getIntro() {
        return "脉脉含情的眼神让目标忘却痛苦。临时提高多个友方目标的物理防御和法术防御。";
    }
}
export class Skill1304 extends SkillTemplate {

    constructor() {
        super();
        this.id = 1304;
        this.name = "黄泉之息";
        this.type = SkillType.Magic;
    }

    getIntro() {
        return "以黄泉之力，可修养生息。对多个友方目标进行治疗。";
    }
}
export class Skill1400 extends SkillTemplate {

    constructor() {
        super();
        this.id = 1400;
        this.name = "横扫千军";
        this.type = SkillType.Physic;
    }

    getIntro() {
        return "以攻代守，战场上一往无前。对单个敌方目标造成物理伤害。";
    }
}
export class Skill1401 extends SkillTemplate {

    constructor() {
        super();
        this.id = 1401;
        this.name = "破斧沉舟";
        this.type = SkillType.Physic;
    }

    getIntro() {
        return "危急时刻，以一敌众，经常起到以少胜多的奇效。对多个敌方目标造成物理伤害。";
    }
}
export class Skill1402 extends SkillTemplate {

    constructor() {
        super();
        this.id = 1402;
        this.name = "后发制人";
        this.type = SkillType.Physic;
    }

    getIntro() {
        return "从孙子兵法中悟出的绝学，避敌锐气而后发制人。大幅度提高自身防御和速度，下回合对单个敌方目标造成高额的物理伤害。";
    }
}
