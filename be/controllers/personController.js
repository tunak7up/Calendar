const { person } = require('../models');
const personService = require('../services/personService');
const { sendRes } = require('../utils/responseHelper');

const getAllPersons = async (rep, res) => {
    try {
        const persons = await personService.getAllPersons();
        sendRes(res, 200, 'Persons retrieved successfully', persons);
    } catch (error) {
        sendRes(res, 500, 'Error retrieving persons', null, error.message);
    }
};

const getPersonById = async (req, res) => {
    try {
        const person = await personService.getPersonById(req.params.id);
        sendRes(res, 200, 'Person retrieved successfully', person);
    } catch (error) {
        sendRes(res, 404, 'Person not found', null, error.message);
    }
};

const getTasksAndRolesByPersonId = async (req, res) => {
    try {
        const data = await personService.getTasksAndRolesByPersonId(req.params.id);
        sendRes(res, 200, 'Tasks and roles retrieved successfully', data);
    } catch (error) {
        sendRes(res, 404, 'Person not found', null, error.message);
    }
};

const createPerson = async (req, res) => {
    try {
        const person = await personService.createPerson(req.body);
        sendRes(res, 201, 'Person created successfully', person);
    } catch (error) {
        sendRes(res, 400, error.message || 'Error creating person', null, error.message);
    }
};

const getPersonByRole = async (req, res) => {
    try {
        const data = await personService.getPersonByRole(req.params.role);
        sendRes(res, 200, 'Persons retrieved successfully', data);
    } catch (error) {
        sendRes(res, 404, 'Person not found', null, error.message);
    }
};


const updatePerson = async (req, res) => {
    try {
        const data = await personService.updatePerson(req.params.id, req.body);
        sendRes(res, 200, 'Person updated successfully', data);
    } catch (error) {
        sendRes(res, 400, error.message || 'Error updating person', null, error.message);
    }
};

const removePerson = async (req, res) => {
    try {
        await personService.removePerson(req.params.id);
        sendRes(res, 200, 'Person removed successfully', null);
    } catch (error) {
        sendRes(res, 404, 'Person not found', null, error.message);
    }
};

const getTasksByPersonId = async (req, res) => {
    try {
        const tasks = await personService.getTasksByPersonId(req.params.id);
        sendRes(res, 200, 'Tasks retrieved successfully', tasks);
    } catch (error) {
        sendRes(res, 404, 'Person not found', null, error.message);
    }
};

const updateOneSignalId = async (req, res) => {
    try {
        const { onesignal_id } = req.body;
        const data = await personService.updateOneSignalId(req.params.id, onesignal_id);
        sendRes(res, 200, 'OneSignal ID updated successfully', data);
    } catch (error) {
        sendRes(res, 400, error.message || 'Error updating OneSignal ID', null, error.message);
    }
};

module.exports = {
    getAllPersons,
    getPersonByRole,
    getPersonById,
    createPerson,
    updatePerson,
    removePerson,
    getTasksAndRolesByPersonId,
    getTasksByPersonId,
    updateOneSignalId
};