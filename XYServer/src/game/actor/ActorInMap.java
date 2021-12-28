package game.actor;

import com.alibaba.fastjson.annotation.JSONField;
import core.event.EventBox;
import core.map.MapPath;
import core.value_type.Vec2;
import game.Map;
import game.Player;
import game.PlayerClientAPI;
import pers.jc.engine.JCEngine;
import java.util.ArrayList;
import java.util.HashMap;

public class ActorInMap {
    public static final HashMap<Integer, ActorInMap> actorMap = new HashMap<>();

    public final int id = JCEngine.getAutoIncrementID(ActorInMap.class);

    public ActorInMap() {
        actorMap.put(id, this);
    }

    public void destroy() {
        eventBox.emit(EventType.Destroy);
        actorMap.remove(id, this);
    }

    @JSONField(serialize = false)
    public Player player;

    @JSONField(serialize = false)
    public Map map;
    public int mapID;

    public void onEnterMap() {
        if (player != null) player.call(PlayerClientAPI.enterMap, this);
    }

    public void onLeaveMap() {

    }

    /**
     * 当前所处位置的地图坐标
     */
    public Vec2 position;
    /**
     * 目的地位置的地图坐标，通过寻路生成
     */
    public Vec2 destination;
    /**
     * 寻路后生成的路径
     */
    @JSONField(serialize = false)
    public MapPath movePath;
    /**
     * 队员是否应该保持行走状态
     * 队员同步坐标时，因为延时造成站立和行走的切换，影响观看体验
     */
    public Boolean keepRunningInTeam;
    /**
     * 最终面朝向（1：右下；2：左下；3：左上；4：右上）
     * 解决寻路完后各个客户端可能面向不一致的问题
     */
    public int face = 1;

    public void move(double desX, double desY) {
        //终点坐标不可达，退出
        if (!map.mapGuider.isCanReach(desX, desY)) return;

        //终点坐标可达，创建路径，并记录终点坐标
        Vec2 endPos = new Vec2(desX, desY).intSelf();
        movePath = map.mapGuider.getPath(position, endPos);
        destination = endPos;

        //及时反馈自己的角色
        if (player != null) player.call(PlayerClientAPI.syncMyActorInMap, this);
    }

    /**
     * 帧驱动更新
     * @param dt 时间间隔
     */
    public void update(double dt) {
        if (movePath != null && movePath.validCount() > 0) {
            position = movePath.go(240, dt).intSelf();
            autoSetFace();
        }
    }

    /**
     * 根据当前移动生成的点序列设置最终朝向
     */
    protected void autoSetFace() {
        ArrayList<Vec2> points = movePath.outs;
        if (points.size() >= 2) {
            Vec2 p2 = points.get(points.size() - 1);
            Vec2 p1 = points.get(points.size() - 2);
            Vec2 v = p2.sub(p1);
            setFaceByVector(v);
        }
    }

    /**
     * 根据两点间的A*寻路路径设置最终朝向
     * @param p1 起点
     * @param p2 终点
     */
    protected void setFaceByAStar(Vec2 p1, Vec2 p2) {
        MapPath path = map.mapGuider.getPath(p1, p2);
        if (path.points.size() >= 2) {
            p2 = path.points.get(0);
            p1 = path.points.get(1);
            Vec2 v = p2.sub(p1);
            setFaceByVector(v);
        }
    }

    /**
     * 根据方向向量设置最终朝向
     * @param v 方向向量
     */
    private void setFaceByVector(Vec2 v) {
        if (v.mag() > 0) {
            if (v.x >= 0 && v.y > 0) face = 4;
            if (v.x >= 0 && v.y <= 0) face = 1;
            if (v.x < 0 && v.y > 0) face = 3;
            if (v.x < 0 && v.y <= 0) face = 2;
        }
    }

    @JSONField(serialize = false)
    public EventBox eventBox = new EventBox();

    public static class EventType {
        public static String Destroy = "Destroy";
    }
}
