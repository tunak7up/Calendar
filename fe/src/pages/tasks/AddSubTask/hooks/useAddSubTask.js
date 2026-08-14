import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { taskService } from '../../../../services/taskService';

export function useAddSubTask() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const parentTask = location.state?.parentTask;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    attachmentUrl: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!parentTask) return;

    const payload = {
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      parent_id: parentTask.task_id,
      assigner_id: parentTask.assigner_id,
      start_time: parentTask.start_time,
      due_date: parentTask.due_date,
      status: 'pending'
    };

    try {
      const result = await taskService.createSubTask(parentTask.task_id, payload);

      if (result.success) {
        if (formData.attachmentUrl.trim()) {
          const subTaskId = result.data.task_id;
          await taskService.createTaskAttachment({ 
            task_id: subTaskId, 
            url: formData.attachmentUrl.trim() 
          });
        }

        alert(t('addsubtask.alert_success'));
        navigate(-1);
      } else {
        alert(t('addsubtask.alert_error') + result.message);
      }
    } catch (error) {
      console.error('Error creating sub-task:', error);
      alert(t('addsubtask.alert_fail'));
    }
  };

  return {
    t,
    navigate,
    parentTask,
    formData,
    setFormData,
    handleSubmit
  };
}
