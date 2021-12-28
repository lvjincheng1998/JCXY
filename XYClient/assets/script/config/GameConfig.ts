export default class GameConfig {
    
    public static get wsURL() {
        let ip = "192.168.101.14";
        if (location && location.hostname && location.hostname.startsWith("localhost")) {
            ip = "127.0.0.1";
        }
        return `ws://${ip}:9888/XY`;
    };

    public static ResAnchor: Record<number, {
        anchorX: number;
        anchorY: number;
    }> = {
        1031: {
            anchorX: 0.5,
            anchorY: 0.38
        },
        2004: {
            anchorX: 0.5,
            anchorY: 0.4
        },
        2033: {
            anchorX: 0.5,
            anchorY: 0.4
        },
        2034: {
            anchorX: 0.5,
            anchorY: 0.39
        },
        4017: {
            anchorX: 0.5,
            anchorY: 0.4
        },
        4018: {
            anchorX: 0.5,
            anchorY: 0.4
        },
        4037: {
            anchorX: 0.5,
            anchorY: 0.4
        },
        4038: {
            anchorX: 0.5,
            anchorY: 0.4
        },
        6088: {
            anchorX: 0.5,
            anchorY: 0.44
        },
        6093: {
            anchorX: 0.5,
            anchorY: 0.4
        }
    };

    //帧数从0开始
    public static ActionKeyFrame: Record<number, {attack: number, magic: number}> = {
        1031: {
            attack: 4,
            magic: 10
        },
        1032: {
            attack: 6,
            magic: 10
        },
        //未调好
        2004: {
            attack: 4,
            magic: 7
        },
        2033: {
            attack: 5,
            magic: 8
        },
        2034: {
            attack: 6,
            magic: 9
        },
        4017: {
            attack: 6,
            magic: 10
        },
        4018: {
            attack: 4,
            magic: 7
        },
        //未调好
        4037: {
            attack: 4,
            magic: 7
        },
        //未调好
        4038: {
            attack: 4,
            magic: 7
        },
        5009: {
            attack: 3,
            magic: 5
        },
        //未调好
        6088: {
            attack: 3,
            magic: 8
        },
        //未调好
        6091: {
            attack: 3,
            magic: 8
        },
        //未调好
        6092: {
            attack: 3,
            magic: 8
        },
        //未调好
        6093: {
            attack: 3,
            magic: 8
        },
        6095: {
            attack: 3,
            magic: 8
        }
    };

    //帧数从0开始
    public static EffectKeyFrame: Record<number, number> = {
        22115: 9,
        22216: 2,
        24230: 7
    };  

    public static HpBarHeight: Record<number, number> = {
        5013: 100,
        6056: 110,
        6095: 140,
    }
}