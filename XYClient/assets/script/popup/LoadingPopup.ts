import ViewModel from "../core/ViewModel";

const {ccclass, property} = cc._decorator;

@ccclass
export default class LoadingPopup extends ViewModel {
    @property(cc.Label)
    label: cc.Label = null;

    title: string = "请耐心等待";
    pointCount: number = 0;
    pointCountMax: number = 3;

    data: LoadingPopupObject;

    onLoad() {
        super.onLoad();
        this.data = this.params[0];
        if (typeof this.data.title == "string") this.title = this.data.title; 
        this.updateLabel();
        this.schedule(this.updateLabel, 0.5);
    }

    updateLabel() {
        this.pointCount++;
        this.pointCount %= this.pointCountMax + 1;
        let str = this.title;
        for (let i = 0; i < this.pointCount; i++) str += ".";
        this.label.string = str; 
    }
}
declare global {
    interface LoadingPopupObject {
        title?: string;
    }
}
