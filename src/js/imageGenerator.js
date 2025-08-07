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
    
    logger.log('ImageGen', 'ブラウザ機能チェック', {
        canvas: debug.canvasSupported,
        download: debug.downloadSupported
    });
    
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
        logger.log('ImageGen', '画像生成開始', { results: !!results });
        
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
        
        logger.log('ImageGen', '画像生成処理開始');
        
    } catch (error) {
        debug.lastError = error.message;
        logger.error('ImageGen', '画像生成エラー', error);
        
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
        logger.log('ImageGen', 'Canvas要素が見つからないため作成します');
        canvas = document.createElement('canvas');
        canvas.id = 'result-canvas';
        canvas.style.display = 'none';
        document.body.appendChild(canvas);
    }
    
    // 16:9のアスペクト比で設定（1920x1080）
    canvas.width = 1920;
    canvas.height = 1080;
    
    logger.log('ImageGen', 'Canvas設定完了', {
        width: canvas.width,
        height: canvas.height
    });
    
    return canvas;
}

/**
 * 背景画像を読み込んで描画
 */
function loadBackgroundAndDraw(ctx, canvas, results) {
    const bgImage = new Image();
    bgImage.crossOrigin = 'anonymous';
    bgImage.src = 'assets/images/format.jpg';
    
    bgImage.onload = function() {
        logger.log('ImageGen', '背景画像読み込み成功');
        
        // 背景画像を描画
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        
        // コンテンツを描画
        drawResultsOnBackground(ctx, canvas, results);
        
        // ダウンロード処理
        downloadCanvasAsImage(canvas);
    };
    
    bgImage.onerror = function() {
        logger.error('ImageGen', '背景画像の読み込みに失敗しました');
        
        // フォールバック: 背景画像なしで描画
        drawResultsWithoutBackground(ctx, canvas, results);
        downloadCanvasAsImage(canvas);
    };
}

/**
 * format.jpg上にコンテンツを描画（sample.jpgのフォーマット）
 */
function drawResultsOnBackground(ctx, canvas, results) {
    logger.log('ImageGen', 'コンテンツ描画開始');
    
    // フォント設定
    ctx.textAlign = 'center';
    ctx.fillStyle = '#006666';
    
    // タイトル（中央上部）
    ctx.font = 'bold 68px sans-serif';
    const titleText = formatCurrency(results.price) + '円で販売した際の手取り額';
    ctx.fillText(titleText, canvas.width / 2, 100);
    
    // 各プラットフォームのコンテンツを描画
    drawNoteSection(ctx, results.note);
    drawTipsSection(ctx, results.tips);
    drawBrainSection(ctx, results.brain);
    drawCoconalaSection(ctx, results.coconala);
    
    logger.log('ImageGen', 'コンテンツ描画完了');
}

/**
 * noteセクションを描画
 */
function drawNoteSection(ctx, data) {
    const x = 100;
    const y = 200;
    
    // タイトル
    ctx.textAlign = 'left';
    ctx.fillStyle = '#008080';
    ctx.font = 'bold 52px "Hiragino Sans", "Yu Gothic", sans-serif';
    ctx.fillText('note：', x, y);
    
    // 手取り額範囲
    ctx.fillStyle = '#006666';
    ctx.font = '52px "Hiragino Sans", "Yu Gothic", sans-serif';
    ctx.fillText(`${formatCurrency(data.minAmount)}円～${formatCurrency(data.maxAmount)}円`, x + 140, y);
    
    // 手数料詳細
    ctx.fillStyle = '#333333';
    ctx.font = '36px "Hiragino Sans", "Yu Gothic", sans-serif';
    let yPos = y + 80;
    
    ctx.fillText(`● プラットフォーム利用料：-${formatCurrency(data.platformFee)}円`, x + 20, yPos);
    yPos += 50;
    ctx.fillText(`● 振込手数料（1回あたり）：-270円`, x + 20, yPos);
    yPos += 80;
    
    // 決済方法別
    ctx.font = '32px "Hiragino Sans", "Yu Gothic", sans-serif';
    const methods = [
        'クレジットカード決済', '携帯キャリア決済', 'PayPay決済',
        'Amazon Pay決済', 'noteポイント決済', 'PayPal決済'
    ];
    
    data.paymentMethods.forEach((method, index) => {
        const methodName = methods[index];
        const text = `● ${methodName} -${formatCurrency(method.serviceFee)}円：${formatCurrency(method.finalNetAmount)}円`;
        ctx.fillText(text, x + 20, yPos);
        yPos += 45;
    });
}

/**
 * tipsセクションを描画
 */
function drawTipsSection(ctx, data) {
    const x = 850;
    const y = 200;
    
    // タイトルと手取り額
    ctx.textAlign = 'left';
    ctx.fillStyle = '#008080';
    ctx.font = 'bold 52px "Hiragino Sans", "Yu Gothic", sans-serif';
    ctx.fillText('tips：', x, y);
    
    ctx.fillStyle = '#006666';
    ctx.fillText(`${formatCurrency(data.netAmount)}円`, x + 120, y);
    
    // 手数料詳細
    ctx.fillStyle = '#333333';
    ctx.font = '36px "Hiragino Sans", "Yu Gothic", sans-serif';
    let yPos = y + 80;
    
    ctx.fillText(`● コンテンツ販売料：-${formatCurrency(data.contentFee)}円`, x + 20, yPos);
    yPos += 50;
    ctx.fillText(`● 振込手数料（1回あたり）：`, x + 20, yPos);
    yPos += 45;
    
    ctx.font = '32px "Hiragino Sans", "Yu Gothic", sans-serif';
    ctx.fillText(`○ 通常会員: 550円`, x + 40, yPos);
    yPos += 40;
    ctx.fillText(`○ プラス会員: 330円`, x + 40, yPos);
}

