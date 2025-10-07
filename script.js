// Global Variables
let words = [];
let currentWordIndex = 0;
let gameWords = []; // Shuffled words for current game session
let gameState = 'stopped'; // stopped, playing, paused
let stats = {
    totalQuestions: 0,
    correctAnswers: 0,
    wrongAnswers: 0
};

// DOM Elements
const addWordSection = document.getElementById('addWordSection');
const gamePlaySection = document.getElementById('gamePlaySection');
const englishWordInput = document.getElementById('englishWord');
const turkishMeaningInput = document.getElementById('turkishMeaning');
const addWordBtn = document.getElementById('addWordBtn');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const unpauseBtn = document.getElementById('unpauseBtn');
const stopBtn = document.getElementById('stopBtn');
const questionText = document.getElementById('questionText');
const answerInput = document.getElementById('answerInput');
const checkAnswerBtn = document.getElementById('checkAnswerBtn');
const feedback = document.getElementById('feedback');
const feedbackContent = document.getElementById('feedbackContent');
const progressFill = document.getElementById('progressFill');
const wordList = document.getElementById('wordList');
const wordCount = document.getElementById('wordCount');
const answerList = document.getElementById('answerList');
const liveCorrect = document.getElementById('liveCorrect');
const liveWrong = document.getElementById('liveWrong');
const toggleWordListBtn = document.getElementById('toggleWordListBtn');
const toggleText = document.getElementById('toggleText');
const wordListContainer = document.getElementById('wordListContainer');
const themeToggle = document.getElementById('themeToggle');

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    updateStats();
    renderWordList();
    setupEventListeners();
    updateGameControls();
    initializeTheme();
});

// Event Listeners
function setupEventListeners() {
    addWordBtn.addEventListener('click', addWord);
    playBtn.addEventListener('click', startGame);
    stopBtn.addEventListener('click', stopGame);
    checkAnswerBtn.addEventListener('click', checkAnswer);
    
    // Toggle word list
    toggleWordListBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleWordList();
    });
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Enter key support
    englishWordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            turkishMeaningInput.focus();
        }
    });
    
    turkishMeaningInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addWord();
        }
    });
    
    answerInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !checkAnswerBtn.disabled) {
            checkAnswer();
        }
    });
}

function toggleWordList() {
    const isCollapsed = wordListContainer.classList.toggle('collapsed');
    
    if (isCollapsed) {
        toggleText.textContent = 'Göster';
        toggleWordListBtn.querySelector('i').className = 'fas fa-eye';
    } else {
        toggleText.textContent = 'Gizle';
        toggleWordListBtn.querySelector('i').className = 'fas fa-eye-slash';
    }
}

// Theme Management
function initializeTheme() {
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        document.body.classList.add('dark-mode');
        updateThemeIcon(true);
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            if (e.matches) {
                document.body.classList.add('dark-mode');
                updateThemeIcon(true);
            } else {
                document.body.classList.remove('dark-mode');
                updateThemeIcon(false);
            }
        }
    });
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcon(isDark);
    
    // Add rotation animation
    themeToggle.style.transform = 'rotate(360deg)';
    setTimeout(() => {
        themeToggle.style.transform = '';
    }, 300);
}

function updateThemeIcon(isDark) {
    const icon = themeToggle.querySelector('i');
    if (isDark) {
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }
}

// Local Storage Functions
function saveData() {
    localStorage.setItem('englishWords', JSON.stringify(words));
    localStorage.setItem('gameStats', JSON.stringify(stats));
}

function loadData() {
    const savedWords = localStorage.getItem('englishWords');
    const savedStats = localStorage.getItem('gameStats');
    
    if (savedWords) {
        words = JSON.parse(savedWords);
    }
    
    if (savedStats) {
        stats = JSON.parse(savedStats);
    }
}

// Word Management
function addWord() {
    const english = englishWordInput.value.trim();
    const turkish = turkishMeaningInput.value.trim();
    
    if (!english || !turkish) {
        showNotification('Lütfen hem İngilizce hem de Türkçe anlamı girin!', 'error');
        return;
    }
    
    // Check if word already exists
    if (words.some(word => word.english.toLowerCase() === english.toLowerCase())) {
        showNotification('Bu kelime zaten mevcut!', 'warning');
        return;
    }
    
    const newWord = {
        id: Date.now(),
        english: english,
        turkish: turkish,
        createdAt: new Date().toISOString()
    };
    
    words.push(newWord);
    saveData();
    updateStats();
    renderWordList();
    updateGameControls();
    
    // Clear inputs
    englishWordInput.value = '';
    turkishMeaningInput.value = '';
    englishWordInput.focus();
    
    // Show success animation
    addWordBtn.innerHTML = '<i class="fas fa-check"></i> Eklendi!';
    addWordBtn.style.background = 'linear-gradient(135deg, #48bb78, #38a169)';
    
    setTimeout(() => {
        addWordBtn.innerHTML = '<i class="fas fa-plus"></i> Kelime Ekle';
        addWordBtn.style.background = '';
    }, 1500);
    
    showNotification('Kelime başarıyla eklendi!', 'success');
}

function deleteWord(id) {
    if (confirm('Bu kelimeyi silmek istediğinizden emin misiniz?')) {
        words = words.filter(word => word.id !== id);
        saveData();
        updateStats();
        renderWordList();
        updateGameControls();
        showNotification('Kelime silindi!', 'info');
    }
}

