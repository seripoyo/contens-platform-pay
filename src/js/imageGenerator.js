/**
 * 画像生成モジュール
 * 計算結果をCanvasで画像化してダウンロード機能を提供
 */

// デバッグ用のグローバル変数
window.ImageGeneratorDebug = {
    lastError: null,
    canvasSupported: false,
    downloadSupported: false,
    lastGenerationAttempt: null
};

/**
 * ブラウザ機能チェック
 */
function checkBrowserCapabilities() {
    const debug = window.ImageGeneratorDebug;
    
    // Canvas API サポートチェック
    debug.canvasSupported = !!(document.createElement('canvas').getContext);
    
    // File download サポートチェック（Blob + URL.createObjectURL）
    debug.downloadSupported = !!(window.Blob && window.URL && window.URL.createObjectURL);
    
    return debug.canvasSupported && debug.downloadSupported;
}

/**
 * 画像生成とダウンロードのメイン関数
 * @param {Object} results - 計算結果データ
 */
function generateAndSaveImage(results) {
    const debug = window.ImageGeneratorDebug;
    debug.lastGenerationAttempt = new Date().toISOString();
    debug.lastError = null;
    
    try {
        
        // ブラウザ機能チェック
        if (!checkBrowserCapabilities()) {
            throw new Error('ブラウザが画像生成機能をサポートしていません');
        }
        
        // 結果データの検証
        if (!results || !validateCalculationResults(results)) {
            throw new Error('計算結果が無効です');
        }
        
        // Canvasを取得または作成
        const canvas = getOrCreateCanvas();
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            throw new Error('Canvas 2Dコンテキストの取得に失敗しました');
        }
        
        // format.jpgを背景として読み込んで描画
        loadBackgroundAndDraw(ctx, canvas, results);
        
        
    } catch (error) {
        debug.lastError = error.message;
        
        // ユーザーに分かりやすいエラーメッセージを表示
        showImageGenerationError(error);
        throw error;
    }
}

/**
 * Canvasを取得または作成
 */
function getOrCreateCanvas() {
    let canvas = document.getElementById('result-canvas');
    
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'result-canvas';
        canvas.style.display = 'none';
        document.body.appendChild(canvas);
    }
    
    // 16:9のアスペクト比で設定（1920x1080）
    canvas.width = 1920;
    canvas.height = 1080;
    
    return canvas;
}

/**
 * フォント読み込み完了を確認する関数
 */
function ensureFontsLoaded() {
    return new Promise((resolve, reject) => {
        // フォントが利用可能かどうか確認
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                // NotoSansJPが読み込まれているか確認
                const testCanvas = document.createElement('canvas');
                const testCtx = testCanvas.getContext('2d');
                
                testCtx.font = '32px "NotoSansJP"';
                const notoWidth = testCtx.measureText('テスト').width;
                
                testCtx.font = '32px serif';
                const serifWidth = testCtx.measureText('テスト').width;
                
                // 幅が異なれば NotoSansJP が正常に読み込まれている
                if (Math.abs(notoWidth - serifWidth) > 1) {
                    resolve();
                } else {
                    // フォールバック処理
                    loadFontFallback().then(resolve).catch(reject);
                }
            }).catch(() => {
                loadFontFallback().then(resolve).catch(reject);
            });
        } else {
            // Font Loading API が利用できない場合
            loadFontFallback().then(resolve).catch(reject);
        }
    });
}

/**
 * フォントフォールバック読み込み
 */
function loadFontFallback() {
    return new Promise((resolve, reject) => {
        // CSS @font-faceを動的に作成
        const style = document.createElement('style');
        style.textContent = `
            @font-face {
                font-family: 'NotoSansJPCanvas';
                src: url('src/fonts/NotoSansJP/NotoSansJP-Bold.woff2') format('woff2'),
                     url('src/fonts/NotoSansJP/NotoSansJP-Bold.woff') format('woff');
                font-weight: bold;
                font-display: block;
            }
            @font-face {
                font-family: 'NotoSansJPCanvas';
                src: url('src/fonts/NotoSansJP/NotoSansJP-Regular.woff2') format('woff2'),
                     url('src/fonts/NotoSansJP/NotoSansJP-Regular.woff') format('woff');
                font-weight: normal;
                font-display: block;
            }
        `;
        document.head.appendChild(style);
        
        // フォント読み込み待機（最大3秒）
        let attempts = 0;
        const maxAttempts = 30;
        
        const checkFont = () => {
            attempts++;
            
            const testCanvas = document.createElement('canvas');
            const testCtx = testCanvas.getContext('2d');
            
            testCtx.font = 'bold 32px "NotoSansJPCanvas", "Noto Sans JP", sans-serif';
            const canvasWidth = testCtx.measureText('テスト').width;
            
            testCtx.font = 'bold 32px serif';
            const serifWidth = testCtx.measureText('テスト').width;
            
            if (Math.abs(canvasWidth - serifWidth) > 1 || attempts >= maxAttempts) {
                resolve();
            } else {
                setTimeout(checkFont, 100);
            }
        };
        
        checkFont();
    });
}

