package game;

import com.alibaba.fastjson.JSONObject;
import game.actor.ActorInBattle;
import game.actor.ActorState;
import game.actor.RoleInMap;
import pers.jc.engine.JCEngine;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.concurrent.atomic.AtomicBoolean;

public class BattleDriver {
    public final ArrayList<ActorInBattle> actors = new ArrayList<>();
    public final ArrayList<BattleOrder> orders = new ArrayList<>();
    public final ArrayList<Integer> teamIDs = new ArrayList<>();
    /**
     * 当前所处回合
     */
    private int roundCount;
    /**
     * 操作等待倒计时（当前回合）
     */
    private int waitTime;
    /**
     * 战斗是否结束
     */
    public boolean isOver;
    /**
     * 已经执行过的回合数
     */
    private int processRoundCount;
    /**
     * 玩家战斗模型
     * Map<用户UID, 玩家模型>
     */
    private HashMap<Integer, PlayerBattleModel> playerBattleModels = new HashMap<>();

    public void start() {
        enterBattle();
        openNewRound(0);
    }

    private void end() {
        playerBattleModels.values().forEach(playerBattleModel -> {
            if (playerBattleModel.role != null) {
                ActorState state = playerBattleModel.role.state;
                state.hp = state.hpMax;
                state.mp = state.mpMax;
            }
            if (playerBattleModel.pet != null) {
                ActorState state = playerBattleModel.pet.state;
                state.hp = state.hpMax;
                state.mp = state.mpMax;
            }
        });
        removeIdKeys();
    }

    public void debug(Player player) {
        int monsterCount = 3;
        if (player.roleInMap != null && player.roleInMap.team != null) {
            player.roleInMap.team.members.forEach(roleInMap -> {
                joinIn(roleInMap.player);
            });
            if (player.roleInMap.team.members.size() > 1) {
                monsterCount = player.roleInMap.team.members.size() * 2;
            }
        } else {
            joinIn(player);
        }
        for (int i = 0; i < monsterCount; i++) {
            ActorInBattle actor = addActor(6093, 0, "玄武" + (i + 1),-1, i);
            actor.state = new ActorState();
            actor.state.setLevel(100);
            actor.state.refresh();
            actor.state.fullHpMp();
        }
        start();
    }

    private boolean isPVP = false;

    public void pvp(Player player, RoleInMap target) {
        if (target == null) return;
        Player targetPlayer = target.player;
        if (targetPlayer == null) return;
        if (player == targetPlayer) return;

        defaultTeamID = -111;
        if (player.roleInMap != null && player.roleInMap.team != null) {
            player.roleInMap.team.members.forEach(roleInMap -> {
                joinIn(roleInMap.player);
            });
        } else {
            joinIn(player);
        }

        defaultTeamID = -222;
        if (targetPlayer.roleInMap != null && targetPlayer.roleInMap.team != null) {
            targetPlayer.roleInMap.team.members.forEach(roleInMap -> {
                joinIn(roleInMap.player);
            });
        } else {
            joinIn(targetPlayer);
        }

        isPVP = true;
        start();
    }

    private int defaultTeamID = 0;

    public void joinIn(Player player) {
        player.battleDriver = this;
        PlayerBattleModel playerBattleModel = new PlayerBattleModel();
        playerBattleModel.player = player;
        if (player.roleData != null) {
            ActorInBattle role = addActor(
                    player.roleData.actorID,
                    player.roleData.weaponID,
                    player.roleData.nickname,
                    player.roleInMap.teamID != null ? player.roleInMap.teamID : defaultTeamID,
                    player.roleInMap.teamMemberIndex != null ? player.roleInMap.teamMemberIndex + 0 : 0
            );
            role.state = player.roleData.state.clone();
            role.state.fullHpMp();
            role.player = player;
            role.isPlayerRole = true;
            playerBattleModel.role = role;
        }
        if (player.petData != null) {
            ActorInBattle pet = addActor(
                    player.petData.actorID,
                    player.petData.weaponID,
                    player.petData.nickname,
                    player.roleInMap.teamID != null ? player.roleInMap.teamID : defaultTeamID,
                    player.roleInMap.teamMemberIndex != null ? player.roleInMap.teamMemberIndex + 5 : 5
            );
            pet.state = player.petData.state.clone();
            pet.state.fullHpMp();
            pet.player = player;
            pet.isPlayerPet = true;
            playerBattleModel.pet = pet;
        }
        playerBattleModels.put(player.id, playerBattleModel);
    }

    private ActorInBattle addActor(int actorID, int weaponID, String nickname, int teamID, int teamMemberIndex) {
        if (!teamIDs.contains(teamID)) {
            teamIDs.add(teamID);
        }
        ActorInBattle actor = new ActorInBattle(this);
        actor.battleDriver = this;
        actor.actorID = actorID;
        actor.weaponID = weaponID;
        actor.nickname = nickname;
        actor.teamID = teamID;
        actor.teamMemberIndex = teamMemberIndex;
        actors.add(actor);
        return actor;
    }

