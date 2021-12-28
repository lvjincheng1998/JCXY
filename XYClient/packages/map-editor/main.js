'use strict';

let FileStream = require("fs");
let FilePath = require("path");

module.exports = {

  load () {

  },

  unload () {

  },

  messages: {
    "open" () {
      if (Editor.Panel.findWindow("map-editor")) {
       return; 
      }

      this.mapDirURL = null;
      this.mapJson = null;
      this.imageBase64Matrix = null;
      this.rowCount = null;
      this.colCount = null;

      let uuids = Editor.Selection.curSelection("asset");
      if (uuids.length != 1) {
        Editor.warn("请选择一个地图资源文件夹");
        return;
      }
      let assetInfo = Editor.assetdb.assetInfoByUuid(uuids[0]);
      if (assetInfo.type != "folder") {
        Editor.warn("请选择一个地图资源文件夹");
        return;
      }
      this.mapDirURL = assetInfo.url;
      let assetPath = assetInfo.path;
      let childFiles = FileStream.readdirSync(assetPath);
      let imageBase64Matrix = [];
      let rowCount = 0;
      let colCount = 0;
      for (let fileName of childFiles) {
        if (fileName.endsWith(".meta")) {
          continue;
        }
        if (fileName.endsWith(".json")) {
          let filePath = FilePath.join(assetPath, fileName);
          let mapJson = FileStream.readFileSync(filePath).toString("utf-8");
          this.mapJson = JSON.parse(mapJson);
          continue;
        }
        let imageType = null;
        if (fileName.endsWith(".jpg")) {
          imageType = "jpg";
        }
        if (fileName.endsWith(".png")) {
          imageType = "png";
        }
        if (!imageType) {
          continue;
        }
        let rowColStr = fileName.substring(0, fileName.lastIndexOf("."));
        let rowColStrs = rowColStr.split("_");
        let rowIndex = parseInt(rowColStrs[0]);
        let colIndex = parseInt(rowColStrs[1]);
        if (rowIndex >= rowCount) {
          rowCount = rowIndex + 1;
        }
        if (colIndex >= colCount) {
          colCount = colIndex + 1;
        }
        if (!imageBase64Matrix[rowIndex]) {
          imageBase64Matrix[rowIndex] = [];
        }
        let filePath = FilePath.join(assetPath, fileName);
        let buffer = FileStream.readFileSync(filePath);
        let iamgeBase64 = "data: image/" + imageType + ";base64," + buffer.toString("base64");
        imageBase64Matrix[rowIndex][colIndex] = iamgeBase64;
      }
      this.imageBase64Matrix = imageBase64Matrix;
      this.rowCount = rowCount;
      this.colCount = colCount;
      if (this.rowCount <= 0 || this.colCount <= 0) {
        Editor.warn(
          "要求目标文件夹内至少存在一张规范命名的图片\n" + 
          "格式: 行_列.jpg 或 png\n" + 
          "例如 2 x 2 的瓦片地图，则分别命名为 0_0.jpg 0_1.jpg 1_0.jpg 1_1.jpg\n"
        );
        return;
      }
      Editor.Panel.open("map-editor");
    },
    "read-res" () {
      Editor.Ipc.sendToPanel("map-editor", "map-editor:import-res", [this.imageBase64Matrix, this.rowCount, this.colCount, this.mapJson]);
    },
    "save-map" (event, data) {
      let url = this.mapDirURL + "/map.json";
      let method = "create";
      if (Editor.assetdb.exists(url)) {
        method = "saveExists";
      }
      Editor.assetdb[method](url, data, (err) => {
        if (err) {
          Editor.failed("地图数据-保存失败");
        } else {
          Editor.success("地图数据-保存成功");
        }
      });
    }
  }
};