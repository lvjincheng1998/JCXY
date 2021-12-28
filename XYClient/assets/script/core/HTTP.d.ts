/**
 * 超文本传输协议模块
 */
declare module JC.HTTP {
    /**
     * AJAX 通过 XMLHttpRequest 对象向服务器发送请求
     * @param requestObject 请求对象信息配置
     */
    function request(requestObject: RequestObject): void;
    /**
     * 用于配置请求信息的对象
     */
    interface RequestObject {
        /** 请求地址 */
        url: string;
        /** 调试输出 */
        debug?: boolean;
        /** 异步请求 */
        async?: boolean;
        /** 请求方法类型 */
        method?: RequestMethod;
        /** 请求数据 */
        data?: any;
        /** 请求数据类型 */
        dataType?: DataType;
        /** 返回数据类型 */
        responeType?: ResponeType;
        /** 请求成功回调函数 */
        success?: Function;
        /** 请求失败回调函数 */
        fail?: Function;
    }
    /**
     * 请求数据类型
     */
    enum DataType {
        FORM = 0,
        JSON = 1
    }
    /**
     * 请求方法类型
     */
    enum RequestMethod {
        GET = 0,
        POST = 1
    }
    /**
     * 返回数据类型
     */
    enum ResponeType {
        Object = 0,
        String = 1
    }
}
