const GRID_SPACE = 30;
const CANVAS_EXTRA_VIEW = 300;

const RGB_BLACK = "rgb(0,0,0)";
const RGB_GREEN = "rgb(0,255,0)";
const RGBA_BLUE = "rgba(0,0,255,0.5)";
const RGBA_RED = "rgba(255,0,0,0.5)";

const RECT_TYPE = {
    NONE: 0,
    BLUE: 1,
    RED: 2
}
const RECT_COLOR = {
    1: RGBA_BLUE,
    2: RGBA_RED
}

var menu_right = document.getElementById("menu-right");
var btn_rect_none = menu_right.children[0];
var btn_rect_blue = menu_right.children[1];
var btn_rect_red = menu_right.children[2];
var btn_fill = menu_right.children[3];
var btn_revoke = menu_right.children[4];
var btn_save = menu_right.children[5];

var canvas = document.querySelector("canvas")
var ctx = canvas.getContext("2d");

var bgImage = null;
var matrix = null;
var matrixRowCount = 0;
var matrixColumnCount = 0; 
var matrixAlterQueue = [];
var rectType = RECT_TYPE.NONE;
var canAddRect = false;
var toFill = false;

function drawBG() {
    if (bgImage) {
        canvas.width = (bgImage.width < window.innerWidth ? window.innerWidth : bgImage.width) + CANVAS_EXTRA_VIEW;
        canvas.height = (bgImage.height < window.innerHeight ? window.innerWidth : bgImage.height) + CANVAS_EXTRA_VIEW; 
    } else {
        canvas.width = window.innerWidth + CANVAS_EXTRA_VIEW;
        canvas.height = window.innerHeight + CANVAS_EXTRA_VIEW;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = RGB_BLACK;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (bgImage) {
        ctx.drawImage(bgImage, 0, 0, bgImage.width, bgImage.height);
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = RGB_GREEN;
    for (let i = 0; i < canvas.height / GRID_SPACE; i++) {
        ctx.moveTo(0, GRID_SPACE * i);
        ctx.lineTo(canvas.width, GRID_SPACE * i);
    }
    for (let i = 0; i < canvas.width / GRID_SPACE; i++) {
        ctx.moveTo(GRID_SPACE * i, 0);
        ctx.lineTo(GRID_SPACE * i, canvas.height);
    }
    ctx.stroke();
}

function initMatrix() {
    matrixRowCount = Math.ceil(bgImage.height / GRID_SPACE);
    matrixColumnCount = Math.ceil(bgImage.width / GRID_SPACE);
    matrix = new Array();
    for (let r = 0; r < matrixRowCount; r++) {
        matrix[r] = new Array();
        for (let c = 0; c < matrixColumnCount; c++) {
            matrix[r][c] = RECT_TYPE.NONE;
        }
    }
    matrixAlterQueue = [];
}

function drawMatrix() {
    if (!matrix) return;
    for (let r = 0; r < matrixRowCount; r++) {
        for (let c = 0; c < matrixColumnCount; c++) {
            let rectType = matrix[r][c];
            if (rectType != RECT_TYPE.NONE) {
                ctx.fillStyle = RECT_COLOR[rectType];
                ctx.fillRect(c * GRID_SPACE, r * GRID_SPACE, GRID_SPACE, GRID_SPACE);
            }
        }
    }
}

function addRect(e) {
    if (!matrix) return;
    let r = Math.floor(e.offsetY / GRID_SPACE);
    let c = Math.floor(e.offsetX / GRID_SPACE);
    let x = c * GRID_SPACE;
    let y = r * GRID_SPACE;
    if (r >= matrixRowCount || c >= matrixColumnCount) return;
    if (matrix[r][c] == RECT_TYPE.NONE && rectType != RECT_TYPE.NONE) {
        matrixAlterQueue.push({row: r, column: c, type: matrix[r][c]});
        matrix[r][c] = rectType;
        ctx.fillStyle = RECT_COLOR[rectType];
        ctx.fillRect(x, y, GRID_SPACE, GRID_SPACE);
    } else if (matrix[r][c] != RECT_TYPE.NONE && matrix[r][c] != rectType) {
        matrixAlterQueue.push({row: r, column: c, type: matrix[r][c]});
        matrix[r][c] = rectType;
        drawBG();
        drawMatrix();
    }
}

function fillRect(e) {
    if (!matrix || rectType == RECT_TYPE.NONE) return;
    let row = Math.floor(e.offsetY / GRID_SPACE);
    let column = Math.floor(e.offsetX / GRID_SPACE);
    if (row >= matrixRowCount || column >= matrixColumnCount) return;
    if (matrix[row][column] != RECT_TYPE.NONE) return;
    let rowColumnList = [];
    let matrixAlterArray = []
    matrixAlterArray.push({row: row, column: column, type: matrix[row][column]});
    matrix[row][column] = rectType;
    rowColumnList.push({row: row, column: column});
    while (rowColumnList.length > 0) {
        let rowColumn = rowColumnList.shift();
        ctx.fillStyle = RECT_COLOR[rectType];
        ctx.fillRect(rowColumn.column * GRID_SPACE, rowColumn.row * GRID_SPACE, GRID_SPACE, GRID_SPACE);
        for (let i = 0; i < 4; i++) {
            let rowColumnTemp;
            if (i == 0) {
                rowColumnTemp = {row: rowColumn.row + 1, column: rowColumn.column};
            } else if (i == 1) {
                rowColumnTemp = {row: rowColumn.row, column: rowColumn.column + 1};
            } else if (i == 2) {
                rowColumnTemp = {row: rowColumn.row - 1, column: rowColumn.column};
            } else if (i == 3) {
                rowColumnTemp = {row: rowColumn.row, column: rowColumn.column - 1};
            }
            if (
                rowColumnTemp.row < 0 || 
                rowColumnTemp.column < 0 || 
                rowColumnTemp.row >= matrixRowCount || 
                rowColumnTemp.column >= matrixColumnCount ||
                matrix[rowColumnTemp.row][rowColumnTemp.column] != RECT_TYPE.NONE
            ) {
                continue;
            }
            matrixAlterArray.push({row: rowColumnTemp.row, column: rowColumnTemp.column, type: matrix[rowColumnTemp.row][rowColumnTemp.column]});
            matrix[rowColumnTemp.row][rowColumnTemp.column] = rectType;
            rowColumnList.push(rowColumnTemp);
        }
    }
    matrixAlterQueue.push(matrixAlterArray);
}

function revoke() {
    let element = matrixAlterQueue.pop();
    if (!element) return;
    if (element instanceof Array) {
        for (let elem of element) {
            let row = elem.row;
            let column = elem.column;
            let type = elem.type;
            matrix[row][column] = type;
        }
        drawBG();
        drawMatrix();
    } else {
        let row = element.row;
        let column = element.column;
        let type = element.type;
        let oldType = matrix[row][column];
        matrix[row][column] = type;
        if (oldType == RECT_TYPE.NONE && type != RECT_TYPE.NONE) {
            ctx.fillStyle = RECT_COLOR[type];
            ctx.fillRect(column * GRID_SPACE, row * GRID_SPACE, GRID_SPACE, GRID_SPACE);
        } else {
            drawBG();
            drawMatrix();
        }   
    }
}

window.onresize = function() {
    drawBG();
    drawMatrix();
}

window.oncontextmenu = function(e) {
    e.preventDefault();
    menu_right.style.display = "block";
    menu_right.style.left = e.offsetX + "px";
    menu_right.style.top = e.offsetY + "px"; 
}

window.onclick = function() { 
    menu_right.style.display = "none";
}

canvas.onmousemove = function(e) {
    if (canAddRect) {
        addRect(e);
    }
}

canvas.onmousedown = function(e) {
    if (e.button == 0) {
        canAddRect = true;
        if (toFill) {
            fillRect(e);
            toFill = false;
        } else {
            addRect(e);
        }
    }
}

canvas.onmouseup = function(e) {
    if (e.button == 0) {
        canAddRect = false;
    }
}

btn_rect_none.onclick = function() {
    rectType = RECT_TYPE.NONE;
    document.getElementById("rect-fill").style.backgroundColor = "rgba(0,0,0,0)";
}

btn_rect_blue.onclick = function() {
    rectType = RECT_TYPE.BLUE;
    document.getElementById("rect-fill").style.backgroundColor = "blue";
}

btn_rect_red.onclick = function() {
    rectType = RECT_TYPE.RED;
    document.getElementById("rect-fill").style.backgroundColor = "red";
}

btn_fill.onclick = function() {
    toFill = true;
}

btn_revoke.onclick = function() {
    revoke();
}

function setMapData(imageBase64Matrix, rowCount, colCount, mapJson) {
    let canvasTemp = document.createElement("canvas");
    let ctxTemp = canvasTemp.getContext("2d");
    let imageTotalCount = 0;
    let imageLoadCount = 0;
    let images = [];
    for (let row = 0; row < rowCount; row++) {
        for (let col = 0; col < colCount; col++) {
            let imageBase64 = imageBase64Matrix[row][col];
            let image = new Image();
            image.src = imageBase64;
            image.onload = () => {
                if (!(images[row] instanceof Array)) {
                    images[row] = [];
                }
                images[row][col] = image;
                imageLoadCount++;
                if (imageTotalCount == imageLoadCount) {
                    let canvasWidth = 0;
                    let canvasHeight = 0;
                    for (let r = 0; r < images.length; r++) {
                        for (let c = 0; c < images[r].length; c++) {
                            if (c == 0) canvasHeight += images[r][c].height;
                            if (r == 0) canvasWidth += images[r][c].width;
                        }
                    }
                    canvasTemp.width = canvasWidth;
                    canvasTemp.height = canvasHeight;
                    let imageY = 0;
                    for (let r = 0; r < images.length; r++) {
                        let imageX = 0;
                        for (let c = 0; c < images[r].length; c++) {
                            ctxTemp.drawImage(images[r][c], imageX, imageY);
                            imageX += images[r][c].width;
                            if (c == images[r].length - 1) imageY += images[r][c].height;
                        }
                    }
                    bgImage = new Image();
                    bgImage.src = canvasTemp.toDataURL("image/png");
                    bgImage.onload = () => {
                        initMatrix();
                        drawBG();
                        if (mapJson) {
                            let a = mapJson.rowCount != matrixRowCount;
                            let b = mapJson.columnCount != matrixColumnCount;
                            let c = mapJson.gridSize != GRID_SPACE; 
                            if (a || b || c) { 
                                Editor.warn("导入的地图数据不匹配");
                                return;
                            }
                            matrix = mapJson.matrix;
                            drawMatrix();
                        }
                    }
                }
            };
            imageTotalCount++;
        }
    }
}

function save() {
    if (matrix) {
        let data = {
            matrix: matrix, 
            rowCount: matrixRowCount, 
            columnCount: matrixColumnCount, 
            width: bgImage.width, 
            height: bgImage.height,
            gridSize: GRID_SPACE
        };
        Editor.Ipc.sendToMain("map-editor:save-map", JSON.stringify(data));
    } else {
        Editor.warn("没有数据可保存");
    }
}

btn_save.onclick = save;

var onKeyControlLeft = false;

document.onkeydown = function(e) {
    if (e.code == "ControlLeft") {
        onKeyControlLeft = true;
    }
    if (e.code == "KeyZ" && onKeyControlLeft) {
        revoke();
    }
    else if (e.code == "KeyS" && onKeyControlLeft) {
        save();
    }
};

document.onkeyup = function(e) {
    if (e.code == "ControlLeft") {
        onKeyControlLeft = false;
    }
};

drawBG();