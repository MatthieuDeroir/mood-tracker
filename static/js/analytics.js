// Variables d'état
let chartInstance = null;
let currentPeriod = 'week';
let moodData = [];

// Émojis pour les moods
const moodEmojis = {
    0: '😭', 1: '😢', 2: '😞', 3: '😕', 4: '😐',
    5: '😐', 6: '🙂', 7: '😊', 8: '😄', 9: '😁', 10: '🤩'
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initPeriodSelector();
    loadStats();
    loadTimelineData();
});

// Initialiser les sélecteurs de période
function initPeriodSelector() {
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.period-btn.active').classList.remove('active');
            btn.classList.add('active');
            currentPeriod = btn.dataset.period;
            loadTimelineData();
        });
    });
}

// Charger les statistiques générales
async function loadStats() {
    try {
        const response = await fetch('/api/analytics?days=30');
        const stats = await response.json();

        document.getElementById('overallAvg').textContent = `${stats.average}/10`;
        document.getElementById('totalCount').textContent = stats.count;
        document.getElementById('bestMood').textContent = `${stats.max}/10 ${moodEmojis[stats.max]}`;
        document.getElementById('worstMood').textContent = `${stats.min}/10 ${moodEmojis[stats.min]}`;

        analyzeTrends(stats.trends);
    } catch (error) {
        console.error('Erreur chargement stats:', error);
    }
}

// Charger les données de timeline pour le graphique
async function loadTimelineData() {
    try {
        // Calculer les dates pour la période
        const endDate = new Date();
        let startDate = new Date();

        switch (currentPeriod) {
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
        }

        const response = await fetch(
            `/api/timeline?period=${currentPeriod}&start=${startDate.toISOString()}&end=${endDate.toISOString()}`
        );

        moodData = await response.json();
        updateChart();
    } catch (error) {
        console.error('Erreur chargement timeline:', error);
    }
}

// Mettre à jour le graphique
function updateChart() {
    const ctx = document.getElementById('moodChart').getContext('2d');

    // Détruire le graphique existant s'il y en a un
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Préparation des données
    const labels = moodData.map(d => {
        const date = new Date(d.date);
        if (currentPeriod === 'day') {
            return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        } else if (currentPeriod === 'week') {
            return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
        } else {
            return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        }
    });

    const moodValues = moodData.map(d => d.averageMood);
    const countValues = moodData.map(d => d.entryCount);

    // Créer le graphique
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Humeur moyenne',
                    data: moodValues,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y',
                },
                {
                    label: 'Nombre d\'entrées',
                    data: countValues,
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1',
                    borderDash: [5, 5],
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    title: {
                        display: true,
                        text: 'Humeur (0-10)'
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Nombre d\'entrées'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            },
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            }
        }
    });
}

// Analyser les tendances et patterns
function analyzeTrends(trends) {
    if (!trends) return;

    const patternsList = document.getElementById('patternsList');
    patternsList.innerHTML = '';

    // Analyser les tendances par heure
    if (trends.byHour && trends.byHour.length > 0) {
        const bestHour = [...trends.byHour].sort((a, b) => b.avgMood - a.avgMood)[0];
        const worstHour = [...trends.byHour].sort((a, b) => a.avgMood - b.avgMood)[0];

        if (bestHour && worstHour) {
            patternsList.innerHTML += `
        <div class="pattern-item">
          <h3>🕒 Tendances horaires</h3>
          <p>Votre meilleure humeur est généralement à <strong>${bestHour.hour}h</strong> (${bestHour.avgMood.toFixed(1)}/10).</p>
          <p>Votre humeur est moins bonne à <strong>${worstHour.hour}h</strong> (${worstHour.avgMood.toFixed(1)}/10).</p>
        </div>
      `;
        }
    }

    // Analyser les tendances par jour de la semaine
    if (trends.byDayOfWeek && trends.byDayOfWeek.length > 0) {
        const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const bestDay = [...trends.byDayOfWeek].sort((a, b) => b.avgMood - a.avgMood)[0];
        const worstDay = [...trends.byDayOfWeek].sort((a, b) => a.avgMood - b.avgMood)[0];

        if (bestDay && worstDay) {
            patternsList.innerHTML += `
        <div class="pattern-item">
          <h3>📅 Tendances hebdomadaires</h3>
          <p>Votre meilleure journée est généralement le <strong>${daysOfWeek[bestDay.dayOfWeek]}</strong> (${bestDay.avgMood.toFixed(1)}/10).</p>
          <p>Votre journée la moins bonne est le <strong>${daysOfWeek[worstDay.dayOfWeek]}</strong> (${worstDay.avgMood.toFixed(1)}/10).</p>
        </div>
      `;
        }
    }

    // Si aucune tendance n'est détectée
    if (patternsList.innerHTML === '') {
        patternsList.innerHTML = '<p>Pas assez de données pour détecter des tendances significatives.</p>';
    }
}