/**
 * 背景画像を読み込んで描画
 */
function loadBackgroundAndDraw(ctx, canvas, results) {
    // フォント読み込み完了を待つ
    ensureFontsLoaded().then(() => {
        const bgImage = new Image();
        bgImage.crossOrigin = 'anonymous';
        bgImage.src = 'assets/images/format.jpg';
        
        bgImage.onload = function() {
            
            // 背景画像を描画
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
            
            // コンテンツを描画
            drawResultsOnBackground(ctx, canvas, results);
            
            // ダウンロード処理
            downloadCanvasAsImage(canvas);
        };
        
        bgImage.onerror = function() {
            
            // フォールバック: 背景画像なしで描画
            drawResultsWithoutBackground(ctx, canvas, results);
            downloadCanvasAsImage(canvas);
        };
    }).catch(() => {
        // フォント読み込みに失敗した場合もそのまま描画
        const bgImage = new Image();
        bgImage.crossOrigin = 'anonymous';
        bgImage.src = 'assets/images/format.jpg';
        
        bgImage.onload = function() {
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
            drawResultsOnBackground(ctx, canvas, results);
            downloadCanvasAsImage(canvas);
        };
        
        bgImage.onerror = function() {
            drawResultsWithoutBackground(ctx, canvas, results);
            downloadCanvasAsImage(canvas);
        };
    });
}

/**
 * format.jpg上にコンテンツを描画（sample.jpgのフォーマット）
 */
function drawResultsOnBackground(ctx, canvas, results) {
    
    // フォント設定
    ctx.textAlign = 'center';
    ctx.fillStyle = '#006666';
    
    // タイトル（中央上部） - 20px下げる
    ctx.font = 'bold 72px "NotoSansJPCanvas", "NotoSansJP", "Noto Sans JP", sans-serif';
    let titleText;
    if (results.quantity && results.unitPrice) {
        titleText = formatCurrency(results.unitPrice) + '円×' + results.quantity + '人 販売時の手取り額';
    } else {
        titleText = formatCurrency(results.price) + '円 販売時の手取り額';
    }
    ctx.fillText(titleText, canvas.width / 2, 140);
    
    // 各プラットフォームのコンテンツを描画
    drawNoteSection(ctx, results.note);
    drawTipsSection(ctx, results.tips);
    drawBrainSection(ctx, results.brain);
    drawCoconalaSection(ctx, results.coconala);
    
}

/**
 * noteセクションを描画
 */
function drawNoteSection(ctx, data) {
    // format.jpgのnoteセクションの位置に合わせて配置（背景描画なし）
    const contentX = 120;
    const contentY = 200;
    
    // タイトルと手取り額を同じ行に表示
    ctx.textAlign = 'left';
    ctx.fillStyle = '#008080';
    ctx.font = 'bold 52px "NotoSansJPCanvas", "NotoSansJP", "Noto Sans JP", sans-serif';
    ctx.fillText('note :', contentX, contentY);
    
    // 手取り額範囲
    ctx.fillStyle = '#008080';
    ctx.font = '52px "NotoSansJPCanvas", "NotoSansJP", "Noto Sans JP", sans-serif';
    ctx.fillText(`${formatCurrency(data.minAmount)}円～${formatCurrency(data.maxAmount)}円`, contentX + 180, contentY);
    
    // noteの黒字は23.9px
    ctx.fillStyle = '#333333';
    ctx.font = '23.9px "NotoSansJPCanvas", "NotoSansJP", "Noto Sans JP", sans-serif';
    let yPos = contentY + 90;
    
    // プラットフォーム利用料
    ctx.fillText(`● プラットフォーム利用料：-${formatCurrency(data.platformFee)}円`, contentX, yPos);
    yPos += 90; // format.jpgの次の項目位置まで調整
    
    // 決済方法別の項目を先に表示
    const methods = [
        'クレジットカード決済', '携帯キャリア決済', 'PayPay決済',
        'Amazon Pay決済', 'noteポイント決済', 'PayPal決済'
    ];
    
    data.paymentMethods.forEach((method, index) => {
        const methodName = methods[index];
        ctx.fillText(`● ${methodName}`, contentX, yPos);
        yPos += 45;
    });
    
    // 最後に振込手数料を表示
    yPos += 45; // 空白行を作る
    ctx.fillText(`● 振込手数料（1回あたり）：270円`, contentX, yPos);
}

