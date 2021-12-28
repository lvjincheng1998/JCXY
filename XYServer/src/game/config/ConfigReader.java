package game.config;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.alibaba.fastjson.TypeReference;
import pers.jc.util.JCFileTool;
import java.io.File;

public class ConfigReader {
    static JCFileTool fileTool = new JCFileTool();

    public static String readConfigAsString(String path) {
        try {
            path = new File("").getCanonicalPath() + File.separator + "config" + File.separator + path;
            return fileTool.readStr(new File(path));
        } catch (Exception e) { e.printStackTrace(); }
        return null;
    }

    public static JSONObject readConfigAsJSONObject(String path) {
        return JSONObject.parseObject(readConfigAsString(path));
    }

    public static JSONArray readConfigAsJSONArray(String path) {
        return JSONArray.parseArray(readConfigAsString(path));
    }

    public static <T> T readConfigAsObject(String path, Class<T> type) {
        return JSON.parseObject(readConfigAsString(path), type);
    }

    public static <T> T readConfigAsObject(String path, TypeReference<T> type) {
        return JSON.parseObject(readConfigAsString(path), type);
    }
}
