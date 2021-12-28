package game;

import com.alibaba.fastjson.annotation.JSONField;
import game.actor.RoleInMap;
import pers.jc.engine.JCEngine;
import java.util.ArrayList;

public class Team {
    public final int id = JCEngine.getAutoIncrementID(Team.class);
    public final ArrayList<RoleInMap> members = new ArrayList<>();
    @JSONField(serialize = false)
    public boolean isValid;

    public boolean isHeader(RoleInMap member) {
        return members.indexOf(member) == 0;
    }

    public RoleInMap getHeader() {
        return members.get(0);
    }

    public boolean isFull() {
        return members.size() >= 5;
    }

    public void addMember(RoleInMap member) {
        members.add(member);
        member.setTeam(this);
        if (members.size() == 1) isValid = true;
    }

    public RoleInMap[] removeMember(RoleInMap member) {
        RoleInMap[] removeList;
        if (isHeader(member)) {
            members.forEach(m -> m.setTeam(null));
            removeList = new RoleInMap[members.size()];
            members.toArray(removeList);
            members.clear();
            isValid = false;
        } else {
            member.setTeam(null);
            members.remove(member);
            removeList = new RoleInMap[]{member};
            members.forEach(m -> m.teamMemberIndex = members.indexOf(m));
        }
        return removeList;
    }

    @Override
    public String toString() {
        String[] strAry = new String[members.size()];
        for (int i = 0; i < members.size(); i++) {
            strAry[i] = members.get(i).toString();
        }
        String str = String.join(", ", strAry);
        return "Team{" +
                "id=" + id +
                ", size=" + members.size() +
                ", members=[" + str + "]}";
    }
}