    /**
     * 前端当前回合的战斗动画播放完成后，请求该接口进入下一回合
     * 多人使用同一回合参数请求时，只有一次生效
     * @param currentRoundCount 当前是第几回合
     */
    public void openNewRound(int currentRoundCount) {
        if (currentRoundCount == roundCount) {
            actors.forEach(a -> a.onRoundPrepare());
            roundCount++;
            waitTime = 30;
            updateRoundCount();
            updateWaitTime();
            startWaitOperate();
            pushBattleOrders();
            createTimerForRoundCountDown();
        }
    }

    private void createTimerForRoundCountDown() {
        Runnable runnable = new Runnable() {
            @Override
            public void run() {
                if (processRoundCount >= roundCount) {
                    JCEngine.director.scheduler.unSchedule(this);
                    return;
                }
                waitTime--;
                if (waitTime == 0) {
                    executeRoundProcess(roundCount);
                } else {
                    if (waitTime <= 27 && isAllOperateCompleted()) {
                        executeRoundProcess(roundCount);
                    } else {
                        updateWaitTime();
                        pushBattleOrders();
                    }
                }
            }
        };
        JCEngine.director.scheduler.schedule(runnable, 1000);
    }

    public void submitOperate(
        int playerUID, int currentRoundCount, int step,
        int operateType, int operateItemID, int operateTargetID
    ) {
        if (step != 1 && step != 2) {
            return;
        }
        if (currentRoundCount != roundCount) {
            return;
        }
        PlayerBattleModel model = playerBattleModels.get(playerUID);
        if (model == null) {
            return;
        }
        if (step == 1) {
            if (model.role != null) {
                model.role.submitOperate(operateType, operateItemID, operateTargetID);
                if (model.pet != null) {
                    model.player.call(PlayerClientAPI.waitOperateForPet);
                } else {
                    model.player.call(PlayerClientAPI.waitOperateEnd);
                }
            }
        }
        if (step == 2) {
            if (model.pet != null) {
                model.pet.submitOperate(operateType, operateItemID, operateTargetID);
                model.player.call(PlayerClientAPI.waitOperateEnd);
            }
        }
        if (isAllOperateCompleted()) {
            executeRoundProcess(currentRoundCount);
        }
    }

    private void executeRoundProcess(int currentRoundCount) {
        if (currentRoundCount == processRoundCount + 1) {
            processRoundCount = currentRoundCount;
            endWaitOperate();
            executeRound();
            checkOver();
            if (isOver) over();
            else nextRound();
            pushBattleOrders();
            if (!isOver) {
                /**
                 * 一定时间后自动进入下一回合
                 * 保证队伍内全部玩家掉线时，回合依旧推进
                 * 保证队伍内全部玩家为机器人时，回合依旧推进
                 */
                int thisRoundCount = roundCount;
                long delay = actors.size() * 5 * 1000;
                JCEngine.director.scheduler.scheduleOnce(() -> openNewRound(thisRoundCount), delay);
            } else {
                end();
            }
        }
    }

    private void executeRound() {
        actors.sort((a, b) -> b.state.speed - a.state.speed);
        for (ActorInBattle actor : actors) {
            if (!actor.isOut) actor.onRoundStart();
        }
        for (ActorInBattle actor : actors) {
            if (!actor.isOut) actor.onRoundProcess();
        }
        for (ActorInBattle actor : actors) {
            if (!actor.isOut) actor.onRoundEnd();
        }
        actors.removeIf(a -> a.isOut);
    }

    private void checkOver() {
        double hp1 = 0;
        double hp2 = 0;
        for (ActorInBattle actor : actors) {
            if (actor.teamID == teamIDs.get(0)) {
                hp1 += actor.state.hp;
            } else if (actor.teamID == teamIDs.get(1)) {
                hp2 += actor.state.hp;
            }
        }
        if (hp1 == 0 || hp2 == 0) {
            isOver = true;
        }
    }

    // ------ 演员的条件筛选 ------

   public ActorInBattle findActor(int id) {
        for (ActorInBattle actor : actors) {
            if (actor.id == id) {
                return actor;
            }
        }
        return null;
    }

    public ArrayList<ActorInBattle> findActorsForAOE(ActorInBattle self, int targetID, int count) {
        ActorInBattle target = null;
        ArrayList<ActorInBattle> targets = new ArrayList<>();
        for (ActorInBattle actor : actors) {
            if (self.teamID != actor.teamID && isActorCanHit(actor)) {
                if (actor.id == targetID) target = actor;
                else targets.add(actor);
            }
        }
        targets.sort((a, b) -> b.state.speed - a.state.speed);
        if (target != null) targets.add(0, target);
        while (targets.size() > count) {
            targets.remove(targets.size() - 1);
        }
        return targets;
    }

