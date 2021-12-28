package game;

import pers.jc.engine.JCEngine;

public abstract class FrameLoop {
    private long lastTime = System.currentTimeMillis();
    protected double dt = 0;

    private void updateTime() {
        long nowTime = System.currentTimeMillis();
        dt = (nowTime - lastTime) / 1000.0;
        lastTime = nowTime;
    }

    public void start(long interval) {
        JCEngine.director.scheduler.schedule(() -> {
            updateTime();
            run();
        }, interval);
    }

    public abstract void run();
}
