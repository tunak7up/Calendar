const { schedule, person } = require('../models');

const createSchedule = async (scheduleData) => {
    return await schedule.create(scheduleData);
};

const getScheduleByPersonId = async (personId) => {
    return await schedule.findAll({
        where: { person_id: personId },
        include: [{ model: person, as: 'person' }],
    });
};

const getAllSchedules = async () => {
    return await schedule.findAll({
        include: [{ model: person, as: 'person', required: true }],
    });
};

module.exports = {
    createSchedule,
    getScheduleByPersonId,
    getAllSchedules
};