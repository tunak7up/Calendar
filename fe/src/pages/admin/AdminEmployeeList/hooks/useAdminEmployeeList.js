import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../../../services/api';

export function useAdminEmployeeList() {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    company_card: '',
    role: 'employee',
    status: true
  });

  const fetchEmployees = useCallback(() => {
    apiFetch('/person')
      .then(data => {
        if (data.success) {
          setEmployees(data.data);
        }
      })
      .catch(error => console.error("Error fetching employees:", error))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const openModal = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        name: user.name,
        username: user.username,
        password: '',
        email: user.email || '',
        company_card: user.company_card || '',
        role: user.role || 'employee',
        status: user.status
      });
    } else {
      setSelectedUser(null);
      setFormData({
        name: '',
        username: '',
        password: '',
        email: '',
        company_card: '',
        role: 'employee',
        status: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = selectedUser
        ? `/person/${selectedUser.person_id}`
        : '/person';

      const method = selectedUser ? 'PUT' : 'POST';

      const payload = { ...formData };
      if (selectedUser && !payload.password) {
        delete payload.password;
      }

      const result = await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (result) {
        setIsModalOpen(false);
        fetchEmployees();
      }
    } catch (error) {
      console.error('Error saving user:', error);
      if (error.message && error.message.includes('Email already exists')) {
        alert(t('employees.error_duplicate_email', { defaultValue: 'Trùng email! Vui lòng sử dụng email khác.' }));
      } else if (error.message && error.message.includes('Username already exists')) {
        alert(t('employees.error_duplicate_username', { defaultValue: 'Trùng tên đăng nhập! Vui lòng sử dụng tên khác.' }));
      } else if (error.message && error.message.includes('Company card already exists')) {
        alert(t('employees.error_duplicate_company_card', { defaultValue: 'Trùng mã thẻ công ty! Vui lòng sử dụng mã khác.' }));
      } else {
        alert(t('employees.error_saving', { defaultValue: 'Error saving user' }));
      }
    }
  };

  const handleInlineUpdate = async (person_id, field, value) => {
    try {
      setEmployees(employees.map(e => e.person_id === person_id ? { ...e, [field]: value } : e));

      await apiFetch(`/person/${person_id}`, {
        method: 'PUT',
        body: JSON.stringify({ [field]: value })
      });
    } catch (error) {
      console.error('Error updating inline:', error);
      fetchEmployees();
    }
  };

  return {
    t,
    employees,
    loading,
    isModalOpen,
    setIsModalOpen,
    selectedUser,
    formData,
    setFormData,
    navigate,
    openModal,
    handleSave,
    handleInlineUpdate
  };
}
