// static/js/analytics.js - Version corrigée

// Variables d'état
let chartInstance = null;
let sleepChartInstance = null;
let currentPeriod = 'week';
let moodData = [];

// Variables pour le tableau d'entrées
let allEntries = [];
let currentPage = 1;
let entriesPerPage = 10;
let filteredEntries = [];

// Émojis pour les moods
const moodEmojis = {
    0: '😭', 1: '😢', 2: '😞', 3: '😕', 4: '😐',
    5: '😐', 6: '🙂', 7: '😊', 8: '😄', 9: '😁', 10: '🤩'
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initialisation de la page Analytics');
    initPeriodSelector();
    loadStats();
    loadTimelineData();
    initEntriesTable();
});

// Initialiser les sélecteurs de période
function initPeriodSelector() {
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const activeBtn = document.querySelector('.period-btn.active');
            if (activeBtn) activeBtn.classList.remove('active');
            btn.classList.add('active');
            currentPeriod = btn.dataset.period;
            loadTimelineData();
        });
    });
}

// Initialiser le tableau d'entrées
function initEntriesTable() {
    // Initialiser le toggle du tableau
    const toggleBtn = document.getElementById('toggleEntriesBtn');
    const tableContainer = document.getElementById('entriesTableContainer');

    if (toggleBtn && tableContainer) {
        toggleBtn.addEventListener('click', () => {
            tableContainer.classList.toggle('hidden');
            toggleBtn.classList.toggle('active');
            const arrowIcon = toggleBtn.querySelector('.arrow-icon');
            if (arrowIcon) {
                arrowIcon.style.transform = tableContainer.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
            }

            // Charger les entrées la première fois que le tableau est affiché
            if (!tableContainer.classList.contains('hidden') && allEntries.length === 0) {
                loadAllEntries();
            }
        });
    }

    // Initialiser les contrôles de pagination
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');

    if (prevPageBtn && nextPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderEntriesTable();
            }
        });

        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderEntriesTable();
            }
        });
    }

    // Initialiser le filtre
    const filterInput = document.getElementById('entriesFilter');
    if (filterInput) {
        filterInput.addEventListener('input', () => {
            filterEntries(filterInput.value);
        });
    }

    // Initialiser le tri
    const sortSelect = document.getElementById('entriesSortBy');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            sortEntries(sortSelect.value);
        });
    }
}

// Charger les statistiques générales
async function loadStats() {
    try {
        console.log('Chargement des statistiques...');
        const response = await fetch('/api/analytics?days=30');

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const stats = await response.json();
        console.log('Statistiques reçues:', stats);

        // Mettre à jour les éléments du DOM avec gestion des erreurs
        const overallAvg = document.getElementById('overallAvg');
        if (overallAvg) {
            overallAvg.textContent = stats.average !== undefined ? `${stats.average}/10` : '0/10';
        }

        const totalCount = document.getElementById('totalCount');
        if (totalCount) {
            totalCount.textContent = stats.count !== undefined ? stats.count : '0';
        }

        const bestMood = document.getElementById('bestMood');
        if (bestMood) {
            const maxMood = stats.max !== undefined ? stats.max : 0;
            bestMood.textContent = `${maxMood}/10 ${moodEmojis[maxMood] || ''}`;
        }

        const worstMood = document.getElementById('worstMood');
        if (worstMood) {
            const minMood = stats.min !== undefined ? stats.min : 0;
            worstMood.textContent = `${minMood}/10 ${moodEmojis[minMood] || ''}`;
        }

        // Analyser les tendances s'il y en a
        if (stats.trends) {
            analyzeTrends(stats.trends);
        } else {
            console.warn('Aucune tendance disponible dans les statistiques');
            const patternsList = document.getElementById('patternsList');
            if (patternsList) {
                patternsList.innerHTML = '<p>Pas assez de données pour détecter des tendances significatives.</p>';
            }
        }
    } catch (error) {
        console.error('Erreur chargement stats:', error);
        // Afficher un message d'erreur dans l'UI
        showError('Erreur lors du chargement des statistiques. Veuillez réessayer plus tard.');
    }
}

