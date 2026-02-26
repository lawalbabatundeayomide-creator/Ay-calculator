/**
 * Calculator Logic Class
 * Handles state management and arithmetic operations
 */
class Calculator {
    constructor(previousOperandTextElement, currentOperandTextElement, historyListElement) {
        this.previousOperandTextElement = previousOperandTextElement;
        this.currentOperandTextElement = currentOperandTextElement;
        this.historyListElement = historyListElement;
        this.history = [];
        this.readyToReset = false; // Flag to reset display after hitting equals and typing new number
        this.clear();
    }

    clear() {
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
        this.readyToReset = false;
    }

    delete() {
        if (this.readyToReset) {
            this.currentOperand = '0';
            this.readyToReset = false;
            return;
        }
        if (this.currentOperand === '0') return;
        
        this.currentOperand = this.currentOperand.toString().slice(0, -1);
        if (this.currentOperand === '' || this.currentOperand === '-') {
            this.currentOperand = '0';
        }
    }

    appendNumber(number) {
        if (this.readyToReset) {
            this.currentOperand = '';
            this.readyToReset = false;
        }
        // Prevent multiple decimals
        if (number === '.' && this.currentOperand.includes('.')) return;
        // Prevent multiple leading zeros
        if (number === '0' && this.currentOperand === '0') return;
        // Replace initial 0 unless it's decimal
        if (this.currentOperand === '0' && number !== '.') {
            this.currentOperand = number.toString();
            return;
        }
        
        this.currentOperand = this.currentOperand.toString() + number.toString();
    }

    chooseOperation(operation) {
        if (this.currentOperand === '') return;
        if (this.previousOperand !== '') {
            this.compute();
        }
        this.operation = operation;
        this.previousOperand = this.currentOperand;
        this.currentOperand = '';
    }

    compute() {
        let computation;
        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);
        
        if (isNaN(prev) || isNaN(current)) return;

        switch (this.operation) {
            case '+':
                computation = prev + current;
                break;
            case '-':
                computation = prev - current;
                break;
            case '*':
                computation = prev * current;
                break;
            case '/':
                if (current === 0) {
                    showToast("Cannot divide by zero");
                    this.currentOperand = '0';
                    this.previousOperand = '';
                    this.operation = undefined;
                    return;
                }
                computation = prev / current;
                break;
            default:
                return;
        }

        // Handle floating point precision errors (basic fix)
        computation = Math.round(computation * 100000000) / 100000000;

        this.addToHistory(prev, this.operation, current, computation);
        
        this.currentOperand = computation;
        this.operation = undefined;
        this.previousOperand = '';
        this.readyToReset = true;
    }

    getDisplayNumber(number) {
        const stringNumber = number.toString();
        const integerDigits = parseFloat(stringNumber.split('.')[0]);
        const decimalDigits = stringNumber.split('.')[1];
        let integerDisplay;
        
        if (isNaN(integerDigits)) {
            integerDisplay = '';
        } else {
            integerDisplay = integerDigits.toLocaleString('en', { maximumFractionDigits: 0 });
        }
        
        if (decimalDigits != null) {
            return `${integerDisplay}.${decimalDigits}`;
        } else {
            return integerDisplay;
        }
    }

    updateDisplay() {
        this.currentOperandTextElement.innerText = this.getDisplayNumber(this.currentOperand);
        
        if (this.operation != null) {
            const opSymbol = this.operation === '*' ? '×' : (this.operation === '/' ? '÷' : this.operation);
            this.previousOperandTextElement.innerText = 
                `${this.getDisplayNumber(this.previousOperand)} ${opSymbol}`;
        } else {
            this.previousOperandTextElement.innerText = '';
        }
    }

    addToHistory(prev, op, curr, result) {
        const opSymbol = op === '*' ? '×' : (op === '/' ? '÷' : op);
        const entry = {
            expression: `${prev} ${opSymbol} ${curr}`,
            result: result
        };
        this.history.unshift(entry); // Add to beginning
        this.renderHistory();
    }

    renderHistory() {
        this.historyListElement.innerHTML = '';
        
        if (this.history.length === 0) {
            this.historyListElement.innerHTML = '<div class="empty-history">No history yet</div>';
            return;
        }

        this.history.forEach((item, index) => {
            const el = document.createElement('div');
            el.className = 'history-item';
            el.innerHTML = `
                <div class="history-expression">${item.expression} =</div>
                <div class="history-result">${item.result}</div>
            `;
            el.onclick = () => {
                this.currentOperand = item.result.toString();
                this.readyToReset = true;
                this.updateDisplay();
                showToast("Result recalled");
            };
            this.historyListElement.appendChild(el);
        });
    }

    clearHistory() {
        this.history = [];
        this.renderHistory();
        showToast("History cleared");
    }
}

