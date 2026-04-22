const { request, request_detail, person, schedule } = require('../models');
const sequelize = require('../config/db');

const createBulkRequest = async (data) => {
    return await sequelize.transaction(async (t) => {


        const newRequest = await request.create({
            type: data.type,
            requester_id: data.requester_id,
            approver_id: data.approver_id,
            status: data.status || 'pending',
            reason: data.reason,
            created_at: new Date().toLocaleString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" })
        }, { transaction: t });


        const detailsData = data.request_details.map(detail => ({
            request_id: newRequest.request_id || newRequest.id,
            start_time: detail.start_time,
            end_time: detail.end_time,
            date: detail.date
        }));

        await request_detail.bulkCreate(detailsData, { transaction: t });

        return newRequest;
    });
};

const getRequestById = async (request_id) => {
    const data = await request.findByPk(request_id, {
        include: [
            { model: request_detail, as: 'details' },
            { model: person, as: 'approver', attributes: ['name', 'role'] }
        ]
    });
    if (!data) throw new Error('Request not found');
    return data;
};

const getAllRequests = async () => {
    return await request.findAll({
        include: [
            { model: request_detail, as: 'details' },
            { model: person, as: 'approver', attributes: ['name', 'role'] }
        ],
        order: [['created_at', 'DESC']]
    });
};

const getAllRequestDetails = async () => {
    return await request_detail.findAll();
};

const getRequestsByRequesterId = async (requester_id) => {
    return await request.findAll({
        where: { requester_id },
        include: [
            { model: request_detail, as: 'details' },
            { model: person, as: 'approver', attributes: ['name', 'role'] }
        ],
        order: [['created_at', 'DESC']]
    });
};

const updateRequestStatus = async (request_id, status) => {
    console.log(`Updating request ${request_id} to status: ${status}`);
    return await sequelize.transaction(async (t) => {
        const data = await request.findByPk(request_id, {
            include: [{ model: request_detail, as: 'details' }],
            transaction: t
        });

        if (!data) throw new Error('Request not found');

        // Update the status
        await data.update({ status }, { transaction: t });
        console.log(`Request ${request_id} updated. Type: ${data.type}`);

        // If approved and type is register, move details to schedule table
        if (status.toLowerCase() === 'approved' && (data.type.toLowerCase() === 'register' || data.type.toLowerCase() === 'leave')) {
            console.log(`Processing sync to schedule for request ${request_id}. Type: ${data.type}`);
            
            const scheduleEntries = data.details.map(detail => ({
                person_id: data.requester_id,
                start_time: detail.start_time,
                end_time: detail.end_time,
                working_date: detail.date
            }));

            if (scheduleEntries.length > 0) {
                // Optional: Clear existing schedule for these dates to avoid duplicates if re-approved
                // await schedule.destroy({ where: { person_id: data.requester_id, working_date: scheduleEntries.map(e => e.working_date) }, transaction: t });
                
                await schedule.bulkCreate(scheduleEntries, { transaction: t });
                console.log(`Successfully synced ${scheduleEntries.length} entries to schedule.`);
            } else {
                console.log('No details found to sync.');
            }
        }

        return data;
    });
};

const deleteRequest = async (request_id) => {
    const data = await request.findByPk(request_id);
    if (!data) throw new Error('Request not found');
    await data.destroy();
};

module.exports = {
    createBulkRequest,
    getRequestById,
    getAllRequestDetails,
    getRequestsByRequesterId,
    getAllRequests,
    updateRequestStatus,
    deleteRequest
};