// Afficher un message d'erreur
function showError(message) {
    // Créer une notification d'erreur
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.textContent = message;

    // Ajouter la notification au DOM
    document.body.appendChild(notification);

    // La supprimer après 5 secondes
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Charger les données de timeline pour le graphique
async function loadTimelineData() {
    try {
        console.log('Chargement des données timeline...');
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

        console.log(`Période: ${currentPeriod}, du ${startDate.toISOString()} au ${endDate.toISOString()}`);

        const response = await fetch(
            `/api/timeline?period=${currentPeriod}&start=${startDate.toISOString()}&end=${endDate.toISOString()}`
        );

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        moodData = await response.json();
        console.log(`Données timeline chargées: ${moodData.length} périodes avec données`);

        if (moodData.length === 0) {
            console.warn('Aucune donnée disponible pour la période sélectionnée');
        }

        updateChart();
        updateSleepChart();

        // Analyser la corrélation entre le sommeil et l'humeur
        displaySleepMoodCorrelation();
    } catch (error) {
        console.error('Erreur chargement timeline:', error);
        showError('Erreur lors du chargement des données de graphique. Veuillez réessayer plus tard.');

        // Réinitialiser les graphiques avec des données vides
        moodData = [];
        updateChart();
        updateSleepChart();
    }
}

// Mettre à jour le graphique principal
function updateChart() {
    const chartContainer = document.querySelector('.chart-container');
    if (!chartContainer) {
        console.error('Conteneur de graphique non trouvé');
        return;
    }

    const canvas = document.getElementById('moodChart');
    if (!canvas) {
        console.error('Canvas moodChart non trouvé');
        return;
    }

    const ctx = canvas.getContext('2d');

    // Détruire le graphique existant s'il y en a un
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Si aucune donnée, afficher un message
    if (!moodData || moodData.length === 0) {
        console.warn('Pas de données pour le graphique');
        canvas.style.display = 'none';

        let noDataMsg = chartContainer.querySelector('.no-data-message');
        if (!noDataMsg) {
            noDataMsg = document.createElement('p');
            noDataMsg.className = 'no-data-message';
            noDataMsg.textContent = 'Pas de données disponibles pour cette période.';
            chartContainer.appendChild(noDataMsg);
        }
        return;
    }

    // Masquer tout message d'absence de données
    canvas.style.display = 'block';
    const noDataMsg = chartContainer.querySelector('.no-data-message');
    if (noDataMsg) noDataMsg.remove();

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

    const moodValues = moodData.map(d => {
        const avg = parseFloat(d.averageMood);
        return isNaN(avg) ? 0 : avg;
    });

    const countValues = moodData.map(d => {
        const count = parseInt(d.entryCount);
        return isNaN(count) ? 0 : count;
    });

    // Créer le graphique
    try {
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
    } catch (error) {
        console.error('Erreur lors de la création du graphique:', error);
        showError('Erreur lors de la création du graphique.');
    }
}

// Mettre à jour le graphique pour les heures de sommeil
function updateSleepChart() {
    const container = document.getElementById('sleepChartContainer');
    if (!container) {
        console.error('Conteneur sleepChartContainer non trouvé');
        return;
    }

    const canvas = document.getElementById('sleepChart');
    if (!canvas) {
        console.error('Canvas sleepChart non trouvé');
        return;
    }

    const ctx = canvas.getContext('2d');

    // Détruire le graphique existant s'il y en a un
    if (sleepChartInstance) {
        sleepChartInstance.destroy();
    }

    // Obtenir toutes les entrées des périodes
    const allEntries = [];
    try {
        moodData.forEach(period => {
            if (period.entries && Array.isArray(period.entries)) {
                allEntries.push(...period.entries);
            }
        });
    } catch (error) {
        console.error('Erreur lors de l\'extraction des entrées:', error);
    }

    console.log(`Total des entrées pour le graphique de sommeil: ${allEntries.length}`);

    // Filtrer les données qui ont des informations de sommeil
    const entriesWithSleep = allEntries.filter(entry =>
        entry && entry.sleepHours !== null && entry.sleepHours !== undefined
    );

    if (entriesWithSleep.length < 3) {
        console.warn('Pas assez de données de sommeil');
        canvas.style.display = 'none';
        let noDataMsg = container.querySelector('.no-data-message');
        if (!noDataMsg) {
            noDataMsg = document.createElement('p');
            noDataMsg.className = 'no-data-message';
            noDataMsg.textContent = 'Pas assez de données de sommeil disponibles pour cette période.';
            container.insertBefore(noDataMsg, container.querySelector('#sleepMoodCorrelation') || null);
        }
        return;
    }

    // Masquer tout message d'absence de données
    canvas.style.display = 'block';
    const noDataMsg = container.querySelector('.no-data-message');
    if (noDataMsg) noDataMsg.remove();

    // Regrouper les entrées par jour
    const entriesByDay = {};
    entriesWithSleep.forEach(entry => {
        try {
            const date = new Date(entry.timestamp);
            const dateStr = date.toISOString().split('T')[0];

            if (!entriesByDay[dateStr]) {
                entriesByDay[dateStr] = [];
            }

            entriesByDay[dateStr].push(entry);
        } catch (error) {
            console.error('Erreur lors du traitement d\'une entrée de sommeil:', error);
        }
    });

    // Calculer les moyennes par jour
    const labels = [];
    const sleepValues = [];
    const moodValues = [];

    Object.entries(entriesByDay).sort().forEach(([dateStr, entries]) => {
        try {
            const date = new Date(dateStr);
            labels.push(date.toLocaleDateString('fr-FR', {
                weekday: currentPeriod === 'week' ? 'short' : undefined,
                day: 'numeric',
                month: currentPeriod === 'year' ? 'short' : undefined
            }));

            // Calculer la moyenne de sommeil
            const totalSleep = entries.reduce((sum, entry) =>
                sum + (parseFloat(entry.sleepHours) || 0), 0);
            const avgSleep = entries.length > 0 ? totalSleep / entries.length : 0;
            sleepValues.push(avgSleep);

            // Calculer la moyenne d'humeur
            const totalMood = entries.reduce((sum, entry) => sum + (parseInt(entry.mood) || 0), 0);
            const avgMood = entries.length > 0 ? totalMood / entries.length : 0;
            moodValues.push(avgMood);
        } catch (error) {
            console.error('Erreur lors du calcul des moyennes:', error);
        }
    });

    // Créer le graphique
    try {
        sleepChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Heures de sommeil',
                        data: sleepValues,
                        borderColor: '#9b59b6',
                        backgroundColor: 'rgba(155, 89, 182, 0.1)',
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y',
                    },
                    {
                        label: 'Humeur moyenne',
                        data: moodValues,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        tension: 0.4,
                        fill: false,
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
                        title: {
                            display: true,
                            text: 'Heures de sommeil'
                        }
                    },
                    y1: {
                        beginAtZero: true,
                        max: 10,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Humeur (0-10)'
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
    } catch (error) {
        console.error('Erreur lors de la création du graphique de sommeil:', error);
        showError('Erreur lors de la création du graphique de sommeil.');
    }
}

// Afficher l'analyse de corrélation sommeil/humeur
function displaySleepMoodCorrelation() {
    const correlationDiv = document.getElementById('sleepMoodCorrelation');
    if (!correlationDiv) return;

    // Préparer les données pour l'analyse
    const allEntries = [];
    try {
        moodData.forEach(period => {
            if (period.entries && Array.isArray(period.entries)) {
                allEntries.push(...period.entries);
            }
        });
    } catch (error) {
        console.error('Erreur lors de l\'extraction des entrées pour la corrélation:', error);
    }

    // Filtrer pour garder seulement les entrées avec des données de sommeil
    const entriesWithSleep = allEntries.filter(entry =>
        entry && entry.sleepHours !== null && entry.sleepHours !== undefined &&
        entry.mood !== null && entry.mood !== undefined
    );

    if (entriesWithSleep.length < 3) {
        correlationDiv.innerHTML = `
            <div class="info-message">
                <p>Pas assez de données pour analyser la corrélation entre le sommeil et l'humeur.</p>
                <p>Ajoutez plus d'entrées avec des heures de sommeil pour voir cette analyse.</p>
            </div>
        `;
        return;
    }

    try {
        const analysis = analyzeSleepMoodCorrelation(entriesWithSleep);

        let correlationClass = 'neutral';
        if (analysis.correlation > 0.3) correlationClass = 'positive';
        if (analysis.correlation < -0.3) correlationClass = 'negative';

        correlationDiv.innerHTML = `
            <div class="correlation ${correlationClass}">
                <h3>Corrélation Sommeil-Humeur: ${analysis.correlation}</h3>
                <p>${analysis.message}</p>
                <div class="sleep-recommendation">
                    <strong>Suggestion:</strong> 
                    ${analysis.correlation > 0.3
            ? 'Essayez de maintenir un rythme de sommeil régulier pour améliorer votre humeur.'
            : 'Continuez à suivre votre sommeil pour obtenir des analyses plus précises.'}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Erreur lors de l\'analyse de corrélation sommeil-humeur:', error);
        correlationDiv.innerHTML = `
            <div class="info-message">
                <p>Erreur lors de l'analyse de la corrélation entre le sommeil et l'humeur.</p>
                <p>Veuillez réessayer plus tard.</p>
            </div>
        `;
    }
}

// Ajouter la visualisation de la corrélation sommeil/humeur
function analyzeSleepMoodCorrelation(data) {
    // Vérifier les données en entrée
    if (!data || !Array.isArray(data) || data.length < 3) {
        return {
            correlation: 0,
            message: "Pas assez de données pour analyser la corrélation sommeil/humeur"
        };
    }

    // Filtrer les données qui ont à la fois une humeur et des heures de sommeil
    const dataWithSleep = data.filter(entry =>
        entry &&
        typeof entry.sleepHours === 'number' && !isNaN(entry.sleepHours) &&
        typeof entry.mood === 'number' && !isNaN(entry.mood)
    );

    if (dataWithSleep.length < 3) {
        return {
            correlation: 0,
            message: "Pas assez de données valides pour analyser la corrélation sommeil/humeur"
        };
    }

    // Calculer la corrélation (simplifiée)
    let sumSleep = 0;
    let sumMood = 0;
    let sumSleepMood = 0;
    let sumSleepSquared = 0;
    let sumMoodSquared = 0;

    dataWithSleep.forEach(entry => {
        sumSleep += entry.sleepHours;
        sumMood += entry.mood;
        sumSleepMood += entry.sleepHours * entry.mood;
        sumSleepSquared += entry.sleepHours * entry.sleepHours;
        sumMoodSquared += entry.mood * entry.mood;
    });

    const n = dataWithSleep.length;
    const numerator = n * sumSleepMood - sumSleep * sumMood;
    const denominator = Math.sqrt((n * sumSleepSquared - sumSleep * sumSleep) *
        (n * sumMoodSquared - sumMood * sumMood));

    if (denominator === 0) return { correlation: 0, message: "Pas de corrélation détectée" };

    const correlation = numerator / denominator;

    let message;
    if (correlation > 0.7) {
        message = "Forte corrélation positive : plus vous dormez, meilleure est votre humeur";
    } else if (correlation > 0.3) {
        message = "Corrélation positive modérée : le sommeil semble améliorer votre humeur";
    } else if (correlation > 0) {
        message = "Légère corrélation positive : un effet modeste du sommeil sur l'humeur";
    } else if (correlation > -0.3) {
        message = "Légère corrélation négative : pas d'effet notable du sommeil";
    } else if (correlation > -0.7) {
        message = "Corrélation négative modérée : des données inhabituelles";
    } else {
        message = "Forte corrélation négative : les données suggèrent que plus de sommeil correspond à une moins bonne humeur (inhabituel)";
    }

    return {
        correlation: correlation.toFixed(2),
        message
    };
}

// Analyser les tendances et patterns
function analyzeTrends(trends) {
    if (!trends) {
        console.warn('Aucune tendance fournie pour l\'analyse');
        return;
    }

    const patternsList = document.getElementById('patternsList');
    if (!patternsList) {
        console.error('Élément patternsList non trouvé');
        return;
    }

    patternsList.innerHTML = '';

    // Vérifier si les données de tendance sont valides
    const hasHourTrends = trends.byHour && Array.isArray(trends.byHour) && trends.byHour.length > 0;
    const hasDayTrends = trends.byDayOfWeek && Array.isArray(trends.byDayOfWeek) && trends.byDayOfWeek.length > 0;

    // Si aucune tendance valide n'est disponible
    if (!hasHourTrends && !hasDayTrends) {
        patternsList.innerHTML = '<p>Pas assez de données pour détecter des tendances significatives.</p>';
        return;
    }

    // Analyser les tendances par heure
    if (hasHourTrends) {
        try {
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
        } catch (error) {
            console.error('Erreur lors de l\'analyse des tendances horaires:', error);
        }
    }

    // Analyser les tendances par jour de la semaine
    if (hasDayTrends) {
        try {
            const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
            const bestDay = [...trends.byDayOfWeek].sort((a, b) => b.avgMood - a.avgMood)[0];
            const worstDay = [...trends.byDayOfWeek].sort((a, b) => a.avgMood - b.avgMood)[0];

            if (bestDay && worstDay && bestDay.dayOfWeek >= 0 && bestDay.dayOfWeek < 7 &&
                worstDay.dayOfWeek >= 0 && worstDay.dayOfWeek < 7) {
                patternsList.innerHTML += `
                    <div class="pattern-item">
                        <h3>📅 Tendances hebdomadaires</h3>
                        <p>Votre meilleure journée est généralement le <strong>${daysOfWeek[bestDay.dayOfWeek]}</strong> (${bestDay.avgMood.toFixed(1)}/10).</p>
                        <p>Votre journée la moins bonne est le <strong>${daysOfWeek[worstDay.dayOfWeek]}</strong> (${worstDay.avgMood.toFixed(1)}/10).</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Erreur lors de l\'analyse des tendances hebdomadaires:', error);
        }
    }

    // Si aucune tendance n'a été ajoutée
    if (patternsList.innerHTML === '') {
        patternsList.innerHTML = '<p>Pas assez de données pour détecter des tendances significatives.</p>';
    }
}

