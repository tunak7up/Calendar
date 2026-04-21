const { schedule, person } = require('../models');

const createSchedule = async ({
    person_id,
    start_time,
    end_time,
    working_date
}) => {
    return await schedule.create({
        person_id,
        start_time,
        end_time,
        working_date
    });
};

const getScheduleByPersonId = async (personId) => {
    return await schedule.findAll({
        where: { person_id: personId },
        include: [
            { 
                model: person, 
                as: 'person',
                required: true
            }
        ],
    });
};

const updateSchedule = async (schedule_id, { start_time, end_time, working_date }) => {
    const data = await schedule.findByPk(schedule_id);
    if (!data) throw new Error('Schedule not found');
    return await data.update({ start_time, end_time, working_date });
};

const deleteSchedule = async (schedule_id) => {
    const data = await schedule.findByPk(schedule_id);
    if (!data) throw new Error('Schedule not found');
    await data.destroy();
};

module.exports = {
    createSchedule,
    getScheduleByPersonId,
    updateSchedule,
    deleteSchedule
};