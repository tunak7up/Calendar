const sequelize = require('../config/db');
const person = require('./person');
const task = require('./task');
const daily_report = require('./daily_report');
const request = require('./request');
const request_detail = require('./request_detail');
const response = require('./response');
const comment = require('./comment');
const comment_attachment = require('./comment_attachment');
const report_attachment = require('./report_attachment');
const task_participant = require('./task_participant');
const role = require('./role');
const task_attachment = require('./task_attachment');
const notification = require('./notification');
const schedule = require('./schedule');

person.hasMany(task, { foreignKey: 'assigner_id', as: 'assigned_tasks' });
task.belongsTo(person, { foreignKey: 'assigner_id', as: 'assigner' });
person.hasMany(task, { foreignKey: 'created_by', as: 'created_tasks' });
task.belongsTo(person, { foreignKey: 'created_by', as: 'creator' });

person.hasMany(daily_report, { foreignKey: 'person_id', as: 'daily_reports' });
daily_report.belongsTo(person, { foreignKey: 'person_id', as: 'reporter' });

person.hasMany(request, { foreignKey: 'requester_id', as: 'requests' });
request.belongsTo(person, { foreignKey: 'requester_id', as: 'requester' });
person.hasMany(request, { foreignKey: 'approver_id', as: 'approvals' });
request.belongsTo(person, { foreignKey: 'approver_id', as: 'approver' });

comment.belongsTo(task, { foreignKey: 'task_id', as: 'task' });
task.hasMany(comment, { foreignKey: 'task_id', as: 'comments' });
comment.belongsTo(person, { foreignKey: 'person_id', as: 'commenter' });
person.hasMany(comment, { foreignKey: 'person_id', as: 'comments' });

comment_attachment.belongsTo(comment, { foreignKey: 'comment_id', as: 'comment' });
comment.hasMany(comment_attachment, { foreignKey: 'comment_id', as: 'attachments' });

report_attachment.belongsTo(daily_report, { foreignKey: 'report_id', as: 'daily_report' });
daily_report.hasMany(report_attachment, { foreignKey: 'report_id', as: 'attachments' });

task_attachment.belongsTo(task, { foreignKey: 'task_id', as: 'task' });
task.hasMany(task_attachment, { foreignKey: 'task_id', as: 'attachments' });

task.hasMany(person, { through: task_participant, foreignKey: 'task_id', as: 'participants' });
person.hasMany(task, { through: task_participant, foreignKey: 'participant_id', as: 'participating_tasks' });
role.hasMany(person, { through: task_participant, foreignKey: 'role_id', as: 'persons' });
person.hasMany(role, { through: task_participant, foreignKey: 'person_id', as: 'roles' });

notification.belongsTo(person, { foreignKey: 'notificate_to', as: 'recipient' });
person.hasMany(notification, { foreignKey: 'notificate_to', as: 'notifications' });
notification.belongsTo(person, { foreignKey: 'sender_id', as: 'sender' });
person.hasMany(notification, { foreignKey: 'sender_id', as: 'sent_notifications' });

request_detail.belongsTo(request, { foreignKey: 'request_id', as: 'request' });
request.hasMany(request_detail, { foreignKey: 'request_id', as: 'details' });

response.belongsTo(request, { foreignKey: 'request_id', as: 'request' });
request.hasMany(response, { foreignKey: 'request_id', as: 'responses' });
response.belongsTo(person, { foreignKey: 'responser_id', as: 'responser' });
person.hasMany(response, { foreignKey: 'responser_id', as: 'responses' });

schedule.belongsTo(person, { foreignKey: 'person_id', as: 'person' });
person.hasMany(schedule, { foreignKey: 'person_id', as: 'schedules' });

async function testConnection() {
  try {
    await sequelize.sync({ force: true });
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } 
}

testConnection();

module.exports = {
    person,
    task,
    daily_report,
    request,
    request_detail,
    response,
    comment,
    comment_attachment,
    report_attachment,
    task_participant,
    role,
    task_attachment,
    notification,
    schedule
};