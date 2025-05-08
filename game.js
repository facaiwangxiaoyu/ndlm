import { shuffleGrid } from './shuffle.js';
import { GameTimer } from './timer.js';
import { LevelManager } from './levelManager.js';
import { HintManager } from './hint.js';
import { CollectionManager } from './collectionManager.js';
import { getCookie } from './utils.js';  // 添加这行

let firstSelectedCell = null;
let secondSelectedCell = null;
let gameGrid = Array(10).fill().map(() => Array(7).fill(null));
let gameTimer = null;
let levelManager = null;
let hintManager = null;
let collectionManager = null;

// 添加全局变量
let connectionCanvas = null;
let connectionCtx = null;
let lastConnectionPath = [];

function initConnectionCanvas() {
    console.log('初始化连线 canvas');
    // 创建canvas用于绘制连线
    connectionCanvas = document.createElement('canvas');
    connectionCanvas.id = 'connectionCanvas';
    const container = document.querySelector('.game-body-cell');
    console.log('容器尺寸:', {
        width: container.clientWidth,
        height: container.clientHeight
    });
    container.appendChild(connectionCanvas);
    

    // 设置canvas尺寸
    function resizeCanvas() {
        connectionCanvas.width = container.clientWidth;
        connectionCanvas.height = container.clientHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    connectionCtx = connectionCanvas.getContext('2d');
    console.log('canvas 尺寸:', {
        width: connectionCanvas.width,
        height: connectionCanvas.height
    });
}

function drawConnection(path) {
    console.log('开始绘制连线, 路径:', path);
    if (!connectionCtx || !path || path.length < 2) {
        console.log('无法绘制连线:', {
            hasContext: !!connectionCtx,
            hasPath: !!path,
            pathLength: path?.length
        });
        return;
    }

    // 清除之前的连线
    connectionCtx.clearRect(0, 0, connectionCanvas.width, connectionCanvas.height);

    // 设置线条样式
    connectionCtx.strokeStyle = '#ffeb3b';
    connectionCtx.lineWidth = 3;
    connectionCtx.lineCap = 'round';
    connectionCtx.lineJoin = 'round';
    console.log('设置线条样式:', {
        strokeStyle: connectionCtx.strokeStyle,
        lineWidth: connectionCtx.lineWidth,
        lineCap: connectionCtx.lineCap,
        lineJoin: connectionCtx.lineJoin
    });
    // 开始绘制路径
    connectionCtx.beginPath();
    connectionCtx.moveTo(path[0].x, path[0].y);
    console.log('起点:', path[0]);
    for (let i = 1; i < path.length; i++) {
        connectionCtx.lineTo(path[i].x, path[i].y);
        console.log('路径点:', path[i]);
    }
    connectionCtx.stroke();

    // 设置定时器清除连线
    setTimeout(() => {
        connectionCtx.clearRect(0, 0, connectionCanvas.width, connectionCanvas.height);
    }, 500); // 500ms后清除连线
    console.log('绘制连线完成');
}

function getCellCenter(cell) {
    const rect = cell.getBoundingClientRect();
    const containerRect = connectionCanvas.getBoundingClientRect();
    const center = {
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top + rect.height / 2
    };
    console.log('获取格子中心点:', {
        cell: cell.dataset,
        rect: rect,
        containerRect: containerRect,
        center: center
    });
    return center;
}

function generateImagePool() {
    let imagePool = [];
    let availableSlots = 40;
    
    for(let i = 0; i <= 10; i++) {
        imagePool.push(i, i);
        availableSlots -= 2;
    }
    
    while(availableSlots > 1) {
        const randomImg = Math.floor(Math.random() * 11);
        imagePool.push(randomImg, randomImg);
        availableSlots -= 2;
    }
    
    for(let i = imagePool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [imagePool[i], imagePool[j]] = [imagePool[j], imagePool[i]];
    }
    
    return imagePool;
}

// 添加辅助方法
function isRowEmpty(grid, row, start, end) {
    console.log(`检查第${row}行从${start}到${end}是否为空`);
    for (let col = Math.min(start, end) + 1; col < Math.max(start, end); col++) {
        if (grid[row][col] && grid[row][col].dataset.cleared !== 'true') {
            console.log(`  位置(${row},${col})不为空`);
            return false;
        }
    }
    console.log(`  该行路径通畅`);
    return true;
}

function isColEmpty(grid, col, start, end) {
    console.log(`检查第${col}列从${start}到${end}是否为空`);
    for (let row = Math.min(start, end) + 1; row < Math.max(start, end); row++) {
        if (grid[row][col] && grid[row][col].dataset.cleared !== 'true') {
            console.log(`  位置(${row},${col})不为空`);
            return false;
        }
    }
    console.log(`  该列路径通畅`);
    return true;
}

function isPointEmpty(grid, row, col) {
    return !grid[row][col] || grid[row][col].dataset.cleared === 'true';
}

// 修改canConnect函数
function canConnect(cell1, cell2, grid) {
    const row1 = parseInt(cell1.dataset.row);
    const col1 = parseInt(cell1.dataset.col);
    const row2 = parseInt(cell2.dataset.row);
    const col2 = parseInt(cell2.dataset.col);
    
    lastConnectionPath = [];
    console.log(`\n检查(${row1},${col1})和(${row2},${col2})是否可连接`);

    // 1. 直线消除
    // 1.1 同列直线消除
    if (col1 === col2) {
        console.log('检查同列直线消除');
        if (Math.abs(row1 - row2) === 1 || isColEmpty(grid, col1, row1, row2)) {
            console.log('同列可直接连接');
            // 记录连线路径
            const center1 = getCellCenter(cell1);
            const center2 = getCellCenter(cell2);
            lastConnectionPath = [center1, center2];
            return true;
        }
    }
    
    // 1.2 同行直线消除
    if (row1 === row2) {
        console.log('检查同行直线消除');
        if (Math.abs(col1 - col2) === 1 || isRowEmpty(grid, row1, col1, col2)) {
            console.log('同行可直接连接');
            // 记录连线路径
            const center1 = getCellCenter(cell1);
            const center2 = getCellCenter(cell2);
            lastConnectionPath = [center1, center2];
            return true;
        }
    }

    // 2. 一个拐点消除
    console.log('检查一个拐点消除');
    
    // 2.1 先水平后垂直
    if (isRowEmpty(grid, row1, col1, col2) && isPointEmpty(grid, row1, col2) && 
        isColEmpty(grid, col2, row1, row2)) {
        console.log('可通过先水平后垂直连接');
        const center1 = getCellCenter(cell1);
        const center2 = getCellCenter(cell2);
        const corner = {x: center2.x, y: center1.y};
        lastConnectionPath = [center1, corner, center2];
        return true;
    }
    
    // 2.2 先垂直后水平
    if (isColEmpty(grid, col1, row1, row2) && isPointEmpty(grid, row2, col1) && 
        isRowEmpty(grid, row2, col1, col2)) {
        console.log('可通过先垂直后水平连接');
        const center1 = getCellCenter(cell1);
        const center2 = getCellCenter(cell2);
        const corner = {x: center1.x, y: center2.y};
        lastConnectionPath = [center1, corner, center2];
        return true;
    }

    // 3. 两个拐点消除
    console.log('检查两个拐点消除');
    
    // 3.1 向右延伸寻找拐点
    for (let col = col1 + 1; col < grid[0].length; col++) {
        if (col === col2) continue;
        if (isRowEmpty(grid, row1, col1, col) && 
            isColEmpty(grid, col, row1, row2) && 
            isRowEmpty(grid, row2, col, col2) &&
            isPointEmpty(grid, row1, col) && 
            isPointEmpty(grid, row2, col)) {
            console.log(`找到向右延伸的连接路径，经过拐点(${row1},${col})和(${row2},${col})`);
            const center1 = getCellCenter(cell1);
            const center2 = getCellCenter(cell2);
            const corner1 = {
                x: center1.x + (col - col1) * cell1.offsetWidth,
                y: center1.y
            };
            const corner2 = {
                x: corner1.x,
                y: center2.y
            };
            lastConnectionPath = [center1, corner1, corner2, center2];
            return true;
        }
    }
    
    // 3.2 向左延伸寻找拐点
    for (let col = col1 - 1; col >= 0; col--) {
        if (col === col2) continue;
        if (isRowEmpty(grid, row1, col, col1) && 
            isColEmpty(grid, col, row1, row2) && 
            isRowEmpty(grid, row2, col, col2) &&
            isPointEmpty(grid, row1, col) && 
            isPointEmpty(grid, row2, col)) {
            console.log(`找到向左延伸的连接路径，经过拐点(${row1},${col})和(${row2},${col})`);
            const center1 = getCellCenter(cell1);
            const center2 = getCellCenter(cell2);
            const corner1 = {
                x: center1.x + (col - col1) * cell1.offsetWidth,
                y: center1.y
            };
            const corner2 = {
                x: corner1.x,
                y: center2.y
            };
            lastConnectionPath = [center1, corner1, corner2, center2];
            return true;
        }
    }
    
    // 3.3 向下延伸寻找拐点
    for (let row = row1 + 1; row < grid.length; row++) {
        if (row === row2) continue;
        if (isColEmpty(grid, col1, row1, row) && 
            isRowEmpty(grid, row, col1, col2) && 
            isColEmpty(grid, col2, row, row2) &&
            isPointEmpty(grid, row, col1) && 
            isPointEmpty(grid, row, col2)) {
            console.log(`找到向下延伸的连接路径，经过拐点(${row},${col1})和(${row},${col2})`);
            const center1 = getCellCenter(cell1);
            const center2 = getCellCenter(cell2);
            const corner1 = {
                x: center1.x,
                y: center1.y + (row - row1) * cell1.offsetHeight
            };
            const corner2 = {
                x: center2.x,
                y: corner1.y
            };
            lastConnectionPath = [center1, corner1, corner2, center2];
            return true;
        }
    }
    
    // 3.4 向上延伸寻找拐点
    for (let row = row1 - 1; row >= 0; row--) {
        if (row === row2) continue;
        if (isColEmpty(grid, col1, row, row1) && 
            isRowEmpty(grid, row, col1, col2) && 
            isColEmpty(grid, col2, row, row2) &&
            isPointEmpty(grid, row, col1) && 
            isPointEmpty(grid, row, col2)) {
            console.log(`找到向上延伸的连接路径，经过拐点(${row},${col1})和(${row},${col2})`);
            const center1 = getCellCenter(cell1);
            const center2 = getCellCenter(cell2);
            const corner1 = {
                x: center1.x,
                y: center1.y + (row - row1) * cell1.offsetHeight
            };
            const corner2 = {
                x: center2.x,
                y: corner1.y
            };
            lastConnectionPath = [center1, corner1, corner2, center2];
            return true;
        }
    }

    console.log('未找到有效连接路径');
    return false;
}

function checkLevelComplete() {
    const container = document.getElementById('gameCanvas');
    const cells = container.getElementsByClassName('cell');
    for (let cell of cells) {
        if (cell.dataset.cleared !== 'true') {
            return false;
        }
    }
    return true;
}

// 修改handleCellClick函数
function handleCellClick(cell) {
    if (cell.dataset.cleared === 'true') {
        console.log('点击了已消除的格子');
        return;
    }

    if (!firstSelectedCell) {
        console.log(`选中第一个格子: (${cell.dataset.row},${cell.dataset.col})`);
        firstSelectedCell = cell;
        cell.classList.add('active');
        const bgImage = cell.querySelector('.bg-image');
        bgImage.src = 'images/active.png';
        bgImage.style.opacity = '0';  // 添加透明度
    } else if (firstSelectedCell === cell) {
        console.log('取消选中第一个格子');
        firstSelectedCell.classList.remove('active');
        const bgImage = firstSelectedCell.querySelector('.bg-image');
        bgImage.src = 'images/pic-bg.png';
        bgImage.style.opacity = '0';  // 添加透明度
        firstSelectedCell = null;
    } else {
        console.log(`选中第二个格子: (${cell.dataset.row},${cell.dataset.col})`);
        secondSelectedCell = cell;
        cell.classList.add('active');
        const bgImage = cell.querySelector('.bg-image');
        bgImage.src = 'images/active.png';
        bgImage.style.opacity = '0';  // 添加透明度

        if (firstSelectedCell.dataset.imageType === secondSelectedCell.dataset.imageType) {
            console.log('图案匹配，检查连接...');
            if (canConnect(firstSelectedCell, secondSelectedCell, gameGrid)) {
                console.log('可以连接，路径:', lastConnectionPath);
                if (lastConnectionPath.length > 0) {
                    console.log('准备绘制连线，路径点数:', lastConnectionPath.length);
                    drawConnection(lastConnectionPath);
                }

                // 保存对元素的引用
                const cell1 = firstSelectedCell;
                const cell2 = secondSelectedCell;
                const elementImg1 = cell1.querySelector('.element-image');
                const elementImg2 = cell2.querySelector('.element-image');

                // 添加淡出动画
                elementImg1.style.transition = 'opacity 0.5s';
                elementImg2.style.transition = 'opacity 0.5s';
                elementImg1.style.opacity = '0';
                elementImg2.style.opacity = '0';

                setTimeout(() => {
                    // 使用保存的引用而不是可能为null的全局变量
                    cell1.dataset.cleared = 'true';
                    cell2.dataset.cleared = 'true';
                    elementImg1.style.display = 'none';
                    elementImg2.style.display = 'none';
                    
                    if (checkLevelComplete()) {
                        console.log('关卡完成！');
                        if (gameTimer) {
                            gameTimer.stop();
                        }
                        levelManager.completeLevel();
                    }
                }, 500);
            } else {
                console.log('无法连接这两个格子');
            }
        } else {
            console.log('图案不匹配');
        }

        setTimeout(() => {
            if (firstSelectedCell) {
                firstSelectedCell.classList.remove('active');
                firstSelectedCell.querySelector('.bg-image').src = 'images/pic-bg.png';
            }
            if (secondSelectedCell) {
                secondSelectedCell.classList.remove('active');
                secondSelectedCell.querySelector('.bg-image').src = 'images/pic-bg.png';
            }
            firstSelectedCell = null;
            secondSelectedCell = null;
        }, 500);
    }

    // 清除提示效果
    if (hintManager) {
        hintManager.clearHint();
    }
}

function generateGrid() {
    const container = document.getElementById('gameCanvas');
    if (!container) return;

    container.innerHTML = '';
    
    const imagePool = generateImagePool();
    let index = 0;
    
    // 初始化空的游戏网格
    gameGrid = Array(10).fill().map(() => Array(7).fill(null));
    
    // 创建实际的游戏格子
    for(let i = 1; i < 9; i++) {
        for(let j = 1; j < 6; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.dataset.cleared = 'false';  // 确保初始状态为未消除
            
            const bgImg = document.createElement('img');
            bgImg.className = 'bg-image';
            bgImg.src = 'images/pic-bg.png';
            bgImg.style.opacity = '0';  // 添加透明度
            
            if(index < 40) {
                const elementImg = document.createElement('img');
                elementImg.className = 'element-image';
                elementImg.src = `images/bird/${imagePool[index]}.png`;
                cell.dataset.imageType = imagePool[index];
                cell.appendChild(elementImg);
            }
            
            cell.appendChild(bgImg);
            container.appendChild(cell);
            gameGrid[i][j] = cell;  // 将cell存储到网格中
            cell.addEventListener('click', () => handleCellClick(cell));
            index++;
        }
    }
    
    // 设置边界格子为已清除状态
    for(let i = 0; i < 10; i++) {
        for(let j = 0; j < 7; j++) {
            if(i === 0 || i === 9 || j === 0 || j === 6) {
                gameGrid[i][j] = {
                    dataset: { cleared: 'true' }
                };
            }
        }
    }
}

function updateLevelDisplay(level) {
    const subtitle = document.querySelector('.subtitle-center');
    subtitle.innerHTML = ''; // 清空原有内容
    
    // 将数字转为字符串，方便分离每一位
    const levelStr = level.toString();
    
    // 为每一位数字创建对应的图片
    for (let digit of levelStr) {
        const img = document.createElement('img');
        img.src = `images/number/${digit}.png`;
        img.style.height = '100%';  // 保持图片高度一致
        img.style.margin = '0 2px'; // 数字之间添加间距
        subtitle.appendChild(img);
    }
}

// 修改initGame函数
function initGame() {
    //console.log('initGame 开始执行');
    // console.log('当前页面状态:', {
    //     homePage: $('.HomePage').is(':visible'),
    //     gamePage: $('.GamePage').is(':visible'),
    //     mapPage: $('.MapPage').is(':visible'),
    //     videoPage: $('.VideoPage').is(':visible')
    // });

    levelManager = new LevelManager();
    collectionManager = new CollectionManager();
    window.collectionManager = collectionManager;
    window.levelManager = levelManager;

    const timerContainer = document.querySelector('.f1 img');
    gameTimer = new GameTimer(timerContainer.parentElement);
    window.gameTimer = gameTimer;

    // 确保主页显示，其他页面隐藏
    //console.log('设置初始页面状态');
    $('.HomePage').show();
    $('.GamePage, .MapPage, .VideoPage').hide();

    //console.log('初始化计时器');  // 调试日志
    
    gameTimer.onTimeOver = () => {
        // 只有在游戏页面显示时才显示游戏结束
        if ($('.GamePage').is(':visible')) {
            //console.log('游戏时间结束');  // 调试日志
            levelManager.gameOver(); // 使用新的gameOver方法
            $('.GameOver').css('display', 'flex');
            levelManager.resetProgress();
            collectionManager.resetCollection();
        }
    };

    levelManager.onLevelStart = (level) => {
        updateLevelDisplay(level);
        generateGrid();
        if (gameTimer) {
            gameTimer.reset();
            gameTimer.start();
        }
        // 初始化提示管理器
        if (hintManager) {
            hintManager.clearHint();
        }
        hintManager = new HintManager(gameGrid, canConnect);
    };

    levelManager.onLevelComplete = (level, isLastLevel) => {
        // 直接获取随机碎片并保存
        collectionManager.getRandomUnCollectedPiece();

        if (isLastLevel) {
            // 这是第40关通过的情况
            // 替换成功窗口中的"下一关"按钮图片为"查看回忆"
            $('.success-body-c2 img').eq(1).attr('src', 'images/view-memory.png');
        }
        
        // 显示成功弹窗
        $('.GameSuccess').css('display', 'flex');
    };

    levelManager.onGameComplete = () => {
        // 移除自动播放视频的逻辑，改为在点击"查看回忆"时触发
    };

    levelManager.onGameOver = () => {
        $('.GameOver').show();
    };

    //levelManager.start();
    
    // 修改音乐控制
    const musicBtn = document.getElementById('music_btn');

    musicBtn.addEventListener('click', () => {
        const isPlaying = levelManager.toggleMusic();
        musicBtn.src = isPlaying ? 'images/music.png' : 'images/music-off.png';
    });

    
}

document.addEventListener('DOMContentLoaded', () => {
    //console.log('DOM内容加载完成');
    // console.log('开始初始化游戏前页面状态:', {
    //     homePage: $('.HomePage').is(':visible'),
    //     gamePage: $('.GamePage').is(':visible')
    // });
    initGame();
});

// 添加页面加载完成事件监听
window.addEventListener('load', () => {
    // console.log('页面完全加载完成');
    // console.log('页面加载后状态:', {
    //     homePage: $('.HomePage').is(':visible'),
    //     gamePage: $('.GamePage').is(':visible')
    // });
});

$(document).ready(function () {
    // 修改主页进入冒险按钮事件
    $("#home-foot-adventure").click(function () {
        //console.log('===== 点击冒险按钮 =====');
        if (!levelManager) {
            //console.error('levelManager 未初始化');
            return;
        }

        // console.log('当前状态:', {
        //     currentLevel: getCookie('currentLevel'),
        //     gameCompleted: levelManager.isGameCompleted,
        //     cookieCompleted: getCookie('gameCompleted')
        // });

        // 检查是否已通关
        const isCompleted = levelManager.isAllLevelsCompleted();
        //console.log('通关检查结果:', isCompleted);

        if (isCompleted) {
            //console.log('游戏已通关，跳转到回忆页面');
            $(".MapPage").show();
            $(".HomePage").hide();
            $(".GamePage").hide(); // 确保游戏页面被隐藏
            // 解锁所有碎片
            for (let i = 1; i <= 40; i++) {
                if (!collectionManager.hasCollected(i)) {
                    collectionManager.collectedPieces.add(i);
                }
            }
            collectionManager.saveCollectedPieces();
            renderCollectionPieces(collectionManager);
        } else {
            //console.log('游戏未通关，进入游戏页面');
            $(".GamePage").show();
            $(".HomePage").hide();
            $(".MapPage").hide();  // 确保其他页面被隐藏
            setTimeout(() => {
                levelManager.start();
                // 初始化连线canvas
                initConnectionCanvas();
            }, 100);
        }
    });

    // 修改碎片页面进入冒险按钮事件
    $("#map-adventure").click(function () {
        if (getCookie('currentLevel') === '-1' || levelManager.isGameCompleted) {
            $('.CompletionDialog').css('display', 'flex');
            return;
        }

        $(".GamePage").show();
        $(".MapPage").hide();
        levelManager.start();
        // 初始化连线canvas
        initConnectionCanvas();
    });

    // 修改第40关通关后的成功弹窗按钮
    $("#success-next").click(function() {
        if (levelManager.currentLevel > levelManager.maxLevel) {
            // 第40关通过后的处理
            $('.GameSuccess').hide();
            $('.GamePage').hide();
            $('.MapPage').show();
            // 解锁所有碎片
            for (let i = 1; i <= 40; i++) {
                if (!collectionManager.hasCollected(i)) {
                    collectionManager.collectedPieces.add(i);
                }
            }
            collectionManager.saveCollectedPieces();
            renderCollectionPieces(collectionManager);
        } else {
            // 普通关卡通过后的处理
            $('.GameSuccess').hide();
            levelManager.startLevel();
        }
    });

    $("#reset_btn").click(function() {
        if(firstSelectedCell) {
            firstSelectedCell.classList.remove('active');
            firstSelectedCell.querySelector('.bg-image').src = 'images/pic-bg.png';
            firstSelectedCell = null;
        }
        if(secondSelectedCell) {
            secondSelectedCell.classList.remove('active');
            secondSelectedCell.querySelector('.bg-image').src = 'images/pic-bg.png';
            secondSelectedCell = null;
        }
        
        shuffleGrid(gameGrid);
    });

    $(".GameOver").click(function() {
        $(this).hide();
        levelManager.retryLevel();
    });

    // 添加提示按钮事件处理
    $("#remind_btn").click(function() {
        if (hintManager) {
            hintManager.showHint();
        }
    });

    $("#gameover-home").click(function() {
        $('.GameOver').hide();
        $('.GamePage').hide();
        $('.HomePage').show();
        levelManager.stopBGM();
        levelManager.resetProgress();
        collectionManager.resetCollection();
        // 阻止自动开始新关卡
        levelManager.isGameStarted = false; // 添加一个标志来控制游戏是否应该开始
    });

    $("#gameover-replay").click(function() {
        $('.GameOver').hide();
        levelManager.retryLevel();
    });

    $("#home").click(function() {
        $('.GamePage').hide();
        $('.HomePage').show();
        // 正常返回主页时保留进度，不需要重置
    });

    // 修改下一关按钮事件
    $(".next-level-btn").click(function() {
        $('.GameSuccess').hide();
        // 移除这里的BGM播放，因为startLevel中会处理
        levelManager.startLevel();
    });

    // 修改成功界面的按钮事件
    $("#success-home").click(function() {
        $('.GameSuccess').hide();
        $('.GamePage').hide();
        $('.HomePage').show();
        if (window.levelManager) {
            window.levelManager.stopBGM();
        }
    });

    $("#success-next").click(function() {
        $('.GameSuccess').hide();
        levelManager.startLevel();
    });

    // 添加通关弹窗按钮的点击事件
    $("#complete-home").click(function() {
        //console.log('点击返回主页按钮');
        $('.CompletionDialog').hide();
        $('.MapPage').hide();
        $('.HomePage').show();
    });

    $("#complete-video").click(function() {
        //console.log('点击查看回忆按钮');
        $('.CompletionDialog').hide();
        $('.MapPage').hide();
        $('.VideoPage').show();
    });

    // 修改通关弹窗的点击事件
    $(".CompletionDialog").click(function() {
        $(this).hide();
    });

    $("#complete-home").click(function(e) {
        e.stopPropagation(); // 阻止事件冒泡
        //console.log('点击返回主页按钮');
        $('.CompletionDialog').hide();
        $('.MapPage').hide();
        $('.HomePage').show();
    });

    $("#complete-video").click(function(e) {
        e.stopPropagation(); // 阻止事件冒泡
        //console.log('点击查看回忆按钮');
        $('.CompletionDialog').hide();
        $('.MapPage').hide();
        $('.VideoPage').show();
    });
});


