const { person, task, task_participant } = require('../models');
const { get } = require('../routes');

const getAllPersons = async () => {
    return await person.findAll();
};

const getPersonById = async (id) => {
    const person = await person.findByPk(id);
    if (!person) throw new Error('Person not found');
    return person;
}

const createPerson = async ({ name, password, status, role, username }) => {

    const existing = await person.findOne({ where: { username } });
    if (existing) throw new Error('Username already exists');

    return await person.create({ name, password, status, role, username });
};

const updatePerson = async (id, { name, password, status, role, username }) => {
    const person = await person.findByPk(id);
    if (!person) throw new Error('Person not found');

    return await person.update({ name, password, status, role, username });
};

const removePerson = async (id) => {
    const person = await person.findByPk(id);
    if (!person) throw new Error('Person not found');
    await person.update({ status: false });
};


// L?y danh s?ch task c?a 1 ng??i k?m vai tr? c?a ng??i ?? trong t?ng task
const getTasksAndRolesByPersonId = async (personId) => {
  const participants = await task_participant.findAll({
    where: { participant_id: personId },
    include: [
      {
        model: task,
        as: 'task',
      }
    ]
  });
  // K?t qu?: [{ task: {...}, role_id: ... }, ...]
  return participants.map(p => ({
    task: p.task,
    role: p.role_id
  }));
};

module.exports = {
    getAllPersons,
    getTasksAndRolesByPersonId,
    getPersonById, 
    createPerson, 
    updatePerson, 
    removePerson
};