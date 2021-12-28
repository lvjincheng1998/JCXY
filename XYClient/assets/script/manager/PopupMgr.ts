import SingleClass from "../core/SingleClass";
import ViewModel from "../core/ViewModel";

export default class PopupMgr extends SingleClass {

    static ins(): PopupMgr {
        return super.ins();
    }

    showTip(object: TipPopupObject) {
        let layoutNode = cc.find("Canvas/TipsLayout");
        if (!layoutNode) {
            layoutNode = new cc.Node("TipsLayout");
            layoutNode.y = -30;
            layoutNode.anchorY = 0;
            layoutNode.zIndex = 1000;
            layoutNode.group = "ui";
            let layout = layoutNode.addComponent(cc.Layout);
            layout.type = cc.Layout.Type.VERTICAL;
            layout.resizeMode = cc.Layout.ResizeMode.CONTAINER;
            layout.verticalDirection = cc.Layout.VerticalDirection.TOP_TO_BOTTOM;
            layout.spacingY = 5;
            cc.find("Canvas").addChild(layoutNode);
        }
        ViewModel.open({
            prefab: "prefab/popup/TipPopup",
            parent: layoutNode,
            params: [object]
        });
    }

    showModal(object: ModalPopupObject) {
        ViewModel.open({
            prefab: "prefab/popup/ModalPopup",
            parent: cc.find("Canvas"),
            single: true,
            params: [object],
            onComplete: (node) => {
                node.group = "ui";
                node.zIndex = 1000;
            }
        });
    }

    preLoading() {
        cc.resources.preload("prefab/popup/LoadingPopup");
    }

    showLoading(object?: LoadingPopupObject) {
        if (object == undefined) object = {};
        ViewModel.open({
            prefab: "prefab/popup/LoadingPopup",
            parent: cc.find("Canvas"),
            single: true,
            params: [object],
            onComplete: (node) => {
                node.group = "ui";
                node.zIndex = 1000;
            }
        });
    }

    hideLoading() {
        ViewModel.close("prefab/popup/LoadingPopup");
    }
}
