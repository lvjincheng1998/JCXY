const {ccclass, property} = cc._decorator;

@ccclass
export default class Movie extends cc.Animation {
    static CustomEvent = {
        FrameEvent: "FrameEvent" 
    };
    
    onLoad() {
        let sprite = this.addComponent(cc.Sprite);
        sprite.sizeMode = cc.Sprite.SizeMode.RAW;
        sprite.type = cc.Sprite.Type.SIMPLE;
        sprite.trim = false;
    }

    /**
     * 播放剪辑
     * Tip: 如果同时播放多个剪辑，则所需的全部资源加载完成后，多个剪辑按顺序同时播放
     * @param args 
     */
    static playClips(args: {
        clipNames: string[],//资源路径
        movies: Movie[],//Movie实例
        wrapMode: cc.WrapMode,//动画模式
        frameRate: number,//动画帧率
        context?: any,//添加语境，目前用于实现覆盖锁
        framesHandler?: (frames: cc.SpriteFrame[], movie: Movie) => cc.SpriteFrame[],//帧处理器，只有第一次构造时触发
        clipHandler?: (clip: cc.AnimationClip, movie: Movie) => cc.AnimationClip,//剪辑处理器，只有第一次构造时触发
        onStart?: () => void//监听事件-播放开始
    }) {
        //并发覆盖锁
        let lockNum = 0;
        if (args.context) {
            if (typeof args.context.movieLock == "number") {
                args.context.movieLock++;
                lockNum = args.context.movieLock;
            } else {
                args.context.movieLock = lockNum;
            }
        }
        //用到的资源加载记录
        let atlasList: cc.SpriteAtlas[] = [];
        let errorList: Error[] = [];
        let completeCount = 0;
        //资源逐个异步加载
        for (let i = 0; i < args.clipNames.length; i++) {
            cc.resources.load(args.clipNames[i], cc.SpriteAtlas, (error: Error, asset: cc.SpriteAtlas) => {
                //加载过程记录
                atlasList[i] = asset;
                errorList[i] = error;
                completeCount++;
                //检测是否完成加载
                if (completeCount == args.clipNames.length) {
                    //如果并发覆盖锁过期，则退出
                    if (args.context && typeof args.context.movieLock == "number") {
                        if (lockNum != args.context.movieLock) {
                            return;
                        }
                    }
                    //剪辑逐个播放
                    for (let j = 0; j < args.clipNames.length; j++) {
                        if (!errorList[j] && atlasList[j]) {
                            let movie = args.movies[j];
                            let clipName = args.clipNames[j];
                            //如果该剪辑已存在，则直接播放后退出
                            if (movie.hasClip(clipName)) {
                                movie.currentClip = null;
                                movie.play(clipName);
                                continue;
                            }
                            //否则构造并添加剪辑后再播放
                            let frames = atlasList[j].getSpriteFrames();
                            if (args.framesHandler instanceof Function) {
                                frames = args.framesHandler(frames, movie);
                            }
                            let clip = cc.AnimationClip.createWithSpriteFrames(frames, args.frameRate);
                            if (args.clipHandler instanceof Function) {
                                clip = args.clipHandler(clip, movie);
                            }
                            clip.name = clipName;
                            clip.wrapMode = args.wrapMode;
                            movie.addClip(clip);
                            movie.play(clipName);
                        }
                    }
                    args.onStart instanceof Function && args.onStart();
                }
            });
        }
    }

    hasClip(clipName: string): boolean {
        let clips = this.getClips();
        for (let clip of clips) {
            if (clip.name == clipName) {
                return true;
            }
        }
        return false;
    }

    getFrameCount(): number {
        return this.currentClip.curveData.comps["cc.Sprite"].spriteFrame.length;
    }

    static addFrameEvent(clip: cc.AnimationClip, frames: number[]) {
        for (let frame of frames) {
            clip.events.push({
                frame: frame / clip.sample,
                func: "onFrameEvent",
                params: [frame as any]
            });
        }
    }

    onFrameEvent(frame: number) {
        this.node.emit(Movie.CustomEvent.FrameEvent, frame);
    }
}