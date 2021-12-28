package core.map;

import java.util.ArrayList;
import java.util.Comparator;

public class PriorityQueue<T> {
    private ArrayList<T> nodes = new ArrayList<>();
    private Comparator<T> comparator;

    public PriorityQueue(Comparator<T> comparator) {
        this.comparator = comparator;
    }

    public void add(T elem) {
        boolean hasAdd = false;
        for (int i = 0; i < nodes.size(); i++) {
            if (comparator.compare(elem, nodes.get(i)) <= 0) {
                nodes.add(i, elem);
                hasAdd = true;
                break;
            }
        }
        if (!hasAdd) nodes.add(elem);
    }

    public T poll() {
        return nodes.size() > 0 ? nodes.remove(0) : null;
    }

    public ArrayList<T> list() {
        return nodes;
    }
}
