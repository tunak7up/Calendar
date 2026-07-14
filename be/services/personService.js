const { where } = require('sequelize');
const { person, task, task_participant } = require('../models');
const bcrypt = require('bcryptjs');

const getAllPersons = async () => {
  return await person.findAll();
  return await person.findAll();
};

const getPersonById = async (id) => {
  const data = await person.findByPk(id);
  if (!data) throw new Error('Person not found');
  return data;
};

const getPersonByRole = async (role) => {
  return await person.findAll({ where: { role } });
};

const createPerson = async (
  {
    name,
    password,
    status,
    role,
    username,
    email
  }) => {
  const existingUsername = await person.findOne({ where: { username } });
  if (existingUsername) throw new Error('Username already exists');

  const finalEmail = (email && email.trim() !== '') ? email.trim() : null;

  if (finalEmail) {
    const existingEmail = await person.findOne({
      where: { email: finalEmail }
    });

    if (existingEmail) {
      throw new Error('Email already exists');
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  return await person.create(
    {
      name,
      password: hashedPassword,
      status,
      role,
      username,
      email: finalEmail
    });
};

const updatePerson = async (
  id,
  { name,
    password,
    status,
    role,
    username,
    email }) => {
  const data = await person.findByPk(id);
  if (!data) throw new Error('Person not found');

  if (username && username !== data.username) {
    const existingUsername = await person.findOne({ where: { username } });
    if (existingUsername) throw new Error('Username already exists');
  }

  const finalEmail = (email && email.trim() !== '') ? email.trim() : null;

  if (finalEmail && finalEmail !== data.email) {
    const existingEmail = await person.findOne({ where: { email: finalEmail } });
    if (existingEmail) throw new Error('Email already exists');
  }

  const updateData = { name, status, role, username, email: finalEmail };
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  return await data.update(updateData);
};

const removePerson = async (id) => {
  const data = await person.findByPk(id);
  if (!data) throw new Error('Person not found');
  await data.update({ status: false });
};



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

  return participants.map(p => ({
    task: p.task,
    role: p.role_id
  }));
};

const getTasksByPersonId = async (personId) => {
  const tasks = await task.findAll({
    include: [
      {
        model: person,
        as: 'participants',
        where: { person_id: personId },
        attributes: []
      }
    ]
  });
  return tasks;
};

const updateOneSignalId = async (id, onesignalId) => {
  const data = await person.findByPk(id);
  if (!data) throw new Error('Person not found');
  return await data.update({ onesignal_id: onesignalId });
};

module.exports = {
  getAllPersons,
  getTasksAndRolesByPersonId,
  getTasksByPersonId,
  getPersonByRole,
  getPersonById,
  createPerson,
  updatePerson,
  removePerson,
  updateOneSignalId
};