package game.actor;

import com.alibaba.fastjson.JSONObject;

public class ActorState implements Cloneable {
    public int hp = 100;
    public int hpMax = 100;
    public int mp = 60;
    public int mpMax = 60;
    public int atkPS = 32;
    public int atkMG = 22;
    public int defPS = 20;
    public int defMG = 12;
    public int speed = 8;
    public int fatalPS = 300; //千分制
    public int fatalMG = 200; //千分制
    public int ti_up = 1000; //千分制
    public int mo_up = 1000; //千分制
    public int li_up = 1000; //千分制
    public int nai_up = 1000; //千分制
    public int min_up = 1000; //千分制
    public int grow_up = 1000; //千分制

    private int level;

    public void setLevel(int level) {
        this.level = level;
    }

    private int weaponLevel;

    public void setWeapon(int weaponID) {
        this.weaponLevel = weaponID % 1000 + 1;
    }

    public void refresh() {
        hpMax = (int) ((level + 1) * ti_up / 1000 * grow_up / 1000 * 100.0);
        if (hp > hpMax) hp = hpMax;
        mpMax = (int) ((level + 1) * mo_up / 1000 * grow_up / 1000 * 60.0);
        if (mp > mpMax) mp = mpMax;
        atkPS = (int) ((level + 1) * li_up / 1000 * grow_up / 1000 * 32.0);
        atkMG = (int) ((level + 1) * mo_up / 1000 * grow_up / 1000 * 22.0);
        defPS = (int) ((level + 1) * nai_up / 1000 * grow_up / 1000 * 20.0);
        defMG = (int) ((level + 1) * mo_up / 1000 * grow_up / 1000 * 12.0);
        speed = (int) ((level + 1) * min_up / 1000 * grow_up / 1000 * 8.0);
        //武器附加攻击
        atkPS += Math.pow(weaponLevel, 2.5) * 32;
        atkMG += Math.pow(weaponLevel, 2.5) * 22;
    }

    public void fullHpMp() {
        hp = hpMax;
        mp = mpMax;
    }

    @Override
    public String toString() {
        return JSONObject.toJSONString(this);
    }

    public ActorState clone() {
        ActorState clone = null;
        try {
            clone = (ActorState) super.clone();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return clone;
    }
}
