package core.event;

import java.util.ArrayList;

public class EventBox {
    private ArrayList<EventPack> eventPacks = new ArrayList<>();

    public void on(String eventName, Runnable callback) {
        on(eventName, callback, null);
    }

    public void on(String eventName, Runnable callback, Object target) {
        EventPack eventPack = new EventPack();
        eventPack.eventName = eventName;
        eventPack.callback = callback;
        eventPack.target = target;
        eventPack.isValid = true;
        eventPacks.add(eventPack);
    }

    public void offTarget(Object target) {
        eventPacks.stream().filter(eventPack -> eventPack.target == target)
            .forEach(eventPack -> eventPack.isValid = false);
    }

    public void off(String eventName) {
        if (eventName == null) return;
        eventPacks.stream().filter(eventPack -> eventPack.eventName.equals(eventName))
            .forEach(eventPack -> eventPack.isValid = false);
    }

    public void off(String eventName, Runnable callback) {
        if (eventName == null) return;
        eventPacks.stream().filter(eventPack -> eventPack.eventName.equals(eventName) && eventPack.callback == callback)
            .forEach(eventPack -> eventPack.isValid = false);
    }

    public void off(String eventName, Object target) {
        if (eventName == null) return;
        eventPacks.stream().filter(eventPack -> eventPack.eventName.equals(eventName) && eventPack.target == target)
            .forEach(eventPack -> eventPack.isValid = false);
    }

    public void off(String eventName, Runnable callback, Object target) {
        if (eventName == null) return;
        eventPacks.stream().filter(eventPack -> eventPack.eventName.equals(eventName)
                && eventPack.callback == callback && eventPack.target == target
        ).forEach(eventPack -> eventPack.isValid = false);
    }

    public void emit(String eventName, Object... args) {
        eventPacks.forEach(eventPack -> {
            if (!eventPack.isValid) return;
            try {
                if (!eventPack.eventName.equals(eventName)) return;
                if (eventPack.callback instanceof Callback) {
                    ((Callback) eventPack.callback).args = args;
                }
                eventPack.callback.run();
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
        eventPacks.removeIf(eventPack -> !eventPack.isValid);
    }

    public static abstract class Callback implements Runnable {
        public Object[] args;
    }

    private static class EventPack {
        String eventName;
        Runnable callback;
        Object target;
        boolean isValid;
    }
}
