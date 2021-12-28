package game.actor;

import com.alibaba.fastjson.annotation.JSONField;
import core.map.MapRectType;
import core.value_type.Vec2;
import game.Map;
import game.Player;
import game.Team;
import game.component.TeamComp;

import java.util.ArrayList;

public class RoleInMap extends ActorInMap {
    public boolean isRole = true;

    public int getRoleID() {
        return player.roleData.id;
    }

    public int getActorID() {
        return player.roleData.actorID;
    }

    public int getWeaponID() {
        return player.roleData.weaponID;
    }

    public String getNickname() {
        return player.roleData.nickname;
    }

    public int getLevel() {
        return player.roleData.level;
    }

    public RoleInMap(Player player, int mapID, Vec2 position) {
        super();
        this.player = player;
        this.position = position;
        Map.get(mapID).enter(this);
    }

    @Override
    public void destroy() {
        if (team != null) {
            TeamComp.ins.leaveTeam(player);
        }
        super.destroy();
    }

    @Override
    public void move(double desX, double desY) {
        //是队员，则无法移操作移动
        if (team != null && !team.isHeader(this)) return;
        super.move(desX, desY);
    }

    @Override
    public void update(double dt) {
        boolean isTeamHeader = team != null && team.isHeader(this);
        if (movePath != null && movePath.validCount() > 0) {
            position = movePath.go(240, dt).intSelf();
            autoSetFace();
            if (isTeamHeader) {
                updateTrace(movePath.outs);
                for (int i = 1; i < team.members.size(); i++) {
                    RoleInMap member = team.members.get(i);
                    member.goToKeyTracePoint(i);
                    member.keepRunningInTeam = movePath.validCount() > 0;
                }
            }
        } else {
            if (isTeamHeader) {
                for (int i = 1; i < team.members.size(); i++) {
                    team.members.get(i).keepRunningInTeam = null;
                }
            }
        }
        if (team == null) {
            keepRunningInTeam = null;
        }
    }

    /**当前所处队伍 */
    @JSONField(serialize = false)
    public Team team;
    /**所处队伍ID */
    public Integer teamID;
    /**所处队伍中的位置 */
    public Integer teamMemberIndex;

    public void setTeam(Team team) {
        this.team = team;
        this.teamID = team == null ? null : team.id;
        this.teamMemberIndex = team == null ? null : team.members.indexOf(this);
    }

    public void setTeamMemberIndex(int teamMemberIndex) {
        this.teamMemberIndex = teamMemberIndex;
    }

    public void onCreateTeam() {
        initTrace();
    }

    public void onJoinTeam() {
        goToKeyTracePoint(teamMemberIndex);
    }

    public void onLeaveTeam() {

    }

    /**
     * 保存经过轨迹路径
     */
    private ArrayList<Vec2> trace;
    /**
     * 临时轨迹路径，只有初始化Trace时用到
     */
    private ArrayList<Vec2> tempTrace;
    /**
     * 临时轨迹长度，只有初始化Trace时用到
     */
    private double tempTraceLen;
    /**
     * 至少需要保存的轨迹长度
     */
    private static final double minTraceLen = 320;
    /**
     * 初始化轨迹时，用到的搜索方向合集
     */
    private static final int[][] rowColumnVars = {
            {1, 0}, {1, 1}, {0, 1}, {-1, 1}, {-1, 0}, {-1, -1}, {0, -1}, {1, -1}
    };

    /**
     * 初始化轨迹（目前队长才需要用到）
     */
    private void initTrace() {
        Vec2 pos = position;
        boolean hasRes = false;
        for (int i = 0; i < rowColumnVars.length; i++) {
            int[][] rcVars = new int[3][]; //选三个相邻的方向搜索
            rcVars[0] = rowColumnVars[i];
            rcVars[1] = rowColumnVars[(i + 1) % rowColumnVars.length];
            rcVars[2] = rowColumnVars[(i + 2) % rowColumnVars.length];
            tempTrace = new ArrayList<>();
            tempTraceLen = 0;
            boolean res = searchTraceForInit(pos, rcVars);
            if (res) {
                hasRes = true;
                break;
            }
        }
        trace = new ArrayList<>();
        if (hasRes) {
            for (int i = tempTrace.size() - 1; i >= 0; i--) {
                trace.add(tempTrace.get(i));
            }
        } else {
            trace.add(pos);
        }
    }

    /**
     * 初始化轨迹时的搜索过程（目前队长才需要用到）
     * @param pos 起点
     * @param rcVars 搜索的方向
     * @return 总搜索出来的轨迹长度是否已满足要求
     */
    private boolean searchTraceForInit(Vec2 pos, int[][] rcVars) {
        int r = map.mapGuider.getRow(pos.y);
        int c = map.mapGuider.getColumn(pos.x);
        int rectType = map.mapGuider.getRectType(pos.x, pos.y);
        if (rectType == MapRectType.OUT_BOUND || rectType == MapRectType.RED) {
            return false;
        }
        double addLen = 0;
        if (tempTrace.size() > 0) {
            Vec2 lastPos = tempTrace.get(tempTrace.size() - 1);
            addLen = pos.sub(lastPos).mag();
        }
        tempTraceLen += addLen;
        tempTrace.add(pos);
        if (tempTraceLen > minTraceLen) {
            return true;
        }
        for (int[] rcVar : rcVars) {
            int nr = r + rcVar[0];
            int nc = c + rcVar[1];
            Vec2 nextPos = map.mapGuider.getPosition(nr, nc);
            boolean res = searchTraceForInit(nextPos, rcVars);
            if (res) return true;
        }
        tempTraceLen -= addLen;
        tempTrace.remove(tempTrace.size() - 1);
        return false;
    }

    /**
     * 伴随着移动，需要更新轨迹列表（目前队长才需要用到）
     * @param points
     */
    private void updateTrace(ArrayList<Vec2> points) {
        trace.addAll(points);
        double len = 0;
        for (int i = trace.size() - 2; i >= 0; i--) {
            len += Vec2.distance(trace.get(i), trace.get(i + 1));
            if (len > minTraceLen) {
                if (i > 0) trace.subList(0, i).clear();
                break;
            }
        }
    }

    /**
     * 获取一个关键轨迹点，用于跟随（目前用于队员跟随队长）
     * @param index 关键轨迹点索引
     * @return 地图坐标
     */
    private Vec2 getKeyTracePoint(int index) {
        double targetLen = minTraceLen * index / 4;
        double currentLen = 0;
        Vec2 point = trace.get(trace.size() - 1);
        for (int i = trace.size() - 2; i >= 0; i--) {
            Vec2 nextPoint = trace.get(i);
            Vec2 vec = nextPoint.sub(point);
            double len = vec.mag();
            double nextLen = currentLen + len;
            if (nextLen > targetLen) {
                double mulValue = (targetLen - currentLen) / len;
                point = point.add(vec.mulSelf(mulValue));
                break;
            }
            point = nextPoint;
            if (nextLen == targetLen) break;
            currentLen = nextLen;
        }
        return point.copy().intSelf();
    }

    /**
     * 作为队员需要跟随队长，因此需要跑到对应的轨迹点
     * @param index 队员位置索引
     */
    private void goToKeyTracePoint(int index) {
        movePath = null;
        Vec2 oldPos = position;
        position = destination = team.getHeader().getKeyTracePoint(index);
        setFaceByAStar(oldPos, position);
    }
}