/**
 * tipsセクションを描画
 */
function drawTipsSection(ctx, data) {
    // format.jpgのtipsセクションの位置に合わせて配置
    const contentX = 800;
    const contentY = 200;
    
    // タイトルと手取り額
    ctx.textAlign = 'left';
    ctx.fillStyle = '#008080';
    ctx.font = 'bold 52px "NotoSansJPCanvas", "NotoSansJP", "Noto Sans JP", sans-serif';
    ctx.fillText('tips :', contentX, contentY);
    
    ctx.fillStyle = '#008080';
    ctx.fillText(`${formatCurrency(data.netAmount)}円`, contentX + 140, contentY);
    
    // それ以外の黒字は20.9px
    ctx.fillStyle = '#333333';
    ctx.font = '20.9px "NotoSansJPCanvas", "NotoSansJP", "Noto Sans JP", sans-serif';
    let yPos = contentY + 60;
    
    ctx.fillText(`● コンテンツ販売料：-${formatCurrency(data.contentFee)}円`, contentX, yPos);
    yPos += 50;
    ctx.fillText(`● 振込手数料（1回あたり）：`, contentX, yPos);
    yPos += 35;
    
    // インデントされた項目
    ctx.fillText(`　○ 通常会員: 550円`, contentX, yPos);
    yPos += 35;
    ctx.fillText(`　○ プラス会員: 330円`, contentX, yPos);
}

/**
 * Brainセクションを描画
 */
function drawBrainSection(ctx, data) {
    // format.jpgのBrainセクションの位置に合わせて配置
    const contentX = 800;
    const contentY = 420;
    
    // タイトルと手取り額
    ctx.textAlign = 'left';
    ctx.fillStyle = '#008080';
    ctx.font = 'bold 52px "NotoSansJPCanvas", "NotoSansJP", "Noto Sans JP", sans-serif';
    ctx.fillText('Brain :', contentX, contentY);
    
    ctx.fillStyle = '#008080';
    ctx.fillText(`${formatCurrency(data.netAmount)}円`, contentX + 170, contentY);
    
    // それ以外の黒字は20.9px
    ctx.fillStyle = '#333333';
    ctx.font = '20.9px "NotoSansJPCanvas", "NotoSansJP", "Noto Sans JP", sans-serif';
    let yPos = contentY + 60;
    
    ctx.fillText(`● コンテンツ販売料：-${formatCurrency(data.contentFee)}円`, contentX, yPos);
    yPos += 40;
    ctx.fillText(`● 振込手数料（1回あたり）：275円`, contentX, yPos);
}

/**
 * ココナラセクションを描画
 */
function drawCoconalaSection(ctx, data) {
    // format.jpgのココナラセクションの位置に合わせて配置
    const contentX = 800;
    const contentY = 578;
    
    // タイトル
    ctx.textAlign = 'left';
    ctx.fillStyle = '#008080';
    ctx.font = 'bold 52px "NotoSansJPCanvas", "NotoSansJP", "Noto Sans JP", sans-serif';
    ctx.fillText('ココナラコンテンツマーケット :', contentX, contentY);
    
    ctx.fillStyle = '#008080';
    ctx.font = '52px "NotoSansJPCanvas", "NotoSansJP", "Noto Sans JP", sans-serif';
    ctx.fillText(`${formatCurrency(data.netAmount)}円`, contentX, contentY + 60);
    
    // それ以外の黒字は20.9px
    ctx.fillStyle = '#333333';
    ctx.font = '20.9px "NotoSansJPCanvas", "NotoSansJP", "Noto Sans JP", sans-serif';
    let yPos = contentY + 120;
    
    ctx.fillText(`● コンテンツ販売料：-${formatCurrency(data.salesFee)}円`, contentX, yPos);
    yPos += 40;
    ctx.fillText(`● 振込手数料（1回あたり）：`, contentX, yPos);
    yPos += 35;
    
    // インデントされた項目
    ctx.fillText(`　○ 売上金額3,000円未満: 160円`, contentX, yPos);
    yPos += 35;
    ctx.fillText(`　○ 売上金額3,000円以上: 無料`, contentX, yPos);
}

/**
 * フォールバック: 背景なしで描画
 */