    public ActorInBattle randomTargetThatCanHit(ActorInBattle self) {
        ArrayList<ActorInBattle> targets = randomTargetsThatCanHit(self, 1);
        if (targets.size() > 0) {
            return targets.get((int)(targets.size() * Math.random()));
        }
        return null;
    }

    public ArrayList<ActorInBattle> randomTargetsThatCanHit(ActorInBattle self, int count) {
        ArrayList<ActorInBattle> targets = new ArrayList<>();
        for (ActorInBattle actor : actors) {
            if (self.teamID != actor.teamID && isActorCanHit(actor)) {
                targets.add(actor);
            }
        }
        while (targets.size() > count) {
            targets.remove((int)(targets.size() * Math.random()));
        }
        return targets;
    }

    // ------ 演员的条件判断 ------

    public boolean isActorCanHit(ActorInBattle actor) {
        if (actor.isAlive() && !actor.isOut) {
            return true;
        }
        return false;
    }

    public boolean isActorCanRevive(ActorInBattle actor) {
        if (actor.isDead() && !actor.isOut) {
            return true;
        }
        return false;
    }

    public boolean isPet(ActorInBattle actor) {
        return actor.player != null && !actor.isPlayerRole;
    }

    public boolean isAllOperateCompleted() {
        AtomicBoolean allDone = new AtomicBoolean(true);
        playerBattleModels.values().forEach(m -> {
            if (m.role != null && !m.role.hasOperate && !m.player.autoBattle) allDone.set(false);
            if (m.pet != null && !m.pet.hasOperate && !m.player.autoBattle) allDone.set(false);
        });
        return allDone.get();
    }

    // ------ 演员操作 ------
    public void setActorOut(ActorInBattle actor) {
        if (actor.player != null) {
            PlayerBattleModel model = playerBattleModels.get(actor.player.id);
            if (model != null) {
                if (actor == model.role) {
                    model.role = null;
                } else if (actor == model.pet) {
                    model.pet = null;
                }
            }
        }
        actor.isOut = true;
    }

    // ------ Call Client ------

    private void enterBattle() {
        JSONObject playerActorIDs = new JSONObject();
        playerBattleModels.forEach((uid, model) -> {
            JSONObject map = new JSONObject();
            if (model.role != null) map.put("role", model.role.id);
            if (model.pet != null) map.put("pet", model.pet.id);
            playerActorIDs.put(uid.toString(), map);
        });
        String dataText = Player.packDataText(PlayerClientAPI.enterBattle, actors, playerActorIDs, isPVP);
        playerBattleModels.values().forEach(m -> {
            m.player.sendDataText(dataText);
        });
    }

    private void pushBattleOrders() {
        String dataText = Player.packDataText(PlayerClientAPI.pushBattleOrders, orders);
        playerBattleModels.values().forEach(m -> {
            m.player.sendDataText(dataText);
        });
        orders.clear();
    }

    // ------ Generate Orders ------

    private void updateRoundCount() {
        BattleOrder order = new BattleOrder(this);
        order.name = BattleOrder.Name_updateRoundCount;
        order.put_value(roundCount);
        orders.add(order);
    }

    private void updateWaitTime() {
        BattleOrder order = new BattleOrder(this);
        order.name = BattleOrder.Name_updateWaitTime;
        order.put_value(waitTime);
        orders.add(order);
    }

    private void startWaitOperate() {
        BattleOrder order = new BattleOrder(this);
        order.name = BattleOrder.Name_startWaitOperate;
        orders.add(order);
    }

    private void endWaitOperate() {
        BattleOrder order = new BattleOrder(this);
        order.name = BattleOrder.Name_endWaitOperate;
        orders.add(order);
    }

    private void nextRound() {
        BattleOrder order = new BattleOrder(this);
        order.name = BattleOrder.Name_nextRound;
        order.put_value(roundCount);
        orders.add(order);
    }

    private void over() {
        BattleOrder order = new BattleOrder(this);
        order.name = BattleOrder.Name_over;
        orders.add(order);
    }

    // ------ Generate AutoIncrementID ------

    private Object orderIdKey = new Object();
    private Object actorIdKey = new Object();

    public int generateOrderID() {
        return JCEngine.getAutoIncrementID(orderIdKey);
    }

    public int generateActorID() {
        return JCEngine.getAutoIncrementID(actorIdKey);
    }

    private void removeIdKeys() {
        JCEngine.removeKeyOfAutoIncrementID(orderIdKey);
        JCEngine.removeKeyOfAutoIncrementID(actorIdKey);
    }

    // ------ Static Class ------

    private static class PlayerBattleModel {
        public Player player;
        public ActorInBattle role;
        public ActorInBattle pet;
    }
}
