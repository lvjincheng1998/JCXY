const {ccclass, property} = cc._decorator;

/**地图矩阵中的矩形类型 */
export enum MapRectType { 
    /**超出边界 */
    OUT_BOUND = -1, 
    /**常规 */
    NONE = 0, 
    /**透明 */
    BLUE = 1, 
    /**阻塞 */
    RED = 2
};

/**
 * 地图组件
 * @description 地图加载、渲染、寻路
 * @author JC
 */
@ccclass
export default class MapGuider extends cc.Component {
    /**地图资源加载路径 */
    @property
    public path: string = "";

    /**地图矩阵数据 */
    private matrix: number[][];
    /**地图矩阵行数 */
    private rowCount: number;
    /**地图矩阵列数 */
    private columnCount: number;
    /**地图网格单元大小 */
    private gridSize: number;
    /**地图宽高 */
    private mapSize: cc.Size;
    /**地图基准点（左上角） */
    public basePoint: cc.Vec2;

    /**地图渲染的根节点 */
    private imageRootNode: cc.Node = null;
    /**地图是否加载并渲染完成 */
    private initialized: boolean = false;

    /**地图事件 */
    public static EventType = {
        Loaded: "Loaded",
        ClickPoint: "ClickPoint",
        LongPress: "LongPress"
    }

    /**脚本实例 */
    public static ins: MapGuider = null;

    public onLoad() {
        MapGuider.ins = this;
        this.load();
    }

    public onDestroy() {
        if (MapGuider.ins == this) {
            MapGuider.ins = null;
        }
    }

    public update(dt: number) {
        this.updateForTouch(dt);
    }

    public lateUpdate(dt: number) {
        this.updateCamera(dt);
    }

    private load() {
        if (!this.imageRootNode) {
            this.imageRootNode = new cc.Node("ImageRoot");
            this.node.addChild(this.imageRootNode);
        }
        this.imageRootNode.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.imageRootNode.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.imageRootNode.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);