function drawResultsWithoutBackground(ctx, canvas, results) {
    
    // ターコイズブルーの背景
    // ctx.fillStyle = '#62C5C5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 外枠の白い境界線エリア
    // ctx.fillStyle = '#E6F5F5';
    ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
    
    // 内側のターコイズブルー背景
    // ctx.fillStyle = '#62C5C5';
    ctx.fillRect(40, 40, canvas.width - 80, canvas.height - 80);
    
    // コンテンツを描画
    drawResultsOnBackground(ctx, canvas, results);
}

/**
 * note詳細描画
 */
function drawNoteDetails(ctx, data, x, y) {
    // ctx.fillStyle = '#333333';
    ctx.font = '28px Arial, sans-serif';
    
    // プラットフォーム利用料
    ctx.fillText(`● プラットフォーム利用料：-${formatCurrency(data.platformFee)}円`, x, y);
    
    // 振込手数料
    ctx.fillText(`● 振込手数料（1回あたり）：270円`, x, y + 40);
    
    // 決済方法別
    ctx.font = '24px Arial, sans-serif';
    // ctx.fillStyle = '#666666';
    y += 100;
    
    const methods = [
        { label: 'クレジットカード決済', fee: '-○円', result: '○円' },
        { label: '携帯キャリア決済', fee: '-○円', result: '○円' },
        { label: 'PayPay決済', fee: '-○円', result: '○円' },
        { label: 'Amazon Pay決済', fee: '-○円', result: '○円' },
        { label: 'noteポイント決済', fee: '-○円', result: '○円' },
        { label: 'PayPal決済', fee: '-○円', result: '○円' }
    ];
    
    methods.forEach((method, index) => {
        const methodData = data.paymentMethods[index];
        if (methodData) {
            ctx.fillText(`● ${method.label} -${formatCurrency(methodData.serviceFee)}円：${formatCurrency(methodData.finalNetAmount)}円`, x, y);
        } else {
            ctx.fillText(`● ${method.label} ${method.fee}：${method.result}`, x, y);
        }
        y += 30;
    });
}

/**
 * tips詳細描画
 */
function drawTipsDetails(ctx, data, x, y) {
    // ctx.fillStyle = '#333333';
    ctx.font = '28px Arial, sans-serif';
    
    // コンテンツ販売料
    ctx.fillText(`● コンテンツ販売料：-${formatCurrency(data.contentFee)}円`, x, y);
    
    // 振込手数料
    ctx.fillText(`● 振込手数料（1回あたり）：`, x, y + 40);
    
    ctx.font = '24px Arial, sans-serif';
    ctx.fillStyle = '#666666';
    ctx.fillText(`  ○ 通常会員: 550円`, x + 20, y + 80);
    ctx.fillText(`  ○ プラス会員: 330円`, x + 20, y + 110);
}

/**
 * Brain詳細描画
 */
function drawBrainDetails(ctx, data, x, y) {
    ctx.fillStyle = '#333333';
    ctx.font = '28px Arial, sans-serif';
    
    // コンテンツ販売料
    ctx.fillText(`● コンテンツ販売料：-${formatCurrency(data.contentFee)}円`, x, y);
    
    // 振込手数料
    ctx.fillText(`● 振込手数料（1回あたり）：275円`, x, y + 40);
}

/**
 * ココナラ詳細描画
 */
function drawCoconalaDetails(ctx, data, x, y) {
    // ctx.fillStyle = '#333333';
    ctx.font = '28px Arial, sans-serif';
    
    // コンテンツ販売料
    ctx.fillText(`● コンテンツ販売料：-${formatCurrency(data.salesFee)}円`, x, y);
    
    // 振込手数料
    ctx.fillText(`● 振込手数料（1回あたり）：`, x, y + 40);
    
    ctx.font = '24px Arial, sans-serif';
    ctx.fillStyle = '#666666';
    ctx.fillText(`  ○ 売上金額3,000円未満: 160円`, x + 20, y + 80);
    ctx.fillText(`  ○ 売上金額3,000円以上: 無料`, x + 20, y + 110);
}

/**
 * CanvasをJPEG画像としてダウンロード
 */
function downloadCanvasAsImage(canvas) {
    
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
            
            // sample.jpgのフォーマットに準拠したファイル名（英数字のみ）
            const filename = `tetoridaka-hikaku_${year}${month}${day}_${hour}${minute}.jpg`;
            
            // Googleアナリティクス: 画像保存ボタンクリックイベント
            if (typeof gtag !== 'undefined') {
                console.log('GA Event: 画像保存ボタンクリック', {
                    event: 'save_image_click',
                    category: 'user_action',
                    label: 'download_result_image',
                    value: 1
                });
                
                gtag('event', 'save_image_click', {
                    'event_category': 'user_action',
                    'event_label': 'download_result_image',
                    'value': 1
                });
            } else {
                console.warn('Google Analytics (gtag) が読み込まれていません');
            }
            
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
            
            
            // 成功メッセージ表示
            showSuccessMessage(`画像をダウンロードしました: ${filename}`);
            
        }, 'image/jpeg', 0.9);
        
    } catch (error) {
        throw error;
    }
}

