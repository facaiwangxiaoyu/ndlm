// 点击显示彩蛋页面
$(document).ready(function () {
    $("#secret").click(function () {
        $(".SecretPage").show();
        $(".HomePage").hide();
    });
});
// 点击回到主页
$(document).ready(function () {
    $("#secret-home").click(function () {
        $(".HomePage").show();
        $(".SecretPage").hide();
    });
});

$(document).ready(function () {
    $("#secret").click(function () {
        $(".SecretPage").show();
        $(".HomePage").hide();
    });
});
// 点击start开始游戏，隐藏主页，显示游戏页
$(document).ready(function () {
    $("#home-foot-adventure").click(function () {
        //console.log('进入游戏页面');  // 调试日志
        $(".GamePage").show();
        $(".HomePage").hide();
        // 等待DOM更新后再初始化
        setTimeout(() => {
            levelManager.start(); // 这会触发BGM播放
            if (window.gameTimer) {
                //console.log('重置并启动计时器');  // 调试日志
                window.gameTimer.reset();
                window.gameTimer.start();
            }
        }, 200);
    });

    $("#map-adventure").click(function () {
        // 检查是否已通关
        const levelManager = window.levelManager;
        if (levelManager && levelManager.isGameCompleted) {
            // alert("您已经通过全部关卡！");  // 也可以改成弹出自定义对话框
            return;
        }

        $(".GamePage").show();
        $(".MapPage").hide();
        levelManager.start(); // 这会触发BGM播放
        // 从碎片页面进入游戏页面时，重置并启动计时器
        if (window.gameTimer) {
            window.gameTimer.reset();
            window.gameTimer.start();
        }
    });

    $("#home").click(function () {
        //console.log('返回主页');  // 调试日志
        $(".GamePage").hide();
        $(".HomePage").show();
        if (window.gameTimer) {
            window.gameTimer.stop();
            window.gameTimer.reset();
        }
        if (window.levelManager) {
            window.levelManager.stopBGM(); // 返回主页时停止BGM
        }
        // 隐藏任何可能显示的游戏结束界面
        $('.GameOver').hide();
    });

    $("#home-foot-memory").click(function () {
        //console.log('进入碎片页面');  // 调试日志
        $(".MapPage").show();
        $(".HomePage").hide();
        if (window.gameTimer) {
            window.gameTimer.stop();
            window.gameTimer.reset();
        }
        if (window.levelManager) {
            window.levelManager.stopBGM(); // 进入碎片页面时停止BGM
        }
        renderCollectionPieces(window.collectionManager);
    });

    // 修改下一关按钮事件
    $(".next-level-btn").click(function() {
        $('.GameSuccess').hide();
        levelManager.startLevel(); // 这会播放新关卡的BGM
    });

    $("#map-video").click(function () {
        // 检查是否完成所有关卡
        const levelManager = window.levelManager;
        // const completed = getCookie('gameCompleted');
        // if (levelManager && levelManager.getCurrentLevel() > levelManager.maxLevel) {
        //console.log("isGameCompleted:", levelManager.isGameCompleted);  // 调试日志
        if (levelManager.isGameCompleted===true) {
            $(".VideoPage").show();
            $(".MapPage").hide();
            // 自动播放视频
            const video = document.getElementById('birthdayVideo');
            if (video) {
                video.play();
            }
        } else {
            alert("还未通关全部关卡，继续努力！");
        }
    });

    $("#video-back-home").click(function () {
        $(".HomePage").show();
        $(".VideoPage").hide();
    });

    // $("#gameover-home").click(function() {
    //     $('.GameOver').hide();
    //     $('.GamePage').hide();
    //     $('.HomePage').show();
    //     levelManager.stopBGM();
    // });
});

// 初始化游戏画布
function initGameCanvas() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const container = document.querySelector('.game-body-cell');
    
    function resizeCanvas() {
        // 设置画布大小，保持5:8的比例
        const containerWidth = container.clientWidth * 0.9;
        const containerHeight = container.clientHeight * 0.9;
        
        // 计算最适合的画布大小，保持5:8比例
        const ratio = 5/8;
        if (containerWidth / containerHeight > ratio) {
            canvas.height = containerHeight;
            canvas.width = containerHeight * ratio;
        } else {
            canvas.width = containerWidth;
            canvas.height = containerWidth / ratio;
        }
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    const img = new Image();
    img.src = 'images/pic-bg.png';
    
    img.onload = function() {
        const rows = 8;  // 改为8行
        const cols = 5;  // 5列
        
        const cellWidth = canvas.width / cols;
        const cellHeight = canvas.height / rows;
        
        // 计算图片缩放大小，保持比例
        const imageAspectRatio = img.width / img.height;
        let drawWidth = cellWidth * 0.9;
        let drawHeight = cellHeight * 0.9;
        
        if (drawWidth / drawHeight > imageAspectRatio) {
            drawWidth = drawHeight * imageAspectRatio;
        } else {
            drawHeight = drawWidth / imageAspectRatio;
        }
        
        // 绘制网格
        for(let i = 0; i < rows; i++) {
            for(let j = 0; j < cols; j++) {
                const x = j * cellWidth + (cellWidth - drawWidth) / 2;
                const y = i * cellHeight + (cellHeight - drawHeight) / 2;
                
                ctx.drawImage(img, 
                    x, 
                    y,
                    drawWidth,
                    drawHeight
                );
            }
        }
    };
}

// 展示碎片逻辑
function renderCollectionPieces(collectionManager) {
    const grid = document.getElementById('pieces-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    // 生成40个碎片位置
    for(let i = 1; i <= 40; i++) {
        const piece = document.createElement('div');
        piece.className = 'piece-item' + (collectionManager.hasCollected(i) ? ' collected' : '');
        
        const img = document.createElement('img');
        img.src = `images/collection/${i}.png`;
        piece.appendChild(img);
        grid.appendChild(piece);
    }
}

function initGame() {
    // ...existing code...
    
    // 修改音乐控制
    const musicBtn = document.getElementById('music_btn');
    let isMusicPlaying = true; // 默认开启音乐

    musicBtn.addEventListener('click', () => {
        if (isMusicPlaying) {
            levelManager.bgmPlayer.pause();
            musicBtn.src = 'images/music.png';
        } else {
            levelManager.bgmPlayer.play();
            musicBtn.src = 'images/music-off.png';
        }
        isMusicPlaying = !isMusicPlaying;
    });
}