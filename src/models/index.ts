// src/models/index.ts - Modèles Sequelize
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db/database.ts';

// Types pour MoodEntry
export interface MoodEntryAttributes {
    id: string;
    user_id: string;
    mood: number;
    note?: string;
    tags: string[];
    timestamp: Date;
    created_at?: Date;
    updated_at?: Date;
}

export interface MoodEntryCreationAttributes extends Optional<MoodEntryAttributes, 'id' | 'created_at' | 'updated_at'> {}

// Types pour User
export interface UserAttributes {
    id: string;
    email: string;
    name: string;
    settings: Record<string, any>;
    created_at?: Date;
    updated_at?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'created_at' | 'updated_at'> {}

// Modèle User
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: string;
    public email!: string;
    public name!: string;
    public settings!: Record<string, any>;
    public created_at!: Date;
    public updated_at!: Date;

    // Associations
    public readonly moods?: MoodEntry[];
}

// Modèle MoodEntry
export class MoodEntry extends Model<MoodEntryAttributes, MoodEntryCreationAttributes> implements MoodEntryAttributes {
    public id!: string;
    public user_id!: string;
    public mood!: number;
    public note?: string;
    public tags!: string[];
    public timestamp!: Date;
    public created_at!: Date;
    public updated_at!: Date;

    // Associations
    public readonly user?: User;
}

// Définition du modèle User
User.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        settings: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {
                timezone: 'UTC',
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
                }
            }
        },
    },
    {
        sequelize,
        modelName: 'User',
        tableName: 'users',
    }
);

// Définition du modèle MoodEntry
MoodEntry.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: User,
                key: 'id',
            },
        },
        mood: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 0,
                max: 10,
            },
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        tags: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
        },
        timestamp: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        modelName: 'MoodEntry',
        tableName: 'mood_entries',
        indexes: [
            {
                fields: ['user_id', 'timestamp'],
            },
            {
                fields: ['timestamp'],
            },
        ],
    }
);

// Relations
User.hasMany(MoodEntry, {
    foreignKey: 'user_id',
    as: 'moods',
});

MoodEntry.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user',
});

// Export des modèles
export { sequelize };
export default { User, MoodEntry, sequelize };