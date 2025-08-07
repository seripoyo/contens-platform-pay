/**
 * ユーティリティ関数集
 * 数値フォーマット、入力値バリデーション、エラーハンドリング等
 */

/**
 * 数値をカンマ区切り形式にフォーマットする
 * @param {number} num - フォーマットする数値
 * @returns {string} カンマ区切り形式の文字列
 */
function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) {
        return '0';
    }
    return Math.floor(num).toLocaleString('ja-JP');
}

/**
 * 価格を円表示形式にフォーマットする
 * @param {number} price - フォーマットする価格
 * @returns {string} "○,○○○円" 形式の文字列
 */
function formatPrice(price) {
    return `${formatNumber(price)}円`;
}

/**
 * 手数料を負の値表示形式にフォーマットする
 * @param {number} fee - フォーマットする手数料
 * @returns {string} "-○,○○○円" 形式の文字列
 */
function formatFee(fee) {
    return `-${formatNumber(Math.abs(fee))}円`;
}

/**
 * 入力値が有効な数値かどうかをチェックする
 * @param {string|number} value - チェックする値
 * @returns {boolean} 有効な数値の場合true
 */
function isValidNumber(value) {
    if (value === null || value === undefined || value === '') {
        return false;
    }
    
    const num = Number(value);
    return !isNaN(num) && isFinite(num) && num > 0;
}

/**
 * 入力値を安全な数値に変換する
 * @param {string|number} value - 変換する値
 * @returns {number} 変換された数値（無効な場合は0）
 */
function parseToSafeNumber(value) {
    if (!isValidNumber(value)) {
        return 0;
    }
    
    const num = Number(value);
    // 最大値制限（1億円まで）
    return Math.min(Math.max(Math.floor(num), 1), 100000000);
}

/**
 * 価格の範囲をチェックする
 * @param {number} price - チェックする価格
 * @returns {object} { isValid: boolean, message: string }
 */
function validatePriceRange(price) {
    if (!isValidNumber(price)) {
        return {
            isValid: false,
            message: '有効な数値を入力してください'
        };
    }
    
    const num = Number(price);
    
    if (num < 1) {
        return {
            isValid: false,
            message: '1円以上の価格を入力してください'
        };
    }
    
    if (num > 100000000) {
        return {
            isValid: false,
            message: '価格は1億円以下で入力してください'
        };
    }
    
    return {
        isValid: true,
        message: ''
    };
}

/**
 * HTML特殊文字をエスケープしてXSS攻撃を防ぐ
 * @param {string} str - エスケープする文字列
 * @returns {string} エスケープされた文字列
 */
function sanitizeHtml(str) {
    if (typeof str !== 'string') {
        return '';
    }
    
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * エラーメッセージを表示する
 * @param {string} elementId - エラー表示する要素のID
 * @param {string} message - エラーメッセージ
 */
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = sanitizeHtml(message);
        errorElement.style.display = 'block';
    }
}

/**
 * エラーメッセージを隠す
 * @param {string} elementId - エラー要素のID
 */
function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.style.display = 'none';
        errorElement.textContent = '';
    }
}

/**
 * 要素にテキストを安全に設定する
 * @param {string} elementId - 要素のID
 * @param {string} text - 設定するテキスト
 */
function setElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = sanitizeHtml(String(text));
    }
}

/**
 * 要素を表示する
 * @param {string} elementId - 要素のID
 */
function showElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = '';
        element.classList.add('fade-in');
    }
}

/**
 * 要素を隠す
 * @param {string} elementId - 要素のID
 */
function hideElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'none';
        element.classList.remove('fade-in');
    }
}

/**
 * ローディング状態を設定する
 * @param {boolean} isLoading - ローディング中かどうか
 */
function setLoadingState(isLoading) {
    const calculateBtn = document.getElementById('calculate-btn');
    const saveBtn = document.getElementById('save-image-btn');
    const priceInput = document.getElementById('price-input');
    
    if (calculateBtn) {
        calculateBtn.disabled = isLoading;
        calculateBtn.textContent = isLoading ? '計算中...' : '計算する';
    }
    
    if (saveBtn) {
        saveBtn.disabled = isLoading;
    }
    
    if (priceInput) {
        priceInput.disabled = isLoading;
    }
}

/**
 * 入力フィールドに数値のみ入力を許可する
 * @param {HTMLInputElement} inputElement - 入力要素
 */
function restrictToNumbers(inputElement) {
    if (!inputElement) return;
    
    inputElement.addEventListener('input', function(e) {
        // 数値以外の文字を削除
        let value = e.target.value.replace(/[^\d]/g, '');
        
        // 先頭の0を除去（ただし、値が'0'の場合は保持）
        if (value.length > 1 && value.charAt(0) === '0') {
            value = value.substring(1);
        }
        
        e.target.value = value;
    });
    
    // ペーストイベントもハンドリング
    inputElement.addEventListener('paste', function(e) {
        setTimeout(() => {
            let value = e.target.value.replace(/[^\d]/g, '');
            if (value.length > 1 && value.charAt(0) === '0') {
                value = value.substring(1);
            }
            e.target.value = value;
        }, 0);
    });
}

/**
 * デバウンス関数（連続実行を防ぐ）
 * @param {Function} func - 実行する関数
 * @param {number} wait - 待機時間（ミリ秒）
 * @returns {Function} デバウンスされた関数
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * リアルタイムバリデーション用の入力チェック
 * @param {HTMLInputElement} inputElement - 入力要素
 * @param {Function} callback - バリデーション結果のコールバック
 */