/**
 * 数値を通貨形式にフォーマット
 */
function formatCurrency(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return '0';
    }
    return amount.toLocaleString('ja-JP');
}

/**
 * 画像生成エラーをユーザーに表示
 */
function showImageGenerationError(error) {
    const errorMessages = {
        'ブラウザが画像生成機能をサポートしていません': 'お使いのブラウザは画像生成機能に対応していません。Chrome、Firefox、Safari等の最新ブラウザをご利用ください。',
        '計算結果が無効です': '計算結果が正しくありません。販売価格を入力して計算を実行してください。',
        'Canvas 2Dコンテキストの取得に失敗しました': 'ブラウザの描画機能に問題があります。ページを再読み込みしてお試しください。',
        '画像データの生成に失敗しました': '画像の生成に失敗しました。しばらく待ってから再度お試しください。'
    };
    
    const userMessage = errorMessages[error.message] || `画像生成エラー: ${error.message}`;
    
    // エラーメッセージを表示（実際のUIに合わせて調整）
    alert(userMessage);
    
}

/**
 * 成功メッセージを表示
 */
function showSuccessMessage(message) {
    // 簡易的な成功メッセージ（実際のUIに合わせて調整）
    
    // 将来的にはトーストメッセージなどに変更
    setTimeout(() => {
    }, 100);
}

/**
 * デバッグ情報取得関数
 */
function getDebugInfo() {
    return {
        debug: window.ImageGeneratorDebug,
        browserCapabilities: {
            canvas: !!(document.createElement('canvas').getContext),
            blob: !!(window.Blob),
            url: !!(window.URL && window.URL.createObjectURL),
            download: !!(document.createElement('a').download !== undefined)
        },
        canvasElement: !!document.getElementById('result-canvas'),
        generateFunction: typeof generateAndSaveImage === 'function'
    };
}

// デバッグ用関数をグローバルスコープに追加
window.imageGenDebug = getDebugInfo;

// メイン関数をグローバルスコープに追加
window.generateAndSaveImage = generateAndSaveImage;

/**
 * テスト用の計算結果データ（4000円販売時）
 */
function getTestCalculationData() {
    return {
        price: 4000,
        note: {
            minAmount: 3200,
            maxAmount: 3400,
            platformFee: 365,
            paymentMethods: [
                { serviceFee: 200, finalNetAmount: 3435 },
                { serviceFee: 600, finalNetAmount: 3035 },
                { serviceFee: 280, finalNetAmount: 3355 },
                { serviceFee: 280, finalNetAmount: 3355 },
                { serviceFee: 400, finalNetAmount: 3235 },
                { serviceFee: 260, finalNetAmount: 3375 }
            ]
        },
        tips: {
            netAmount: 3440,
            contentFee: 560
        },
        brain: {
            netAmount: 3445,
            contentFee: 480
        },
        coconala: {
            netAmount: 2960,
            salesFee: 880
        }
    };
}

/**
 * プレビュー用Canvas生成機能
 */
function generatePreviewImage() {
    
    try {
        // 入力された金額と本数を取得
        const priceInput = document.getElementById('price-input');
        const quantityInput = document.getElementById('quantity-input');
        let inputPrice = null;
        let inputQuantity = 1;
        
        if (priceInput && priceInput.value && !isNaN(priceInput.value) && parseInt(priceInput.value) > 0) {
            inputPrice = parseInt(priceInput.value);
        } else {
            // 入力がない場合は処理を終了
            return;
        }
        
        if (quantityInput && quantityInput.value && !isNaN(quantityInput.value) && parseInt(quantityInput.value) > 0) {
            inputQuantity = parseInt(quantityInput.value);
        }
        
        // 総売上を計算
        const totalAmount = inputPrice * inputQuantity;
        
        // 総売上で計算を実行
        const testData = calculateAllPlatforms(totalAmount);
        
        // 単価と本数情報を追加
        testData.unitPrice = inputPrice;
        testData.quantity = inputQuantity;
        
        // ココナラのY位置を790に設定
        window.previewSettings.coconala.contentY = 790;
        
        // サンプル画像imgをcanvasに置換
        replaceSampleImageWithCanvas(testData);
        
    } catch (error) {
        // エラーは静かに処理
    }
}


