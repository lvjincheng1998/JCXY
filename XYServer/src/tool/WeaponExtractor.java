package tool;

import java.io.File;
import pers.jc.util.JCFileTool;

public class WeaponExtractor {
    public static String source = "C:\\Users\\JC\\Desktop\\resources\\weapon\\";
    public static String output = "C:\\Users\\JC\\Desktop\\";

    public static void main(String[] args) throws Exception {
        extractWeapon(2004);
    }

    public static void extractWeapon(int dirID) throws Exception {
        File dir = new File(source + dirID);
        if (!(dir.exists() && dir.isDirectory())) return;
        File out = new File(output + dirID);
        if (!out.exists()) out.mkdir();
        JCFileTool fileTool = new JCFileTool();
        for (File file : dir.listFiles()) {
            String fileName = file.getName();
            if (fileName.endsWith(".png") || fileName.endsWith(".plist")) {
                String newFileName = null;
                if (dirID % 1000 < 30 ? fileName.startsWith("0000") : fileName.startsWith("0100")) {
                    newFileName = fileName.replace(dirID % 1000 < 30 ? "0000" : "0100", "1000");
                } else if (fileName.startsWith("0301")) {
                    newFileName = fileName.replace("0301", "1001");
                } else if (fileName.startsWith("0403")) {
                    newFileName = fileName.replace("0403", "1002");
                } else if (fileName.startsWith("0501")) {
                    newFileName = fileName.replace("0501", "1003");
                }
                if (newFileName != null) {
                    String oldPath = dir.getPath() + File.separator + fileName;
                    String newPath = out.getPath() + File.separator + newFileName;
                    fileTool.copyFile(oldPath, newPath);
                    if (fileName.endsWith(".plist")) {
                        File newFile = new File(newPath);
                        String[] lines = fileTool.readLines(newFile);
                        String content = String.join("\n", lines);
                        String oldImageName = fileName.replace(".plist", ".png");
                        String newImageName = newFileName.replace(".plist", ".png");
                        content = content.replace(oldImageName, newImageName);
                        fileTool.writeStr(newFile, content);
                    }
                }
            }
        }
    }
}
