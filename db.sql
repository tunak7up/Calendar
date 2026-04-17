-- -------------------------------------------------------
-- Project Name: --------- Intern / Role & Permission Management
-- Database: ------------- SQL Server 
-- -------------------------------------------------------

-- ---------- TABLE USER -----------
CREATE TABLE [user] (
  user_id    int,
  name       varchar(256),
  password   varchar(256),
  status     BIT,            -- Đổi boolean thành BIT
  role       VARCHAR(50),    -- Đổi enum thành VARCHAR
  username   varchar(256),
  
  CONSTRAINT pk_user PRIMARY KEY (user_id)
);
GO

-- ---------- TABLE TASK -----------
CREATE TABLE task (
  task_id      int,
  parent_id    int,
  assigner_id  int,
  created_by   int,
  start_time   datetime,
  due_date     datetime,
  title        text,
  status       VARCHAR(50),  -- Đổi enum thành VARCHAR
  created_at   datetime,
  description  text,
  priority     VARCHAR(50),  -- Đổi enum thành VARCHAR
  ended_at     datetime,
  
  CONSTRAINT pk_task PRIMARY KEY (task_id)
);
GO

-- ---------- TABLE DAILY_REPORT -----------
CREATE TABLE daily_report (
  report_id    int,
  user_id      int,
  content      text,
  created_at   datetime,
  update_at    datetime,
  date_work    date,
  
  CONSTRAINT pk_daily_report PRIMARY KEY (report_id)
);
GO

-- ---------- TABLE REQUEST -----------
CREATE TABLE request (
  request_id   int,
  type_id      int,
  user_id      int,
  approver_id  int,
  reason       varchar(256),
  created_at   datetime,
  status       VARCHAR(50),  -- Đổi enum thành VARCHAR
  
  CONSTRAINT pk_request PRIMARY KEY (request_id)
);
GO

-- ---------- TABLE COMMENT -----------
CREATE TABLE comment (
  comment_id   int,
  task_id      int,
  user_id      int,
  content      text,
  create_at    datetime,
  
  CONSTRAINT pk_comment PRIMARY KEY (comment_id)
);
GO

-- ---------- TABLE TASK_USER -----------
CREATE TABLE task_user (
  id         int,
  task_id    int,
  user_id    int,
  role_id    int,
  
  CONSTRAINT pk_task_user PRIMARY KEY (id)
);
GO

-- ---------- TABLE ROLE -----------
CREATE TABLE role (
  role_id    int,
  role_name  varchar(256),
  
  CONSTRAINT pk_role PRIMARY KEY (role_id)
);
GO

-- ---------- TABLE SCHEDULE -----------
CREATE TABLE schedule (
  schedule_id  int,
  employee_id  int,
  start_time   datetime,
  end_time     datetime,
  
  CONSTRAINT pk_schedule PRIMARY KEY (schedule_id)
);
GO

-- ---------- TABLE REQUEST_TYPE -----------
CREATE TABLE request_type (
  type_id    int,
  type_name  varchar(256),
  
  CONSTRAINT pk_request_type PRIMARY KEY (type_id)
);
GO

-- ---------- TABLE NOTIFICATION -----------
CREATE TABLE notification (
  notification_id  int,
  user_id          int,
  sender_id        int,
  entity_type      varchar(256),
  entity_id        int,
  title            varchar(256),
  contents         text,
  is_read          BIT,            -- Đổi boolean thành BIT
  create_at        datetime,
  
  CONSTRAINT pk_notification PRIMARY KEY (notification_id)
);
GO

-- ---------- TABLE REQUEST_DETAIL -----------
CREATE TABLE request_detail (
  request_detail_id  int,
  request_id         int,
  date               date,
  shift              VARCHAR(50),  -- Đổi enum thành VARCHAR
  start_time         datetime,
  end_time           datetime,
  repeat_type        int,
  
  CONSTRAINT pk_request_detail PRIMARY KEY (request_detail_id)
);
GO

-- ---------- TABLE RESPONSE -----------
CREATE TABLE response (
  response_id    int,
  request_id     int,
  content        text,
  created_at     datetime,
  responser_id   int,
  
  CONSTRAINT pk_response PRIMARY KEY (response_id, request_id)
);
GO

-- ---------- TABLE REPEAT_TYPE -----------
CREATE TABLE repeat_type (
  repeat_type_id  int,
  type            VARCHAR(50),     -- Đổi enum thành VARCHAR
  
  CONSTRAINT pk_repeat_type PRIMARY KEY (repeat_type_id)
);
GO

-- ---------- TABLE REPORT_ATTACHMENT -----------
CREATE TABLE report_attachment (
  id         int,
  URL        text,
  report_id  int,
  
  CONSTRAINT pk_report_attachment PRIMARY KEY (id)
);
GO