/**
 * デベロッパーツール用の調整可能な設定
 */
window.previewSettings = {
    // noteセクション設定
    note: {
        contentX: 150,
        contentY: 300,
        titleFontSize: 37,
        rangeFontSize: 37,
        detailFontSize: 28.1,
        platformFeeY: 90,
        methodsStartY: 180,
        methodSpacing: 60,
        transferFeeExtraY: 45
    },
    // tipsセクション設定
    tips: {
        contentX: 1020,
        contentY: 270,
        titleFontSize: 32,
        detailFontSize: 26.1,
        spacing: 45
    },
    // Brainセクション設定
    brain: {
        contentX: 1020,
        contentY: 570,
        titleFontSize: 32,
        detailFontSize: 26.1,
        spacing: 45
    },
    // ココナラセクション設定
    coconala: {
        contentX: 1020,
        contentY: 790,
        titleFontSize: 32,
        amountFontSize: 32,
        detailFontSize: 26,
        spacing: 45
    }
};

/**
 * 設定を使用してnoteセクションを描画（調整可能版）
 */
function drawNoteSection(ctx, data) {
    const settings = window.previewSettings.note;
    
    // タイトルと手取り額を太字で表示
    ctx.textAlign = 'left';
    ctx.fillStyle = '#008080';
    ctx.font = `bold ${settings.titleFontSize}px "NotoSansJPCanvas", "NotoSansJP", "Noto Sans JP", sans-serif`;
    const titleText = 'note:';
    ctx.fillText(titleText, settings.contentX, settings.contentY);
    
    // 手取り額範囲（太字、空白を削除）
    const titleWidth = ctx.measureText(titleText).width;
    ctx.fillStyle = '#008080';
    ctx.font = `bold ${settings.rangeFontSize}px "NotoSansJPCanvas", "NotoSansJP", "Noto Sans JP", sans-serif`;
    ctx.fillText(`${formatCurrency(data.minAmount)}円～${formatCurrency(data.maxAmount)}円`, settings.contentX + titleWidth + 5, settings.contentY);
    
    // 項目詳細（太字）
    ctx.font = `bold ${settings.detailFontSize}px "NotoSansJPCanvas", "NotoSansJP", "Noto Sans JP", sans-serif`;
    let yPos = settings.contentY + settings.platformFeeY;
    
    // プラットフォーム利用料（太字、マイナス部分は赤）
    ctx.fillStyle = '#333333';
    ctx.fillText(`· プラットフォーム利用料：`, settings.contentX, yPos);
    const platformText = ctx.measureText(`· プラットフォーム利用料：`).width;
    ctx.fillStyle = '#d32f2f'; // 赤色
    ctx.fillText(`-${formatCurrency(data.platformFee)}円`, settings.contentX + platformText, yPos);
    yPos = settings.contentY + settings.methodsStartY;
    
    // 決済方法別の項目を表示（料金も含む）
    const methods = [
        'クレジットカード決済', '携帯キャリア決済', 'PayPay決済',
        'Amazon Pay決済', 'noteポイント決済', 'PayPal決済'
    ];
    
    methods.forEach((methodName, index) => {
        if (data.paymentMethods && data.paymentMethods[index]) {
            const method = data.paymentMethods[index];
            
            // 決済方法名（太字、黒）
            ctx.fillStyle = '#333333';
            ctx.font = `bold ${settings.detailFontSize}px "NotoSansJPCanvas", "NotoSansJP", "Noto Sans JP", sans-serif`;
            ctx.fillText(`· ${methodName} `, settings.contentX, yPos);
            let currentX = settings.contentX + ctx.measureText(`· ${methodName} `).width;
            
            // 手数料部分（赤）
            if (method.serviceFee > 0) {
                ctx.fillStyle = '#d32f2f';
                ctx.fillText(`-${formatCurrency(method.serviceFee)}円`, currentX, yPos);
                currentX += ctx.measureText(`-${formatCurrency(method.serviceFee)}円`).width;
            } else {
                ctx.fillText('手数料なし', currentX, yPos);
                currentX += ctx.measureText('手数料なし').width;
            }
            
            // コロンと手取り額（青色）
            ctx.fillStyle = '#2b609b';
            ctx.fillText(`：${formatCurrency(method.finalNetAmount)}円`, currentX, yPos);
        } else {
            ctx.fillStyle = '#333333';
            ctx.font = `bold ${settings.detailFontSize}px "NotoSansJPCanvas", "NotoSansJP", "Noto Sans JP", sans-serif`;
            ctx.fillText(`· ${methodName}`, settings.contentX, yPos);
        }
        yPos += settings.methodSpacing;
    });
    
    // 最後に振込手数料を表示
    yPos += settings.transferFeeExtraY;
    ctx.fillStyle = '#333333';
    ctx.fillText(`· 振込手数料（1回あたり）：`, settings.contentX, yPos);
    const transferText = ctx.measureText(`· 振込手数料（1回あたり）：`).width;
    ctx.fillStyle = '#d32f2f'; // 赤色
    ctx.fillText(`-270円`, settings.contentX + transferText, yPos);
}

