/**
 * メイン処理・イベント制御・UI更新
 * DOM操作、イベントリスナー、画面制御を担当
 */

// デバッグログ機能
const DEBUG = true;
const logger = {
    log: function(category, message, data = null) {
        if (!DEBUG) return;
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[${timestamp}][${category}]`;
        if (data) {
            console.log(`${prefix} ${message}`, data);
        } else {
            console.log(`${prefix} ${message}`);
        }
    },
    group: function(title) {
        if (!DEBUG) return;
        console.group(title);
    },
    groupEnd: function() {
        if (!DEBUG) return;
        console.groupEnd();
    },
    error: function(category, message, error) {
        const timestamp = new Date().toLocaleTimeString();
        console.error(`[${timestamp}][${category}] ERROR: ${message}`, error);
    }
};

/**
 * アプリケーション初期化
 */
function initializeApp() {
    logger.log('App', 'アプリケーション初期化開始');
    
    // DOM要素の取得
    const priceInput = document.getElementById('price-input');
    const calculateBtn = document.getElementById('calculate-btn');
    const saveImageBtn = document.getElementById('save-image-btn');
    const resultsSection = document.getElementById('results-section');
    
    logger.log('DOM', 'DOM要素取得結果', {
        priceInput: !!priceInput,
        calculateBtn: !!calculateBtn,
        saveImageBtn: !!saveImageBtn,
        resultsSection: !!resultsSection
    });
    
    if (!priceInput || !calculateBtn) {
        logger.error('Init', '必須のDOM要素が見つかりません');
        logError('初期化', new Error('必須のDOM要素が見つかりません'));
        return;
    }
    
    // 入力フィールドの設定
    logger.log('Setup', '入力フィールドの設定開始');
    setupInputField(priceInput);
    
    // イベントリスナーの設定
    logger.log('Setup', 'イベントリスナーの設定開始');
    setupEventListeners(priceInput, calculateBtn, saveImageBtn);
    
    // 初期状態の設定
    logger.log('Setup', '初期状態の設定開始');
    setInitialState();
    
    logger.log('App', 'アプリケーション初期化完了');
}

/**
 * 入力フィールドの設定
 * @param {HTMLInputElement} priceInput - 価格入力フィールド
 */
function setupInputField(priceInput) {
    logger.log('InputSetup', '入力フィールド設定開始');
    
    // 数値のみ入力許可
    logger.log('InputSetup', '数値制限設定');
    restrictToNumbers(priceInput);
    
    // Enterキー送信防止
    logger.log('InputSetup', 'Enter キー防止設定');
    preventFormSubmission(priceInput);
    
    // リアルタイムバリデーション設定
    logger.log('InputSetup', 'リアルタイムバリデーション設定');
    setupRealTimeValidation(priceInput, function(validation) {
        logger.log('Validation', 'バリデーション結果', {
            isValid: validation.isValid,
            message: validation.message,
            inputValue: priceInput.value
        });
        
        setValidationState('price-input', validation.isValid, validation.message);
        
        // 計算ボタンの有効/無効制御
        const calculateBtn = document.getElementById('calculate-btn');
        if (calculateBtn) {
            const hasValue = priceInput.value.trim() !== '';
            const shouldEnable = validation.isValid && hasValue;
            calculateBtn.disabled = !shouldEnable;
            
            logger.log('ButtonState', '計算ボタン状態変更', {
                hasValue: hasValue,
                isValid: validation.isValid,
                disabled: !shouldEnable
            });
        }
    });
    
    logger.log('InputSetup', '入力フィールド設定完了');
}

/**
 * イベントリスナーの設定
 * @param {HTMLInputElement} priceInput - 価格入力フィールド
 * @param {HTMLButtonElement} calculateBtn - 計算ボタン
 * @param {HTMLButtonElement} saveImageBtn - 画像保存ボタン
 */
function setupEventListeners(priceInput, calculateBtn, saveImageBtn) {
    logger.log('EventSetup', 'イベントリスナー設定開始');
    
    // 計算ボタンのクリックイベント
    calculateBtn.addEventListener('click', function() {
        logger.log('Event', '計算ボタンクリック');
        handleCalculate();
    });
    
    // 画像保存ボタンのクリックイベント
    if (saveImageBtn) {
        saveImageBtn.addEventListener('click', function() {
            logger.log('Event', '画像保存ボタンクリック');
            handleSaveImage();
        });
    }
    
    // 入力フィールドのフォーカスイベント
    priceInput.addEventListener('focus', function() {
        logger.log('Event', '入力フィールドフォーカス');
        hideError('input-error');
    });
    
    // ウィンドウリサイズイベント（レスポンシブ対応）
    window.addEventListener('resize', debounce(function() {
        logger.log('Event', 'ウィンドウリサイズ', {
            width: window.innerWidth,
            height: window.innerHeight
        });
        adjustLayoutForViewport();
    }, 250));
    
    logger.log('EventSetup', 'イベントリスナー設定完了');
}

/**
 * 初期状態の設定
 */
function setInitialState() {
    logger.log('InitState', '初期状態設定開始');
    
    // エラーメッセージを隠す
    hideError('input-error');
    logger.log('InitState', 'エラーメッセージ非表示');
    
    // 計算ボタンを無効化
    const calculateBtn = document.getElementById('calculate-btn');
    if (calculateBtn) {
        calculateBtn.disabled = true;
        logger.log('InitState', '計算ボタン無効化');
    }
    
    // 価格入力フィールドにフォーカス
    const priceInput = document.getElementById('price-input');
    if (priceInput) {
        priceInput.focus();
        logger.log('InitState', '入力フィールドにフォーカス');
    }
    
    logger.log('InitState', '初期状態設定完了');
}

/**
 * 計算処理のハンドラー
 */
function handleCalculate() {
    logger.group('計算処理開始');
    
    const priceInput = document.getElementById('price-input');
    if (!priceInput) {
        logger.error('Calculate', '価格入力フィールドが見つかりません');
        logger.groupEnd();
        return;
    }
    
    const inputValue = getNormalizedInputValue('price-input');
    logger.log('Calculate', '入力値取得', { 
        rawValue: priceInput.value, 
        normalizedValue: inputValue 
    });
    
    // 入力値の検証
    const validation = validatePriceRange(inputValue);
    logger.log('Calculate', 'バリデーション結果', validation);
    
    if (!validation.isValid) {
        logger.error('Calculate', 'バリデーション失敗', validation.message);
        showError('input-error', validation.message);
        logger.groupEnd();
        return;
    }
    
    // ローディング状態開始
    logger.log('Calculate', 'ローディング状態開始');
    setLoadingState(true);
    hideError('input-error');
    
    try {
        // 計算実行（非同期処理として扱う）
        logger.log('Calculate', '計算処理を非同期で実行');
        setTimeout(() => {
            performCalculation(parseToSafeNumber(inputValue));
        }, 100);
        
    } catch (error) {
        logger.error('Calculate', '計算処理でエラー', error);
        logError('計算処理', error);
        showError('input-error', '計算中にエラーが発生しました');
        setLoadingState(false);
        logger.groupEnd();
    }
}

/**
 * 実際の計算処理
 * @param {number} price - 販売価格
 */
function performCalculation(price) {
    logger.log('PerformCalc', '計算実行開始', { price: price });
    
    try {
        // 全プラットフォームの計算実行
        const results = calculateAllPlatforms(price);
        logger.log('PerformCalc', '計算結果取得', results);
        
        if (!results || !validateCalculationResults(results)) {
            throw new Error('計算結果が不正です');
        }
        
        // 結果をUIに表示
        logger.log('PerformCalc', 'UI表示開始');
        displayCalculationResults(results);
        
        // ローディング状態終了
        logger.log('PerformCalc', 'ローディング状態終了');
        setLoadingState(false);
        
        // 結果エリアまでスクロール
        logger.log('PerformCalc', '結果エリアへスクロール');
        scrollToResults();
        
        logger.log('PerformCalc', '計算処理完了');
        logger.groupEnd();
        
    } catch (error) {
        logger.error('PerformCalc', '計算処理エラー', error);
        logError('計算処理', error);
        showError('input-error', '計算に失敗しました。再度お試しください。');
        setLoadingState(false);
        logger.groupEnd();
    }
}

/**
 * 計算結果をUIに表示
 * @param {Object} results - 計算結果
 */
function displayCalculationResults(results) {
    logger.group('結果表示');
    
    // タイトル更新
    const titleText = `${formatPrice(results.price)}で販売した際の手取り額`;
    setElementText('results-title', titleText);
    logger.log('Display', 'タイトル更新', { title: titleText });
    
    // note の結果表示
    logger.log('Display', 'note結果表示開始');
    displayNoteResults(results.note);
    
    // tips の結果表示
    logger.log('Display', 'tips結果表示開始');
    displayTipsResults(results.tips);
    
    // Brain の結果表示
    logger.log('Display', 'Brain結果表示開始');
    displayBrainResults(results.brain);
    
    // ココナラ の結果表示
    logger.log('Display', 'ココナラ結果表示開始');
    displayCoconalaResults(results.coconala);
    
    logger.log('Display', '結果表示完了');
    logger.groupEnd();
}

/**
 * noteの計算結果を表示
 * @param {Object} noteResults - note の計算結果
 */
function displayNoteResults(noteResults) {
    logger.log('NoteDisplay', 'note表示データ', noteResults);
    
    // 金額範囲の表示
    const rangeText = `${formatPrice(noteResults.minAmount)}～${formatPrice(noteResults.maxAmount)}`;
    setElementText('note-range', rangeText);
    logger.log('NoteDisplay', '金額範囲表示', { rangeText: rangeText });
    
    // プラットフォーム利用料
    setElementText('note-platform-fee', formatFee(noteResults.platformFee));
    logger.log('NoteDisplay', 'プラットフォーム利用料表示', { fee: noteResults.platformFee });
    
    // 各決済方法の表示
    noteResults.paymentMethods.forEach((method, index) => {
        const feeElementId = `note-${method.name}-fee`;
        const resultElementId = `note-${method.name}-result`;
        
        setElementText(feeElementId, formatFee(method.serviceFee));
        setElementText(resultElementId, formatPrice(method.finalNetAmount));
        
        logger.log('NoteDisplay', `決済方法表示: ${method.label}`, {
            index: index,
            serviceFee: method.serviceFee,
            finalNetAmount: method.finalNetAmount
        });
    });
}

/**
 * tipsの計算結果を表示
 * @param {Object} tipsResults - tips の計算結果
 */
function displayTipsResults(tipsResults) {
    logger.log('TipsDisplay', 'tips表示データ', tipsResults);
    
    // 手取り額（プラス会員基準）
    setElementText('tips-result', formatPrice(tipsResults.netAmount));
    
    // コンテンツ販売手数料
    setElementText('tips-content-fee', formatFee(tipsResults.contentFee));
    
    logger.log('TipsDisplay', '表示完了', {
        netAmount: tipsResults.netAmount,
        contentFee: tipsResults.contentFee
    });
}

/**
 * Brainの計算結果を表示
 * @param {Object} brainResults - Brain の計算結果
 */
function displayBrainResults(brainResults) {
    logger.log('BrainDisplay', 'Brain表示データ', brainResults);
    
    // 手取り額
    setElementText('brain-result', formatPrice(brainResults.netAmount));
    
    // コンテンツ販売手数料
    setElementText('brain-content-fee', formatFee(brainResults.contentFee));
    
    logger.log('BrainDisplay', '表示完了', {
        netAmount: brainResults.netAmount,
        contentFee: brainResults.contentFee
    });
}

/**
 * ココナラの計算結果を表示
 * @param {Object} coconalaResults - ココナラ の計算結果
 */
function displayCoconalaResults(coconalaResults) {
    logger.log('CoconalaDisplay', 'ココナラ表示データ', coconalaResults);
    
    // 手取り額
    setElementText('coconala-result', formatPrice(coconalaResults.netAmount));
    
    // 販売手数料
    setElementText('coconala-sales-fee', formatFee(coconalaResults.salesFee));
    
    logger.log('CoconalaDisplay', '表示完了', {
        netAmount: coconalaResults.netAmount,
        salesFee: coconalaResults.salesFee
    });
}

/**
 * 画像保存処理のハンドラー
 */
function handleSaveImage() {
    logger.group('画像保存処理');
    
    const saveBtn = document.getElementById('save-image-btn');
    if (!saveBtn) {
        logger.error('SaveImage', '保存ボタンが見つかりません');
        logger.groupEnd();
        return;
    }
    
    // ボタン無効化
    saveBtn.disabled = true;
    saveBtn.textContent = '保存中...';
    logger.log('SaveImage', 'ボタン状態変更', { disabled: true });
    
    try {
        // 現在の計算結果を取得
        const currentResults = getCurrentCalculationResults();
        logger.log('SaveImage', '計算結果取得', currentResults);
        
        if (!currentResults) {
            throw new Error('保存する結果がありません');
        }
        
        // 画像生成機能のデバッグ情報
        const debugInfo = {
            generateFunction: typeof generateAndSaveImage,
            imageGenModule: !!window.generateAndSaveImage,
            debugHelper: typeof window.imageGenDebug,
            results: !!currentResults,
            resultsValid: currentResults ? validateCalculationResults(currentResults) : false
        };
        
        logger.log('SaveImage', 'デバッグ情報', debugInfo);
        
        // 追加のデバッグ情報
        if (typeof window.imageGenDebug === 'function') {
            const extendedDebug = window.imageGenDebug();
            logger.log('SaveImage', '詳細デバッグ情報', extendedDebug);
        }
        
        // 画像生成・保存処理
        if (typeof generateAndSaveImage === 'function') {
            logger.log('SaveImage', '画像生成開始');
            generateAndSaveImage(currentResults);
        } else {
            // より詳細なエラー情報
            const errorDetails = {
                functionType: typeof generateAndSaveImage,
                globalFunction: typeof window.generateAndSaveImage,
                scriptLoaded: !!document.querySelector('script[src*="imageGenerator"]'),
                jsFiles: Array.from(document.querySelectorAll('script[src]')).map(s => s.src)
            };
            
            logger.error('SaveImage', '画像生成機能チェック失敗', errorDetails);
            throw new Error(`画像生成機能が利用できません - 関数型: ${typeof generateAndSaveImage}`);
        }
        
    } catch (error) {
        logger.error('SaveImage', '画像保存エラー', error);
        logError('画像保存', error);
        alert('画像の保存に失敗しました。再度お試しください。');
    } finally {
        // ボタン復元
        setTimeout(() => {
            saveBtn.disabled = false;
            saveBtn.textContent = '画像として保存';
            logger.log('SaveImage', 'ボタン状態復元', { disabled: false });
        }, 1000);
        
        logger.groupEnd();
    }
}

/**
 * 現在の計算結果を取得
 * @returns {Object|null} 計算結果オブジェクト
 */
function getCurrentCalculationResults() {
    logger.log('GetResults', '現在の計算結果取得開始');
    
    const resultsSection = document.getElementById('results-section');
    
    if (!resultsSection) {
        logger.log('GetResults', '結果セクションが見つかりません');
        return null;
    }
    
    // 表示されている価格から結果を再構築
    const priceText = document.getElementById('results-title')?.textContent;
    logger.log('GetResults', 'タイトルテキスト取得', { priceText: priceText });
    
    if (!priceText) {
        logger.log('GetResults', 'タイトルテキストが見つかりません');
        return null;
    }
    
    // 価格の抽出（正規表現を使用）
    const priceMatch = priceText.match(/(\d{1,3}(?:,\d{3})*)円/);
    logger.log('GetResults', '価格抽出結果', { match: priceMatch });
    
    if (!priceMatch) {
        logger.log('GetResults', '価格を抽出できませんでした');
        return null;
    }
    
    const price = parseToSafeNumber(priceMatch[1].replace(/,/g, ''));
    logger.log('GetResults', '価格パース結果', { price: price });
    
    const results = calculateAllPlatforms(price);
    logger.log('GetResults', '計算結果取得完了', results);
    
    return results;
}

/**
 * 結果エリアまでスムーズスクロール
 */
function scrollToResults() {
    const resultsSection = document.getElementById('results-section');
    if (resultsSection) {
        logger.log('Scroll', '結果エリアへスクロール開始');
        resultsSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        logger.log('Scroll', 'スクロール完了');
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
        logger.log('Layout', 'モバイルレイアウト適用');
    } else {
        resultsContainer.classList.remove('mobile-layout');
        logger.log('Layout', 'デスクトップレイアウト適用');
    }
}

/**
 * キーボードショートカットの設定
 */
function setupKeyboardShortcuts() {
    logger.log('KeyboardSetup', 'キーボードショートカット設定');
    
    document.addEventListener('keydown', function(e) {
        // Ctrl+Enter または Cmd+Enter で計算実行
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            logger.log('Keyboard', 'Ctrl+Enter押下');
            const calculateBtn = document.getElementById('calculate-btn');
            if (calculateBtn && !calculateBtn.disabled) {
                calculateBtn.click();
            }
        }
        
        // Ctrl+S または Cmd+S で画像保存
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            logger.log('Keyboard', 'Ctrl+S押下');
            const saveBtn = document.getElementById('save-image-btn');
            if (saveBtn && !saveBtn.disabled) {
                saveBtn.click();
            }
        }
        
        // Escape で結果を隠す
        if (e.key === 'Escape') {
            logger.log('Keyboard', 'Escape押下');
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
    logger.error('ErrorHandle', `${context}でエラー`, error);
    logError(context, error);
    showError('input-error', userMessage);
    setLoadingState(false);
}

// DOM読み込み完了時の初期化
document.addEventListener('DOMContentLoaded', function() {
    logger.log('DOM', 'DOMContentLoaded イベント発火');
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
    
    logger.log('Unload', 'ページ離脱確認', { hasResults: hasResults });
    
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
    console.log('🔍 画像生成機能テスト開始');
    
    const debug = window.debugApp();
    console.log('📊 デバッグ情報:', debug);
    
    if (!currentResults) {
        console.log('❌ 計算結果がありません。まず価格を入力して計算してください。');
        return false;
    }
    
    if (typeof window.generateAndSaveImage !== 'function') {
        console.log('❌ generateAndSaveImage関数が定義されていません');
        console.log('🔧 利用可能な関数:', Object.keys(window).filter(k => k.includes('generate')));
        return false;
    }
    
    try {
        console.log('✅ 画像生成を実行します...');
        window.generateAndSaveImage(currentResults);
        return true;
    } catch (error) {
        console.log('❌ 画像生成エラー:', error);
        return false;
    }
};