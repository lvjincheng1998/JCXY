package game.component;

import com.alibaba.fastjson.JSONObject;
import game.PlayerClientAPI;
import game.actor.ActorInMap;
import game.actor.RoleInMap;
import game.Player;
import game.Team;
import pers.jc.network.SocketComponent;
import pers.jc.network.SocketMethod;
import java.util.ArrayList;

@SocketComponent("TeamComp")
public class TeamComp {
    public static TeamComp ins;

    public TeamComp() {
        ins = this;
    }

    private final ArrayList<Team> teams = new ArrayList<>();

    public Team findTeam(int teamID) {
        for (Team team : teams) if (team.id == teamID) return team;
        return null;
    }

    @SocketMethod
    public void createTeam(Player player) {
        service.createTeam(player.roleInMap);
    }

    @SocketMethod
    public void leaveTeam(Player player) {
        service.leaveTeam(player.roleInMap);
    }

    @SocketMethod
    public void pleaseLeaveTeam(Player player, int targetID) {
        RoleInMap roleInMap = player.roleInMap;
        Team team = roleInMap.team;
        if (team == null) return;
        if (!team.isHeader(roleInMap)) return;
        RoleInMap target = (RoleInMap) ActorInMap.actorMap.get(targetID);
        if (target == null) return;
        if (team.members.contains(target)) {
            service.leaveTeam(target);
            target.player.call(PlayerClientAPI.showTip, "你被请离队伍！");
        }
    }

    @SocketMethod
    public void inviteJoinTeam(Player player, int targetID) {
        RoleInMap roleInMap = player.roleInMap;
        Team team = roleInMap.team;
        if (team == null) return;
        if (team.isFull()) return;
        RoleInMap target = (RoleInMap) ActorInMap.actorMap.get(targetID);
        if (target == null) return;
        if (target.team != null) return;
        Player targetPlayer = target.player;
        if (targetPlayer != null) {
            JSONObject data = new JSONObject();
            data.put("id", roleInMap.id);
            data.put("nickname", roleInMap.getNickname());
            data.put("teamID", team.id);
            targetPlayer.call(PlayerClientAPI.inviteJoinTeam, data);
        }
    }

    @SocketMethod
    public void acceptInviteJoinTeam(Player player, int teamID) {
        if (player.battleDriver != null && !player.battleDriver.isOver) {
            player.call(PlayerClientAPI.showTip, "你正在战斗，无法执行该操作！");
            return;
        }
        RoleInMap roleInMap = player.roleInMap;
        Team targetTeam = findTeam(teamID);
        if (targetTeam == null) return;
        Player targetHeaderPlayer = targetTeam.getHeader().player;
        if (targetHeaderPlayer != null) {
            if (targetHeaderPlayer.battleDriver != null && !targetHeaderPlayer.battleDriver.isOver) {
                player.call(PlayerClientAPI.showTip, "对方正在战斗，你进入其队伍失败！");
                return;
            }
        }
        service.joinTeam(roleInMap, targetTeam);
    }

    @SocketMethod
    public void rejectInviteJoinTeam(int targetID) {
        ActorInMap actorInMap = ActorInMap.actorMap.get(targetID);
        if (actorInMap == null) return;
        Player player = actorInMap.player;
        if (player == null) return;
        player.call(PlayerClientAPI.showTip, "对方拒绝了你的邀请！");
    }

    @SocketMethod
    public void requestJoinTeam(Player player, int teamID) {
        RoleInMap roleInMap = player.roleInMap;
        Team team = roleInMap.team;
        if (team != null) return;
        Team targetTeam = findTeam(teamID);
        if (targetTeam == null) return;
        //打包申请人员数据
        JSONObject data = new JSONObject();
        data.put("id", roleInMap.id);
        data.put("nickname", roleInMap.getNickname());
        //通知目标队伍的队长
        Player headerPlayer = targetTeam.getHeader().player;
        headerPlayer.call(PlayerClientAPI.noticeRequestJoinTeam, data);
    }

    @SocketMethod
    public void acceptRequestJoinTeam(Player player, int targetID) {
        if (player.battleDriver != null && !player.battleDriver.isOver) {
            player.call(PlayerClientAPI.showTip, "你正在战斗，无法执行该操作！");
            return;
        }
        RoleInMap roleInMap = player.roleInMap;
        Team team = player.roleInMap.team;
        if (team == null) return;
        if (!team.isHeader(roleInMap)) return;
        RoleInMap target = (RoleInMap) ActorInMap.actorMap.get(targetID);
        Player targetPlayer = target.player;
        if (targetPlayer != null) {
            if (targetPlayer.battleDriver != null && !targetPlayer.battleDriver.isOver) {
                player.call(PlayerClientAPI.showTip, "对方正在战斗，加入队伍失败！");
                return;
            }
        }
        service.joinTeam(target, team);
    }

    @SocketMethod
    public void rejectRequestJoinTeam(int targetID) {
        ActorInMap actorInMap = ActorInMap.actorMap.get(targetID);
        if (actorInMap == null) return;
        Player player = actorInMap.player;
        if (player == null) return;
        player.call(PlayerClientAPI.showTip, "对方拒绝了你的申请！");
    }

    Service service = new Service();

    class Service {
        void createTeam(RoleInMap roleInMap) {
            if (roleInMap == null) return;
            if (roleInMap.team != null) return;
            Team team = new Team();
            teams.add(team);
            team.addMember(roleInMap);
            roleInMap.onCreateTeam();
            setTeamToClient(roleInMap);
        }
        void joinTeam(RoleInMap roleInMap, Team team) {
            if (roleInMap == null) return;
            if (team == null) return;
            if (roleInMap.team != null) return;
            if (team.isFull()) return;
            team.addMember(roleInMap);
            roleInMap.onJoinTeam();
            setTeamToClient(team.members.toArray(new RoleInMap[]{}));
        }
        void leaveTeam(RoleInMap roleInMap) {
            if (roleInMap == null) return;
            Team team = roleInMap.team;
            if (team == null) return;
            RoleInMap[] removeList = team.removeMember(roleInMap);
            if (!team.isValid) teams.remove(team);
            roleInMap.onLeaveTeam();
            setTeamToClient(removeList);
            setTeamToClient(team.members.toArray(new RoleInMap[]{}));
        }
        void setTeamToClient(RoleInMap... actorInMaps) {
            for (RoleInMap roleInMap : actorInMaps) {
                Player player = roleInMap.player;
                if (player != null) {
                    player.call(PlayerClientAPI.setTeam, roleInMap.team, roleInMap);
                }
            }
        }
    }
}
