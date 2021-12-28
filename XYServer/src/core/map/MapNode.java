package core.map;

/**A*寻路算法的网格节点 */
public class MapNode {
    private MapAStar mapAStar;
    public MapNode parent;
    public int x;
    public int y;
    private double f;
    private double g;
    private double h;
    public String key;

    public MapNode (int x, int y, MapNode parent, MapAStar mapAStar) {
        this.mapAStar = mapAStar;
        this.parent = parent;
        this.x = x;
        this.y = y;
        this.g = parent != null ? parent.g + Math.sqrt(Math.pow(x - parent.x, 2) + Math.pow(y - parent.y, 2)) : 0;
        this.h = mapAStar.endNode != null ? Math.abs(mapAStar.endNode.x - x) + Math.abs(mapAStar.endNode.y - y) : 0;
        this.f = g + h + turnCost();
        this.key = x + "," + y;
    }

    public int turnCost() {
        if (parent == null || parent.parent == null) return 0;
        int dx1 = parent.x - parent.parent.x;
        int dy1 = parent.y - parent.parent.y;
        int dx2 = x - parent.x;
        int dy2 = y - parent.y;
        return dx1 == dx2 && dy1 == dy2 ? 0 : 1000;
    }

    public boolean isOpen() {
        return mapAStar.openKeySet.contains(key);
    }

    public boolean isClose() {
        return mapAStar.closeKeySet.contains(key);
    }

    public int compareTo(MapNode node) {
        double value = f - node.f;
        if (value > 0) return 1;
        if (value < 0) return -1;
        return 0;
    }

    public boolean equal(MapNode node) {
        return node.x == x && node.y == y;
    }

    public boolean isEnd() {
        return equal(mapAStar.endNode);
    }
}
