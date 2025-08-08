/**
 * メイン処理・イベント制御・UI更新
 * DOM操作、イベントリスナー、画面制御を担当
 */


/**
 * アプリケーション初期化
 */
function initializeApp() {
    
    // DOM要素の取得
    const priceInput = document.getElementById('price-input');
    const calculateBtn = document.getElementById('calculate-btn');
    const saveImageBtn = document.getElementById('save-image-btn');
    const resultsSection = document.getElementById('results-section');
    
    if (!priceInput || !calculateBtn) {
        logError('初期化', new Error('必須のDOM要素が見つかりません'));
        return;
    }
    
    // 入力フィールドの設定
    setupInputField(priceInput);
    
    // イベントリスナーの設定
    setupEventListeners(priceInput, calculateBtn, saveImageBtn);
    
    // 初期状態の設定
    setInitialState();
    
}

/**
 * 入力フィールドの設定
 * @param {HTMLInputElement} priceInput - 価格入力フィールド
 */
function setupInputField(priceInput) {
    
    // 数値のみ入力許可
    restrictToNumbers(priceInput);
    
    // Enterキー送信防止
    preventFormSubmission(priceInput);
    
    // リアルタイムバリデーション設定
    setupRealTimeValidation(priceInput, function(validation) {
        
        setValidationState('price-input', validation.isValid, validation.message);
        
        // 計算ボタンの有効/無効制御
        const calculateBtn = document.getElementById('calculate-btn');
        if (calculateBtn) {
            const hasValue = priceInput.value.trim() !== '';
            const shouldEnable = validation.isValid && hasValue;
            calculateBtn.disabled = !shouldEnable;
        }
    });
    
}

/**
 * イベントリスナーの設定
 * @param {HTMLInputElement} priceInput - 価格入力フィールド
 * @param {HTMLButtonElement} calculateBtn - 計算ボタン
 * @param {HTMLButtonElement} saveImageBtn - 画像保存ボタン
 */
function setupEventListeners(priceInput, calculateBtn, saveImageBtn) {
    
    // 計算ボタンのクリックイベント
    calculateBtn.addEventListener('click', function() {
        handleCalculate();
    });
    
    // 画像保存ボタンのクリックイベント
    if (saveImageBtn) {
        saveImageBtn.addEventListener('click', function() {
            handleSaveImage();
        });
    }
    
    // プレビューボタンのクリックイベント
    const previewImageBtn = document.getElementById('preview-image-btn');
    
    if (previewImageBtn) {
        previewImageBtn.addEventListener('click', function() {
            handlePreviewImage();
        });
    } else {
    }
    
    // 入力フィールドのフォーカスイベント
    priceInput.addEventListener('focus', function() {
        hideError('input-error');
    });
    
    // ウィンドウリサイズイベント（レスポンシブ対応）
    window.addEventListener('resize', debounce(function() {
        adjustLayoutForViewport();
    }, 250));
    
}

/**
 * 初期状態の設定
 */
function setInitialState() {
    
    // エラーメッセージを隠す
    hideError('input-error');
    
    // 計算ボタンを無効化
    const calculateBtn = document.getElementById('calculate-btn');
    if (calculateBtn) {
        calculateBtn.disabled = true;
    }
    
    // 価格入力フィールドにフォーカス
    const priceInput = document.getElementById('price-input');
    if (priceInput) {
        priceInput.focus();
    }
    
}

/**
 * 計算処理のハンドラー
 */
function handleCalculate() {
    
    const priceInput = document.getElementById('price-input');
    if (!priceInput) {
        return;
    }
    
    const inputValue = getNormalizedInputValue('price-input');
    
    // 入力値の検証
    const validation = validatePriceRange(inputValue);
    
    if (!validation.isValid) {
        showError('input-error', validation.message);
        return;
    }
    
    // ローディング状態開始
    setLoadingState(true);
    hideError('input-error');
    
    try {
        // 計算実行（非同期処理として扱う）
        setTimeout(() => {
            performCalculation(parseToSafeNumber(inputValue));
        }, 100);
        
    } catch (error) {
        logError('計算処理', error);
        showError('input-error', '計算中にエラーが発生しました');
        setLoadingState(false);
    }
}

