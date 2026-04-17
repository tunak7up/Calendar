const { person } = require('../models');

const getAllPersons = async () => {
  return await Person.findAll();
};

const getPersonById = async (id) => {
    const person = await Person.findByPk(id);
    if (!person) throw new Error('Person not found');
    return person;
}

const create = async ({ name, password, status, role, username }) => {
  // V? d? business logic: ki?m tra username tr?ng
  const existing = await Person.findOne({ where: { username } });
  if (existing) throw new Error('Username already exists');

  return await Person.create({ name, password, status, role, username });
};

const update = async (id, { name, password, status, role, username }) => {
  const person = await Person.findByPk(id);
  if (!person) throw new Error('Person not found');

  // V? d? business logic: kh?ng cho ??i role n?u ?ang inactive
  if (!person.status && role !== person.role) {
    throw new Error('Cannot change role of inactive person');
  }

  return await person.update({ name, password, status, role, username });
};

const remove = async (id) => {
  const person = await Person.findByPk(id);
  if (!person) throw new Error('Person not found');
  await person.destroy();
};

module.exports = { getAll, getById, create, update, remove };