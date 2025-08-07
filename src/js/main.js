/**
 * á¤óæû¤ÙóÈ6¡ûUIô°
 * DOMÍ\¤ÙóÈê¹Êü;b6¡’ÅS
 */

/**
 * ¢×ê±ü·çó
 */
function initializeApp() {
    // DOM nÖ—
    const priceInput = document.getElementById('price-input');
    const calculateBtn = document.getElementById('calculate-btn');
    const saveImageBtn = document.getElementById('save-image-btn');
    const resultsSection = document.getElementById('results-section');
    
    if (!priceInput || !calculateBtn) {
        logError('', new Error('ÅnDOM L‹dKŠ~[“'));
        return;
    }
    
    // e›Õ£üëÉn-š
    setupInputField(priceInput);
    
    // ¤ÙóÈê¹Êün-š
    setupEventListeners(priceInput, calculateBtn, saveImageBtn);
    
    // ¶Kn-š
    setInitialState();
    
    console.log('¢×ê±ü·çóLUŒ~W_');
}

/**
 * e›Õ£üëÉn-š
 * @param {HTMLInputElement} priceInput - ¡<e›Õ£üëÉ
 */
function setupInputField(priceInput) {
    // p$ne›1ï
    restrictToNumbers(priceInput);
    
    // Enter­üá2b
    preventFormSubmission(priceInput);
    
    // ê¢ë¿¤àĞêÇü·çó-š
    setupRealTimeValidation(priceInput, function(validation) {
        setValidationState('price-input', validation.isValid, validation.message);
        
        // —Ü¿ón	¹/!¹6¡
        const calculateBtn = document.getElementById('calculate-btn');
        if (calculateBtn) {
            const hasValue = priceInput.value.trim() !== '';
            calculateBtn.disabled = !validation.isValid || !hasValue;
        }
    });
}

/**
 * ¤ÙóÈê¹Êün-š
 * @param {HTMLInputElement} priceInput - ¡<e›Õ£üëÉ
 * @param {HTMLButtonElement} calculateBtn - —Ü¿ó
 * @param {HTMLButtonElement} saveImageBtn - ;ÏİXÜ¿ó
 */
function setupEventListeners(priceInput, calculateBtn, saveImageBtn) {
    // —Ü¿ón¯êÃ¯¤ÙóÈ
    calculateBtn.addEventListener('click', function() {
        handleCalculate();
    });
    
    // ;ÏİXÜ¿ón¯êÃ¯¤ÙóÈ
    if (saveImageBtn) {
        saveImageBtn.addEventListener('click', function() {
            handleSaveImage();
        });
    }
    
    // e›Õ£üëÉnÕ©ü«¹¤ÙóÈ
    priceInput.addEventListener('focus', function() {
        hideError('input-error');
    });
    
    // ¦£óÉ¦êµ¤º¤ÙóÈì¹İó·ÖşÜ	
    window.addEventListener('resize', debounce(function() {
        adjustLayoutForViewport();
    }, 250));
}

/**
 * ¶Kn-š
 */
function setInitialState() {
    // Pœh:¨ê¢’ Y
    hideElement('results-section');
    
    // ¨éüáÃ»ü¸’ Y
    hideError('input-error');
    
    // —Ü¿ó’!¹
    const calculateBtn = document.getElementById('calculate-btn');
    if (calculateBtn) {
        calculateBtn.disabled = true;
    }
    
    // ¡<e›Õ£üëÉkÕ©ü«¹
    const priceInput = document.getElementById('price-input');
    if (priceInput) {
        priceInput.focus();
    }
}

/**
 * —ænÏóÉéü
 */
function handleCalculate() {
    const priceInput = document.getElementById('price-input');
    if (!priceInput) return;
    
    const inputValue = getNormalizedInputValue('price-input');
    
    // e›$n<
    const validation = validatePriceRange(inputValue);
    if (!validation.isValid) {
        showError('input-error', validation.message);
        return;
    }
    
    // íüÇ£ó°¶K‹Ë
    setLoadingState(true);
    hideError('input-error');
    
    try {
        // —ŸL^æhWfqF	
        setTimeout(() => {
            performCalculation(parseToSafeNumber(inputValue));
        }, 100);
        
    } catch (error) {
        logError('—æ', error);
        showError('input-error', '—-k¨éüLzW~W_');
        setLoadingState(false);
    }
}

