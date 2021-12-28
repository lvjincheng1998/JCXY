import ViewModel from "../core/ViewModel";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ModalPopup extends ViewModel {
    @property(cc.Node)
    panelNode: cc.Node = null;
    @property(cc.Label)
    titleLabel: cc.Label = null;
    @property(cc.Label)
    contentLabel: cc.Label = null;
    @property(cc.Button)
    btnConfirm: cc.Button = null;
    @property(cc.Button)
    btnCancel: cc.Button = null;
    
    data: ModalPopupObject;

    onLoad() {
        super.onLoad();
        
        //获取数据
        this.data = this.params[0];
        //设置显示内容
        this.titleLabel.string = this.data.title;
        this.contentLabel.string = this.data.content;
        if (this.data.contentHorizontalAlign != undefined) this.contentLabel.horizontalAlign = this.data.contentHorizontalAlign;
        //设置X坐标
        if (typeof this.data.x == "number") this.panelNode.x += this.data.x;
        //
        //添加监听
        this.btnConfirm.node.on(cc.Node.EventType.TOUCH_END, () => {
            this.btnConfirm.enabled = false;
            this.btnCancel.enabled = false;
            this.quit();
            if (this.data.confirm instanceof Function) this.data.confirm(); 
        });
        this.btnCancel.node.on(cc.Node.EventType.TOUCH_END, () => {
            this.btnConfirm.enabled = false;
            this.btnCancel.enabled = false;
            this.quit();
            if (this.data.cancel instanceof Function) this.data.cancel(); 
        });
        //loaded
        if (this.data.loaded instanceof Function) this.data.loaded();
    }

    quit() {
        cc.tween(this.panelNode).then(cc.scaleTo(0.1, 0, 0)).then(cc.callFunc(() => {
            this.node.destroy();
        })).start();
    }
}
declare global {
    interface ModalPopupObject {
        title: string;
        content: string;
        contentHorizontalAlign?: cc.Label.HorizontalAlign;
        x?: number;
        confirm?: Function;
        cancel?: Function;
        loaded?: Function;
    }
}
