/**
 * 超文本传输协议模块
 */
var JC;
(function (JC) {
    var HTTP;
    (function (HTTP) {
        /**
         * AJAX 通过 XMLHttpRequest 对象向服务器发送请求
         * @param requestObject 请求对象信息配置
         */
        function request(requestObject) {
            requestObject.async = (requestObject.async == undefined ? true : requestObject.async);
            requestObject.method = (requestObject.method == undefined ? RequestMethod.GET : requestObject.method);
            requestObject.data = (requestObject.data == undefined ? {} : requestObject.data);
            requestObject.dataType = (requestObject.dataType == undefined ? DataType.FORM : requestObject.dataType);
            requestObject.responeType = (requestObject.responeType == undefined ? ResponeType.Object : requestObject.responeType);
            requestObject.debug = (requestObject.debug == undefined ? false : requestObject.debug);
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (requestObject.debug) {
                    console.warn("request_url: ", requestObject.url, "request_readyState: ", xhr.readyState, "request_status: ", xhr.status);
                }
                if (xhr.readyState < 4) {
                    return;
                }
                if (xhr.status >= 200 && xhr.status < 400) {
                    if (requestObject.success instanceof Function) {
                        if (requestObject.responeType == ResponeType.Object) {
                            if (requestObject.debug) {
                                console.warn("request_url: ", requestObject.url, "result will parse to json");
                            }
                            var result = undefined;
                            try {
                                result = JSON.parse(xhr.responseText);
                                if (requestObject.debug) {
                                    console.warn("request_url: ", requestObject.url, "result parse to json success", result);
                                }
                            }
                            catch (_a) {
                                result = xhr.responseText;
                                if (requestObject.debug) {
                                    console.error("request_url: ", requestObject.url, "result can not parse to json", result);
                                }
                            }
                            requestObject.success(result);
                        }
                        else if (requestObject.responeType == ResponeType.String) {
                            var result = xhr.responseText;
                            if (requestObject.debug) {
                                console.warn("request_url: ", requestObject.url, "result parse to text", result);
                            }
                            requestObject.success(result);
                        }
                    }
                }
                else {
                    if (requestObject.fail instanceof Function) {
                        requestObject.fail();
                    }
                }
            };
            var getUrlForm = function (dataObject, startChar, centerChar) {
                var str = "";
                if (dataObject) {
                    var paramIndex = -1;
                    for (var key in dataObject) {
                        paramIndex++;
                        str += (paramIndex == 0 ? startChar : centerChar);
                        str += key + '=' + encodeURIComponent(dataObject[key]);
                    }
                }
                return str;
            };
            if (requestObject.method == RequestMethod.GET) {
                xhr.open("GET", requestObject.url += getUrlForm(requestObject.data, '?', '&'), requestObject.async);
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                xhr.send();
            }
            else if (requestObject.method == RequestMethod.POST) {
                xhr.open("POST", requestObject.url, requestObject.async);
                if (requestObject.dataType == DataType.FORM) {
                    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                    xhr.send(getUrlForm(requestObject.data, '', '&'));
                }
                else if (requestObject.dataType == DataType.JSON) {
                    xhr.setRequestHeader("Content-Type", "application/json");
                    xhr.send(JSON.stringify(requestObject.data));
                }
            }
        }
        HTTP.request = request;
        /**
         * 请求数据类型
         */
        var DataType;
        (function (DataType) {
            DataType[DataType["FORM"] = 0] = "FORM";
            DataType[DataType["JSON"] = 1] = "JSON";
        })(DataType = HTTP.DataType || (HTTP.DataType = {}));
        /**
         * 请求方法类型
         */
        var RequestMethod;
        (function (RequestMethod) {
            RequestMethod[RequestMethod["GET"] = 0] = "GET";
            RequestMethod[RequestMethod["POST"] = 1] = "POST";
        })(RequestMethod = HTTP.RequestMethod || (HTTP.RequestMethod = {}));
        /**
         * 返回数据类型
         */
        var ResponeType;
        (function (ResponeType) {
            ResponeType[ResponeType["Object"] = 0] = "Object";
            ResponeType[ResponeType["String"] = 1] = "String";
        })(ResponeType = HTTP.ResponeType || (HTTP.ResponeType = {}));
    })(HTTP = JC.HTTP || (JC.HTTP = {}));
})(JC || (JC = {}));
