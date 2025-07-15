// src/utils/localization.ts
import { SupportedLanguage, Translations } from '../models/types.ts';

// Traductions françaises
const frTranslations: Translations = {
    moodLabels: {
        0: 'Terrible',
        1: 'Très mal',
        2: 'Mal',
        3: 'Pas bien',
        4: 'Faible',
        5: 'Neutre',
        6: 'Correct',
        7: 'Bien',
        8: 'Très bien',
        9: 'Super',
        10: 'Incroyable'
    },
    interface: {
        // Messages généraux
        appTitle: 'Suivi d\'Humeur',
        dashboard: 'Tableau de bord',
        analytics: 'Analyses',
        save: 'Sauvegarder',
        delete: 'Supprimer',
        edit: 'Modifier',
        cancel: 'Annuler',
        confirm: 'Confirmer',

        // Libellés et titres
        howAreYouFeeling: 'Comment vous sentez-vous maintenant ?',
        today: 'Aujourd\'hui',
        noteOptional: 'Raconte-moi ce qui se passe... (optionnel)',

        // Statistiques
        averageToday: 'Moyenne aujourd\'hui',
        entries: 'Entrées',
        currentMood: 'Humeur actuelle',

        // Tags courants
        tagWork: 'Travail',
        tagFamily: 'Famille',
        tagHealth: 'Santé',
        tagFriends: 'Amis',
        tagExercise: 'Sport',
        tagFood: 'Nourriture',

        // Périodes
        thisWeek: 'Cette semaine',
        thisMonth: 'Ce mois',
        thisYear: 'Cette année',

        // Statistiques analytiques
        average: 'Moyenne',
        totalEntries: 'Total entrées',
        bestMood: 'Meilleure humeur',
        worstMood: 'Pire humeur',
        moodEvolution: 'Évolution de l\'humeur',
        detectedPatterns: 'Schémas détectés',

        // Messages de notification
        moodSaved: 'Humeur sauvegardée !',
        moodUpdated: 'Humeur mise à jour !',
        moodDeleted: 'Humeur supprimée !',
        errorSaving: 'Erreur lors de la sauvegarde',
        errorUpdating: 'Erreur lors de la mise à jour',
        errorDeleting: 'Erreur lors de la suppression',

        // Jours de la semaine
        monday: 'Lundi',
        tuesday: 'Mardi',
        wednesday: 'Mercredi',
        thursday: 'Jeudi',
        friday: 'Vendredi',
        saturday: 'Samedi',
        sunday: 'Dimanche',

        // Mois
        january: 'Janvier',
        february: 'Février',
        march: 'Mars',
        april: 'Avril',
        may: 'Mai',
        june: 'Juin',
        july: 'Juillet',
        august: 'Août',
        september: 'Septembre',
        october: 'Octobre',
        november: 'Novembre',
        december: 'Décembre'
    }
};

// Traductions anglaises
const enTranslations: Translations = {
    moodLabels: {
        0: 'Terrible',
        1: 'Very bad',
        2: 'Bad',
        3: 'Not good',
        4: 'Low',
        5: 'Neutral',
        6: 'Fine',
        7: 'Good',
        8: 'Very good',
        9: 'Great',
        10: 'Amazing'
    },
    interface: {
        // General messages
        appTitle: 'Mood Tracker',
        dashboard: 'Dashboard',
        analytics: 'Analytics',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        cancel: 'Cancel',
        confirm: 'Confirm',

        // Labels and titles
        howAreYouFeeling: 'How are you feeling right now?',
        today: 'Today',
        noteOptional: 'Tell me what\'s happening... (optional)',

        // Statistics
        averageToday: 'Today\'s average',
        entries: 'Entries',
        currentMood: 'Current mood',

        // Common tags
        tagWork: 'Work',
        tagFamily: 'Family',
        tagHealth: 'Health',
        tagFriends: 'Friends',
        tagExercise: 'Exercise',
        tagFood: 'Food',

        // Periods
        thisWeek: 'This week',
        thisMonth: 'This month',
        thisYear: 'This year',

        // Analytics statistics
        average: 'Average',
        totalEntries: 'Total entries',
        bestMood: 'Best mood',
        worstMood: 'Worst mood',
        moodEvolution: 'Mood evolution',
        detectedPatterns: 'Detected patterns',

        // Notification messages
        moodSaved: 'Mood saved!',
        moodUpdated: 'Mood updated!',
        moodDeleted: 'Mood deleted!',
        errorSaving: 'Error saving',
        errorUpdating: 'Error updating',
        errorDeleting: 'Error deleting',

        // Days of the week
        monday: 'Monday',
        tuesday: 'Tuesday',
        wednesday: 'Wednesday',
        thursday: 'Thursday',
        friday: 'Friday',
        saturday: 'Saturday',
        sunday: 'Sunday',

        // Months
        january: 'January',
        february: 'February',
        march: 'March',
        april: 'April',
        may: 'May',
        june: 'June',
        july: 'July',
        august: 'August',
        september: 'September',
        october: 'October',
        november: 'November',
        december: 'December'
    }
};

// Dictionnaire des traductions disponibles
const translations: Record<SupportedLanguage, Translations> = {
    fr: frTranslations,
    en: enTranslations,
    // Ajoutez d'autres langues ici au besoin
    es: frTranslations, // Placeholder, à remplacer par de vraies traductions espagnoles
    de: frTranslations  // Placeholder, à remplacer par de vraies traductions allemandes
};

// Fonction pour obtenir les traductions pour une langue
export function getTranslations(lang: SupportedLanguage): Translations {
    return translations[lang] || translations.fr; // Français par défaut
}

// Fonction pour obtenir une traduction spécifique
export function translate(key: string, lang: SupportedLanguage = 'fr'): string {
    const parts = key.split('.');
    let result: any = getTranslations(lang);

    for (const part of parts) {
        if (result && typeof result === 'object' && part in result) {
            result = result[part];
        } else {
            // Retourner la clé si la traduction n'est pas trouvée
            return key;
        }
    }

    return result;
}

// Fonction pour formater une date selon la langue
export function formatDate(date: Date, lang: SupportedLanguage = 'fr'): string {
    const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };

    return date.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', options);
}

// Fonction pour formater une heure selon la langue
export function formatTime(date: Date, lang: SupportedLanguage = 'fr'): string {
    const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit'
    };

    return date.toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-US', options);
}

// Exporter la langue par défaut et les langues supportées
export const DEFAULT_LANGUAGE: SupportedLanguage = 'fr';
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['fr', 'en', 'es', 'de'];