/**
 * 実際の計算処理
 * @param {number} price - 販売価格
 */
function performCalculation(price) {
    
    try {
        // 全プラットフォームの計算実行
        const results = calculateAllPlatforms(price);
        
        if (!results || !validateCalculationResults(results)) {
            throw new Error('計算結果が不正です');
        }
        
        // 結果をUIに表示
        displayCalculationResults(results);
        
        // プレビューを自動表示
        if (typeof window.generatePreviewImage === 'function') {
            try {
                window.generatePreviewImage();
            } catch (error) {
                // プレビュー生成に失敗しても計算結果表示は継続
            }
        }
        
        // ローディング状態終了
        setLoadingState(false);
        
        // 結果エリアまでスクロール
        scrollToResults();
        
        
    } catch (error) {
        logError('計算処理', error);
        showError('input-error', '計算に失敗しました。再度お試しください。');
        setLoadingState(false);
    }
}

/**
 * 計算結果をUIに表示
 * @param {Object} results - 計算結果
 */
function displayCalculationResults(results) {
    
    // タイトル更新
    const titleText = `${formatPrice(results.price)}で販売した際の手取り額`;
    setElementText('results-title', titleText);
    
    // note の結果表示
    displayNoteResults(results.note);
    
    // tips の結果表示
    displayTipsResults(results.tips);
    
    // Brain の結果表示
    displayBrainResults(results.brain);
    
    // ココナラ の結果表示
    displayCoconalaResults(results.coconala);
    
}

/**
 * noteの計算結果を表示
 * @param {Object} noteResults - note の計算結果
 */
function displayNoteResults(noteResults) {
    
    // 金額範囲の表示
    const rangeText = `${formatPrice(noteResults.minAmount)}～${formatPrice(noteResults.maxAmount)}`;
    setElementText('note-range', rangeText);
    
    // プラットフォーム利用料
    setElementText('note-platform-fee', formatFee(noteResults.platformFee));
    
    // 各決済方法の表示
    noteResults.paymentMethods.forEach((method, index) => {
        const feeElementId = `note-${method.name}-fee`;
        const resultElementId = `note-${method.name}-result`;
        
        setElementText(feeElementId, formatFee(method.serviceFee));
        setElementText(resultElementId, formatPrice(method.finalNetAmount));
    });
}

/**
 * tipsの計算結果を表示
 * @param {Object} tipsResults - tips の計算結果
 */
function displayTipsResults(tipsResults) {
    
    // 手取り額（プラス会員基準）
    setElementText('tips-result', formatPrice(tipsResults.netAmount));
    
    // コンテンツ販売手数料
    setElementText('tips-content-fee', formatFee(tipsResults.contentFee));
}

/**
 * Brainの計算結果を表示
 * @param {Object} brainResults - Brain の計算結果
 */
function displayBrainResults(brainResults) {
    
    // 手取り額
    setElementText('brain-result', formatPrice(brainResults.netAmount));
    
    // コンテンツ販売手数料
    setElementText('brain-content-fee', formatFee(brainResults.contentFee));
}

/**
 * ココナラの計算結果を表示
 * @param {Object} coconalaResults - ココナラ の計算結果
 */
function displayCoconalaResults(coconalaResults) {
    
    // 手取り額
    setElementText('coconala-result', formatPrice(coconalaResults.netAmount));
    
    // 販売手数料
    setElementText('coconala-sales-fee', formatFee(coconalaResults.salesFee));
}

/**
 * 画像保存処理のハンドラー
 */