        cc.resources.loadDir(this.path, cc.Asset, (error, assets) => {
            if (error) {
                return cc.error(error);
            }
            let imageAssets = [];
            let jsonAsset = null;
            for (let asset of assets) {
                if (asset instanceof cc.SpriteFrame) {
                    imageAssets.push(asset);
                } else if (asset instanceof cc.JsonAsset) {
                    jsonAsset = asset;
                }
            }
            this.loadComplete(imageAssets, jsonAsset);
        });
    }

    private loadComplete(imageAssets: cc.SpriteFrame[], jsonAsset: cc.JsonAsset) {
        if (imageAssets.length == 0 || !jsonAsset) return;

        this.matrix = jsonAsset.json.matrix;
        this.rowCount = jsonAsset.json.rowCount;
        this.columnCount = jsonAsset.json.columnCount;
        this.gridSize = jsonAsset.json.gridSize;
        this.mapSize = cc.size(jsonAsset.json.width, jsonAsset.json.height);
        this.basePoint = cc.v2(-this.mapSize.width / 2, this.mapSize.height / 2);
        
        this.imageRootNode.setContentSize(this.mapSize);

        let imageNodes: cc.Node[][] = [[]];
        for (let imageAsset of imageAssets) {
            let rowColumnStrings = imageAsset.name.split("_");
            let row = parseInt(rowColumnStrings[0]);
            let column = parseInt(rowColumnStrings[1]);
            let imageNode = new cc.Node(imageAsset.name);
            imageNode.setAnchorPoint(0, 1);
            imageNode.addComponent(cc.Sprite).spriteFrame = imageAsset;
            this.imageRootNode.addChild(imageNode);
            if (!(imageNodes[row] instanceof Array)) imageNodes[row] = [];
            imageNodes[row][column] = imageNode;
        }
        let y = 0;
        for (let r = 0; r < imageNodes.length; r++) {
            let x = 0;
            for (let c = 0; c < imageNodes[r].length; c++) {
                let image = imageNodes[r][c];
                image.setPosition(this.basePoint.add(cc.v2(x, y)))
                x += image.width;
                if (c == imageNodes[r].length - 1) y -= image.height;
            }
        }

        this.imageRootNode.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.imageRootNode.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.imageRootNode.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);

        this.initialized = true;

        this.node.emit(MapGuider.EventType.Loaded);
    }  

    private touching = false;
    private touchTime = 0;
    private isLongPress = false;
    private touchEvent: cc.Event.EventTouch;

    private onTouchStart(e: cc.Event.EventTouch) {
        this.touching = true;
        this.touchTime = 0;
        this.isLongPress = false;
        this.touchEvent = e;
    }

    private onTouchEnd(e: cc.Event.EventTouch) {
        this.touching = false;
        if (!this.isLongPress) this.emitClickPosition(e);
    }

    private onTouchCancel() {
        this.touching = false;
    }

    private updateForTouch(dt: number) {
        if (!this.touching) return;
        this.touchTime += dt;
        if (!this.isLongPress && this.touchTime >= 0.5) {
            this.isLongPress = true;
            this.emitLongPressPosition(this.touchEvent);
        }
    }

    private emitClickPosition(e: cc.Event.EventTouch) {
        this.node.emit(MapGuider.EventType.ClickPoint, this.locationToPosition(e.getLocation()));
    }

    private emitLongPressPosition(e: cc.Event.EventTouch) {
        this.node.emit(MapGuider.EventType.LongPress, this.locationToPosition(e.getLocation()));
    }

    private locationToPosition(location: cc.Vec2): cc.Vec2 {
        let centerLocation = cc.v2(cc.winSize.width / 2, cc.winSize.height / 2);
        let vec = location.sub(centerLocation);
        vec.mulSelf(1 / this.camera.zoomRatio);
        return this.camera.node.getPosition().addSelf(vec);
    }

    public isCanReach(x: number, y: number) {
        let rectType = this.getRectType(x, y);
        if (rectType == MapRectType.OUT_BOUND) return false;
        if (rectType == MapRectType.RED) return false;
        return true;
    }

    public isCanReach2(row: number, column: number) {
        let rectType = this.getRectType2(row, column);
        if (rectType == MapRectType.OUT_BOUND) return false;
        if (rectType == MapRectType.RED) return false;
        return true;
    }

    public getRectType(x: number, y: number): MapRectType {
        if (!this.initialized) return MapRectType.OUT_BOUND;
        let row = this.getRow(y);
        let column = this.getColumn(x);
        return this.getRectType2(row, column);
    }

    public getRectType2(row: number, column: number): MapRectType {
        if (!this.initialized) return MapRectType.OUT_BOUND;
        if (this.isOutBound(row, column)) {
            return MapRectType.OUT_BOUND;
        }
        return this.matrix[row][column];
    }

    public getPosition(row: number, column: number): cc.Vec2 {
        return cc.v2(
            this.basePoint.x + column * this.gridSize, 
            this.basePoint.y - row * this.gridSize
        );
    }

    public getRow(y: number): number {
        return Math.floor((this.basePoint.y - y) / this.gridSize);
    }

    public getColumn(x: number): number {
        return Math.floor((x - this.basePoint.x) / this.gridSize);
    }

    public isOutBound(row: number, column: number): boolean {
        return row < 0 || column < 0 || row >= this.rowCount || column >= this.columnCount;
    }

    public getPath(startPoint: cc.Vec2, endPoint: cc.Vec2): {x: number, y: number}[] {
        let outList = [];
        if (!this.initialized) {
            return outList;
        }
        if (startPoint.equals(endPoint)) {
            return outList;
        }
        let endX = Math.floor((endPoint.x - this.basePoint.x) / this.gridSize);
        let endY = Math.floor((this.basePoint.y - endPoint.y) / this.gridSize);
        if (this.isOutBound(endY, endX) || this.matrix[endY][endX] == MapRectType.RED) {
            return outList;
        }
        let startX = Math.floor((startPoint.x - this.basePoint.x) / this.gridSize);
        let startY = Math.floor((this.basePoint.y - startPoint.y) / this.gridSize);
        let target = MapNode.calculate(startX, startY, endX, endY, this.matrix);
        while (target) {
            outList.push(target);
            target = target.parent;
        }
        if (outList.length > 0) {
            for (let node of outList) {
                node.x = this.basePoint.x + node.x * this.gridSize;
                node.y = this.basePoint.y - node.y * this.gridSize;
            }
            if (outList.length < 3) {
                outList = [startPoint, endPoint];
            } else {
                //近距离移动轨迹优化
                let vec = endPoint.sub(startPoint);
                let mag = vec.mag();
                let canLine = false;
                if (mag < 1000) {
                    canLine = true;
                    let i = 0;
                    while (i < mag) {
                        i++;
                        if (i >= mag) i = mag;
                        let rectType = this.getRectType(startPoint.x + vec.x * i / mag, startPoint.y + vec.y * i / mag);
                        if (rectType == MapRectType.RED || rectType == MapRectType.OUT_BOUND) {
                            canLine = false;
                            break;
                        }
                    }
                    if (canLine) {
                        outList = [startPoint, endPoint];
                    }
                }
                //不能优化则按A*轨迹
                if (!canLine) {
                    outList.reverse();
                    outList[0] = startPoint;
                    outList[outList.length - 1] = endPoint;
                }
            }
        }
        return outList;
    }

    public drawPath(path: {x: number, y: number}[]) {
        this.imageRootNode.getChildByName("PathDrawer")?.destroy();
        let pd = new cc.Node("PathDrawer").addComponent(cc.Graphics);
        pd.lineWidth = 5;
        pd.strokeColor = cc.Color.WHITE;
        this.imageRootNode.addChild(pd.node);
        for (let node of path) {
            let x = node.x - this.basePoint.x;
            let y = this.basePoint.y - node.y;
            x /= this.gridSize;
            y /= this.gridSize;
            x = x << 0;
            y = y << 0;
            x = this.basePoint.x + x * this.gridSize;
            y = this.basePoint.y - y * this.gridSize;
            pd.rect(x, y - this.gridSize, this.gridSize, this.gridSize);
            pd.stroke();
        }
    } 

    public static nextPosition(position: cc.Vec2, path: {x: number, y: number}[], speed: number, dt: number) {
        let dx = speed * dt;
        let pos: cc.Vec2 = position;
        while (path.length > 0 && dx > 0) {
            let nextPos = cc.Vec2.clone(path[0]);
            let vec = nextPos.sub(pos);
            let mag = vec.mag();
            if (dx < mag) {
                pos = vec.mulSelf(dx / mag).addSelf(pos);
                break;
            }
            path.shift();
            pos = nextPos;
            if (dx == mag) break;
            dx -= mag;
        }
        return pos;
    }

    private camera: cc.Camera = null;
    private cameraNode: cc.Node = null;
    private cameraTarget: cc.Node = null;
    private cameraV2a: cc.Vec2 = cc.v2();
    private cameraV2b: cc.Vec2 = cc.v2();
    private cameraV2c: cc.Vec2 = cc.v2();

    public initCamera(cameraNode: cc.Node, target: cc.Node) {
        this.camera = cameraNode instanceof cc.Node ? cameraNode.getComponent(cc.Camera) : null;
        this.cameraNode = cameraNode;
        this.cameraTarget = target;
        this.updateCamera(0, false);
    }

    private updateCamera(dt: number, lerp: boolean = true) {
        if (!this.cameraNode || !this.cameraNode.isValid) return;
        if (!this.cameraTarget || !this.cameraTarget.isValid) return;
        if (!MapGuider.ins || !MapGuider.ins.initialized) return;
        let winWidthHalf = cc.winSize.width / 2 / this.camera.zoomRatio;
        let borderLeft = -MapGuider.ins.mapSize.width / 2;
        let borderRight = MapGuider.ins.mapSize.width / 2;
        let roleLeftX = this.cameraTarget.x - winWidthHalf;
        let roleRightX = this.cameraTarget.x + winWidthHalf;
        if (roleLeftX < borderLeft) this.cameraV2b.x = borderLeft + winWidthHalf;
        else if (roleRightX > borderRight) this.cameraV2b.x = borderRight - winWidthHalf;
        else this.cameraV2b.x = this.cameraTarget.x;
        let winHeightHalf = cc.winSize.height / 2 / this.camera.zoomRatio;
        let borderUp = MapGuider.ins.mapSize.height / 2;
        let borderDown = -MapGuider.ins.mapSize.height / 2;
        let roleUpY = this.cameraTarget.y + winHeightHalf;
        let roleDownY = this.cameraTarget.y - winHeightHalf;
        if (roleUpY > borderUp) this.cameraV2b.y = borderUp - winHeightHalf;
        else if (roleDownY < borderDown) this.cameraV2b.y = borderDown + winHeightHalf;
        else this.cameraV2b.y = this.cameraTarget.y;
        this.cameraNode.getPosition(this.cameraV2a);
        if (this.cameraV2a.equals(this.cameraV2b)) return;
        let distance = cc.Vec2.distance(this.cameraV2a, this.cameraV2b);
        let lerpT = dt * 5 * distance / 30;
        if (lerp) lerpT = cc.misc.clampf(lerpT, 0.05, 1);
        else lerpT = 1;
        cc.Vec2.lerp(this.cameraV2c, this.cameraV2a, this.cameraV2b, lerpT);
        this.cameraNode.setPosition(this.cameraV2c);
    }
}