// --- DOM Elements ---
const previousOperandTextElement = document.getElementById('previousOperand');
const currentOperandTextElement = document.getElementById('currentOperand');
const historyListElement = document.getElementById('historyList');
const historyToggleBtn = document.getElementById('historyToggleBtn');
const historyPanel = document.getElementById('historyPanel');
const themeToggle = document.getElementById('themeToggle');
const clearHistoryBtn = document.getElementById('clearHistory');
const toast = document.getElementById('toast');

// --- Initialization ---
const calculator = new Calculator(previousOperandTextElement, currentOperandTextElement, historyListElement);

// --- Event Listeners ---

// Click handling
document.querySelectorAll('button[data-action]').forEach(button => {
    button.addEventListener('click', () => {
        const action = button.dataset.action;
        const value = button.dataset.value;

        switch (action) {
            case 'number':
                calculator.appendNumber(value);
                calculator.updateDisplay();
                break;
            case 'operation':
                calculator.chooseOperation(value);
                calculator.updateDisplay();
                break;
            case 'compute':
                calculator.compute();
                calculator.updateDisplay();
                break;
            case 'clear':
                calculator.clear();
                calculator.updateDisplay();
                break;
            case 'delete':
                calculator.delete();
                calculator.updateDisplay();
                break;
        }
    });
});

// Keyboard support
document.addEventListener('keydown', (e) => {
    let key = e.key;
    
    // Map keyboard keys to calculator functions
    if (key >= '0' && key <= '9' || key === '.') {
        calculator.appendNumber(key);
    } else if (key === '+' || key === '-') {
        calculator.chooseOperation(key);
    } else if (key === '*') {
        calculator.chooseOperation('*');
    } else if (key === '/') {
        e.preventDefault(); // Prevent quick find in Firefox
        calculator.chooseOperation('/');
    } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        calculator.compute();
    } else if (key === 'Backspace') {
        calculator.delete();
    } else if (key === 'Escape') {
        calculator.clear();
    }

    calculator.updateDisplay();
    simulateButtonPress(key);
});

// Theme Toggle
let isDark = false;
themeToggle.addEventListener('click', () => {
    isDark = !isDark;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    themeToggle.innerHTML = isDark 
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>` // Moon icon
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`; // Sun icon
});

// History Toggle (Mobile)
historyToggleBtn.addEventListener('click', () => {
    historyPanel.classList.toggle('open');
});

// Clear History
clearHistoryBtn.addEventListener('click', () => {
    calculator.clearHistory();
});

// Toast Helper
let toastTimeout;
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// Visual Feedback Helper for Keyboard Presses
function simulateButtonPress(key) {
    let selector = '';
    if (key >= '0' && key <= '9') {
        selector = `button[data-value="${key}"]`;
    } else if (key === '.') {
        selector = `button[data-value="."]`;
    } else if (key === '+' || key === '-') {
        selector = `button[data-value="${key}"]`;
    } else if (key === '*') {
        selector = `button[data-value="*"]`;
    } else if (key === '/') {
        selector = `button[data-value="/"]`;
    } else if (key === 'Enter' || key === '=') {
        selector = `button[data-action="compute"]`;
    } else if (key === 'Backspace') {
        selector = `button[data-action="delete"]`;
    } else if (key === 'Escape') {
        selector = `button[data-action="clear"]`;
    }

    const btn = document.querySelector(selector);
    if (btn) {
        btn.style.transform = 'translateY(1px)';
        btn.style.backgroundColor = 'var(--btn-active)';
        setTimeout(() => {
            btn.style.transform = '';
            btn.style.backgroundColor = '';
        }, 100);
    }
}