/**
 * Ÿ›n—æ
 * @param {number} price - ©ò¡<
 */
function performCalculation(price) {
    try {
        // h×éÃÈÕ©üàn—ŸL
        const results = calculateAllPlatforms(price);
        
        if (!results || !validateCalculationResults(results)) {
            throw new Error('—PœLcgY');
        }
        
        // Pœ’UIkh:
        displayCalculationResults(results);
        
        // íüÇ£ó°¶KB†
        setLoadingState(false);
        
        // Pœ¨ê¢’h:¢Ëáü·çóØM	
        showElement('results-section');
        
        // Pœ¨ê¢~g¹¯íüë
        scrollToResults();
        
    } catch (error) {
        logError('—æ', error);
        showError('input-error', '—k1WW~W_¦JfWO`UD');
        setLoadingState(false);
    }
}

/**
 * —Pœ’UIkh:
 * @param {Object} results - —Pœ
 */
function displayCalculationResults(results) {
    // ¿¤Èëô°
    setElementText('results-title', `${formatPrice(results.price)}œM	g©òW_›nKÖŠM`);
    
    // note nPœh:
    displayNoteResults(results.note);
    
    // tips nPœh:
    displayTipsResults(results.tips);
    
    // Brain nPœh:
    displayBrainResults(results.brain);
    
    // ³³Êé nPœh:
    displayCoconalaResults(results.coconala);
}

/**
 * noten—Pœ’h:
 * @param {Object} noteResults - note n—Pœ
 */
function displayNoteResults(noteResults) {
    // ÑMÄònh:
    setElementText('note-range', `${formatPrice(noteResults.minAmount)}^${formatPrice(noteResults.maxAmount)}`);
    
    // ×éÃÈÕ©üà)(™
    setElementText('note-platform-fee', formatFee(noteResults.platformFee));
    
    // z¹Õnh:
    noteResults.paymentMethods.forEach(method => {
        const feeElementId = `note-${method.name}-fee`;
        const resultElementId = `note-${method.name}-result`;
        
        setElementText(feeElementId, formatFee(method.serviceFee));
        setElementText(resultElementId, formatPrice(method.finalNetAmount));
    });
}

/**
 * tipsn—Pœ’h:
 * @param {Object} tipsResults - tips n—Pœ
 */
function displayTipsResults(tipsResults) {
    // KÖŠM×é¹áú–	
    setElementText('tips-result', formatPrice(tipsResults.netAmount));
    
    // ³óÆóÄ©òKp™
    setElementText('tips-content-fee', formatFee(tipsResults.contentFee));
}

/**
 * Brainn—Pœ’h:
 * @param {Object} brainResults - Brain n—Pœ
 */
function displayBrainResults(brainResults) {
    // KÖŠM
    setElementText('brain-result', formatPrice(brainResults.netAmount));
    
    // ³óÆóÄ©òKp™
    setElementText('brain-content-fee', formatFee(brainResults.contentFee));
}

/**
 * ³³Êén—Pœ’h:
 * @param {Object} coconalaResults - ³³Êé n—Pœ
 */
function displayCoconalaResults(coconalaResults) {
    // KÖŠM
    setElementText('coconala-result', formatPrice(coconalaResults.netAmount));
    
    // ©òKp™
    setElementText('coconala-sales-fee', formatFee(coconalaResults.salesFee));
}

/**
 * ;ÏİXænÏóÉéü
 */
