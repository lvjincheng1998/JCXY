package game;

import pers.jc.engine.JCEngine;

public class Boot {

    public static void main(String[] args) {
        Map.init();
        JCEngine.scanPackage("game.component");
        JCEngine.boot(9888, "/XY", Player.class);
    }
}
