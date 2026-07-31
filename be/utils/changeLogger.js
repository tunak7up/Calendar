const { change_history } = require('../models');

/**
 * Filter object to keep plain data fields and ignore internal sequelize metadata
 */
const sanitizeData = (data) => {
    if (!data) return null;
    let plain = typeof data.toJSON === 'function' ? data.toJSON() : { ...data };
    
    const ignoreFields = ['updated_at', 'updatedAt', 'created_at', 'createdAt'];
    const sanitized = {};
    for (const key of Object.keys(plain)) {
        if (!ignoreFields.includes(key) && plain[key] !== undefined) {
            sanitized[key] = plain[key];
        }
    }
    return sanitized;
};

/**
 * Calculate diff between old and new object
 * ONLY keeps fields that were modified!
 */
const calculateDiff = (oldData, newData) => {
    const sOld = sanitizeData(oldData) || {};
    const sNew = sanitizeData(newData) || {};

    const oldDiff = {};
    const newDiff = {};

    const allKeys = new Set([...Object.keys(sOld), ...Object.keys(sNew)]);
    for (const key of allKeys) {
        const valOld = sOld[key];
        const valNew = sNew[key];

        if (valOld !== undefined && valNew !== undefined) {
            if (JSON.stringify(valOld) !== JSON.stringify(valNew)) {
                oldDiff[key] = valOld;
                newDiff[key] = valNew;
            }
        } else if (valOld !== undefined && valNew === undefined) {
            oldDiff[key] = valOld;
        } else if (valOld === undefined && valNew !== undefined) {
            newDiff[key] = valNew;
        }
    }

    return {
        oldData: Object.keys(oldDiff).length > 0 ? oldDiff : null,
        changedData: Object.keys(newDiff).length > 0 ? newDiff : null
    };
};

/**
 * Log a record change into change_history
 */
const logChange = async ({
    tableName,
    recordId,
    parentTable = null,
    parentId = null,
    action,
    oldData = null,
    newData = null,
    changedBy = null,
    transaction = null
}) => {
    try {
        await change_history.sync();

        let oldDataJson = null;
        let changedDataJson = null;

        if (action === 'CREATE') {
            oldDataJson = null;
            changedDataJson = sanitizeData(newData);
        } else if (action === 'DELETE') {
            oldDataJson = sanitizeData(oldData);
            changedDataJson = null;
        } else if (action === 'UPDATE') {
            const diff = calculateDiff(oldData, newData);
            oldDataJson = diff.oldData;
            changedDataJson = diff.changedData;

            if (!oldDataJson && !changedDataJson) {
                return null; // Nothing changed
            }
        }

        const options = transaction ? { transaction } : {};
        return await change_history.create({
            table_name: tableName,
            record_id: recordId,
            parent_table: parentTable,
            parent_id: parentId,
            action,
            old_data: oldDataJson,
            changed_data: changedDataJson,
            changed_by: changedBy,
            created_at: new Date()
        }, options);
    } catch (err) {
        console.error(`[ChangeLogger] Error logging ${action} for ${tableName} (${recordId}):`, err.message);
        return null;
    }
};

module.exports = {
    logChange,
    calculateDiff,
    sanitizeData
};
