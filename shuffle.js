export function shuffleGrid(gameGrid) {
    // 收集所有未被消除的格子及其图片类型
    const activeCells = [];
    const activeImageTypes = [];
    
    // 遍历网格收集未消除的格子
    for (let row = 0; row < gameGrid.length; row++) {
        for (let col = 0; col < gameGrid[row].length; col++) {
            const cell = gameGrid[row][col];
            if (cell && cell.dataset.cleared !== 'true') {
                activeCells.push(cell);
                activeImageTypes.push(cell.dataset.imageType);
            }
        }
    }
    
    // 打乱图片类型数组
    for (let i = activeImageTypes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [activeImageTypes[i], activeImageTypes[j]] = 
        [activeImageTypes[j], activeImageTypes[i]];
    }
    
    // 将打乱后的图片类型重新分配给格子
    activeCells.forEach((cell, index) => {
        const newImageType = activeImageTypes[index];
        cell.dataset.imageType = newImageType;
        cell.querySelector('.element-image').src = `images/bird/${newImageType}.png`;
    });
}
