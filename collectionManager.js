import { setCookie, getCookie, deleteCookie } from './utils.js';

export class CollectionManager {
    constructor() {
        this.collectedPieces = new Set();
        this.totalPieces = 40;
        this.loadCollectedPieces();
    }

    loadCollectedPieces() {
        const saved = getCookie('collectedPieces');
        if (saved) {
            this.collectedPieces = new Set(JSON.parse(saved));
        }
    }

    saveCollectedPieces() {
        setCookie('collectedPieces', JSON.stringify([...this.collectedPieces]), 30);
    }

    // 获取一个随机未收集的碎片
    getRandomUnCollectedPiece() {
        const uncollected = [];
        for(let i = 1; i <= this.totalPieces; i++) {
            if(!this.collectedPieces.has(i)) {
                uncollected.push(i);
            }
        }
        if(uncollected.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * uncollected.length);
        const pieceNumber = uncollected[randomIndex];
        this.collectedPieces.add(pieceNumber);
        this.saveCollectedPieces();
        return pieceNumber;
    }

    resetCollection() {
        this.collectedPieces.clear();
        deleteCookie('collectedPieces');
    }

    // 检查碎片是否已收集
    hasCollected(pieceNumber) {
        return this.collectedPieces.has(pieceNumber);
    }

    // 获取已收集碎片数量
    getCollectedCount() {
        return this.collectedPieces.size;
    }
}