// GESTION DU TABLEAU D'ENTRÉES

// Charger toutes les entrées
async function loadAllEntries() {
    try {
        console.log('Chargement de toutes les entrées...');
        // Récupérer les entrées des 12 derniers mois
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 12);

        const response = await fetch(`/api/moods?start=${startDate.toISOString()}&limit=1000`);

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        allEntries = await response.json();

        console.log(`Entrées chargées: ${allEntries.length}`);

        // Initialiser les entrées filtrées avec toutes les entrées
        filteredEntries = [...allEntries];
        currentPage = 1;

        // Trier par date décroissante par défaut
        sortEntries('date-desc');

        // Afficher le tableau
        renderEntriesTable();
    } catch (error) {
        console.error('Erreur lors du chargement des entrées:', error);
        showError('Erreur lors du chargement des entrées. Veuillez réessayer plus tard.');
    }
}

// Filtrer les entrées
function filterEntries(query) {
    if (!query) {
        filteredEntries = [...allEntries];
    } else {
        query = query.toLowerCase();
        filteredEntries = allEntries.filter(entry => {
            try {
                const date = new Date(entry.timestamp).toLocaleDateString();
                const note = entry.note ? entry.note.toLowerCase() : '';
                const emotions = entry.emotions ? entry.emotions.toLowerCase() : '';

                return date.includes(query) ||
                    note.includes(query) ||
                    emotions.includes(query) ||
                    entry.mood.toString().includes(query);
            } catch (error) {
                console.error('Erreur lors du filtrage d\'une entrée:', error);
                return false;
            }
        });
    }

    currentPage = 1;
    renderEntriesTable();
}

