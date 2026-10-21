const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const backup_log = sequelize.define(
    'backup_log',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            field: 'ID'
        },
        filename: {
            type: DataTypes.STRING(500),
            allowNull: false,
            field: 'Filename'
        },
        // S3 key (null nếu không có S3)
        s3_key: {
            type: DataTypes.STRING(500),
            allowNull: true,
            field: 'S3Key'
        },
        // Đường dẫn local trên máy chủ
        local_path: {
            type: DataTypes.STRING(1000),
            allowNull: true,
            field: 'LocalPath'
        },
        size_bytes: {
            type: DataTypes.BIGINT,
            allowNull: true,
            field: 'SizeBytes'
        },
        rows_count: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'RowsCount'
        },
        tables_count: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'TablesCount'
        },
        // 'manual' hoặc 'cron'
        triggered_by: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'manual',
            field: 'TriggeredBy'
        },
        // person_id của admin thực hiện (null nếu là cron)
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'CreatedBy'
        },
        // 'pending' | 'success' | 'failed'
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'pending',
            field: 'Status'
        },
        error_message: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'ErrorMessage'
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'CreatedAt'
        }
    },
    {
        tableName: 'BackupLogs',
        timestamps: false
    }
);

module.exports = backup_log;
