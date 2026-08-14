const { where } = require('sequelize');
const { person, task, task_participant, refresh_token } = require('../models');
const bcrypt = require('bcryptjs');

const getAllPersons = async () => {
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
    email,
    company_card
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

  const finalCompanyCard = (company_card && company_card.trim() !== '') ? company_card.trim() : null;
  if (finalCompanyCard) {
    const existingCard = await person.findOne({ where: { company_card: finalCompanyCard } });
    if (existingCard) {
      throw new Error('Company card already exists');
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
      email: finalEmail,
      company_card: finalCompanyCard
    });
};

const updatePerson = async (
  id,
  { name,
    password,
    status,
    role,
    username,
    email,
    company_card }) => {
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

  const finalCompanyCard = (company_card && company_card.trim() !== '') ? company_card.trim() : null;
  if (finalCompanyCard && finalCompanyCard !== data.company_card) {
    const existingCard = await person.findOne({ where: { company_card: finalCompanyCard } });
    if (existingCard) {
      throw new Error('Company card already exists');
    }
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (status !== undefined) updateData.status = status;
  if (role !== undefined) updateData.role = role;
  if (username !== undefined) updateData.username = username;
  if (email !== undefined) updateData.email = finalEmail;
  if (company_card !== undefined) updateData.company_card = finalCompanyCard;

  if (password && password.trim() !== '') {
    updateData.password = await bcrypt.hash(password, 10);
    // Xóa toàn bộ refresh token trong DB của person đó khi đổi mật khẩu
    await refresh_token.destroy({
      where: { person_id: id }
    });
    console.log(`[Person Service] Đã xóa toàn bộ refresh token cho person_id: ${id} do đổi mật khẩu.`);
  }

  if (status === false) {
    // Xóa toàn bộ refresh token nếu tài khoản bị vô hiệu hóa
    await refresh_token.destroy({
      where: { person_id: id }
    });
    console.log(`[Person Service] Đã xóa toàn bộ refresh token cho person_id: ${id} do vô hiệu hóa tài khoản.`);
  }

  return await data.update(updateData);
};

const removePerson = async (id) => {
  const data = await person.findByPk(id);
  if (!data) throw new Error('Person not found');
  await data.update({ status: false });
  // Xóa toàn bộ refresh token khi xóa/vô hiệu hóa person
  await refresh_token.destroy({
    where: { person_id: id }
  });
  console.log(`[Person Service] Đã xóa toàn bộ refresh token cho person_id: ${id} do xóa person.`);
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
  
  // Register in push_subscription table for multi-device support
  const { push_subscription } = require('../models');
  if (onesignalId && onesignalId.trim() !== '') {
    try {
      const existing = await push_subscription.findOne({
        where: { onesignal_id: onesignalId }
      });
      if (existing) {
        if (existing.person_id !== id) {
          await existing.update({ person_id: id });
          console.log(`[Person Service] Updated push subscription owner from person ${existing.person_id} to ${id}`);
        }
      } else {
        await push_subscription.create({
          person_id: id,
          onesignal_id: onesignalId
        });
      }
    } catch (err) {
      console.error('[Person Service] Error registering push subscription:', err);
    }
  }
  
  return data;
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