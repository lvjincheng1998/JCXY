package core.value_type;

import java.util.Objects;

public class Vec2 {
    public double x = 0;
    public double y = 0;

    public Vec2() {}

    public Vec2(double x, double y) {
        this.x = x;
        this.y = y;
    }

    public Vec2 copy() {
        return new Vec2(x, y);
    }

    public Vec2 intSelf() {
        x = (int) x;
        y = (int) y;
        return this;
    }

    public double mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    public Vec2 add(Vec2 vector) {
        return Vec2.add(new Vec2(), this, vector);
    }

    public Vec2 sub(Vec2 vector) {
        return Vec2.subtract(new Vec2(), this, vector);
    }

    public Vec2 mul(double num) {
        return Vec2.multiplyScalar(new Vec2(), this, num);
    }

    public Vec2 addSelf(Vec2 vector) {
        return Vec2.add(this, this, vector);
    }

    public Vec2 subSelf(Vec2 vector) {
        return Vec2.subtract(this, this, vector);
    }

    public Vec2 mulSelf(double num) {
        return Vec2.multiplyScalar(this, this, num);
    }

    public Vec2 normalizeSelf () {
        double magSqr = this.x * this.x + this.y * this.y;
        if (magSqr == 1.0) return this;
        if (magSqr == 0.0) return this;
        double invSqrt = 1.0 / Math.sqrt(magSqr);
        this.x *= invSqrt;
        this.y *= invSqrt;
        return this;
    }

    public static Vec2 add(Vec2 out, Vec2 a, Vec2 b) {
        out.x = a.x + b.x;
        out.y = a.y + b.y;
        return out;
    }

    public static Vec2 subtract(Vec2 out, Vec2 a, Vec2 b) {
        out.x = a.x - b.x;
        out.y = a.y - b.y;
        return out;
    }

    public static Vec2 multiplyScalar(Vec2 out, Vec2 a, double b) {
        out.x = a.x * b;
        out.y = a.y * b;
        return out;
    }

    public static double distance(Vec2 v1, Vec2 v2) {
        double dx = v2.x - v1.x;
        double dy = v2.y - v1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Vec2 vec2 = (Vec2) o;
        return Double.compare(vec2.x, x) == 0 &&
                Double.compare(vec2.y, y) == 0;
    }

    @Override
    public int hashCode() {
        return Objects.hash(x, y);
    }

    @Override
    public String toString() {
        return "Vec2{" +
                "x=" + x +
                ", y=" + y +
                '}';
    }
}
