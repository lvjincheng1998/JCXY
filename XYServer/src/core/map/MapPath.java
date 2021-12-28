package core.map;

import core.value_type.Vec2;

import java.util.ArrayList;

public class MapPath {
    /**
     * 路径的关键点记录列表
     * 顺序【终点：起点】
     */
    public final ArrayList<Vec2> points;
    /**
     * 当前路径点索引，用于把列表当队列用
     */
    private int index;
    /**
     * 模拟运动-起点
     */
    private Vec2 origin;
    /**
     * 模拟运动后，输出的点序列，上一次记录清除
     * 顺序【起点：终点】
     */
    public ArrayList<Vec2> outs;

    /**
     *  创建一个地图路径
     * @param points A*算出的点路径，顺序【终点：起点】
     */
    public MapPath(ArrayList<Vec2> points) {
        this.points = points;
        index = points.size() - 1;
        origin = validCount() > 0 ? next() : null;
    }

    /**
     * 查看队列中还有几个未使用的点
     * @return 点的数量
     */
    public int validCount() {
        return index + 1;
    }

    /**
     * 下一个点出列
     * @return 点坐标
     */
    public Vec2 next() {
        return points.get(index--);
    }

    /**
     *  查看下一个点
     * @return 点坐标
     */
    public Vec2 peek() {
        return points.get(index);
    }

    /**
     * 模拟运动
     * @param speed 运动速度
     * @param dt 运动时间
     * @return 终点坐标
     */
    public Vec2 go(double speed, double dt) {
        double dx = speed * dt;
        outs = new ArrayList<>();
        Vec2 org = origin;
        while (validCount() > 0 && dx > 0) {
            Vec2 nextPos = peek().copy();
            Vec2 vec = nextPos.sub(origin);
            double mag = vec.mag();
            if (dx < mag) {
                origin = vec.mulSelf(dx / mag).addSelf(origin);
                outs.add(origin);
                break;
            }
            origin = next();
            outs.add(origin);
            if (dx == mag) break;
            dx -= mag;
        }
        if (outs.size() > 0) outs.add(0, org);
        return origin;
    }
}