// Game Functions
function startGame() {
    if (words.length === 0) {
        showNotification('Oyunu başlatmak için en az bir kelime eklemelisiniz!', 'warning');
        return;
    }
    
    gameState = 'playing';
    currentWordIndex = 0;
    stats.totalQuestions = 0;
    stats.correctAnswers = 0;
    stats.wrongAnswers = 0;
    
    // Clear answer history
    answerList.innerHTML = '';
    liveCorrect.textContent = '0';
    liveWrong.textContent = '0';
    
    // Create shuffled array of words for this game session
    gameWords = [...words].sort(() => Math.random() - 0.5);
    
    updateGameControls();
    showGamePlaySection();
    showNextQuestion();
}

function stopGame() {
    gameState = 'stopped';
    updateGameControls();
    hideGamePlaySection();
    
    const accuracy = stats.totalQuestions > 0 ? 
        Math.round((stats.correctAnswers / stats.totalQuestions) * 100) : 0;
    
    showNotification(
        `Oyun bitti! Toplam: ${stats.totalQuestions} soru, Doğru: ${stats.correctAnswers}, Yanlış: ${stats.wrongAnswers}, Başarı: %${accuracy}`,
        'info'
    );
}

function showNextQuestion() {
    if (gameState !== 'playing') return;
    
    if (gameWords.length === 0) {
        stopGame();
        return;
    }
    
    // Pick a random word (infinite loop - never ends)
    const randomIndex = Math.floor(Math.random() * words.length);
    const currentWord = words[randomIndex];
    
    // Show game play section
    showGamePlaySection();
    
    questionText.textContent = currentWord.english;
    answerInput.value = '';
    answerInput.disabled = false;
    checkAnswerBtn.disabled = false;
    answerInput.focus();
    
    // Hide feedback
    feedbackContent.classList.remove('show', 'correct', 'wrong');
}

function checkAnswer() {
    if (gameState !== 'playing') return;
    
    const userAnswer = answerInput.value.trim().toLowerCase();
    const currentEnglish = questionText.textContent;
    
    // Find the word
    const currentWord = words.find(w => w.english === currentEnglish);
    if (!currentWord) return;
    
    const correctAnswers = currentWord.turkish.toLowerCase().split(',').map(a => a.trim());
    
    const isCorrect = correctAnswers.some(answer => 
        userAnswer.includes(answer) || answer.includes(userAnswer)
    );
    
    stats.totalQuestions++;
    
    if (isCorrect) {
        stats.correctAnswers++;
        showFeedback('Doğru! 🎉', 'correct');
        addAnswerToHistory(currentWord, true);
    } else {
        stats.wrongAnswers++;
        showFeedback(`Yanlış! Doğru cevap: ${currentWord.turkish}`, 'wrong');
        addAnswerToHistory(currentWord, false);
    }
    
    updateLiveStats();
    
    // Disable input and button
    answerInput.disabled = true;
    checkAnswerBtn.disabled = true;
    
    // Move to next question after 1 second
    setTimeout(() => {
        showNextQuestion();
    }, 1000);
}

function addAnswerToHistory(word, isCorrect) {
    const answerItem = document.createElement('div');
    answerItem.className = `answer-item ${isCorrect ? 'correct' : 'wrong'}`;
    answerItem.innerHTML = `
        <i class="fas fa-${isCorrect ? 'check-circle' : 'times-circle'}"></i>
        <div class="answer-item-content">
            <div class="answer-item-word">${word.english}</div>
            <div class="answer-item-meaning">${word.turkish}</div>
        </div>
    `;
    
    // Add to top of list
    answerList.insertBefore(answerItem, answerList.firstChild);
}

function updateLiveStats() {
    liveCorrect.textContent = stats.correctAnswers;
    liveWrong.textContent = stats.wrongAnswers;
}

function showFeedback(message, type) {
    feedbackContent.textContent = message;
    feedbackContent.className = `feedback-content ${type} show`;
    
    // Add shake animation for wrong answers
    if (type === 'wrong') {
        feedbackContent.classList.add('shake');
        setTimeout(() => {
            feedbackContent.classList.remove('shake');
        }, 500);
    }
}

// UI Functions
function updateGameControls() {
    const isPlaying = gameState === 'playing';
    const isStopped = gameState === 'stopped';
    
    playBtn.disabled = !isStopped || words.length === 0;
    stopBtn.disabled = isStopped;
}

function showGamePlaySection() {
    gamePlaySection.style.display = 'block';
    gamePlaySection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideGamePlaySection() {
    gamePlaySection.style.display = 'none';
    questionText.textContent = 'Oyunu başlatmak için yukarıdaki "Başlat" butonuna tıklayın';
    answerInput.value = '';
    answerInput.disabled = true;
    checkAnswerBtn.disabled = true;
    feedbackContent.classList.remove('show', 'correct', 'wrong');
}

function updateStats() {
    wordCount.textContent = words.length;
}

function renderWordList() {
    if (words.length === 0) {
        wordList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Henüz kelime eklenmemiş. İlk kelimenizi ekleyin!</p>
            </div>
        `;
        return;
    }
    
    wordList.innerHTML = words.map(word => `
        <div class="word-item" data-id="${word.id}">
            <div class="word-item-header">
                <div class="word-english">${word.english}</div>
                <button class="delete-btn" onclick="deleteWord(${word.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="word-turkish">${word.turkish}</div>
        </div>
    `).join('');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 15px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
        transform: translateX(400px);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function getNotificationColor(type) {
    const colors = {
        success: 'linear-gradient(135deg, #48bb78, #38a169)',
        error: 'linear-gradient(135deg, #f56565, #e53e3e)',
        warning: 'linear-gradient(135deg, #ed8936, #dd6b20)',
        info: 'linear-gradient(135deg, #4299e1, #3182ce)'
    };
    return colors[type] || colors.info;
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        e.preventDefault();
        if (gameState === 'playing') {
            stopGame();
        }
    }
});

// Auto-save functionality
setInterval(() => {
    if (words.length > 0) {
        saveData();
    }
}, 30000); // Save every 30 seconds
