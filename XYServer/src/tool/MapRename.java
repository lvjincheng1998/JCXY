package tool;

import pers.jc.util.JCFileTool;
import java.io.File;

public class MapRename {
    public static String source = "C:\\Users\\JC\\Desktop\\resources\\Map\\jpg\\";
    public static String output = "C:\\Users\\JC\\Desktop\\";

    public static void main(String[] args) throws Exception {
        fixMap(1010);
    }

    public static void fixMap(int dirID) throws Exception {
        File dir = new File(source + dirID);
        if (!(dir.exists() && dir.isDirectory())) return;
        File out = new File(output + dirID);
        if (!out.exists()) out.mkdir();
        JCFileTool fileTool = new JCFileTool();
        int maxRowIndex = 0;
        for (File file : dir.listFiles()) {
            String fileName = file.getName();
            String[] chars = fileName.split("_");
            int rowIndex = Integer.parseInt(chars[1]);
            if (rowIndex > maxRowIndex) maxRowIndex = rowIndex;
        }
        for (File file : dir.listFiles()) {
            String fileName = file.getName();
            String[] chars = fileName.split("_");
            int rowIndex = maxRowIndex - Integer.parseInt(chars[1]);
            int colIndex = Integer.parseInt(chars[2].substring(0, chars[2].lastIndexOf(".jpg")));
            String oldPath = dir.getPath() + File.separator + fileName;
            String newPath = out.getPath() + File.separator + rowIndex + "_" + colIndex + ".jpg";
            fileTool.copyFile(oldPath, newPath);
        }
    }
}
