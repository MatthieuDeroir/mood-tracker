// src/services/userService.ts
import { db } from '../db/database.ts';
import { users, User } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { SupportedLanguage, getTranslations } from '../utils/localization.ts';

export class UserService {
    // Obtenir un utilisateur par ID
    static async getUserById(userId: string): Promise<User | undefined> {
        try {
            const [user] = await db.select()
                .from(users)
                .where(eq(users.id, userId));

            return user;
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'utilisateur:', error);
            throw error;
        }
    }

    // Obtenir un utilisateur par email
    static async getUserByEmail(email: string): Promise<User | undefined> {
        try {
            const [user] = await db.select()
                .from(users)
                .where(eq(users.email, email));

            return user;
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'utilisateur par email:', error);
            throw error;
        }
    }

    // Créer un nouvel utilisateur
    static async createUser(email: string, name: string, language: SupportedLanguage = 'fr'): Promise<User> {
        try {
            const defaultSettings = {
                timezone: 'Europe/Paris',
                language: language,
                moodLabels: getTranslations(language).moodLabels
            };

            const [newUser] = await db.insert(users)
                .values({
                    id: randomUUID(),
                    email,
                    name,
                    settings: defaultSettings
                })
                .returning();

            console.log(`👤 Nouvel utilisateur créé: ${email}`);
            return newUser;
        } catch (error) {
            console.error('Erreur lors de la création de l\'utilisateur:', error);
            throw error;
        }
    }

    // Mettre à jour les paramètres utilisateur
    static async updateUserSettings(userId: string, settings: Partial<User['settings']>): Promise<User | undefined> {
        try {
            // Récupérer l'utilisateur actuel
            const user = await this.getUserById(userId);

            if (!user) {
                return undefined;
            }

            // Fusionner les paramètres existants avec les nouveaux
            const updatedSettings = {
                ...user.settings,
                ...settings
            };

            // Mettre à jour l'utilisateur
            const [updatedUser] = await db.update(users)
                .set({
                    settings: updatedSettings,
                    updatedAt: new Date()
                })
                .where(eq(users.id, userId))
                .returning();

            console.log(`📝 Paramètres utilisateur mis à jour: ${userId}`);
            return updatedUser;
        } catch (error) {
            console.error('Erreur lors de la mise à jour des paramètres utilisateur:', error);
            throw error;
        }
    }

    // Mettre à jour la langue préférée
    static async updateUserLanguage(userId: string, language: SupportedLanguage): Promise<User | undefined> {
        try {
            const user = await this.getUserById(userId);

            if (!user) {
                return undefined;
            }

            // Obtenir les traductions pour la nouvelle langue
            const translations = getTranslations(language);

            // Mettre à jour les paramètres utilisateur
            return await this.updateUserSettings(userId, {
                language: language,
                moodLabels: translations.moodLabels
            });
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la langue utilisateur:', error);
            throw error;
        }
    }

    // Supprimer un utilisateur
    static async deleteUser(userId: string): Promise<boolean> {
        try {
            const result = await db.delete(users)
                .where(eq(users.id, userId));

            console.log(`🗑️ Utilisateur supprimé: ${userId}`);
            return result.rowCount > 0;
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'utilisateur:', error);
            throw error;
        }
    }
}

export default UserService;