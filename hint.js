export class HintManager {
    constructor(gameGrid, canConnectFn) {
        this.gameGrid = gameGrid;
        this.canConnect = canConnectFn;
        this.hintCells = null;
        this.hintAnimationFrame = null;
        this.isHinting = false;
    }

    findMatchingPair() {
        // 遍历所有未清除的格子
        for(let i = 1; i < this.gameGrid.length - 1; i++) {
            for(let j = 1; j < this.gameGrid[i].length - 1; j++) {
                const cell1 = this.gameGrid[i][j];
                if(!cell1 || cell1.dataset.cleared === 'true') continue;

                // 查找另一个相同类型的格子
                for(let m = 1; m < this.gameGrid.length - 1; m++) {
                    for(let n = 1; n < this.gameGrid[m].length - 1; n++) {
                        if(i === m && j === n) continue;
                        
                        const cell2 = this.gameGrid[m][n];
                        if(!cell2 || cell2.dataset.cleared === 'true') continue;

                        if(cell1.dataset.imageType === cell2.dataset.imageType) {
                            if(this.canConnect(cell1, cell2, this.gameGrid)) {
                                return [cell1, cell2];
                            }
                        }
                    }
                }
            }
        }
        return null;
    }

    showHint() {
        if(this.isHinting) {
            this.clearHint();
            return;
        }

        const matchingPair = this.findMatchingPair();
        if(!matchingPair) {
            const container = document.querySelector('.game-body-cell');
            container.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                container.style.animation = '';
                alert("无可连接的格子，请重排！");
            }, 500);
            return false;
        }

        this.hintCells = matchingPair;
        this.isHinting = true;

        // 为找到的格子添加提示效果
        this.hintCells.forEach(cell => {
            cell.classList.add('hint');
            // 让图片元素也参与动画
            const elementImg = cell.querySelector('.element-image');
            if(elementImg) {
                elementImg.style.transition = 'all 0.3s ease-in-out';
            }
        });

        // 3秒后自动清除提示（从5秒改为3秒，让交互更流畅）
        setTimeout(() => {
            if(this.isHinting) {
                this.clearHint();
            }
        }, 3000);

        return true;
    }

    clearHint() {
        if(this.hintCells) {
            this.hintCells.forEach(cell => {
                cell.classList.remove('hint');
            });
            this.hintCells = null;
        }
        this.isHinting = false;
    }
}

// 添加抖动动画的关键帧
const style = document.createElement('style');
style.textContent = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
}
`;
document.head.appendChild(style);