/**A*寻路算法的网格节点 */
class MapNode {
    public parent: MapNode;
    private x: number;
    private y: number;
    private f: number;
    private g: number;
    private h: number;
    private key: string;
    private static startNode: MapNode;
    private static endNode: MapNode;
    private static openQueue: PriorityQueue<MapNode>; //优化openList的排序速度，改用PriorityQueue
    private static openKeySet: Set<string>; //加快openList的查询速度，改用Set 
    private static closeKeySet: Set<string>; //加快closeList的查询速度，改用Set 
    private static matrix: number[][];
    private static row: number;
    private static column: number;

    constructor(x: number, y:number, parent: MapNode) {
        this.parent = parent;
        this.x = x;
        this.y = y;
        this.g = this.parent ? this.parent.g + Math.sqrt(Math.pow(x - parent.x, 2) + Math.pow(y - parent.y, 2)) : 0;
        this.h = MapNode.endNode ? Math.abs(MapNode.endNode.x - this.x) + Math.abs(MapNode.endNode.y - this.y) : 0;
        this.f = this.g + this.h + this.turnCost(); //避免路径中出现过多拐点，综合代价加入了拐弯成本
        this.key = `${this.x},${this.y}`;
    }

    private turnCost() { 
        if (!this.parent || !this.parent.parent) return 0;
        let dx1 = this.parent.x - this.parent.parent.x;
        let dy1 = this.parent.y - this.parent.parent.y;
        let dx2 = this.x - this.parent.x;
        let dy2 = this.y - this.parent.y;
        return dx1 == dx2 && dy1 == dy2 ? 0 : 1000;
	}