function handleSaveImage() {
    const saveBtn = document.getElementById('save-image-btn');
    if (!saveBtn) return;
    
    // Ü¿ó!¹
    saveBtn.disabled = true;
    saveBtn.textContent = 'İX-...';
    
    try {
        // ş(n—Pœ’Ö—
        const currentResults = getCurrentCalculationResults();
        
        if (!currentResults) {
            throw new Error('İXY‹PœLBŠ~[“');
        }
        
        // ;ÏûİXæ
        if (typeof generateAndSaveImage === 'function') {
            generateAndSaveImage(currentResults);
        } else {
            throw new Error(';Ï_ıL)(gM~[“');
        }
        
    } catch (error) {
        logError(';ÏİX', error);
        alert(';ÏnİXk1WW~W_¦JfWO`UD');
    } finally {
        // Ü¿ó©C
        setTimeout(() => {
            saveBtn.disabled = false;
            saveBtn.textContent = ';ÏhWfİX';
        }, 1000);
    }
}

/**
 * ş(n—Pœ’Ö—
 * @returns {Object|null} —PœªÖ¸§¯È
 */
function getCurrentCalculationResults() {
    const resultsSection = document.getElementById('results-section');
    
    if (!resultsSection || resultsSection.style.display === 'none') {
        return null;
    }
    
    // h:UŒfD‹¡<K‰Pœ’ËÉ
    const priceText = document.getElementById('results-title')?.textContent;
    if (!priceText) return null;
    
    // ¡<n½úchş’(	
    const priceMatch = priceText.match(/(\d{1,3}(?:,\d{3})*)†/);
    if (!priceMatch) return null;
    
    const price = parseToSafeNumber(priceMatch[1].replace(/,/g, ''));
    return calculateAllPlatforms(price);
}

/**
 * Pœ¨ê¢~g¹àüº¹¯íüë
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
 * ÓåüİüÈµ¤ºkÜX_ì¤¢¦È¿t
 */
function adjustLayoutForViewport() {
    const resultsContainer = document.querySelector('.results-container');
    if (!resultsContainer) return;
    
    const viewportWidth = window.innerWidth;
    
    // âĞ¤ë¾$: 768px
    if (viewportWidth < 768) {
        resultsContainer.classList.add('mobile-layout');
    } else {
        resultsContainer.classList.remove('mobile-layout');
    }
}

/**
 * ­üÜüÉ·çüÈ«ÃÈn-š
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl+Enter ~_o Cmd+Enter g—ŸL
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            const calculateBtn = document.getElementById('calculate-btn');
            if (calculateBtn && !calculateBtn.disabled) {
                calculateBtn.click();
            }
        }
        
        // Ctrl+S ~_o Cmd+S g;ÏİX
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const saveBtn = document.getElementById('save-image-btn');
            if (saveBtn && !saveBtn.disabled) {
                saveBtn.click();
            }
        }
        
        // Escape gPœ’ Y
        if (e.key === 'Escape') {
            hideElement('results-section');
        }
    });
}

/**
 * ¨éüænq 
 * @param {string} context - ¨éü³óÆ­¹È
 * @param {Error} error - ¨éüªÖ¸§¯È
 * @param {string} userMessage - æü¶üQáÃ»ü¸
 */
function handleError(context, error, userMessage = '¨éüLzW~W_') {
    logError(context, error);
    showError('input-error', userMessage);
    setLoadingState(false);
}

// DOM­¼Œ†Bn
document.addEventListener('DOMContentLoaded', function() {
    safeDOM(() => {
        initializeApp();
        setupKeyboardShortcuts();
        adjustLayoutForViewport();
    });
});

// Úü¸â1Mnº—PœLB‹4	
window.addEventListener('beforeunload', function(e) {
    const resultsSection = document.getElementById('results-section');
    if (resultsSection && resultsSection.style.display !== 'none') {
        const message = '—PœLİXUŒfD~[“Úü¸’âŒ~YK';
        e.preventDefault();
        e.returnValue = message;
        return message;
    }
});

// °íüĞë¢phWfl‹
window.MainApp = {
    initializeApp,
    handleCalculate,
    handleSaveImage,
    displayCalculationResults,
    getCurrentCalculationResults,
    adjustLayoutForViewport
};