/**
 * 設定を使用してtipsセクションを描画（調整可能版）
 */
function drawTipsSection(ctx, data) {
    const settings = window.previewSettings.tips;
    
    // タイトルと手取り額を太字で表示
    ctx.textAlign = 'left';
    ctx.fillStyle = '#008080';
    ctx.font = `bold ${settings.titleFontSize}px "NotoSansJPCanvas", "NotoSansJP", "Noto Sans JP", sans-serif`;
    const titleText = 'tips:';
    ctx.fillText(titleText, settings.contentX, settings.contentY);
    
    // 手取り額（太字、空白を削除）
    const titleWidth = ctx.measureText(titleText).width;
    ctx.fillStyle = '#008080';
    ctx.font = `bold ${settings.titleFontSize}px "NotoSansJPCanvas", "NotoSansJP", "Noto Sans JP", sans-serif`;
    ctx.fillText(`${formatCurrency(data.netAmount)}円`, settings.contentX + titleWidth + 5, settings.contentY);
    
    // 項目詳細（太字）
    ctx.font = `bold ${settings.detailFontSize}px "NotoSansJPCanvas", "NotoSansJP", "Noto Sans JP", sans-serif`;
    let yPos = settings.contentY + 60;
    
    // コンテンツ販売料（太字、マイナス部分は赤）
    ctx.fillStyle = '#333333';
    ctx.fillText(`· コンテンツ販売料：`, settings.contentX, yPos);
    const contentFeeText = ctx.measureText(`· コンテンツ販売料：`).width;
    ctx.fillStyle = '#d32f2f'; // 赤色
    ctx.fillText(`-${formatCurrency(data.contentFee)}円`, settings.contentX + contentFeeText, yPos);
    yPos += 50;
    
    // 振込手数料
    ctx.fillStyle = '#333333';
    ctx.fillText(`· 振込手数料（1回あたり）：`, settings.contentX, yPos);
    yPos += settings.spacing;
    
    // インデントされた項目
    ctx.font = `bold ${settings.detailFontSize}px "NotoSansJPCanvas", "NotoSansJP", "Noto Sans JP", sans-serif`;
    ctx.fillText(`　· 通常会員: 550円`, settings.contentX, yPos);
    yPos += settings.spacing;
    ctx.fillText(`　· プラス会員: 330円`, settings.contentX, yPos);
}

/**
 * 設定を使用してBrainセクションを描画（調整可能版）
 */
function drawBrainSection(ctx, data) {
    const settings = window.previewSettings.brain;
    
    // タイトルと手取り額を太字で表示
    ctx.textAlign = 'left';
    ctx.fillStyle = '#008080';
    ctx.font = `bold ${settings.titleFontSize}px "NotoSansJPCanvas", "NotoSansJP", "Noto Sans JP", sans-serif`;
    const titleText = 'Brain:';
    ctx.fillText(titleText, settings.contentX, settings.contentY);
    
    // 手取り額（太字、空白を削除）
    const titleWidth = ctx.measureText(titleText).width;
    ctx.fillStyle = '#008080';
    ctx.font = `bold ${settings.titleFontSize}px "NotoSansJPCanvas", "NotoSansJP", "Noto Sans JP", sans-serif`;
    ctx.fillText(`${formatCurrency(data.netAmount)}円`, settings.contentX + titleWidth + 5, settings.contentY);
    
    // 項目詳細（太字）
    ctx.font = `bold ${settings.detailFontSize}px "NotoSansJPCanvas", "NotoSansJP", "Noto Sans JP", sans-serif`;
    let yPos = settings.contentY + 60;
    
    // コンテンツ販売料（太字、マイナス部分は赤）
    ctx.fillStyle = '#333333';
    ctx.fillText(`· コンテンツ販売料：`, settings.contentX, yPos);
    const contentFeeText = ctx.measureText(`· コンテンツ販売料：`).width;
    ctx.fillStyle = '#d32f2f'; // 赤色
    ctx.fillText(`-${formatCurrency(data.contentFee)}円`, settings.contentX + contentFeeText, yPos);
    yPos += settings.spacing;
    
    // 振込手数料（太字、黒色）
    ctx.fillStyle = '#333333';
    ctx.fillText(`· 振込手数料（1回あたり）：`, settings.contentX, yPos);
    const transferFeeText = ctx.measureText(`· 振込手数料（1回あたり）：`).width;
    ctx.fillStyle = '#333333'; // 黒色
    ctx.fillText(`275円`, settings.contentX + transferFeeText, yPos);
}

