package game;

import core.map.MapGuider;
import game.actor.ActorInMap;
import game.config.ConfigReader;
import java.util.*;

public class Map {
    private static final HashMap<Integer, Map> maps = new HashMap<>();

    public static Map get(int mapID) {
        return maps.get(mapID);
    }

    public static void init() {
        new Map(1010);
        maps.values().forEach(map -> {
            new FrameLoop() {
                @Override
                public void run() {
                    HashMap<String, ActorInMap> data = new HashMap<>();
                    map.actors.forEach((key, value) -> {
                        value.update(dt);
                        data.put(key.toString(), value);
                    });
                    String dataText = Player.packDataText(PlayerClientAPI.syncActorsInMap, map.mapID, data);
                    map.actors.values().forEach(value -> {
                        Player player = value.player;
                        if (player != null) {
                            player.sendDataText(dataText);
                        }
                    });
                }
            }.start(333);
        });
    }

    public final int mapID;
    public final MapGuider mapGuider;
    public final HashMap<Integer, ActorInMap> actors = new HashMap<>();

    private Map(int mapID) {
        this.mapID = mapID;
        this.mapGuider = new MapGuider();
        this.mapGuider.load(ConfigReader.readConfigAsJSONObject("map/" + mapID + ".json"));
        maps.put(this.mapID, this);
    }

    public void enter(ActorInMap actorInMap) {
        actorInMap.map = this;
        actorInMap.mapID = mapID;
        actorInMap.eventBox.on(ActorInMap.EventType.Destroy, () -> {
            leave(actorInMap);
        }, this);
        actors.put(actorInMap.id, actorInMap);
        actorInMap.onEnterMap();
    }

    public void leave(ActorInMap actorInMap) {
        actorInMap.map = null;
        actorInMap.mapID = 0;
        actorInMap.eventBox.offTarget(this);
        actors.remove(actorInMap.id, actorInMap);
        actorInMap.onLeaveMap();
    }
}