-- ---------- TABLE COMMENT_ATTACHMENT -----------
CREATE TABLE comment_attachment (
  id          int,
  URL         text,
  comment_id  int,
  
  CONSTRAINT pk_comment_attachment PRIMARY KEY (id)
);
GO

-- ---------- TABLE TASK_ATTACHMENT -----------
CREATE TABLE task_attachment (
  id       int,
  URL      text,
  task_id  int,
  
  CONSTRAINT pk_task_attachment PRIMARY KEY (id)
);
GO

-- -------------------------------------------------------
-- FOREIGN KEYS 
-- -------------------------------------------------------

-- Khóa ngoại bảng TASK
ALTER TABLE task ADD CONSTRAINT fk_task_parent_id FOREIGN KEY (parent_id) REFERENCES task (task_id);
ALTER TABLE task ADD CONSTRAINT fk_task_assigner_id FOREIGN KEY (assigner_id) REFERENCES [user] (user_id);
ALTER TABLE task ADD CONSTRAINT fk_task_created_by FOREIGN KEY (created_by) REFERENCES [user] (user_id);
GO

-- Khóa ngoại bảng DAILY_REPORT
ALTER TABLE daily_report ADD CONSTRAINT fk_daily_report_user_id FOREIGN KEY (user_id) REFERENCES [user] (user_id);
GO

-- Khóa ngoại bảng REQUEST
ALTER TABLE request ADD CONSTRAINT fk_request_type_id FOREIGN KEY (type_id) REFERENCES request_type (type_id);
ALTER TABLE request ADD CONSTRAINT fk_request_user_id FOREIGN KEY (user_id) REFERENCES [user] (user_id);
ALTER TABLE request ADD CONSTRAINT fk_request_approver_id FOREIGN KEY (approver_id) REFERENCES [user] (user_id);
GO

-- Khóa ngoại bảng COMMENT
ALTER TABLE comment ADD CONSTRAINT fk_comment_task_id FOREIGN KEY (task_id) REFERENCES task (task_id);
ALTER TABLE comment ADD CONSTRAINT fk_comment_user_id FOREIGN KEY (user_id) REFERENCES [user] (user_id);
GO

-- Khóa ngoại bảng TASK_USER
ALTER TABLE task_user ADD CONSTRAINT fk_task_user_task_id FOREIGN KEY (task_id) REFERENCES task (task_id);
ALTER TABLE task_user ADD CONSTRAINT fk_task_user_user_id FOREIGN KEY (user_id) REFERENCES [user] (user_id);
ALTER TABLE task_user ADD CONSTRAINT fk_task_user_role_id FOREIGN KEY (role_id) REFERENCES role (role_id);
GO

-- Khóa ngoại bảng SCHEDULE
ALTER TABLE schedule ADD CONSTRAINT fk_schedule_employee_id FOREIGN KEY (employee_id) REFERENCES [user] (user_id);
GO

-- Khóa ngoại bảng NOTIFICATION
ALTER TABLE notification ADD CONSTRAINT fk_notification_user_id FOREIGN KEY (user_id) REFERENCES [user] (user_id);
ALTER TABLE notification ADD CONSTRAINT fk_notification_sender_id FOREIGN KEY (sender_id) REFERENCES [user] (user_id);
GO

-- Khóa ngoại bảng REQUEST_DETAIL
ALTER TABLE request_detail ADD CONSTRAINT fk_request_detail_request_id FOREIGN KEY (request_id) REFERENCES request (request_id);
ALTER TABLE request_detail ADD CONSTRAINT fk_request_detail_repeat_type FOREIGN KEY (repeat_type) REFERENCES repeat_type (repeat_type_id);
GO

-- Khóa ngoại bảng RESPONSE
ALTER TABLE response ADD CONSTRAINT fk_response_request_id FOREIGN KEY (request_id) REFERENCES request (request_id);
ALTER TABLE response ADD CONSTRAINT fk_response_responser_id FOREIGN KEY (responser_id) REFERENCES [user] (user_id);
GO

-- Khóa ngoại CÁC BẢNG ATTACHMENT
ALTER TABLE report_attachment ADD CONSTRAINT fk_report_attachment_report_id FOREIGN KEY (report_id) REFERENCES daily_report (report_id);
ALTER TABLE comment_attachment ADD CONSTRAINT fk_comment_attachment_comment_id FOREIGN KEY (comment_id) REFERENCES comment (comment_id);
ALTER TABLE task_attachment ADD CONSTRAINT fk_task_attachment_task_id FOREIGN KEY (task_id) REFERENCES task (task_id);
GO