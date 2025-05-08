import { setCookie, getCookie, deleteCookie } from './utils.js';

export class LevelManager {
    constructor() {
        console.log('===== LevelManager Constructor Start =====');
        console.log('LevelManager 构造函数执行');
        this.currentLevel = 1;
        this.maxLevel = 40;
        this.timeLimit = 60000; // 60秒
        this.onLevelStart = null;
        this.onLevelComplete = null;
        this.onGameComplete = null;
        this.onGameOver = null;
        this.loadProgress();
        console.log('加载进度后:', {
            currentLevel: this.currentLevel,
            isGameCompleted: this.isGameCompleted,
            cookieLevel: getCookie('currentLevel')
        });
        this.bgmPlayer = new Audio();
        this.bgmPlayer.loop = true;
        this.successSound = new Audio('audio/success.mp3');
        this.failSound = new Audio('audio/over2.mp3');
        this.isMusicPlaying = true; // 添加音乐状态跟踪
        this.isGameCompleted = false;
        this.loadGameCompletedStatus();

        // 在构造函数中添加对当前关卡的检查
        if (this.currentLevel > this.maxLevel) {
            this.currentLevel = this.maxLevel;
            this.isGameCompleted = true;
            this.saveGameCompletedStatus();
        }
        this.isGameStarted = false;
        console.log('===== LevelManager Constructor End =====');
    }

    loadProgress() {
        console.log('===== Load Progress Start =====');
        const level = getCookie('currentLevel');
        console.log('读取到的关卡:', level);

        if (level === '-1') {
            console.log('检测到通关标记');
            this.isGameCompleted = true;
            this.saveGameCompletedStatus();
            this.currentLevel = this.maxLevel;
        } else if (level) {
            this.currentLevel = parseInt(level);
        }

        console.log('加载后状态:', {
            currentLevel: this.currentLevel,
            isGameCompleted: this.isGameCompleted,
            cookieLevel: getCookie('currentLevel')
        });
        console.log('===== Load Progress End =====');
    }

    loadGameCompletedStatus() {
        const completed = getCookie('gameCompleted');
        this.isGameCompleted = completed === 'true';
    }

    saveGameCompletedStatus() {
        setCookie('gameCompleted', this.isGameCompleted, 30);
    }

    start() {
        this.isGameStarted = true;
        console.log('LevelManager.start() 被调用');
        console.log('当前关卡:', this.currentLevel);
        console.log('Cookie中的关卡:', getCookie('currentLevel'));
        
        if (this.isGameCompleted || getCookie('currentLevel') === '-1') {
            console.log('游戏已通关，不应该启动关卡');
            return;
        }

        if (!getCookie('currentLevel')) {
            this.currentLevel = 1;
        }
        this.startLevel();
    }

    startLevel() {
        if (!this.isGameStarted) {
            return;
        }
        console.log('LevelManager.startLevel() 被调用');
        console.log('即将开始的关卡:', this.currentLevel);
        
        if (this.isGameCompleted || getCookie('currentLevel') === '-1') {
            console.log('游戏已通关，不应该启动关卡');
            return;
        }
        
        // 添加安全检查
        if (this.currentLevel > this.maxLevel) {
            this.currentLevel = this.maxLevel;
            this.isGameCompleted = true;
            this.saveGameCompletedStatus();
            return;
        }

        // 进入关卡前确保所有页面状态正确
        $('.VideoPage').hide();
        $('.MapPage').hide();
        $('.HomePage').hide();
        $('.GamePage').show();

        // 重置页面宽度
        $('.GamePage').css('width', '100%');

        // 进入关卡时播放对应BGM
        this.playLevelBGM(this.currentLevel);
        if (this.onLevelStart) {
            this.onLevelStart(this.currentLevel);
        }
    }

    completeLevel() {
        console.log('===== Complete Level Start =====');
        console.log('当前关卡:', this.currentLevel);
        console.log('最大关卡:', this.maxLevel);
        
        this.stopBGM();
        
        this.successSound.currentTime = 0;
        this.successSound.play().catch(error => {
            console.log('播放成功音效失败:', error);
        });

        // 第40关通过的特殊处理
        if (this.currentLevel === this.maxLevel) {
            console.log('达到最后一关，设置通关状态');
            this.isGameCompleted = true;
            this.saveGameCompletedStatus();
            // 设置特殊的currentLevel值表示游戏完成
            setCookie('currentLevel', '-1', 30);
            console.log('保存后的状态:', {
                isGameCompleted: this.isGameCompleted,
                cookieLevel: getCookie('currentLevel'),
                cookieCompleted: getCookie('gameCompleted')
            });
            if (this.onLevelComplete) {
                this.onLevelComplete(this.currentLevel, true);
            }
            return;
        }

        this.currentLevel++;
        setCookie('currentLevel', this.currentLevel, 30);
        
        if (this.onLevelComplete) {
            this.onLevelComplete(this.currentLevel, false);
        }
        console.log('===== Complete Level End =====');
    }

    retryLevel() {
        this.startLevel();
    }

    resetProgress() {
        this.stopBGM();
        this.currentLevel = 1;
        deleteCookie('currentLevel');
        deleteCookie('gameCompleted');
    }

    getCurrentLevel() {
        return this.currentLevel;
    }

    getTimeLimit() {
        return this.timeLimit;
    }

    playLevelBGM(level) {
        // 停止当前播放的音乐
        this.bgmPlayer.pause();
        this.bgmPlayer.currentTime = 0;
        
        // 设置并播放新的音乐
        this.bgmPlayer.src = `audio/bgm/${level}.MP3`;
        if (this.isMusicPlaying) {
            this.bgmPlayer.play().catch(error => {
                console.log('BGM播放失败:', error);
            });
        }
    }

    stopBGM() {
        this.bgmPlayer.pause();
        this.bgmPlayer.currentTime = 0;
    }

    gameOver() {
        this.stopBGM();
        // 播放失败音效
        this.failSound.currentTime = 0;
        this.failSound.play().catch(error => {
            console.log('播放失败音效失败:', error);
        });
        
        if (this.onGameOver) {
            this.onGameOver();
        }
    }

    toggleMusic() {
        this.isMusicPlaying = !this.isMusicPlaying;
        if (this.isMusicPlaying) {
            this.bgmPlayer.play();
        } else {
            this.bgmPlayer.pause();
        }
        return this.isMusicPlaying;
    }

    isAllLevelsCompleted() {
        const status = {
            isGameCompleted: this.isGameCompleted,
            currentLevel: this.currentLevel,
            cookieLevel: getCookie('currentLevel'),
            cookieCompleted: getCookie('gameCompleted')
        };
        console.log('检查通关状态:', status);
        return this.isGameCompleted || getCookie('currentLevel') === '-1';
    }
}