    private isOpen() {
        return MapNode.openKeySet.has(this.key);
    }

    private isClose() {
        return MapNode.closeKeySet.has(this.key);
    }

    private compareTo(node: MapNode) {
        return this.f - node.f;
    }

    private equal(node: MapNode) {
        return node.x == this.x && node.y == this.y;
    }

    private isEnd() {
        return this.equal(MapNode.endNode);
    }

    public static calculate(startX: number, startY: number, endX: number, endY: number, matrix: number[][]) {
        this.startNode = new MapNode(startX, startY, null);
        this.endNode = new MapNode(endX, endY, null);
        this.openQueue = new PriorityQueue<MapNode>((a, b) => a.compareTo(b));
        this.openKeySet = new Set();
        this.closeKeySet = new Set();
        this.matrix = matrix;
        this.row = this.matrix.length;
        this.column = this.matrix[0].length;

        let target = MapNode.startNode;
        MapNode.openNode(target);
        while (target && !target.isEnd()) {
            MapNode.closeNode(target);
            MapNode.openNearbyNode(-1, 0, target);
            MapNode.openNearbyNode(1, 0, target);
            MapNode.openNearbyNode(0, -1, target);
            MapNode.openNearbyNode(0, 1, target);
            MapNode.openNearbyNode(1, 1, target);
            MapNode.openNearbyNode(1, -1, target);
            MapNode.openNearbyNode(-1, 1, target);
            MapNode.openNearbyNode(-1, -1, target);
            target = MapNode.openQueue.poll();
        }
        return target;
    }

    private static openNearbyNode(offsetX: number, offsetY: number, node: MapNode) {
        let x = node.x + offsetX;
        let y = node.y + offsetY;
        if (x < 0 || x >= MapNode.column) return;
        if (y < 0 || y >= MapNode.row) return;
        if (MapNode.matrix[y][x] == MapRectType.RED) return;
        if (offsetX != 0 && offsetY != 0) {
            if (
                MapNode.matrix[node.y][x] == MapRectType.RED || 
                MapNode.matrix[y][node.x] == MapRectType.RED
            ) return;
        }
        let newNode = new MapNode(x, y, node);
        let isOpen = newNode.isOpen();
        let isClose = newNode.isClose();
        if (isOpen) {
            newNode.compareTo(node) <= 0 && MapNode.updateNode(newNode);
        } else {
            !isClose && MapNode.openNode(newNode);
        }
    }

    private static openNode(node: MapNode) {
        MapNode.openKeySet.add(node.key);
        MapNode.openQueue.add(node);
    }

    private static closeNode(node: MapNode) {
        MapNode.openKeySet.delete(node.key);
        MapNode.closeKeySet.add(node.key);
    }

    private static updateNode(newNode: MapNode) {
        let openList = MapNode.openQueue.getElems();
        for (let i = 0; i < openList.length; i++) {
            let node = openList[i];
            if (node.equal(newNode)) {
                openList.splice(i, 1);
                MapNode.openQueue.add(newNode);           
                return;
            }
        }
    }
}

/**优先队列 */
class PriorityQueue<T> {
    private elems: T[] = [];
    private comparator: Function = (a, b) => a - b;

    constructor(comparator: (a: T, b: T) => number) {
        this.comparator = comparator;
    }

    public add(elem: T) {
        let hasAdd = false;
        for (let i = 0; i < this.elems.length; i++) {
            if (this.comparator(elem, this.elems[i]) <= 0) {
                this.elems.splice(i, 0, elem);
                hasAdd = true;
                break;
            }
        }
        !hasAdd && this.elems.push(elem);
    }

    public poll(): T {
        return this.elems.length > 0 ? this.elems.shift() : null;  
    }

    public getElems() {
        return this.elems;
    }
}
