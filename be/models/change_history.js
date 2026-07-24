const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const change_history = sequelize.define(
    'change_history',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        table_name: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        record_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        parent_table: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        parent_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        action: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        old_data: {
            type: DataTypes.TEXT('long'),
            allowNull: true,
            get() {
                const rawValue = this.getDataValue('old_data');
                if (!rawValue) return null;
                try {
                    return typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
                } catch (e) {
                    return rawValue;
                }
            },
            set(value) {
                if (value === null || value === undefined) {
                    this.setDataValue('old_data', null);
                } else {
                    this.setDataValue('old_data', typeof value === 'object' ? JSON.stringify(value) : value);
                }
            }
        },
        changed_data: {
            type: DataTypes.TEXT('long'),
            allowNull: true,
            get() {
                const rawValue = this.getDataValue('changed_data');
                if (!rawValue) return null;
                try {
                    return typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
                } catch (e) {
                    return rawValue;
                }
            },
            set(value) {
                if (value === null || value === undefined) {
                    this.setDataValue('changed_data', null);
                } else {
                    this.setDataValue('changed_data', typeof value === 'object' ? JSON.stringify(value) : value);
                }
            }
        },
        changed_by: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },
    {
        tableName: 'change_history',
        timestamps: false,
        indexes: [
            {
                name: 'idx_change_history_table_record',
                fields: ['table_name', 'record_id']
            },
            {
                name: 'idx_change_history_parent',
                fields: ['parent_table', 'parent_id']
            },
            {
                name: 'idx_change_history_changed_by',
                fields: ['changed_by']
            },
            {
                name: 'idx_change_history_created_at',
                fields: ['created_at']
            }
        ]
    }
);

// const syncChangeHistory = async () => {
//     await change_history.sync({ force: true });
//     console.log('Change history table synced');
// };

// syncChangeHistory();

module.exports = change_history;
