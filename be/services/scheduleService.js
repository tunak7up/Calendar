const { schedule, person } = require('../models');
const sequelize = require('../config/db');
const { Op } = require('sequelize');

const createSchedule = async ({
    person_id,
    start_time,
    end_time,
    working_date
}) => {
    const newSchedule = await schedule.create({
        person_id,
        start_time,
        end_time,
        working_date
    });

    // Tự động lên lịch thông báo điểm danh cho ca làm việc mới
    try {
        const { scheduleMilestonesForSchedule } = require('./attendanceNotificationService');
        scheduleMilestonesForSchedule(newSchedule).catch(err => {
            console.error('[Schedule Service] Error scheduling milestones for new schedule:', err);
        });
    } catch (err) {
        console.error('[Schedule Service] Error requiring attendanceNotificationService:', err);
    }

    return newSchedule;
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

const getScheduleByPersonIdWithTimeRange = async (data) => {
    const { personId, startTime, endTime } = data;
    return await schedule.findAll({
        where: {
            person_id: personId,
            start_time: { [Op.gte]: startTime },
            end_time: { [Op.lte]: endTime }
        },
        include: [
            {
                model: person,
                as: 'person',
                required: true
            }
        ],
    });
};

const getSchedulesByRange = async (startDate, endDate) => {
    return await schedule.findAll({
        where: {
            working_date: {
                [Op.between]: [startDate, endDate]
            }
        },
        include: [
            {
                model: person,
                as: 'person',
                required: true,
                attributes: ['person_id', 'name', 'username']
            }
        ],
        order: [['working_date', 'ASC']]
    });
};

const getAllSchedules = async () => {
    return await schedule.findAll({
        include: [
            {
                model: person,
                as: 'person',
                required: true,
                attributes: ['person_id', 'name', 'username']
            }
        ],
        order: [['working_date', 'ASC']]
    });
};

const updateSchedule = async (schedule_id, { start_time, end_time, working_date }) => {
    const data = await schedule.findByPk(schedule_id);
    if (!data) throw new Error('Schedule not found');
    const updatedSchedule = await data.update({ start_time, end_time, working_date });

    // Tự động lên lịch lại thông báo điểm danh cho ca làm việc đã cập nhật
    try {
        const { scheduleMilestonesForSchedule } = require('./attendanceNotificationService');
        scheduleMilestonesForSchedule(updatedSchedule).catch(err => {
            console.error('[Schedule Service] Error rescheduling milestones for updated schedule:', err);
        });
    } catch (err) {
        console.error('[Schedule Service] Error requiring attendanceNotificationService:', err);
    }

    return updatedSchedule;
};

const deleteSchedule = async (schedule_id) => {
    const data = await schedule.findByPk(schedule_id);
    if (!data) throw new Error('Schedule not found');
    await data.destroy();
};

const getShiftByDate = async (personId, date) => {
    const ws = await schedule.findOne({
        where: {
            person_id: personId,
            working_date: date
        }
    });
    
    if (!ws) return null;

    const startTime = new Date(ws.start_time);
    const endTime = new Date(ws.end_time);
    
    const startHHMM = `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`;
    const endHHMM = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;

    if (startHHMM === '08:30' && endHHMM === '12:00') return 'Morning';
    if (startHHMM === '13:00' && endHHMM === '17:30') return 'Afternoon';
    return 'Full Day';
};

module.exports = {
    createSchedule,
    getScheduleByPersonId,
    getAllSchedules,
    getSchedulesByRange,
    updateSchedule,
    deleteSchedule,
    getScheduleByPersonIdWithTimeRange,
    getShiftByDate
};