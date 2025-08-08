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
    
    // タイトル（中央上部） - 20px下げる
    ctx.font = 'bold 72px "NotoSansJP"';
    const titleText = formatCurrency(results.price) + '円で販売した際の手取り額';
    ctx.fillText(titleText, canvas.width / 2, 140);
    
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
    // format.jpgのnoteセクションの位置に合わせて配置（背景描画なし）
    const contentX = 120;
    const contentY = 200;
    
    // タイトルと手取り額を同じ行に表示
    ctx.textAlign = 'left';
    ctx.fillStyle = '#008080';
    ctx.font = 'bold 52px "NotoSansJP"';
    ctx.fillText('note :', contentX, contentY);
    
    // 手取り額範囲
    ctx.fillStyle = '#008080';
    ctx.font = '52px "NotoSansJP"';
    ctx.fillText(`${formatCurrency(data.minAmount)}円～${formatCurrency(data.maxAmount)}円`, contentX + 180, contentY);
    
    // noteの黒字は23.9px
    ctx.fillStyle = '#333333';
    ctx.font = '23.9px "NotoSansJP"';
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
    ctx.fillText(`● 振込手数料（1回あたり）：-270円`, contentX, yPos);
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
    ctx.font = 'bold 52px "NotoSansJP"';
    ctx.fillText('tips :', contentX, contentY);
    
    ctx.fillStyle = '#008080';
    ctx.fillText(`${formatCurrency(data.netAmount)}円`, contentX + 140, contentY);
    
    // それ以外の黒字は20.9px
    ctx.fillStyle = '#333333';
    ctx.font = '20.9px "NotoSansJP"';
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
    ctx.font = 'bold 52px "NotoSansJP"';
    ctx.fillText('Brain :', contentX, contentY);
    
    ctx.fillStyle = '#008080';
    ctx.fillText(`${formatCurrency(data.netAmount)}円`, contentX + 170, contentY);
    
    // それ以外の黒字は20.9px
    ctx.fillStyle = '#333333';
    ctx.font = '20.9px "NotoSansJP"';
    let yPos = contentY + 60;
    
    ctx.fillText(`● コンテンツ販売料：-${formatCurrency(data.contentFee)}円`, contentX, yPos);
    yPos += 40;
    ctx.fillText(`● 振込手数料（1回あたり）：-275円`, contentX, yPos);
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
    ctx.font = 'bold 52px "NotoSansJP"';
    ctx.fillText('ココナラコンテンツマーケット :', contentX, contentY);
    
    ctx.fillStyle = '#008080';
    ctx.font = '52px "NotoSansJP"';
    ctx.fillText(`${formatCurrency(data.netAmount)}円`, contentX, contentY + 60);
    
    // それ以外の黒字は20.9px
    ctx.fillStyle = '#333333';
    ctx.font = '20.9px "NotoSansJP"';
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
    logger.log('ImageGen', 'フォールバック描画開始');
    
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
    ctx.fillText(`● 振込手数料（1回あたり）：-270円`, x, y + 40);
    
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
    ctx.fillText(`● 振込手数料（1回あたり）：-275円`, x, y + 40);
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
    logger.log('ImageGen', 'プレビュー画像生成開始');
    
    try {
        // 入力された金額を取得
        const priceInput = document.getElementById('price-input');
        let inputPrice = null;
        
        if (priceInput && priceInput.value && !isNaN(priceInput.value) && parseInt(priceInput.value) > 0) {
            inputPrice = parseInt(priceInput.value);
            logger.log('ImageGen', '入力金額を使用', { price: inputPrice });
        } else {
            // 入力がない、または無効な値の場合はアラートを表示
            alert('料金を先に入力してください');
            logger.log('ImageGen', '入力金額がないためプレビューを中止');
            return;
        }
        
        // 入力された金額で計算を実行
        const testData = calculateAllPlatforms(inputPrice);
        
        // 既存のプレビュー関連要素があれば削除
        const existingContainer = document.getElementById('preview-container');
        if (existingContainer) {
            existingContainer.remove();
        }
        
        // プレビューコンテナを作成
        const container = document.createElement('div');
        container.id = 'preview-container';
        container.style.cssText = `
            position: relative;
            width: 960px;
            margin: 20px auto;
            border: 2px solid #ccc;
            background: #f9f9f9;
            padding: 10px;
        `;
        
        // プレビュー用Canvasを作成
        const canvas = document.createElement('canvas');
        canvas.id = 'preview-canvas';
        canvas.width = 1920;
        canvas.height = 1080;
        canvas.style.cssText = `
            width: 960px;
            height: 540px;
            display: block;
            border: 1px solid #999;
        `;
        
        // 調整パネルを作成
        const controlPanel = document.createElement('div');
        
        // ココナラのY位置を790に更新
        window.previewSettings.coconala.contentY = 790;
        controlPanel.id = 'adjustment-panel';
        controlPanel.style.cssText = `
            background: #fff;
            border: 1px solid #ddd;
            padding: 15px;
            margin-top: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
        `;
        
        controlPanel.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #333;">🔧 デベロッパーツール調整パネル</h3>
            <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                <label style="font-weight: bold; margin-right: 10px;">販売価格:</label>
                <input type="number" id="preview-price-input" value="${inputPrice}" min="1" style="width: 80px; padding: 4px; border: 1px solid #ccc; border-radius: 3px;">
                <span style="margin-left: 5px;">円</span>
                <button id="update-price-btn" style="margin-left: 10px; padding: 4px 12px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;">更新</button>
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                <div>
                    <h4 style="margin: 0 0 8px 0; color: #666;">Note セクション</h4>
                    <div style="display: grid; grid-template-columns: 1fr auto; gap: 5px; align-items: center;">
                        <label>X位置:</label> <input type="number" id="note-contentX" value="${window.previewSettings.note.contentX}" style="width: 60px;">
                        <label>Y位置:</label> <input type="number" id="note-contentY" value="${window.previewSettings.note.contentY}" style="width: 60px;">
                        <label>見出しサイズ:</label> <input type="number" id="note-titleFontSize" value="${window.previewSettings.note.titleFontSize}" step="0.1" style="width: 60px;">
                        <label>詳細フォント:</label> <input type="number" id="note-detailFontSize" value="${window.previewSettings.note.detailFontSize}" step="0.1" style="width: 60px;">
                        <label>項目間隔:</label> <input type="number" id="note-methodSpacing" value="${window.previewSettings.note.methodSpacing}" style="width: 60px;">
                    </div>
                </div>
                <div>
                    <h4 style="margin: 0 0 8px 0; color: #666;">Tips セクション</h4>
                    <div style="display: grid; grid-template-columns: 1fr auto; gap: 5px; align-items: center;">
                        <label>X位置:</label> <input type="number" id="tips-contentX" value="${window.previewSettings.tips.contentX}" style="width: 60px;">
                        <label>Y位置:</label> <input type="number" id="tips-contentY" value="${window.previewSettings.tips.contentY}" style="width: 60px;">
                        <label>見出しサイズ:</label> <input type="number" id="tips-titleFontSize" value="${window.previewSettings.tips.titleFontSize}" step="0.1" style="width: 60px;">
                        <label>詳細フォント:</label> <input type="number" id="tips-detailFontSize" value="${window.previewSettings.tips.detailFontSize}" step="0.1" style="width: 60px;">
                        <label>項目間隔:</label> <input type="number" id="tips-spacing" value="${window.previewSettings.tips.spacing}" style="width: 60px;">
                    </div>
                </div>
                <div>
                    <h4 style="margin: 0 0 8px 0; color: #666;">Brain セクション</h4>
                    <div style="display: grid; grid-template-columns: 1fr auto; gap: 5px; align-items: center;">
                        <label>X位置:</label> <input type="number" id="brain-contentX" value="${window.previewSettings.brain.contentX}" style="width: 60px;">
                        <label>Y位置:</label> <input type="number" id="brain-contentY" value="${window.previewSettings.brain.contentY}" style="width: 60px;">
                        <label>見出しサイズ:</label> <input type="number" id="brain-titleFontSize" value="${window.previewSettings.brain.titleFontSize}" step="0.1" style="width: 60px;">
                        <label>詳細フォント:</label> <input type="number" id="brain-detailFontSize" value="${window.previewSettings.brain.detailFontSize}" step="0.1" style="width: 60px;">
                        <label>項目間隔:</label> <input type="number" id="brain-spacing" value="${window.previewSettings.brain.spacing}" style="width: 60px;">
                    </div>
                </div>
                <div>
                    <h4 style="margin: 0 0 8px 0; color: #666;">ココナラ セクション</h4>
                    <div style="display: grid; grid-template-columns: 1fr auto; gap: 5px; align-items: center;">
                        <label>X位置:</label> <input type="number" id="coconala-contentX" value="${window.previewSettings.coconala.contentX}" style="width: 60px;">
                        <label>Y位置:</label> <input type="number" id="coconala-contentY" value="790" style="width: 60px;">
                        <label>見出しサイズ:</label> <input type="number" id="coconala-titleFontSize" value="${window.previewSettings.coconala.titleFontSize}" step="0.1" style="width: 60px;">
                        <label>詳細フォント:</label> <input type="number" id="coconala-detailFontSize" value="${window.previewSettings.coconala.detailFontSize}" step="0.1" style="width: 60px;">
                        <label>項目間隔:</label> <input type="number" id="coconala-spacing" value="${window.previewSettings.coconala.spacing}" style="width: 60px;">
                    </div>
                </div>
            </div>
            <div style="margin-top: 15px; text-align: center;">
                <button id="apply-changes-btn" style="padding: 8px 20px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;">変更を適用</button>
                <button id="reset-settings-btn" style="padding: 8px 20px; background: #6c757d; color: white; border: none; border-radius: 3px; cursor: pointer; margin-left: 10px;">リセット</button>
                <button id="export-settings-btn" style="padding: 8px 20px; background: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer; margin-left: 10px;">設定をコピー</button>
            </div>
            <div style="margin-top: 10px; font-size: 11px; color: #666;">
                ※ 値を変更して「変更を適用」をクリックするか、デベロッパーツールで adjustPreview.updateSetting() を使用
            </div>
        `;
        
        // コンテナに要素を追加
        container.appendChild(canvas);
        container.appendChild(controlPanel);
        
        // body に追加
        document.body.appendChild(container);
        
        // 調整パネルのイベントリスナーを設定
        setupAdjustmentPanelEvents();
        
        const ctx = canvas.getContext('2d');
        
        // format.jpgを背景として読み込んで描画
        loadBackgroundAndDrawPreview(ctx, canvas, testData);
        
        logger.log('ImageGen', 'プレビューCanvas作成完了');
        
    } catch (error) {
        logger.error('ImageGen', 'プレビュー生成エラー', error);
        alert('プレビュー生成に失敗しました: ' + error.message);
    }
}

/**
 * プレビュー用の背景画像読み込み
 */
function loadBackgroundAndDrawPreview(ctx, canvas, results) {
    const bgImage = new Image();
    bgImage.crossOrigin = 'anonymous';
    bgImage.src = 'assets/images/format.jpg';
    
    bgImage.onload = function() {
        logger.log('ImageGen', 'プレビュー用背景画像読み込み成功');
        
        // 背景画像を描画
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        
        // コンテンツを描画
        drawResultsOnBackground(ctx, canvas, results);
        
        logger.log('ImageGen', 'プレビュー画像描画完了');
    };
    
    bgImage.onerror = function() {
        logger.error('ImageGen', 'プレビュー用背景画像の読み込みに失敗');
        
        // フォールバック: 背景画像なしで描画
        drawResultsWithoutBackground(ctx, canvas, results);
    };
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
    ctx.font = `bold ${settings.titleFontSize}px "NotoSansJP"`;
    const titleText = 'note:';
    ctx.fillText(titleText, settings.contentX, settings.contentY);
    
    // 手取り額範囲（太字、空白を削除）
    const titleWidth = ctx.measureText(titleText).width;
    ctx.fillStyle = '#008080';
    ctx.font = `bold ${settings.rangeFontSize}px "NotoSansJP"`;
    ctx.fillText(`${formatCurrency(data.minAmount)}円～${formatCurrency(data.maxAmount)}円`, settings.contentX + titleWidth + 5, settings.contentY);
    
    // 項目詳細（太字）
    ctx.font = `bold ${settings.detailFontSize}px "NotoSansJP"`;
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
            ctx.font = `bold ${settings.detailFontSize}px "NotoSansJP"`;
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
            ctx.font = `bold ${settings.detailFontSize}px "NotoSansJP"`;
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
    ctx.font = `bold ${settings.titleFontSize}px "NotoSansJP"`;
    const titleText = 'tips:';
    ctx.fillText(titleText, settings.contentX, settings.contentY);
    
    // 手取り額（太字、空白を削除）
    const titleWidth = ctx.measureText(titleText).width;
    ctx.fillStyle = '#008080';
    ctx.font = `bold ${settings.titleFontSize}px "NotoSansJP"`;
    ctx.fillText(`${formatCurrency(data.netAmount)}円`, settings.contentX + titleWidth + 5, settings.contentY);
    
    // 項目詳細（太字）
    ctx.font = `bold ${settings.detailFontSize}px "NotoSansJP"`;
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
    ctx.font = `bold ${settings.detailFontSize}px "NotoSansJP"`;
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
    ctx.font = `bold ${settings.titleFontSize}px "NotoSansJP"`;
    const titleText = 'Brain:';
    ctx.fillText(titleText, settings.contentX, settings.contentY);
    
    // 手取り額（太字、空白を削除）
    const titleWidth = ctx.measureText(titleText).width;
    ctx.fillStyle = '#008080';
    ctx.font = `bold ${settings.titleFontSize}px "NotoSansJP"`;
    ctx.fillText(`${formatCurrency(data.netAmount)}円`, settings.contentX + titleWidth + 5, settings.contentY);
    
    // 項目詳細（太字）
    ctx.font = `bold ${settings.detailFontSize}px "NotoSansJP"`;
    let yPos = settings.contentY + 60;
    
    // コンテンツ販売料（太字、マイナス部分は赤）
    ctx.fillStyle = '#333333';
    ctx.fillText(`· コンテンツ販売料：`, settings.contentX, yPos);
    const contentFeeText = ctx.measureText(`· コンテンツ販売料：`).width;
    ctx.fillStyle = '#d32f2f'; // 赤色
    ctx.fillText(`-${formatCurrency(data.contentFee)}円`, settings.contentX + contentFeeText, yPos);
    yPos += settings.spacing;
    
    // 振込手数料（太字、マイナス部分は赤）
    ctx.fillStyle = '#333333';
    ctx.fillText(`· 振込手数料（1回あたり）：`, settings.contentX, yPos);
    const transferFeeText = ctx.measureText(`· 振込手数料（1回あたり）：`).width;
    ctx.fillStyle = '#d32f2f'; // 赤色
    ctx.fillText(`-275円`, settings.contentX + transferFeeText, yPos);
}

/**
 * 設定を使用してココナラセクションを描画（調整可能版）
 */
function drawCoconalaSection(ctx, data) {
    const settings = window.previewSettings.coconala;
    
    // タイトルと手取り額を太字で表示
    ctx.textAlign = 'left';
    ctx.fillStyle = '#008080';
    ctx.font = `bold ${settings.titleFontSize}px "NotoSansJP"`;
    const titleText = 'ココナラコンテンツマーケット:';
    ctx.fillText(titleText, settings.contentX, settings.contentY);
    
    // 手取り額（太字、空白を削除して同じ行に）
    const titleWidth = ctx.measureText(titleText).width;
    ctx.fillStyle = '#008080';
    ctx.font = `bold ${settings.titleFontSize}px "NotoSansJP"`;
    ctx.fillText(`${formatCurrency(data.netAmount)}円`, settings.contentX + titleWidth + 10, settings.contentY);
    
    // 項目詳細（太字）
    ctx.font = `bold ${settings.detailFontSize}px "NotoSansJP"`;
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
    ctx.font = `bold ${settings.detailFontSize}px "NotoSansJP"`;
    ctx.fillText(`　· 売上金額3,000円未満: 160円`, settings.contentX, yPos);
    yPos += settings.spacing;
    ctx.fillText(`　· 売上金額3,000円以上: 無料`, settings.contentX, yPos);
}

/**
 * プレビューを再描画する関数
 */
function redrawPreview() {
    const canvas = document.getElementById('preview-canvas');
    if (!canvas) {
        console.log('❌ プレビューCanvasが見つかりません');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // 現在のプレビュー価格を取得
    let currentPrice = null;
    const priceInput = document.getElementById('preview-price-input');
    if (priceInput && priceInput.value && !isNaN(priceInput.value) && parseInt(priceInput.value) > 0) {
        currentPrice = parseInt(priceInput.value);
    } else {
        // プレビュー価格入力がない場合は、メインの入力フィールドをチェック
        const mainPriceInput = document.getElementById('price-input');
        if (mainPriceInput && mainPriceInput.value && !isNaN(mainPriceInput.value) && parseInt(mainPriceInput.value) > 0) {
            currentPrice = parseInt(mainPriceInput.value);
        }
    }
    
    // 価格が設定されていない場合はアラートを表示して終了
    if (!currentPrice) {
        console.log('❌ 正しい価格が入力されていません');
        return;
    }
    
    // 現在の価格で計算データを生成
    const testData = calculateAllPlatforms(currentPrice);
    
    // 背景画像を再描画
    const bgImage = new Image();
    bgImage.crossOrigin = 'anonymous';
    bgImage.src = 'assets/images/format.jpg';
    
    bgImage.onload = function() {
        // 背景画像を描画
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        
        // コンテンツを描画
        drawResultsOnBackground(ctx, canvas, testData);
    };
    
    bgImage.onerror = function() {
        // フォールバック: 背景画像なしで描画
        drawResultsWithoutBackground(ctx, canvas, testData);
    };
}

/**
 * 調整パネルのイベントリスナーを設定
 */
function setupAdjustmentPanelEvents() {
    // 価格更新ボタン
    const updatePriceBtn = document.getElementById('update-price-btn');
    if (updatePriceBtn) {
        updatePriceBtn.addEventListener('click', function() {
            updatePreviewPrice();
        });
    }
    
    // 価格入力フィールドのEnterキーイベント
    const priceInput = document.getElementById('preview-price-input');
    if (priceInput) {
        priceInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                updatePreviewPrice();
            }
        });
    }
    
    // 変更を適用ボタン
    const applyBtn = document.getElementById('apply-changes-btn');
    if (applyBtn) {
        applyBtn.addEventListener('click', function() {
            applySettingsFromPanel();
        });
    }
    
    // リセットボタン
    const resetBtn = document.getElementById('reset-settings-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            resetToDefaultSettings();
        });
    }
    
    // 設定をコピーボタン
    const exportBtn = document.getElementById('export-settings-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            exportCurrentSettings();
        });
    }
    
    // Enter キーで即座に適用
    const inputs = document.querySelectorAll('#adjustment-panel input');
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                applySettingsFromPanel();
            }
        });
        
        // リアルタイム更新（input イベント）
        input.addEventListener('input', debounce(function() {
            applySettingsFromPanel();
        }, 300));
    });
}

/**
 * プレビューの価格を更新
 */
function updatePreviewPrice() {
    const priceInput = document.getElementById('preview-price-input');
    if (!priceInput) {
        console.log('❌ 価格入力フィールドが見つかりません');
        return;
    }
    
    const inputValue = priceInput.value.trim();
    if (!inputValue || inputValue === '' || isNaN(inputValue)) {
        alert('料金を先に入力してください');
        return;
    }
    
    const newPrice = parseInt(inputValue);
    if (newPrice <= 0) {
        alert('正しい金額を入力してください');
        return;
    }
    
    console.log(`💰 価格を${newPrice}円に更新します`);
    
    // 新しい価格で計算を実行
    const newData = calculateAllPlatforms(newPrice);
    
    // プレビューを更新
    const canvas = document.getElementById('preview-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        
        // 背景画像を再描画
        const bgImage = new Image();
        bgImage.crossOrigin = 'anonymous';
        bgImage.src = 'assets/images/format.jpg';
        
        bgImage.onload = function() {
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
            drawResultsOnBackground(ctx, canvas, newData);
            console.log(`✅ プレビューを${newPrice}円で更新しました`);
        };
        
        bgImage.onerror = function() {
            drawResultsWithoutBackground(ctx, canvas, newData);
            console.log(`✅ プレビューを${newPrice}円で更新しました（背景なし）`);
        };
    }
}

/**
 * パネルから設定を適用
 */
function applySettingsFromPanel() {
    const sections = ['note', 'tips', 'brain', 'coconala'];
    
    sections.forEach(section => {
        const settings = window.previewSettings[section];
        
        Object.keys(settings).forEach(key => {
            const input = document.getElementById(`${section}-${key}`);
            if (input) {
                const value = parseFloat(input.value) || settings[key];
                window.previewSettings[section][key] = value;
            }
        });
    });
    
    redrawPreview();
    console.log('✅ 設定を適用してプレビューを更新しました');
}

/**
 * デフォルト設定にリセット
 */
function resetToDefaultSettings() {
    const defaultSettings = {
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
        tips: {
            contentX: 1020,
            contentY: 270,
            titleFontSize: 32,
            detailFontSize: 26.1,
            spacing: 45
        },
        brain: {
            contentX: 1020,
            contentY: 570,
            titleFontSize: 32,
            detailFontSize: 26.1,
            spacing: 45
        },
        coconala: {
            contentX: 1020,
            contentY: 790,
            titleFontSize: 32,
            amountFontSize: 32,
            detailFontSize: 26,
            spacing: 45
        }
    };
    
    window.previewSettings = defaultSettings;
    
    // パネルの入力値も更新
    Object.keys(defaultSettings).forEach(section => {
        Object.keys(defaultSettings[section]).forEach(key => {
            const input = document.getElementById(`${section}-${key}`);
            if (input) {
                input.value = defaultSettings[section][key];
            }
        });
    });
    
    redrawPreview();
    console.log('🔄 設定をデフォルトにリセットしました');
}

/**
 * 現在の設定をクリップボードにコピー
 */
function exportCurrentSettings() {
    const settingsCode = `
// 現在の設定をコードとして適用
window.previewSettings = ${JSON.stringify(window.previewSettings, null, 2)};
adjustPreview.redraw();
    `.trim();
    
    navigator.clipboard.writeText(settingsCode).then(() => {
        alert('設定がクリップボードにコピーされました！\nデベロッパーツールのコンソールに貼り付けて実行できます。');
        console.log('📋 設定がコピーされました:', settingsCode);
    }).catch(() => {
        console.log('📋 設定コード:', settingsCode);
        alert('設定をコンソールに出力しました。');
    });
}

/**
 * デバウンス関数
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
 * デベロッパーツール用のヘルパー関数
 */
window.adjustPreview = {
    // 設定を更新してプレビューを再描画
    updateSetting: function(section, property, value) {
        if (window.previewSettings[section] && window.previewSettings[section].hasOwnProperty(property)) {
            window.previewSettings[section][property] = value;
            redrawPreview();
            console.log(`✅ ${section}.${property} = ${value} に更新しました`);
        } else {
            console.log(`❌ 無効な設定: ${section}.${property}`);
        }
    },
    
    // 現在の設定を表示
    showSettings: function() {
        console.log('📋 現在の設定:', window.previewSettings);
    },
    
    // プレビューを再描画
    redraw: function() {
        redrawPreview();
        console.log('🔄 プレビューを再描画しました');
    },
    
    // 使用方法のヘルプ
    help: function() {
        console.log(`
📖 調整方法:
adjustPreview.updateSetting('note', 'contentX', 150)  // noteのX位置を150に変更
adjustPreview.updateSetting('tips', 'contentY', 220)  // tipsのY位置を220に変更
adjustPreview.updateSetting('note', 'detailFontSize', 25)  // noteの詳細フォントサイズを25に変更

💰 価格更新:
updatePreviewPrice()  // 調整パネルの価格入力フィールドから更新
パネルの「販売価格」フィールドに金額を入力して「更新」ボタンをクリック

利用可能な設定:
- note: contentX, contentY, titleFontSize, rangeFontSize, detailFontSize, platformFeeY, methodsStartY, methodSpacing, transferFeeExtraY
- tips: contentX, contentY, titleFontSize, detailFontSize, spacing
- brain: contentX, contentY, titleFontSize, detailFontSize, spacing
- coconala: contentX, contentY, titleFontSize, amountFontSize, detailFontSize, spacing

その他のコマンド:
adjustPreview.showSettings()  // 現在の設定を表示
adjustPreview.redraw()        // プレビューを再描画
adjustPreview.help()          // このヘルプを表示
        `);
    }
};

// プレビュー機能をグローバルスコープに追加
window.generatePreviewImage = generatePreviewImage;
window.getTestCalculationData = getTestCalculationData;
window.updatePreviewPrice = updatePreviewPrice;

logger.log('ImageGen', '画像生成モジュール読み込み完了');
logger.log('ImageGen', 'デベロッパーツール用調整機能が利用可能です: adjustPreview.help()');;