// Trier les entrées
function sortEntries(sortBy) {
    try {
        switch (sortBy) {
            case 'date-desc':
                filteredEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                break;
            case 'date-asc':
                filteredEntries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                break;
            case 'mood-desc':
                filteredEntries.sort((a, b) => (b.mood || 0) - (a.mood || 0));
                break;
            case 'mood-asc':
                filteredEntries.sort((a, b) => (a.mood || 0) - (b.mood || 0));
                break;
        }
    } catch (error) {
        console.error('Erreur lors du tri des entrées:', error);
    }

    renderEntriesTable();
}

// Rendre le tableau d'entrées
function renderEntriesTable() {
    const tableBody = document.querySelector('#entriesTable tbody');
    if (!tableBody) {
        console.error('Corps du tableau non trouvé');
        return;
    }

    tableBody.innerHTML = '';

    const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);
    const start = (currentPage - 1) * entriesPerPage;
    const end = Math.min(start + entriesPerPage, filteredEntries.length);

    // Mettre à jour l'info de pagination
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) {
        pageInfo.textContent = `Page ${currentPage}/${totalPages || 1}`;
    }

    // Désactiver/activer les boutons de pagination
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');

    if (prevPageBtn) {
        prevPageBtn.disabled = currentPage === 1;
    }

    if (nextPageBtn) {
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
    }

    // Aucune entrée à afficher
    if (filteredEntries.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="8" class="no-entries">Aucune entrée trouvée</td>`;
        tableBody.appendChild(row);
        return;
    }

    // Créer les lignes du tableau
    for (let i = start; i < end; i++) {
        try {
            const entry = filteredEntries[i];
            if (!entry) continue;

            const date = new Date(entry.timestamp);

            const row = document.createElement('tr');
            row.dataset.id = entry.id;

            row.innerHTML = `
                <td>${date.toLocaleDateString('fr-FR')}</td>
                <td>${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
                <td class="editable mood-cell" data-field="mood">${entry.mood}/10 ${moodEmojis[entry.mood] || ''}</td>
                <td class="editable" data-field="sleepHours">${entry.sleepHours !== null ? entry.sleepHours + 'h' : '-'}</td>
                <td class="editable" data-field="medication">${entry.medication !== null ? entry.medication : '-'}</td>
                <td class="editable" data-field="emotions">${entry.emotions || '-'}</td>
                <td class="editable note-cell" data-field="note">${entry.note || '-'}</td>
                <td>
                    <div class="edit-controls">
                        <button class="edit-btn" onclick="editEntry('${entry.id}')">✏️</button>
                        <button class="delete-btn" onclick="deleteEntry('${entry.id}')">🗑️</button>
                    </div>
                </td>
            `;

            tableBody.appendChild(row);
        } catch (error) {
            console.error('Erreur lors du rendu d\'une ligne du tableau:', error);
        }
    }

    // Ajouter les événements pour l'édition en place
    document.querySelectorAll('#entriesTable .editable').forEach(cell => {
        cell.addEventListener('click', function() {
            startEditing(this);
        });
    });
}

// Fonction pour démarrer l'édition d'une cellule
function startEditing(cell) {
    // Vérifier si la cellule est déjà en mode édition
    if (cell.classList.contains('editing')) return;

    try {
        const field = cell.dataset.field;
        const entryId = cell.parentElement.dataset.id;
        const entry = allEntries.find(e => e.id === entryId);

        if (!entry) {
            console.error('Entrée non trouvée pour l\'édition');
            return;
        }

        // Sauvegarder la valeur actuelle
        const currentValue = entry[field];

        // Créer le contrôle d'édition approprié
        let editControl;

        if (field === 'mood') {
            editControl = document.createElement('select');
            for (let i = 0; i <= 10; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.text = `${i}/10 ${moodEmojis[i] || ''}`;
                if (i === entry.mood) option.selected = true;
                editControl.appendChild(option);
            }
        } else if (field === 'sleepHours' || field === 'medication') {
            editControl = document.createElement('input');
            editControl.type = 'number';
            editControl.step = '0.1';
            editControl.min = '0';
            editControl.value = currentValue || '';
        } else if (field === 'note') {
            editControl = document.createElement('textarea');
            editControl.value = currentValue || '';
        } else {
            editControl = document.createElement('input');
            editControl.type = 'text';
            editControl.value = currentValue || '';
        }

        // Ajouter la classe editing et remplacer le contenu
        cell.classList.add('editing');
        cell.textContent = '';
        cell.appendChild(editControl);

        // Focus sur le contrôle
        editControl.focus();

        // Gérer l'enregistrement lorsque l'utilisateur quitte le champ
        editControl.addEventListener('blur', () => {
            saveEdit(entryId, field, editControl.value);
        });

        // Gérer l'enregistrement avec la touche Entrée (sauf pour textarea)
        editControl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && field !== 'note') {
                e.preventDefault();
                saveEdit(entryId, field, editControl.value);
            }
        });
    } catch (error) {
        console.error('Erreur lors du démarrage de l\'édition:', error);
        showError('Erreur lors de la modification de l\'entrée.');
    }
}

// Fonction pour enregistrer l'édition
async function saveEdit(entryId, field, value) {
    try {
        // Trouver l'entrée dans le tableau
        const entry = allEntries.find(e => e.id === entryId);
        if (!entry) {
            console.error('Entrée non trouvée pour la sauvegarde');
            return;
        }

        // Préparer les données à mettre à jour
        const updates = {};

        // Convertir la valeur en fonction du champ
        if (field === 'mood' || field === 'sleepHours' || field === 'medication') {
            const numValue = parseFloat(value);
            updates[field] = isNaN(numValue) ? 0 : numValue;
        } else {
            updates[field] = value;
        }

        // Appeler l'API pour mettre à jour l'entrée
        const response = await fetch(`/api/moods/${entryId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Mise à jour réussie:', result);

            // Mettre à jour l'entrée localement
            Object.assign(entry, updates);

            // Mettre à jour l'affichage
            renderEntriesTable();

            // Recharger les données des graphiques
            loadTimelineData();
        } else {
            const errorData = await response.json();
            console.error('Erreur lors de la mise à jour:', errorData);
            showError('Erreur lors de la mise à jour: ' + (errorData.error || 'Erreur inconnue'));
        }
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de l\'édition:', error);
        showError('Erreur lors de la sauvegarde des modifications.');
    }
}

