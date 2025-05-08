export class GameTimer {
    constructor(container) {
        this.container = container;
        this.totalTime = 90000; // 改回60秒
        this.currentTime = 0;
        this.isRunning = false;
        this.timerId = null;
        this.onTimeOver = null;

        // 获取time-bg元素并保存其尺寸位置信息
        const timeBg = this.container.querySelector('img');
        const timeBgRect = timeBg.getBoundingClientRect();
        
        // 创建时间遮罩层容器，位置和大小与time-bg一致
        this.timeBarContainer = document.createElement('div');
        this.timeBarContainer.style.position = 'absolute';
        this.timeBarContainer.style.width = '47%';
        this.timeBarContainer.style.height = '50%';
        this.timeBarContainer.style.left = '50%';
        this.timeBarContainer.style.top = '50%';
        this.timeBarContainer.style.transform = 'translate(-50%, -50%)';
        this.timeBarContainer.style.overflow = 'hidden';

        // 创建时间遮罩层，完全覆盖容器
        this.timeBar = document.createElement('img');
        this.timeBar.src = 'images/time/time.png';
        this.timeBar.style.position = 'absolute';
        this.timeBar.style.height = '100%';
        this.timeBar.style.width = '0%';
        this.timeBar.style.left = '1%';
        this.timeBar.style.top = '1%';
        this.timeBar.style.objectFit = 'cover';
        this.timeBar.style.zIndex = '1';

        // 创建时间进度条底图
        this.timeBg=document.createElement('img')
        this.timeBg.src='images/time/time-bg.png'
        this.timeBg.style.position = 'absolute';
        this.timeBg.style.height = '100%';
        this.timeBg.style.width = '100%';
        this.timeBg.style.left = '0';
        this.timeBg.style.top = '0';
        this.timeBg.style.objectFit = 'fill';


        // 创建小鸟图标，大小相对于容器
        this.bird = document.createElement('img');
        this.bird.src = 'images/time/bird.png';
        this.bird.style.position = 'absolute';
        this.bird.style.height = '100%';
        this.bird.style.top = '0';
        this.bird.style.left = '5%';
        this.bird.style.transform = 'translateX(-50%)';
        this.bird.style.zIndex = '2';
        
        // 添加元素到容器
        this.timeBarContainer.appendChild(this.timeBar);
        this.timeBarContainer.appendChild(this.bird);
        this.timeBarContainer.appendChild(this.timeBg)
        
        // 确保container有相对定位
        this.container.style.position = 'relative';
        
        // 将timeBarContainer添加到主容器
        this.container.appendChild(this.timeBarContainer);
    }
    
    update = () => {
        if (!this.isRunning) return;
        
        this.currentTime += 50;
        const progress = Math.min(this.currentTime / this.totalTime, 1);
        
        // 更新时间条和小鸟位置
        this.timeBar.style.width = `${progress * 100}%`;
        this.bird.style.left = `${progress * 100}%`;
        
        // 检查是否结束
        if (this.currentTime >= this.totalTime) {
            this.stop();
            if (this.onTimeOver) {
                this.onTimeOver();
            }
            return;
        }
        
        // 继续下一帧
        this.timerId = setTimeout(this.update, 50);
    }
    
    start() {
        //console.log('计时器启动');  // 调试日志
        if (this.isRunning) return;
        this.isRunning = true;
        this.update();
    }
    
    stop() {
        //console.log('计时器停止');  // 调试日志
        this.isRunning = false;
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
    }
    
    reset() {
        //console.log('计时器重置');  // 调试日志
        this.stop();
        this.currentTime = 0;
        this.timeBar.style.width = '0%';
        this.bird.style.left = '0';
    }
}