function handleSaveImage() {
    
    const saveBtn = document.getElementById('save-image-btn');
    if (!saveBtn) {
        return;
    }
    
    // ボタン無効化
    saveBtn.disabled = true;
    saveBtn.textContent = '保存中...';
    
    try {
        // サンプル画像のcanvasが存在するかチェック
        const sampleCanvas = document.querySelector('.sample-image canvas');
        
        if (sampleCanvas) {
            // サンプル画像のcanvasを直接保存
            downloadCanvasAsImageDirect(sampleCanvas);
            return;
        }
        
        // フォールバック: 既存の方法で計算結果を取得
        const currentResults = getCurrentCalculationResults();
        
        if (!currentResults) {
            throw new Error('保存する結果がありません。まず計算を実行してください。');
        }
        
        // 画像生成機能のデバッグ情報
        const debugInfo = {
            generateFunction: typeof generateAndSaveImage,
            imageGenModule: !!window.generateAndSaveImage,
            debugHelper: typeof window.imageGenDebug,
            results: !!currentResults,
            resultsValid: currentResults ? validateCalculationResults(currentResults) : false
        };
        
        
        // 追加のデバッグ情報
        if (typeof window.imageGenDebug === 'function') {
            const extendedDebug = window.imageGenDebug();
        }
        
        // 画像生成・保存処理
        if (typeof generateAndSaveImage === 'function') {
            generateAndSaveImage(currentResults);
        } else {
            // より詳細なエラー情報
            const errorDetails = {
                functionType: typeof generateAndSaveImage,
                globalFunction: typeof window.generateAndSaveImage,
                scriptLoaded: !!document.querySelector('script[src*="imageGenerator"]'),
                jsFiles: Array.from(document.querySelectorAll('script[src]')).map(s => s.src)
            };
            
            throw new Error(`画像生成機能が利用できません - 関数型: ${typeof generateAndSaveImage}`);
        }
        
    } catch (error) {
        logError('画像保存', error);
        alert('画像の保存に失敗しました。再度お試しください。');
    } finally {
        // ボタン復元
        setTimeout(() => {
            saveBtn.disabled = false;
            saveBtn.textContent = '画像として保存';
        }, 1000);
        
    }
}

/**
 * 現在の計算結果を取得
 * @returns {Object|null} 計算結果オブジェクト
 */
function getCurrentCalculationResults() {
    
    const resultsSection = document.getElementById('results-section');
    
    if (!resultsSection) {
        return null;
    }
    
    // 表示されている価格から結果を再構築
    const priceText = document.getElementById('results-title')?.textContent;
    
    if (!priceText) {
        return null;
    }
    
    // 価格の抽出（正規表現を使用）
    const priceMatch = priceText.match(/(\d{1,3}(?:,\d{3})*)円/);
    
    if (!priceMatch) {
        return null;
    }
    
    const price = parseToSafeNumber(priceMatch[1].replace(/,/g, ''));
    
    const results = calculateAllPlatforms(price);
    
    return results;
}

/**
 * 結果エリアまでスムーズスクロール
 */
function scrollToResults() {
    const resultsSection = document.getElementById('results-section');
    if (resultsSection) {
        resultsSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

/**
 * ビューポートサイズに応じたレイアウト調整
 */
function adjustLayoutForViewport() {
    const resultsContainer = document.querySelector('.results-container');
    if (!resultsContainer) return;
    
    const viewportWidth = window.innerWidth;
    
    // モバイル閾値: 768px
    if (viewportWidth < 768) {
        resultsContainer.classList.add('mobile-layout');
    } else {
        resultsContainer.classList.remove('mobile-layout');
    }
}

/**
 * キーボードショートカットの設定
 */
function setupKeyboardShortcuts() {
    
    document.addEventListener('keydown', function(e) {
        // Ctrl+Enter または Cmd+Enter で計算実行
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            const calculateBtn = document.getElementById('calculate-btn');
            if (calculateBtn && !calculateBtn.disabled) {
                calculateBtn.click();
            }
        }
        
        // Ctrl+S または Cmd+S で画像保存
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const saveBtn = document.getElementById('save-image-btn');
            if (saveBtn && !saveBtn.disabled) {
                saveBtn.click();
            }
        }
        
        // Escape で結果を隠す
        if (e.key === 'Escape') {
            hideElement('results-section');
        }
    });
}

