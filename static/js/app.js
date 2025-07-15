// État global simple
let currentMood = 5;
let selectedTags = [];
let todayMoods = [];

// Émojis pour les moods
const moodEmojis = {
    0: '😭', 1: '😢', 2: '😞', 3: '😕', 4: '😐',
    5: '😐', 6: '🙂', 7: '😊', 8: '😄', 9: '😁', 10: '🤩'
};

const moodTexts = {
    0: 'Terrible', 1: 'Très mal', 2: 'Mal', 3: 'Pas bien', 4: 'Faible',
    5: 'Neutre', 6: 'Correct', 7: 'Bien', 8: 'Très bien', 9: 'Super', 10: 'Incroyable'
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initMoodSlider();
    initTags();
    initSaveButton();
    loadTodayMoods();
});

function initMoodSlider() {
    const slider = document.getElementById('moodRange');
    const emoji = document.getElementById('moodEmoji');
    const text = document.getElementById('moodText');
    const value = document.getElementById('moodValue');

    slider.addEventListener('input', (e) => {
        currentMood = parseInt(e.target.value);
        emoji.textContent = moodEmojis[currentMood];
        text.textContent = moodTexts[currentMood];
        value.textContent = `${currentMood}/10`;
    });
}

function initTags() {
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const tagValue = tag.dataset.tag;
            if (selectedTags.includes(tagValue)) {
                selectedTags = selectedTags.filter(t => t !== tagValue);
                tag.classList.remove('selected');
            } else {
                selectedTags.push(tagValue);
                tag.classList.add('selected');
            }
        });
    });
}

function initSaveButton() {
    document.getElementById('saveMood').addEventListener('click', saveMood);
}

async function saveMood() {
    const note = document.getElementById('moodNote').value;
    const sleepHours = parseFloat(document.getElementById('sleepHours').value) || null;
    const medication = parseFloat(document.getElementById('medication').value) || null;
    const emotions = document.getElementById('emotions').value;

    try {
        const response = await fetch('/api/moods', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mood: currentMood,
                note: note,
                tags: selectedTags,
                sleepHours: sleepHours,
                medication: medication,
                emotions: emotions
            })
        });

        if (response.ok) {
            // Reset form
            document.getElementById('moodNote').value = '';
            document.getElementById('sleepHours').value = '';
            document.getElementById('medication').value = '';
            document.getElementById('emotions').value = '';
            selectedTags = [];
            document.querySelectorAll('.tag').forEach(tag => tag.classList.remove('selected'));

            // Reload today's moods
            loadTodayMoods();

            showNotification('Mood sauvegardé !');
        }
    } catch (error) {
        showNotification('Erreur lors de la sauvegarde', 'error');
    }
}

async function loadTodayMoods() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`/api/moods?start=${today}`);
        const moods = await response.json();

        todayMoods = moods;
        displayMoodsList(moods);
        updateQuickStats(moods);
    } catch (error) {
        console.error('Erreur chargement moods:', error);
    }
}

function displayMoodsList(moods) {
    const list = document.getElementById('moodsList');

    if (moods.length === 0) {
        list.innerHTML = '<p class="no-moods">Aucun mood enregistré aujourd\'hui</p>';
        return;
    }

    list.innerHTML = moods.map(mood => {
        // Formatage pour afficher ou non les informations de sommeil
        const sleepInfo = mood.sleepHours
            ? `<div class="mood-sleep">💤 ${mood.sleepHours}h de sommeil</div>`
            : '';

        const medicationInfo = mood.medication
            ? `<div class="mood-medication">💊 Médicament: ${mood.medication}</div>`
            : '';

        const emotionsInfo = mood.emotions
            ? `<div class="mood-emotions">🔍 Émotions: ${mood.emotions}</div>`
            : '';

        return `
        <div class="mood-entry">
          <div class="mood-time">${new Date(mood.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
          <div class="mood-score">${moodEmojis[mood.mood]} ${mood.mood}/10</div>
          <div class="mood-note">${mood.note || ''}</div>
          ${sleepInfo}
          ${medicationInfo}
          ${emotionsInfo}
          <div class="mood-tags">${mood.tags.map(tag => `<span class="tag-small">${tag}</span>`).join('')}</div>
        </div>
      `;
    }).join('');
}

function updateQuickStats(moods) {
    const avgElement = document.getElementById('todayAvg');
    const countElement = document.getElementById('todayCount');
    const sleepElement = document.getElementById('todaySleep');

    if (moods.length === 0) {
        avgElement.textContent = '-';
        countElement.textContent = '0';
        sleepElement.textContent = '-';
        return;
    }

    const avg = moods.reduce((sum, mood) => sum + mood.mood, 0) / moods.length;
    avgElement.textContent = `${avg.toFixed(1)}/10`;
    countElement.textContent = moods.length.toString();

    // Calcul de la moyenne de sommeil
    const moodsWithSleep = moods.filter(mood => mood.sleepHours !== null);
    if (moodsWithSleep.length > 0) {
        const sleepAvg = moodsWithSleep.reduce((sum, mood) => sum + mood.sleepHours, 0) / moodsWithSleep.length;
        sleepElement.textContent = `${sleepAvg.toFixed(1)}h`;
    } else {
        sleepElement.textContent = '-';
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}