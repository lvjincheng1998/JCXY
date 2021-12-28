import ViewModel from "../core/ViewModel";

const {ccclass, property} = cc._decorator;

@ccclass
export default class TipPopup extends ViewModel {
    data: TipPopupObject;

    onLoad() {
        super.onLoad();

        //获取数据
        this.data = this.params[0];
        //添加监听-点击销毁
        this.node.children[0].on(cc.Node.EventType.TOUCH_END, this.quit, this);
        //设置显示内容
        this.node.getComponentInChildren(cc.Label).string = this.data.content;
        //设置持续时间
        let delayTime = typeof this.data.duration == "number" && this.data.duration > 0 ? this.data.duration : 1500;
        delayTime /= 1000;
        cc.tween(this.node).delay(delayTime).then(cc.fadeOut(0)).to(0.3, {height: 0}).then(cc.destroySelf()).start();
        //设置X坐标
        if (typeof this.data.x == "number") this.node.x = this.data.x;
    }

    quit() {
        cc.Tween.stopAllByTarget(this.node);
        cc.tween(this.node).then(cc.fadeOut(0)).to(0.3, {height: 0}).then(cc.destroySelf()).start();
    }
}
declare global {
    interface TipPopupObject {
        content: string;
        duration?: number;
        x?: number;
    }
}