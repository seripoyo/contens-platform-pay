/**
 * 手数料計算モジュール
 * 各プラットフォーム（note/tips/Brain/ココナラ）の手数料計算を行う
 */

/**
 * noteの計算結果型定義
 * @typedef {Object} NoteResult
 * @property {number} platformFee - プラットフォーム利用料
 * @property {number} transferFee - 振込手数料
 * @property {Array} paymentMethods - 決済方法別結果
 */

/**
 * noteの手数料計算
 * @param {number} price - 販売価格
 * @returns {NoteResult} 計算結果
 */
function calculateNote(price) {
    const transferFee = 0; // 振込手数料（固定）
    
    // 決済方法別の手数料計算
    const paymentMethods = [
        { name: 'credit', label: 'クレジットカード決済', rate: 0.05 },
        { name: 'carrier', label: '携帯キャリア決済', rate: 0.15 },
        { name: 'paypay', label: 'PayPay決済', rate: 0.07 },
        { name: 'amazon', label: 'Amazon Pay決済', rate: 0.07 },
        { name: 'point', label: 'noteポイント決済', rate: 0.10 },
        { name: 'paypal', label: 'PayPal決済', rate: 0.065 }
    ];
    
    const results = paymentMethods.map(method => {
        // 決済手数料
        const serviceFee = Math.floor(price * method.rate);
        
        // 決済手数料差し引き後
        const afterServiceFee = price - serviceFee;
        
        // プラットフォーム利用料（10%）
        const platformFee = Math.floor(afterServiceFee * 0.10);
        
        // 手取り額（振込手数料前）
        const netAmountBeforeTransfer = afterServiceFee - platformFee;
        
        // 最終手取り額（振込手数料後）
        const finalNetAmount = Math.max(0, netAmountBeforeTransfer - transferFee);
        
        return {
            name: method.name,
            label: method.label,
            serviceFee: serviceFee,
            platformFee: platformFee,
            netAmountBeforeTransfer: netAmountBeforeTransfer,
            finalNetAmount: finalNetAmount
        };
    });
    
    // プラットフォーム利用料の平均値を表示用に計算
    const avgPlatformFee = Math.floor(results.reduce((sum, r) => sum + r.platformFee, 0) / results.length);
    
    // 手取り額の範囲
    const minAmount = Math.min(...results.map(r => r.finalNetAmount));
    const maxAmount = Math.max(...results.map(r => r.finalNetAmount));
    
    return {
        platformFee: avgPlatformFee,
        transferFee: transferFee,
        paymentMethods: results,
        minAmount: minAmount,
        maxAmount: maxAmount
    };
}

/**
 * tipsの手数料計算
 * @param {number} price - 販売価格
 * @returns {Object} 計算結果
 */
function calculateTips(price) {
    // コンテンツ販売手数料（14%）
    const contentFee = Math.floor(price * 0.14);
    
    // 手数料差し引き後
    const afterFee = price - contentFee;
    
    // 振込手数料
    const transferFeeNormal = 0; // 通常会員
    const transferFeePlus = 0;   // プラス会員
    
    // 最終手取り額
    const netAmountNormal = Math.max(0, afterFee - transferFeeNormal);
    const netAmountPlus = Math.max(0, afterFee - transferFeePlus);
    
    return {
        contentFee: contentFee,
        transferFeeNormal: transferFeeNormal,
        transferFeePlus: transferFeePlus,
        netAmountNormal: netAmountNormal,
        netAmountPlus: netAmountPlus,
        // 表示用の手取り額（プラス会員）
        netAmount: netAmountPlus
    };
}

/**
 * Brainの手数料計算
 * @param {number} price - 販売価格
 * @returns {Object} 計算結果
 */
function calculateBrain(price) {
    // コンテンツ販売手数料（12%）
    const contentFee = Math.floor(price * 0.12);
    
    // 手数料差し引き後
    const afterFee = price - contentFee;
    
    // 出金手数料（275円固定）
    const withdrawalFee = 0;
    
    // 最終手取り額
    const netAmount = Math.max(0, afterFee - withdrawalFee);
    
    return {
        contentFee: contentFee,
        withdrawalFee: withdrawalFee,
        netAmount: netAmount
    };
}

