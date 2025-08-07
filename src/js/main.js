/**
 * ��������6��UI��
 * DOM�\�������;b6���S
 */

/**
 * �������
 */
function initializeApp() {
    // DOM� n֗
    const priceInput = document.getElementById('price-input');
    const calculateBtn = document.getElementById('calculate-btn');
    const saveImageBtn = document.getElementById('save-image-btn');
    const resultsSection = document.getElementById('results-section');
    
    if (!priceInput || !calculateBtn) {
        logError('', new Error('�nDOM� L�dK�~[�'));
        return;
    }
    
    // e�գ���n-�
    setupInputField(priceInput);
    
    // �������n-�
    setupEventListeners(priceInput, calculateBtn, saveImageBtn);
    
    // �Kn-�
    setInitialState();
    
    console.log('�������LU�~W_');
}

/**
 * e�գ���n-�
 * @param {HTMLInputElement} priceInput - �<e�գ���
 */
function setupInputField(priceInput) {
    // p$ne�1�
    restrictToNumbers(priceInput);
    
    // Enter���2b
    preventFormSubmission(priceInput);
    
    // �뿤��������-�
    setupRealTimeValidation(priceInput, function(validation) {
        setValidationState('price-input', validation.isValid, validation.message);
        
        // �ܿ�n	�/!�6�
        const calculateBtn = document.getElementById('calculate-btn');
        if (calculateBtn) {
            const hasValue = priceInput.value.trim() !== '';
            calculateBtn.disabled = !validation.isValid || !hasValue;
        }
    });
}

/**
 * �������n-�
 * @param {HTMLInputElement} priceInput - �<e�գ���
 * @param {HTMLButtonElement} calculateBtn - �ܿ�
 * @param {HTMLButtonElement} saveImageBtn - ;��Xܿ�
 */
function setupEventListeners(priceInput, calculateBtn, saveImageBtn) {
    // �ܿ�n��ï����
    calculateBtn.addEventListener('click', function() {
        handleCalculate();
    });
    
    // ;��Xܿ�n��ï����
    if (saveImageBtn) {
        saveImageBtn.addEventListener('click', function() {
            handleSaveImage();
        });
    }
    
    // e�գ���nթ�������
    priceInput.addEventListener('focus', function() {
        hideError('input-error');
    });
    
    // ���ɦ굤�����������	
    window.addEventListener('resize', debounce(function() {
        adjustLayoutForViewport();
    }, 250));
}

/**
 * �Kn-�
 */
function setInitialState() {
    // P�h:�ꢒ�Y
    hideElement('results-section');
    
    // ����û����Y
    hideError('input-error');
    
    // �ܿ�!�
    const calculateBtn = document.getElementById('calculate-btn');
    if (calculateBtn) {
        calculateBtn.disabled = true;
    }
    
    // �<e�գ���kթ���
    const priceInput = document.getElementById('price-input');
    if (priceInput) {
        priceInput.focus();
    }
}

/**
 * ��n�����
 */
function handleCalculate() {
    const priceInput = document.getElementById('price-input');
    if (!priceInput) return;
    
    const inputValue = getNormalizedInputValue('price-input');
    
    // e�$n<
    const validation = validatePriceRange(inputValue);
    if (!validation.isValid) {
        showError('input-error', validation.message);
        return;
    }
    
    // ��ǣ�K��
    setLoadingState(true);
    hideError('input-error');
    
    try {
        // ��L^�hWfqF	
        setTimeout(() => {
            performCalculation(parseToSafeNumber(inputValue));
        }, 100);
        
    } catch (error) {
        logError('��', error);
        showError('input-error', '�-k���LzW~W_');
        setLoadingState(false);
    }
}

/**
 * ��n��
 * @param {number} price - ��<
 */
function performCalculation(price) {
    try {
        // h����թ��n��L
        const results = calculateAllPlatforms(price);
        
        if (!results || !validateCalculationResults(results)) {
            throw new Error('�P�LcgY');
        }
        
        // P��UIkh:
        displayCalculationResults(results);
        
        // ��ǣ�KB�
        setLoadingState(false);
        
        // P��ꢒh:��������M	
        showElement('results-section');
        
        // P���~g�����
        scrollToResults();
        
    } catch (error) {
        logError('��', error);
        showError('input-error', '�k1WW~W_��JfWO`UD');
        setLoadingState(false);
    }
}

/**
 * �P��UIkh:
 * @param {Object} results - �P�
 */
function displayCalculationResults(results) {
    // ������
    setElementText('results-title', `${formatPrice(results.price)}�M	g��W_�nK֊M`);
    
    // note nP�h:
    displayNoteResults(results.note);
    
    // tips nP�h:
    displayTipsResults(results.tips);
    
    // Brain nP�h:
    displayBrainResults(results.brain);
    
    // ���� nP�h:
    displayCoconalaResults(results.coconala);
}

/**
 * noten�P��h:
 * @param {Object} noteResults - note n�P�
 */
