const sequelize = require('../config/db');
const person = require('./person');
const task = require('./task');
const daily_report = require('./daily_report');
const request = require('./request');
const request_detail = require('./request_detail');
const response = require('./response');
const comment = require('./comment');
const task_participant = require('./task_participant');
const notification = require('./notification');
const schedule = require('./schedule');
const refresh_token = require('./refresh_token');
const preset_reason = require('./preset_reason');
const theme_setting = require('./theme_setting');
const ai_agent = require('./ai_agent');
const task_status = require('./task_status');
const push_subscription = require('./pushSubscription');
const change_history = require('./change_history');
const fileAttachment = require('./fileAttachment');

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

task.belongsToMany(person, { through: task_participant, foreignKey: 'task_id', otherKey: 'participant_id', as: 'participants' });
person.belongsToMany(task, { through: task_participant, foreignKey: 'participant_id', otherKey: 'task_id', as: 'participating_tasks', onDelete: 'NO ACTION' });

task.hasMany(task_participant, { foreignKey: 'task_id', as: 'task_participants' });
task_participant.belongsTo(task, { foreignKey: 'task_id', as: 'task' });

person.hasMany(change_history, { foreignKey: 'changed_by', as: 'change_histories' });
change_history.belongsTo(person, { foreignKey: 'changed_by', as: 'changer', onDelete: 'NO ACTION' });

notification.belongsTo(person, { foreignKey: 'notificate_to', as: 'recipient' });
person.hasMany(notification, { foreignKey: 'notificate_to', as: 'notifications' });
notification.belongsTo(person, { foreignKey: 'sender_id', as: 'sender' });
person.hasMany(notification, { foreignKey: 'sender_id', as: 'sent_notifications' });

request_detail.belongsTo(request, { foreignKey: 'request_id', as: 'request' });
request.hasMany(request_detail, { foreignKey: 'request_id', as: 'details' });

response.belongsTo(request, { foreignKey: 'request_id', as: 'request' });
request.hasOne(response, { foreignKey: 'request_id', as: 'response' });
response.belongsTo(person, { foreignKey: 'responser_id', as: 'responser' });
person.hasMany(response, { foreignKey: 'responser_id', as: 'responses' });

schedule.belongsTo(person, { foreignKey: 'person_id', as: 'person' });
person.hasMany(schedule, { foreignKey: 'person_id', as: 'schedules' });

refresh_token.belongsTo(person, { foreignKey: 'person_id', as: 'person' });
person.hasMany(refresh_token, { foreignKey: 'person_id', as: 'refresh_tokens' });

preset_reason.hasMany(request, { foreignKey: 'preset_reason_id', as: 'requests' });
request.belongsTo(preset_reason, { foreignKey: 'preset_reason_id', as: 'preset_reason' });

person.hasMany(push_subscription, { foreignKey: 'person_id', as: 'push_subscriptions' });
push_subscription.belongsTo(person, { foreignKey: 'person_id', as: 'person' });

module.exports = {
    person,
    task,
    daily_report,
    request,
    request_detail,
    response,
    comment,
    task_participant,
    notification,
    schedule,
    refresh_token,
    preset_reason,
    theme_setting,
    ai_agent,
    task_status,
    push_subscription,
    change_history,
    fileAttachment
};