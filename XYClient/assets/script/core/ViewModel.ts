const {ccclass, property} = cc._decorator;

@ccclass
export default class ViewModel extends cc.Component {
    @property
    private _enableWidget: boolean = true;
    @property
    set enableWidget(value) {
        this._enableWidget = value;
        this._checkWidget();
    }
    get enableWidget() {
        return this._enableWidget;
    }
    @property
    private _enableBlockInputEvents: boolean = true;
    @property
    get enableBlockInputEvents() {
        return this._enableBlockInputEvents;
    }
    set enableBlockInputEvents(value) {
        this._enableBlockInputEvents = value;
        this._checkBlockInputEvents();
    }
    @property
    private _enableBgColor: boolean = true;
    @property
    get enableBgColor() {
        return this._enableBgColor;
    }
    set enableBgColor(value) {
        this._enableBgColor = value;
        this._renderBgColor();
    }
    @property
    private _bgColor: cc.Color = cc.color(0, 0, 0, 155);
    @property({
        visible: function() {
            return this.enableBgColor; 
        }
    })
    get bgColor() {
        return this._bgColor;
    }
    set bgColor(value) {
        this._bgColor = value;
        this._renderBgColor();
    }

    public params: any[] = [];

    onLoad() {
        this._checkWidget();
        this._checkBlockInputEvents();
        this._renderBgColor();

        this.node.on(cc.Node.EventType.SIZE_CHANGED, this._renderBgColor, this);
    }

    private _checkWidget() {
        if (CC_EDITOR) return;
        if (this.enableWidget) {
            let widget = this.node.getComponent(cc.Widget);
            if (!widget) {
                widget = this.node.addComponent(cc.Widget);
                widget.left = 0;
                widget.right = 0;
                widget.top = 0;
                widget.bottom = 0;
                widget.isAlignLeft = true;
                widget.isAlignRight = true;
                widget.isAlignTop = true;
                widget.isAlignBottom = true;
                widget.updateAlignment();
            }
        } else {
            this.node.removeComponent(cc.Widget);
        }
    }

    private _checkBlockInputEvents() {
        if (CC_EDITOR) return;
        if (this.enableBlockInputEvents) {
            let blockInputEvents = this.node.getComponent(cc.BlockInputEvents);
            if (!blockInputEvents) {
                this.node.addComponent(cc.BlockInputEvents);
            }
        } else {
            this.node.removeComponent(cc.BlockInputEvents);
        }
    }

    private _renderBgColor() {
        if (CC_EDITOR) return;
        if (this.enableBgColor) {
            let graphics = this.node.getComponent(cc.Graphics);
            if (!graphics) graphics = this.node.addComponent(cc.Graphics);
            graphics.clear();
            graphics.fillColor = this.bgColor;
            graphics.fillRect(-this.node.width / 2, -this.node.height / 2, this.node.width, this.node.height);
        } else {
            this.node.removeComponent(cc.Graphics);
        }
    }

    private static viewMap: Map<string, any> = new Map();
    
    public static open(vo: ViewObject) {
        if (vo.prefab instanceof cc.Prefab) {
            return this.initView(vo);
        }
        if (typeof vo.prefab == "string") {
            cc.resources.load(vo.prefab, cc.Prefab, (err: any, prefab: cc.Prefab) => {
                if (err) return;
                vo.prefab = prefab;
                this.initView(vo);
            });
        }
    }

    private static initView(vo: ViewObject) {
        if (vo.single) {
            this.deleteView(vo.prefab as cc.Prefab);
        }
        let node: cc.Node = cc.instantiate(vo.prefab as cc.Prefab);
        let uuid = (vo.prefab as any)._uuid;
        let views = this.viewMap.get(uuid);
        if (views instanceof Array) {
            views.push(node);
        } else {
            this.viewMap.set(uuid, node);
        }
        vo.params instanceof Array && (node.getComponent(ViewModel).params = vo.params);
        let parent = vo.parent ? vo.parent : cc.director.getScene();
        parent.addChild(node);
        vo.onComplete instanceof Function && vo.onComplete(node);
    }

    public static close(prefab: cc.Prefab | string) {
        if (prefab instanceof cc.Prefab) {
            this.deleteView(prefab)
        }
        if (typeof prefab == "string") {
            cc.resources.load(prefab, cc.Prefab, (err: any, prefab: cc.Prefab) => {
                if (err) return;
                this.deleteView(prefab);
            });
        }
    }

    private static deleteView(prefab: cc.Prefab) {
        let uuid = (prefab as any)._uuid;
        let views = this.viewMap.get(uuid);
        if (views instanceof cc.Node) {
            views.isValid && views.destroy();
        } else if (views instanceof Array) {
            for (let view of views) {
                (view as cc.Node).isValid && (view as cc.Node).destroy();
            }
        }
        this.viewMap.delete(uuid);
    }
}

interface ViewObject {
    prefab: cc.Prefab | string;
    parent?: cc.Node;
    single?: boolean; 
    params?: any[];
    onComplete?: (node: cc.Node) => void;
}