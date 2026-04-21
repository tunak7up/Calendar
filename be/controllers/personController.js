const { person } = require('../models');
const personService = require('../services/personService');

const getAllPersons = async (rep, res) => {
    try {
        const persons = await personService.getAllPersons();
        res.json(persons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getPersonById = async (req, res) => {
    try {
        const person = await personService.getPersonById(req.params.id);
        res.json(person);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

const getTasksAndRolesByPersonId = async (req, res) => {
    try {
        const data = await personService.getTasksAndRolesByPersonId(req.params.id);
        res.json(data);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

const createPerson = async (req, res) => {
    try {
        const person = await personService.createPerson(req.body);
        res.json(person);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const updatePerson = async (req, res) => {
    try {
        const data = await personService.updatePerson(req.params.id, req.body);
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const removePerson = async (req, res) => {
    try {
        await personService.removePerson(req.params.id);
        res.json({ message: 'Person removed' });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

module.exports = {
    getAllPersons,
    getPersonById,
    createPerson,
    updatePerson,
    removePerson
};