function setupRealTimeValidation(inputElement, callback) {
    if (!inputElement || typeof callback !== 'function') return;
    
    const debouncedValidation = debounce((value) => {
        const validation = validatePriceRange(value);
        callback(validation);
    }, 300);
    
    inputElement.addEventListener('input', function(e) {
        const value = e.target.value.trim();
        
        // 空の場合はエラーを隠す
        if (value === '') {
            callback({ isValid: true, message: '' });
            return;
        }
        
        // デバウンス処理でバリデーション実行
        debouncedValidation(value);
    });
    
    // フォーカス外れた時の即座のバリデーション
    inputElement.addEventListener('blur', function(e) {
        const value = e.target.value.trim();
        if (value !== '') {
            const validation = validatePriceRange(value);
            callback(validation);
        }
    });
}

/**
 * フォームの送信を防ぐ（Enterキー対応）
 * @param {HTMLFormElement|HTMLInputElement} element - 対象要素
 */
function preventFormSubmission(element) {
    if (!element) return;
    
    element.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            
            // 計算ボタンがある場合はクリックイベントを発火
            const calculateBtn = document.getElementById('calculate-btn');
            if (calculateBtn && !calculateBtn.disabled) {
                calculateBtn.click();
            }
        }
    });
}

/**
 * 入力値の正規化（全角数字を半角に変換等）
 * @param {string} value - 入力値
 * @returns {string} 正規化された値
 */
function normalizeInput(value) {
    if (typeof value !== 'string') return '';
    
    return value
        .replace(/[０-９]/g, function(match) {
            return String.fromCharCode(match.charCodeAt(0) - 0xFEE0);
        })
        .replace(/[^\d]/g, '')
        .replace(/^0+/, '') || '0';
}

/**
 * 入力フィールドの値を取得して正規化
 * @param {string} elementId - 要素のID
 * @returns {string} 正規化された入力値
 */
function getNormalizedInputValue(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return '';
    
    const rawValue = element.value || '';
    return normalizeInput(rawValue);
}

/**
 * カスタムバリデーションルールの追加
 * @param {string} ruleName - ルール名
 * @param {Function} validator - バリデーション関数
 */
const customValidationRules = new Map();

function addValidationRule(ruleName, validator) {
    if (typeof ruleName !== 'string' || typeof validator !== 'function') {
        return false;
    }
    
    customValidationRules.set(ruleName, validator);
    return true;
}

/**
 * カスタムルールを含む拡張バリデーション
 * @param {string|number} value - バリデーション対象の値
 * @param {Array<string>} rules - 適用するルール名の配列
 * @returns {object} バリデーション結果
 */
function validateWithCustomRules(value, rules = []) {
    // 基本バリデーション
    const baseResult = validatePriceRange(value);
    if (!baseResult.isValid) {
        return baseResult;
    }
    
    // カスタムルールの適用
    for (const ruleName of rules) {
        const validator = customValidationRules.get(ruleName);
        if (validator) {
            const result = validator(value);
            if (!result.isValid) {
                return result;
            }
        }
    }
    
    return { isValid: true, message: '' };
}

/**
 * フィールドごとのバリデーション状態管理
 */
const validationState = new Map();

/**
 * バリデーション状態を設定
 * @param {string} fieldId - フィールドID
 * @param {boolean} isValid - バリデーション結果
 * @param {string} message - エラーメッセージ
 */
function setValidationState(fieldId, isValid, message = '') {
    validationState.set(fieldId, { isValid, message });
    
    // UI更新
    updateFieldValidationUI(fieldId, isValid, message);
}

/**
 * 全フィールドのバリデーション状態をチェック
 * @returns {boolean} 全フィールドが有効かどうか
 */
function areAllFieldsValid() {
    for (const [fieldId, state] of validationState) {
        if (!state.isValid) {
            return false;
        }
    }
    return true;
}

/**
 * フィールドのバリデーション状態をUIに反映
 * @param {string} fieldId - フィールドID
 * @param {boolean} isValid - バリデーション結果
 * @param {string} message - エラーメッセージ
 */
function updateFieldValidationUI(fieldId, isValid, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}-error`);
    
    if (field) {
        if (isValid) {
            field.classList.remove('invalid');
            field.classList.add('valid');
        } else {
            field.classList.remove('valid');
            field.classList.add('invalid');
        }
    }
    
    if (errorElement) {
        if (isValid || message === '') {
            hideError(`${fieldId}-error`);
        } else {
            showError(`${fieldId}-error`, message);
        }
    }
}

/**
 * エラーログを出力する（開発用）
 * @param {string} context - エラーのコンテキスト
 * @param {Error} error - エラーオブジェクト
 */
function logError(context, error) {
    console.error(`[${context}] エラーが発生しました:`, error);
}

/**
 * 安全にDOMを操作するヘルパー関数
 * @param {Function} callback - DOM操作を行う関数
 */
function safeDOM(callback) {
    try {
        callback();
    } catch (error) {
        logError('DOM操作', error);
    }
}

// モジュールとしてエクスポート（ES6モジュール未使用のため、グローバル関数として定義）
window.Utils = {
    formatNumber,
    formatPrice,
    formatFee,
    isValidNumber,
    parseToSafeNumber,
    validatePriceRange,
    sanitizeHtml,
    showError,
    hideError,
    setElementText,
    showElement,
    hideElement,
    setLoadingState,
    restrictToNumbers,
    debounce,
    logError,
    safeDOM,
    setupRealTimeValidation,
    preventFormSubmission,
    normalizeInput,
    getNormalizedInputValue,
    addValidationRule,
    validateWithCustomRules,
    setValidationState,
    areAllFieldsValid,
    updateFieldValidationUI
};