/**
 * 設定を使用してココナラセクションを描画（調整可能版）
 */
function drawCoconalaSection(ctx, data) {
    const settings = window.previewSettings.coconala;
    
    // タイトルと手取り額を太字で表示
    ctx.textAlign = 'left';
    ctx.fillStyle = '#008080';
    ctx.font = `bold ${settings.titleFontSize}px "NotoSansJPCanvas", "NotoSansJP", "Noto Sans JP", sans-serif`;
    const titleText = 'ココナラコンテンツマーケット:';
    ctx.fillText(titleText, settings.contentX, settings.contentY);
    
    // 手取り額（太字、空白を削除して同じ行に）
    const titleWidth = ctx.measureText(titleText).width;
    ctx.fillStyle = '#008080';
    ctx.font = `bold ${settings.titleFontSize}px "NotoSansJPCanvas", "NotoSansJP", "Noto Sans JP", sans-serif`;
    ctx.fillText(`${formatCurrency(data.netAmount)}円`, settings.contentX + titleWidth + 10, settings.contentY);
    
    // 項目詳細（太字）
    ctx.font = `bold ${settings.detailFontSize}px "NotoSansJPCanvas", "NotoSansJP", "Noto Sans JP", sans-serif`;
    let yPos = settings.contentY + 60;
    
    // コンテンツ販売料（太字、マイナス部分は赤）
    ctx.fillStyle = '#333333';
    ctx.fillText(`· コンテンツ販売料：`, settings.contentX, yPos);
    const contentFeeText = ctx.measureText(`· コンテンツ販売料：`).width;
    ctx.fillStyle = '#d32f2f'; // 赤色
    ctx.fillText(`-${formatCurrency(data.salesFee)}円`, settings.contentX + contentFeeText, yPos);
    yPos += settings.spacing;
    
    // 振込手数料
    ctx.fillStyle = '#333333';
    ctx.fillText(`· 振込手数料（1回あたり）：`, settings.contentX, yPos);
    yPos += settings.spacing;
    
    // インデントされた項目
    ctx.font = `bold ${settings.detailFontSize}px "NotoSansJPCanvas", "NotoSansJP", "Noto Sans JP", sans-serif`;
    ctx.fillText(`　· 売上金額3,000円未満: 160円`, settings.contentX, yPos);
    yPos += settings.spacing;
    ctx.fillText(`　· 売上金額3,000円以上: 無料`, settings.contentX, yPos);
}






/**
 * サンプル画像imgをcanvasに置換する関数
 */
function replaceSampleImageWithCanvas(testData) {
    
    const sampleImageDiv = document.querySelector('.sample-image');
    
    if (!sampleImageDiv) {
        return;
    }
    
    // 既存のimg要素を取得
    const existingImg = sampleImageDiv.querySelector('img');
    
    if (!existingImg) {
        return;
    }
    
    // 新しいcanvasを作成
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 1920;
    sampleCanvas.height = 1080;
    sampleCanvas.className = 'sample-preview';
    sampleCanvas.style.cssText = `
        max-width: 100%;
        height: auto;
        border: 1px solid #ddd;
        border-radius: 4px;
    `;
    
    
    // imgをcanvasに置換
    sampleImageDiv.replaceChild(sampleCanvas, existingImg);
    
    // canvasにコンテンツを描画
    const ctx = sampleCanvas.getContext('2d');
    
    // format.jpgを背景として読み込んで描画
    const bgImage = new Image();
    bgImage.crossOrigin = 'anonymous';
    bgImage.src = 'assets/images/format.jpg';
    
    bgImage.onload = function() {
        
        // 背景画像を描画
        ctx.drawImage(bgImage, 0, 0, sampleCanvas.width, sampleCanvas.height);
        
        // コンテンツを描画
        drawResultsOnBackground(ctx, sampleCanvas, testData);
    };
    
    bgImage.onerror = function() {
        
        // フォールバック: 背景画像なしで描画
        drawResultsWithoutBackground(ctx, sampleCanvas, testData);
    };
}

// プレビュー機能をグローバルスコープに追加
window.generatePreviewImage = generatePreviewImage;

