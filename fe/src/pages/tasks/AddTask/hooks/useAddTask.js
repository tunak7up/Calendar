import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../../../services/api';
import { taskService } from '../../../../services/taskService';
import { fileService } from '../../../../services/fileService';
import { useAuth } from '../../../../context/AuthContext';

export function useAddTask() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString();
  const initialDateFromState = location.state?.date;
  const initialDate = initialDateFromState && initialDateFromState >= todayStr ? initialDateFromState : todayStr;

  const initialState = {
    taskName: '',
    description: '',
    startDate: initialDate,
    startTime: '00:01',
    dueDate: initialDate,
    endTime: '23:59',
    assigner: '',
    priority: 'Medium',
    subTasks: [],
    assignees: location.state?.assignee ? [location.state.assignee] : []
  };

  const [formData, setFormData] = useState(initialState);
  const [isSubTaskModalOpen, setIsSubTaskModalOpen] = useState(false);
  const [managers, setManagers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);

  const [isStartCalOpen, setIsStartCalOpen] = useState(false);
  const [isDueCalOpen, setIsDueCalOpen] = useState(false);

  const startCalRef = useRef(null);
  const dueCalRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const validFiles = [];
    for (const file of files) {
      const validation = fileService.validateFile(file);
      if (!validation.valid) {
        alert(t('file.upload_error', { name: file.name, error: validation.error }));
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length > 0) {
      setPendingFiles(prev => [...prev, ...validFiles]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePendingFile = (index) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const result = await apiFetch('/person');
        if (result.success && Array.isArray(result.data)) {
          const persons = result.data;
          const managersList = persons.filter(p => p.role === 'manager');
          setManagers(managersList);
          setAllUsers(persons);

          let initialAssignees = location.state?.assignee ? [location.state.assignee] : [];
          if (currentUser) {
            const self = persons.find(p => p.person_id === currentUser.person_id || p.name === currentUser.name || p.username === currentUser.username);
            if (self) {
              const alreadyAdded = initialAssignees.some(a => a.person_id === self.person_id || a.name === self.name);
              if (!alreadyAdded) {
                initialAssignees = [...initialAssignees, { name: self.name, role: 'assignee', person_id: self.person_id }];
              }
            }
          }

          setFormData(prev => ({ 
            ...prev, 
            assigner: managersList.length > 0 ? managersList[0].name : '',
            assignees: initialAssignees
          }));
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, [currentUser, location.state?.assignee]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (startCalRef.current && !startCalRef.current.contains(event.target)) setIsStartCalOpen(false);
      if (dueCalRef.current && !dueCalRef.current.contains(event.target)) setIsDueCalOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReset = () => {
    let initialAssignees = location.state?.assignee ? [location.state.assignee] : [];
    if (currentUser) {
      const self = allUsers.find(p => p.person_id === currentUser.person_id || p.name === currentUser.name || p.username === currentUser.username);
      if (self) {
        const alreadyAdded = initialAssignees.some(a => a.person_id === self.person_id || a.name === self.name);
        if (!alreadyAdded) {
          initialAssignees = [...initialAssignees, { name: self.name, role: 'assignee', person_id: self.person_id }];
        }
      }
    }
    setFormData({
      ...initialState,
      assigner: managers.length > 0 ? managers[0].name : '',
      assignees: initialAssignees
    });
  };

  const handleSubmit = async () => {
    try {
      const assignerUser = managers.find(m => m.name === formData.assigner);
      const assigner_id = assignerUser ? assignerUser.person_id : null;

      const task_participants = formData.assignees.map(a => {
        const p = allUsers.find(u => u.name === a.name);
        return {
          participant_id: p ? p.person_id : null,
          role: a.role.charAt(0).toUpperCase() + a.role.slice(1)
        };
      }).filter(p => p.participant_id !== null);

      const sub_tasks = formData.subTasks.map(st => ({
        ...st,
        status: 'pending',
        priority: st.priority.toLowerCase()
      }));

      const start_time = new Date(`${formData.startDate}T${formData.startTime}:00`).toISOString();
      const due_date = new Date(`${formData.dueDate}T${formData.endTime}:00`).toISOString();

      const payload = {
        assigner_id,
        start_time,
        due_date,
        title: formData.taskName,
        status: 'pending',
        description: formData.description,
        priority: formData.priority.toLowerCase(),
        sub_tasks,
        task_participants
      };

      const result = await taskService.createTask(payload);
      if (result.success) {
        const newTaskId = result.data.task_id || result.data.id;

        if (pendingFiles.length > 0 && newTaskId) {
          for (const file of pendingFiles) {
            const validation = fileService.validateFile(file);
            if (!validation.valid) {
              alert(t('file.upload_error', { name: file.name, error: validation.error }));
              continue;
            }

            const uploadData = new FormData();
            uploadData.append('file', file);
            uploadData.append('attachable_type', 'task');
            uploadData.append('attachable_id', newTaskId);
            try {
              await apiFetch('/file-attachment/upload', { method: 'POST', body: uploadData });
            } catch (error) {
              console.error('Upload error:', error);
              alert(t('file.upload_error', { name: file.name, error: error.message }));
            }
          }
        }

        alert(t('addtask.alert_success'));
        handleReset();
        setPendingFiles([]);
        navigate('/tasks');
      } else {
        alert(t('addtask.alert_error') + result.message);
      }
    } catch (err) {
      console.error("Error creating task", err);
      alert(err.message || "An unexpected error occurred. Please try again.");
    }
  };

  const addAssignee = (personId) => {
    const user = allUsers.find(u => u.person_id.toString() === personId.toString() || u.name === personId);
    if (user && !formData.assignees.some(a => a.name === user.name)) {
      setFormData({
        ...formData,
        assignees: [...formData.assignees, { name: user.name, role: 'assignee', person_id: user.person_id }]
      });
    }
  };

  const updateAssigneeRole = (personIdOrName, role) => {
    setFormData({
      ...formData,
      assignees: formData.assignees.map(a => 
        (a.person_id?.toString() === personIdOrName.toString() || a.name === personIdOrName) 
        ? { ...a, role } 
        : a
      )
    });
  };

  const removeAssignee = (personIdOrName) => {
    setFormData({ 
      ...formData, 
      assignees: formData.assignees.filter(a => !(a.person_id?.toString() === personIdOrName.toString() || a.name === personIdOrName))
    });
  };

  return {
    t,
    navigate,
    todayStr,
    formData,
    setFormData,
    isSubTaskModalOpen,
    setIsSubTaskModalOpen,
    managers,
    allUsers,
    pendingFiles,
    isStartCalOpen,
    setIsStartCalOpen,
    isDueCalOpen,
    setIsDueCalOpen,
    startCalRef,
    dueCalRef,
    fileInputRef,
    handleFileSelect,
    handleRemovePendingFile,
    handleSubmit,
    addAssignee,
    updateAssigneeRole,
    removeAssignee
  };
}
