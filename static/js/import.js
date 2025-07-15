// Gestion de l'importation de fichiers CSV
document.addEventListener('DOMContentLoaded', () => {
    const importButton = document.getElementById('importButton');
    const fileInput = document.getElementById('csvFile');
    const resultsDiv = document.getElementById('importResults');
    const resultsContent = document.getElementById('resultsContent');

    importButton.addEventListener('click', importCsv);

    async function importCsv() {
        const file = fileInput.files[0];
        if (!file) {
            showNotification('Veuillez sélectionner un fichier CSV', 'error');
            return;
        }

        // Lire le contenu du fichier
        const content = await readFileAsText(file);

        // Récupérer les options
        const skipHeader = document.getElementById('skipHeader').checked;
        const delimiter = document.getElementById('delimiter').value;
        const dateFormat = document.getElementById('dateFormat').value;
        const fixMode = document.getElementById('fixMode').checked;

        // Créer l'objet de requête
        const requestData = {
            file: content,
            options: {
                skipHeader,
                delimiter,
                dateFormat,
                fixMode
            }
        };

        // Désactiver le bouton pendant l'importation
        importButton.disabled = true;
        importButton.textContent = 'Importation en cours...';

        try {
            // Appeler l'API
            const response = await fetch('/api/import/csv', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();

            if (response.ok) {
                // Afficher les résultats
                resultsDiv.classList.remove('hidden');

                // Créer le contenu des résultats
                let resultContent = `
                    <div class="success-message">
                        <p>${result.message}</p>
                        <ul>
                            <li>Entrées importées: <strong>${result.results.success}</strong></li>
                            <li>Entrées échouées: <strong>${result.results.failed}</strong></li>
                            <li>Total: <strong>${result.results.total}</strong></li>
                        </ul>
                    </div>
                `;

                // Afficher les erreurs si présentes
                if (result.results.errors && result.results.errors.length > 0) {
                    resultContent += `
                        <div class="error-details">
                            <h4>Détails des erreurs${result.results.hasMoreErrors ? ` (${result.results.errors.length} sur ${result.results.totalErrors} affichées)` : ''}:</h4>
                            <ul class="error-list">
                                ${result.results.errors.map(error => `<li>${error}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                }

                resultsContent.innerHTML = resultContent;

                showNotification('Importation terminée avec succès', 'success');
            } else {
                showNotification('Erreur: ' + (result.error || 'Échec de l\'importation'), 'error');
            }
        } catch (error) {
            console.error('Erreur lors de l\'importation:', error);
            showNotification('Erreur de connexion', 'error');
        } finally {
            // Réactiver le bouton
            importButton.disabled = false;
            importButton.textContent = 'Importer';
        }
    }

    // Fonction pour lire un fichier en texte
    function readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    }

    // Fonction pour afficher une notification
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
});