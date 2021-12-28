import SingleClass from "../core/SingleClass";
import ViewModel from "../core/ViewModel";
import BattleDriver from "../game/BattleDriver";
import BattleView from "../view/BattleView";

export default class BattleMgr extends SingleClass {

    static ins(): BattleMgr {
        return super.ins();
    }

    /**
     * 缓存在战斗页面实例化完成前收到的Orders
     */
     private ordersCache: any[]; 

     enterBattle(actors, playerActorIDs, isPVP) {
         this.ordersCache = [];
         ViewModel.open({
             prefab: "prefab/view/BattleView",
             parent: cc.find("Canvas"),
             onComplete: () => {
                 BattleDriver.ins.init(actors, playerActorIDs, isPVP);
                 this.pushOrderChaches();
             }
         });
     }
 
     pushBattleOrders(orders) {
         if (BattleDriver.ins) {
             this.pushOrderChaches();
             BattleDriver.ins.orders.push.apply(BattleDriver.ins.orders, orders);
         } else {
             this.ordersCache.push.apply(this.ordersCache, orders);
         }
     }
     
     private pushOrderChaches() {
         if (this.ordersCache) {
             BattleDriver.ins.orders.push.apply(BattleDriver.ins.orders, this.ordersCache);
             this.ordersCache = null;
         }
     }
 
     autoBattle: boolean = false;
     setAutoBattle(autoBattle) {
         this.autoBattle = autoBattle;  
         if (BattleView.ins) {
             BattleView.ins.refreshAutoBattle();
         }
     }
 
     waitOperateForPet() {
         BattleView.ins.waitOperateForPet();
     }
 
     waitOperateEnd() {
         BattleView.ins.endWaitOperate();
     }
}
