package core.map;

import java.util.*;

/**A*寻路算法 */
public class MapAStar {
    public MapNode startNode;
    public MapNode endNode;
    public PriorityQueue<MapNode> openQueue;
    public HashSet<String> openKeySet;
    public HashSet<String> closeKeySet;
    public int[][] matrix;
    public int row;
    public int column;

    public MapNode calculate(int startX, int startY, int endX, int endY, int[][] matrix) {
        this.startNode = new MapNode(startX, startY, null, this);
        this.endNode = new MapNode(endX, endY, null, this);
        this.openQueue = new PriorityQueue<>((o1, o2) -> o1.compareTo(o2));
        this.openKeySet = new HashSet<>();
        this.closeKeySet = new HashSet<>();
        this.matrix = matrix;
        this.row = matrix.length;
        this.column = matrix[0].length;

        MapNode target = startNode;
        openNode(target);
        while (target != null && !target.isEnd()) {
            closeNode(target);
            openNearbyNode(-1, 0, target);
            openNearbyNode(1, 0, target);
            openNearbyNode(0, -1, target);
            openNearbyNode(0, 1, target);
            openNearbyNode(1, 1, target);
            openNearbyNode(1, -1, target);
            openNearbyNode(-1, 1, target);
            openNearbyNode(-1, -1, target);
            target = openQueue.poll();
        }
        return target;
    }

    private void openNearbyNode(int offsetX, int offsetY, MapNode node) {
        int x = node.x + offsetX;
        int y = node.y + offsetY;
        if (x < 0 ||x >= column) return;
        if (y < 0 || y >= row) return;
        if (matrix[y][x] == MapRectType.RED) return;
        if (offsetX != 0 && offsetY != 0) {
            if (
                matrix[node.y][x] == MapRectType.RED ||
                matrix[y][node.x] == MapRectType.RED
            ) return;
        }
        MapNode newNode = new MapNode(x, y, node, this);
        boolean isOpen = newNode.isOpen();
        boolean isClose = newNode.isClose();
        if (isOpen) {
            if (newNode.compareTo(node) <= 0) updateNode(newNode);
        } else {
            if (!isClose) openNode(newNode);
        }
    }

    private void openNode(MapNode node) {
        openKeySet.add(node.key);
        openQueue.add(node);
    }

    private void closeNode(MapNode node) {
        openKeySet.remove(node.key);
        closeKeySet.add(node.key);
    }

    private void updateNode(MapNode newNode) {
        ArrayList<MapNode> openList = openQueue.list();
        for (int i = 0; i < openList.size(); i++) {
            MapNode node = openList.get(i);
            if (node.equal(newNode)) {
                openList.remove(i);
                openQueue.add(newNode);
                return;
            }
        }
    }
}