/**
 * ココナラコンテンツマーケットの手数料計算
 * @param {number} price - 販売価格
 * @returns {Object} 計算結果
 */
function calculateCoconala(price) {
    // 販売手数料（22%固定）
    const salesFee = Math.floor(price * 0.22);
    
    // 手数料差し引き後
    const afterFee = price - salesFee;
    
    // 振込手数料（売上金額により変動）
    const transferFeeUnder3000 = 0; // 3,000円未満
    const transferFeeOver3000 = 0;    // 3,000円以上
    
    // 3,000円基準での手取り額計算
    const netAmountUnder3000 = Math.max(0, afterFee - transferFeeUnder3000);
    const netAmountOver3000 = afterFee;
    
    // 実際の振込手数料と手取り額を決定
    const actualTransferFee = afterFee >= 3000 ? transferFeeOver3000 : transferFeeUnder3000;
    const actualNetAmount = afterFee >= 3000 ? netAmountOver3000 : netAmountUnder3000;
    
    return {
        salesFee: salesFee,
        transferFeeUnder3000: transferFeeUnder3000,
        transferFeeOver3000: transferFeeOver3000,
        netAmountUnder3000: netAmountUnder3000,
        netAmountOver3000: netAmountOver3000,
        actualTransferFee: actualTransferFee,
        netAmount: actualNetAmount
    };
}

/**
 * 全プラットフォームの手数料計算（メイン関数）
 * @param {number} price - 販売価格
 * @returns {Object} 全プラットフォームの計算結果
 */
function calculateAllPlatforms(price) {
    // 価格の型を安全な数値に変換
    const safePrice = parseToSafeNumber(price);
    
    if (safePrice <= 0) {
        return null;
    }
    
    try {
        const results = {
            price: safePrice,
            note: calculateNote(safePrice),
            tips: calculateTips(safePrice),
            brain: calculateBrain(safePrice),
            coconala: calculateCoconala(safePrice)
        };
        
        return results;
    } catch (error) {
        logError('計算処理', error);
        return null;
    }
}

/**
 * 計算結果の妥当性検証
 * @param {Object} results - 計算結果
 * @returns {boolean} 妥当性検証結果
 */
function validateCalculationResults(results) {
    if (!results || typeof results !== 'object') {
        return false;
    }
    
    // 必須プラットフォームの存在確認
    const requiredPlatforms = ['note', 'tips', 'brain', 'coconala'];
    for (const platform of requiredPlatforms) {
        if (!results[platform]) {
            return false;
        }
    }
    
    // 価格の妥当性確認
    if (typeof results.price !== 'number' || results.price <= 0) {
        return false;
    }
    
    return true;
}

/**
 * プラットフォームの表示名取得
 * @param {string} platformKey - プラットフォームキー
 * @returns {string} 表示名
 */
function getPlatformDisplayName(platformKey) {
    const displayNames = {
        note: 'note',
        tips: 'tips',
        brain: 'Brain',
        coconala: 'ココナラコンテンツマーケット'
    };
    
    return displayNames[platformKey] || platformKey;
}

/**
 * 手取り額でプラットフォームを並び替え
 * @param {Object} results - 計算結果
 * @returns {Array} 並び替えられたプラットフォーム一覧
 */
function sortPlatformsByNetAmount(results) {
    if (!validateCalculationResults(results)) {
        return [];
    }
    
    const platforms = [
        { key: 'tips', name: getPlatformDisplayName('tips'), netAmount: results.tips.netAmount },
        { key: 'brain', name: getPlatformDisplayName('brain'), netAmount: results.brain.netAmount },
        { key: 'coconala', name: getPlatformDisplayName('coconala'), netAmount: results.coconala.netAmount }
    ];
    
    // noteは範囲があるので最大値を使用
    platforms.push({
        key: 'note',
        name: getPlatformDisplayName('note'),
        netAmount: results.note.maxAmount
    });
    
    // 手取り額の降順でソート
    return platforms.sort((a, b) => b.netAmount - a.netAmount);
}

// グローバルスコープに追加
window.Calculator = {
    calculateNote,
    calculateTips,
    calculateBrain,
    calculateCoconala,
    calculateAllPlatforms,
    validateCalculationResults,
    getPlatformDisplayName,
    sortPlatformsByNetAmount
};