/**
 * エラー処理の統一化
 * @param {string} context - エラーコンテキスト
 * @param {Error} error - エラーオブジェクト
 * @param {string} userMessage - ユーザー向けメッセージ
 */
function handleError(context, error, userMessage = 'エラーが発生しました') {
    logError(context, error);
    showError('input-error', userMessage);
    setLoadingState(false);
}

// DOM読み込み完了時の初期化
document.addEventListener('DOMContentLoaded', function() {
    safeDOM(() => {
        initializeApp();
        setupKeyboardShortcuts();
        adjustLayoutForViewport();
    });
});

// ページ離脱前の確認（計算結果がある場合）
window.addEventListener('beforeunload', function(e) {
    const resultsTitle = document.getElementById('results-title')?.textContent || '';
    const hasResults = resultsTitle.includes('円で販売した際の');
    
    
    if (hasResults) {
        const message = '計算結果が保存されていません。ページを離れますか？';
        e.preventDefault();
        e.returnValue = message;
        return message;
    }
});

// グローバル関数として公開
window.MainApp = {
    initializeApp,
    handleCalculate,
    handleSaveImage,
    displayCalculationResults,
    getCurrentCalculationResults,
    adjustLayoutForViewport
};

// グローバルスコープにデバッグ関数を追加（開発時のみ）
window.debugApp = function() {
    return {
        currentResults: currentResults,
        isCalculated: isCalculated,
        elements: {
            priceInput: !!priceInput,
            calculateBtn: !!calculateBtn,
            saveImageBtn: !!saveImageBtn,
            resultsSection: !!resultsSection
        },
        functions: {
            performCalculation: typeof performCalculation,
            displayResults: typeof displayResults,
            validateInput: typeof validateInput,
            generateAndSaveImage: typeof generateAndSaveImage,
            globalGenerateAndSaveImage: typeof window.generateAndSaveImage
        },
        imageGeneration: {
            moduleLoaded: !!window.generateAndSaveImage,
            debugHelper: typeof window.imageGenDebug === 'function' ? window.imageGenDebug() : null,
            canvasElement: !!document.getElementById('result-canvas'),
            browserSupport: {
                canvas: !!(document.createElement('canvas').getContext),
                blob: !!(window.Blob),
                url: !!(window.URL && window.URL.createObjectURL)
            }
        }
    };
};

// 画像生成テスト用関数
window.testImageGeneration = function() {
    
    const debug = window.debugApp();
    
    if (!currentResults) {
        return false;
    }
    
    if (typeof window.generateAndSaveImage !== 'function') {
        return false;
    }
    
    try {
        window.generateAndSaveImage(currentResults);
        return true;
    } catch (error) {
        return false;
    }
};

/**
 * Canvasから直接画像をダウンロードする関数
 */
function downloadCanvasAsImageDirect(canvas) {
    try {
        // Canvas を JPEG に変換
        canvas.toBlob(function(blob) {
            if (!blob) {
                throw new Error('画像データの生成に失敗しました');
            }
            
            // 現在の日時を取得してフォーマット
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hour = String(now.getHours()).padStart(2, '0');
            const minute = String(now.getMinutes()).padStart(2, '0');
            
            // ファイル名を生成
            const filename = `tetoridaka-hikaku_${year}${month}${day}_${hour}${minute}.jpg`;
            
            // ダウンロードリンクを作成
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            
            // ダウンロードを実行
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // メモリ解放
            URL.revokeObjectURL(url);
            
            // 成功メッセージは表示しない
            
        }, 'image/jpeg', 0.9);
        
    } catch (error) {
        throw error;
    }
}

/**
 * プレビュー画像表示ハンドラー
 */
function handlePreviewImage() {
    
    try {
        if (typeof window.generatePreviewImage !== 'function') {
            throw new Error('プレビュー機能が利用できません');
        }
        
        // プレビュー画像を生成・表示
        window.generatePreviewImage();
        
    } catch (error) {
        showError('input-error', 'プレビュー表示に失敗しました: ' + error.message);
    }
}