/**
 * Brainセクションを描画
 */
function drawBrainSection(ctx, data) {
    const x = 850;
    const y = 500;
    
    // タイトルと手取り額
    ctx.textAlign = 'left';
    ctx.fillStyle = '#008080';
    ctx.font = 'bold 52px "Hiragino Sans", "Yu Gothic", sans-serif';
    ctx.fillText('Brain：', x, y);
    
    ctx.fillStyle = '#006666';
    ctx.fillText(`${formatCurrency(data.netAmount)}円`, x + 150, y);
    
    // 手数料詳細
    ctx.fillStyle = '#333333';
    ctx.font = '36px "Hiragino Sans", "Yu Gothic", sans-serif';
    let yPos = y + 80;
    
    ctx.fillText(`● コンテンツ販売料：-${formatCurrency(data.contentFee)}円`, x + 20, yPos);
    yPos += 50;
    ctx.fillText(`● 振込手数料（1回あたり）：-275円`, x + 20, yPos);
}

/**
 * ココナラセクションを描画
 */
function drawCoconalaSection(ctx, data) {
    const x = 850;
    const y = 750;
    
    // タイトル（長いので少し小さく）
    ctx.textAlign = 'left';
    ctx.fillStyle = '#008080';
    ctx.font = 'bold 44px "Hiragino Sans", "Yu Gothic", sans-serif';
    ctx.fillText('ココナラコンテンツマーケット：', x, y);
    
    ctx.fillStyle = '#006666';
    ctx.font = '52px "Hiragino Sans", "Yu Gothic", sans-serif';
    ctx.fillText(`${formatCurrency(data.netAmount)}円`, x + 480, y);
    
    // 手数料詳細
    ctx.fillStyle = '#333333';
    ctx.font = '36px "Hiragino Sans", "Yu Gothic", sans-serif';
    let yPos = y + 80;
    
    ctx.fillText(`● コンテンツ販売料：-${formatCurrency(data.salesFee)}円`, x + 20, yPos);
    yPos += 50;
    ctx.fillText(`● 振込手数料（1回あたり）：`, x + 20, yPos);
    yPos += 45;
    
    ctx.font = '32px "Hiragino Sans", "Yu Gothic", sans-serif';
    ctx.fillText(`○ 売上金額3,000円未満: 160円`, x + 40, yPos);
    yPos += 40;
    ctx.fillText(`○ 売上金額3,000円以上: 無料`, x + 40, yPos);
}

/**
 * フォールバック: 背景なしで描画
 */
function drawResultsWithoutBackground(ctx, canvas, results) {
    logger.log('ImageGen', 'フォールバック描画開始');
    
    // ターコイズブルーの背景
    ctx.fillStyle = '#62C5C5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 白い枠内のコンテンツエリア
    ctx.fillStyle = '#E6F5F5';
    ctx.fillRect(30, 30, canvas.width - 60, canvas.height - 60);
    
    // コンテンツを描画
    drawResultsOnBackground(ctx, canvas, results);
}

/**
 * note詳細描画
 */
function drawNoteDetails(ctx, data, x, y) {
    ctx.fillStyle = '#333333';
    ctx.font = '28px Arial, sans-serif';
    
    // プラットフォーム利用料
    ctx.fillText(`● プラットフォーム利用料：-${formatCurrency(data.platformFee)}円`, x, y);
    
    // 振込手数料
    ctx.fillText(`● 振込手数料（1回あたり）：-270円`, x, y + 40);
    
    // 決済方法別
    ctx.font = '24px Arial, sans-serif';
    ctx.fillStyle = '#666666';
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
    ctx.fillStyle = '#333333';
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
    ctx.fillText(`● 振込手数料（1回あたり）：-275円`, x, y + 40);
}

/**
 * ココナラ詳細描画
 */
function drawCoconalaDetails(ctx, data, x, y) {
    ctx.fillStyle = '#333333';
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
    logger.log('ImageGen', 'ダウンロード開始');
    
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
            
            logger.log('ImageGen', 'ダウンロード完了', { filename: filename });
            
            // 成功メッセージ表示
            showSuccessMessage(`画像をダウンロードしました: ${filename}`);
            
        }, 'image/jpeg', 0.9);
        
    } catch (error) {
        logger.error('ImageGen', 'ダウンロードエラー', error);
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
    
    logger.log('ImageGen', 'エラーメッセージ表示', { message: userMessage });
}

/**
 * 成功メッセージを表示
 */
function showSuccessMessage(message) {
    // 簡易的な成功メッセージ（実際のUIに合わせて調整）
    logger.log('ImageGen', '成功メッセージ', { message });
    
    // 将来的にはトーストメッセージなどに変更
    setTimeout(() => {
        console.log(`✅ ${message}`);
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

logger.log('ImageGen', '画像生成モジュール読み込み完了');