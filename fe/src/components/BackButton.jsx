import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

export default function BackButton({ onClick, className = '' }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBack = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`group flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors duration-200 active:scale-95 ${className}`}
    >
      <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
      <span>{t('taskdetails.back')}</span>
    </button>
  );
}
