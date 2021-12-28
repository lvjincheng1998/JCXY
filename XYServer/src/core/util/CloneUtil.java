package core.util;

import java.lang.reflect.Field;

public class CloneUtil {

    /**
     * 把一个对象的指定字段的值克隆到另一个对象中
     * @param src 源对象
     * @param dest 目标对象
     * @param fieldNames 指定字段名
     */
    public static void cloneFieldValues(Object src, Object dest, String... fieldNames) {
        if (src == null) return;
        if (dest == null) return;
        for (String fieldName : fieldNames) {
            try {
                Field srcField = src.getClass().getDeclaredField(fieldName);
                if (!srcField.isAccessible()) srcField.setAccessible(true);
                Field destField = dest.getClass().getDeclaredField(fieldName);
                if (!destField.isAccessible()) destField.setAccessible(true);
                destField.set(dest, srcField.get(src));
            } catch (Exception e) {}
        }
    }
}
