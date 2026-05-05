const { task, task_participant } = require('../models');
const sequelize = require('../config/db');

const getAllParticipantsByTaskId = async (taskId) => {
    return await task_participant.findAll({
        where: {
            task_id: taskId
        }
    });
};

const addParticipantToTask = async (taskId, participantId, role) => {
    return await task_participant.create({
        task_id: taskId,
        participant_id: participantId,
        role: role
    });
};

module.exports = {
    getAllParticipantsByTaskId,
    addParticipantToTask
};