
const personService = require('../services/personService');

const createPerson = async (req, res) => {
    try {
        const newPerson = await personService.createPerson(req.body);
        res.status(201).json(newPerson);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getAllPersons = async (req, res) => {
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
        if (person) {
            res.json(person);
        } else {
            res.status(404).json({ error: 'Person not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updatePerson = async (req, res) => {
    try {
        const updated = await personService.updatePerson(req.params.id, req.body);
        if (updated) {
            res.json({ message: 'Person updated successfully' });
        } else {
            res.status(404).json({ error: 'Person not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deletePerson = async (req, res) => {
    try {
        const deleted = await personService.deletePerson(req.params.id);
        if (deleted) {
            res.json({ message: 'Person deleted successfully' });
        } else {
            res.status(404).json({ error: 'Person not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createPerson,
    getAllPersons,
    getPersonById,
    updatePerson,
    deletePerson
};