// Fonction pour supprimer une entrée
async function deleteEntry(entryId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) {
        return;
    }

    try {
        const response = await fetch(`/api/moods/${entryId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            // Supprimer l'entrée des tableaux locaux
            allEntries = allEntries.filter(e => e.id !== entryId);
            filteredEntries = filteredEntries.filter(e => e.id !== entryId);

            // Mettre à jour l'affichage
            renderEntriesTable();

            // Recharger les données des graphiques
            loadTimelineData();
        } else {
            const errorData = await response.json();
            console.error('Erreur lors de la suppression:', errorData);
            showError('Erreur lors de la suppression: ' + (errorData.error || 'Erreur inconnue'));
        }
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'entrée:', error);
        showError('Erreur lors de la suppression de l\'entrée.');
    }
}

// Fonction pour éditer une entrée complète (pour les boutons d'édition)
function editEntry(entryId) {
    const row = document.querySelector(`tr[data-id="${entryId}"]`);
    if (row) {
        // Déclencher l'édition sur la cellule du commentaire (note)
        const noteCell = row.querySelector('.note-cell');
        if (noteCell) {
            startEditing(noteCell);
        }
    }
}

// Ajouter ces styles pour les notifications d'erreur
document.head.insertAdjacentHTML('beforeend', `
<style>
.error-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background-color: #e74c3c;
    color: white;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 1000;
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
`);