function displayNoteResults(noteResults) {
    // �M��nh:
    setElementText('note-range', `${formatPrice(noteResults.minAmount)}^${formatPrice(noteResults.maxAmount)}`);
    
    // ����թ��)(�
    setElementText('note-platform-fee', formatFee(noteResults.platformFee));
    
    // z��nh:
    noteResults.paymentMethods.forEach(method => {
        const feeElementId = `note-${method.name}-fee`;
        const resultElementId = `note-${method.name}-result`;
        
        setElementText(feeElementId, formatFee(method.serviceFee));
        setElementText(resultElementId, formatPrice(method.finalNetAmount));
    });
}

/**
 * tipsn�P��h:
 * @param {Object} tipsResults - tips n�P�
 */
function displayTipsResults(tipsResults) {
    // K֊M�����	
    setElementText('tips-result', formatPrice(tipsResults.netAmount));
    
    // ����ĩ�Kp�
    setElementText('tips-content-fee', formatFee(tipsResults.contentFee));
}

/**
 * Brainn�P��h:
 * @param {Object} brainResults - Brain n�P�
 */
function displayBrainResults(brainResults) {
    // K֊M
    setElementText('brain-result', formatPrice(brainResults.netAmount));
    
    // ����ĩ�Kp�
    setElementText('brain-content-fee', formatFee(brainResults.contentFee));
}

/**
 * ����n�P��h:
 * @param {Object} coconalaResults - ���� n�P�
 */
function displayCoconalaResults(coconalaResults) {
    // K֊M
    setElementText('coconala-result', formatPrice(coconalaResults.netAmount));
    
    // ��Kp�
    setElementText('coconala-sales-fee', formatFee(coconalaResults.salesFee));
}

/**
 * ;��X�n�����
 */
function handleSaveImage() {
    const saveBtn = document.getElementById('save-image-btn');
    if (!saveBtn) return;
    
    // ܿ�!�
    saveBtn.disabled = true;
    saveBtn.textContent = '�X-...';
    
    try {
        // �(n�P��֗
        const currentResults = getCurrentCalculationResults();
        
        if (!currentResults) {
            throw new Error('�XY�P�LB�~[�');
        }
        
        // ;���X�
        if (typeof generateAndSaveImage === 'function') {
            generateAndSaveImage(currentResults);
        } else {
            throw new Error(';�_�L)(gM~[�');
        }
        
    } catch (error) {
        logError(';��X', error);
        alert(';�n�Xk1WW~W_��JfWO`UD');
    } finally {
        // ܿ�C
        setTimeout(() => {
            saveBtn.disabled = false;
            saveBtn.textContent = ';�hWf�X';
        }, 1000);
    }
}

/**
 * �(n�P��֗
 * @returns {Object|null} �P��ָ���
 */
function getCurrentCalculationResults() {
    const resultsSection = document.getElementById('results-section');
    
    if (!resultsSection || resultsSection.style.display === 'none') {
        return null;
    }
    
    // h:U�fD��<K�P�����
    const priceText = document.getElementById('results-title')?.textContent;
    if (!priceText) return null;
    
    // �<n��c�h��(	
    const priceMatch = priceText.match(/(\d{1,3}(?:,\d{3})*)�/);
    if (!priceMatch) return null;
    
    const price = parseToSafeNumber(priceMatch[1].replace(/,/g, ''));
    return calculateAllPlatforms(price);
}

/**
 * P���~g���������
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
 * �����ȵ��k�X_줢�ȿt
 */
function adjustLayoutForViewport() {
    const resultsContainer = document.querySelector('.results-container');
    if (!resultsContainer) return;
    
    const viewportWidth = window.innerWidth;
    
    // �Ф�$: 768px
    if (viewportWidth < 768) {
        resultsContainer.classList.add('mobile-layout');
    } else {
        resultsContainer.classList.remove('mobile-layout');
    }
}

/**
 * ����ɷ��ȫ��n-�
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl+Enter ~_o Cmd+Enter g��L
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            const calculateBtn = document.getElementById('calculate-btn');
            if (calculateBtn && !calculateBtn.disabled) {
                calculateBtn.click();
            }
        }
        
        // Ctrl+S ~_o Cmd+S g;��X
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const saveBtn = document.getElementById('save-image-btn');
            if (saveBtn && !saveBtn.disabled) {
                saveBtn.click();
            }
        }
        
        // Escape gP���Y
        if (e.key === 'Escape') {
            hideElement('results-section');
        }
    });
}

/**
 * ����nq 
 * @param {string} context - �����ƭ��
 * @param {Error} error - ����ָ���
 * @param {string} userMessage - ����Q�û��
 */
function handleError(context, error, userMessage = '���LzW~W_') {
    logError(context, error);
    showError('input-error', userMessage);
    setLoadingState(false);
}

// DOM����Bn
document.addEventListener('DOMContentLoaded', function() {
    safeDOM(() => {
        initializeApp();
        setupKeyboardShortcuts();
        adjustLayoutForViewport();
    });
});

// ����1Mn���P�LB�4	
window.addEventListener('beforeunload', function(e) {
    const resultsSection = document.getElementById('results-section');
    if (resultsSection && resultsSection.style.display !== 'none') {
        const message = '�P�L�XU�fD~[������~YK';
        e.preventDefault();
        e.returnValue = message;
        return message;
    }
});

// �����phWfl�
window.MainApp = {
    initializeApp,
    handleCalculate,
    handleSaveImage,
    displayCalculationResults,
    getCurrentCalculationResults,
    adjustLayoutForViewport
};