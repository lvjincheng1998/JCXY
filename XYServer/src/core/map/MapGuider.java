package core.map;

import com.alibaba.fastjson.JSONObject;
import core.value_type.Vec2;
import java.util.ArrayList;

public class MapGuider {
    /**地图矩阵数据 */
    private int[][] matrix;
    /**地图矩阵行数 */
    private int rowCount;
    /**地图矩阵列数 */
    private int columnCount;
    /**地图网格单元大小 */
    private int gridSize;
    /**地图宽高 */
    private Vec2 mapSize;
    /**地图基准点（左上角） */
    public Vec2 basePoint;

    public void load(JSONObject data) {
        try {
            this.matrix = data.getJSONArray("matrix").toJavaObject(int[][].class);
            this.rowCount = data.getIntValue("rowCount");
            this.columnCount = data.getIntValue("columnCount");
            this.gridSize = data.getIntValue("gridSize");
            this.mapSize = new Vec2(data.getIntValue("width"), data.getIntValue("height"));
            this.basePoint = new Vec2(-this.mapSize.x / 2, this.mapSize.y / 2);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public boolean isCanReach(double x, double y) {
        int rectType = getRectType(x, y);
        if (rectType == MapRectType.OUT_BOUND) return false;
        if (rectType == MapRectType.RED) return false;
        return true;
    }

    public boolean isCanReach2(int row, int column) {
        int rectType = getRectType2(row, column);
        if (rectType == MapRectType.OUT_BOUND) return false;
        if (rectType == MapRectType.RED) return false;
        return true;
    }

    public int getRectType(double x, double y) {
        int row = getRow(y);
        int column = getColumn(x);
        return getRectType2(row, column);
    }

    public int getRectType2(int row, int column) {
        if (isOutBound(row, column)) {
            return MapRectType.OUT_BOUND;
        }
        return this.matrix[row][column];
    }

    public Vec2 getPosition(int row, int column) {
        return getPosition(row, column, new Vec2());
    }

    public Vec2 getPosition(int row, int column, Vec2 out) {
        out.x = this.basePoint.x + column * this.gridSize;
        out.y = this.basePoint.y - row * this.gridSize;
        return out;
    }

    public int getRow(double y) {
        return (int) ((this.basePoint.y - y) / this.gridSize);
    }

    public int getColumn(double x) {
        return (int) ((x - this.basePoint.x) / this.gridSize);
    }

    public boolean isOutBound(int row, int column) {
        return row < 0 || column < 0 || row >= this.rowCount || column >= this.columnCount;
    }

    public MapPath getPath(Vec2 startPoint, Vec2 endPoint) {
        ArrayList<Vec2> points = new ArrayList<>();
        if (startPoint.equals(endPoint)) {
            return new MapPath(points);
        }
        int endX = (int) ((endPoint.x - this.basePoint.x) / this.gridSize);
        int endY = (int) ((this.basePoint.y - endPoint.y) / this.gridSize);
        if (isOutBound(endY, endX) || this.matrix[endY][endX] == MapRectType.RED) {
            return new MapPath(points);
        }
        int startX = (int) ((startPoint.x - this.basePoint.x) / this.gridSize);
        int startY = (int) ((this.basePoint.y - startPoint.y) / this.gridSize);
        MapNode mapNode = new MapAStar().calculate(startX, startY, endX, endY, this.matrix);
        while (mapNode != null) {
            int x = (int) (this.basePoint.x + mapNode.x * this.gridSize);
            int y = (int) (this.basePoint.y - mapNode.y * this.gridSize);
            points.add(new Vec2(x, y));
            mapNode = mapNode.parent;
        }
        if (points.size() > 0) {
            boolean canLine = true;
            if (points.size() >= 3) {
                //近距离移动轨迹优化
                Vec2 vec = endPoint.sub(startPoint);
                double mag = vec.mag();
                if (mag < 1000) {
                    double i = 0;
                    while (i < mag) {
                        i++;
                        if (i >= mag) i = mag;
                        double nextX = startPoint.x + vec.x * i / mag;
                        double nextY = startPoint.y + vec.y * i / mag;
                        int rectType = getRectType(nextX, nextY);
                        if (rectType == MapRectType.RED || rectType == MapRectType.OUT_BOUND) {
                            canLine = false;
                            break;
                        }
                    }
                } else {
                    canLine = false;
                }
            }
            if (canLine) {
                points.clear();
                points.add(endPoint);
                points.add(startPoint);
            } else {
                points.set(0, endPoint);
                points.set(points.size() - 1, startPoint);
            }
        }
        return new MapPath(points);
    }
}
