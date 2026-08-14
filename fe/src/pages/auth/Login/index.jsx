import React from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import LanguageSelector from '../../../components/LanguageSelector';
import { useLogin } from './hooks/useLogin';

export default function Login({ onLogin }) {
  const {
    t,
    username,
    setUsername,
    password,
    setPassword,
    savePassword,
    setSavePassword,
    showPassword,
    setShowPassword,
    isLoading,
    isChecking,
    error,
    handleSubmit
  } = useLogin({ onLogin });

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
          <p className="mt-4 text-sm font-semibold text-gray-500 tracking-wide">
            {t('login.checking_session', { defaultValue: 'Đang kiểm tra phiên đăng nhập...' })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 relative">
      {/* Floating Language Selector */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSelector />
      </div>

      {/* Card */}
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-10">
          <img src="/kis_vietnam_creative_logo.jpeg" alt="Logo" className="w-16 h-16 rounded-2xl object-cover shadow-lg mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight" data-customizable-id="login-welcome" data-customizable-type="text">{t('login.welcome')}</h1>
          <p className="text-sm text-gray-400 mt-1 text-center" data-customizable-id="login-subtitle" data-customizable-type="text">{t('login.subtitle')}</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium text-center">
              {error === 'auth_error' ? t('login.error_auth') : error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 tracking-wider uppercase">
                {t('login.username')}
              </label>
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('login.username_placeholder')}
                required
                className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-[0.95rem] text-gray-900 placeholder:text-gray-300 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 tracking-wider uppercase">
                {t('login.password')}
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('login.password_placeholder')}
                  required
                  className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 pr-11 text-[0.95rem] text-gray-900 placeholder:text-gray-300 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword
                    ? <EyeSlashIcon className="w-5 h-5" />
                    : <EyeIcon className="w-5 h-5" />
                  }
                </button>
              </div>
            </div>

            {/* Save password */}
            <label className="flex items-center gap-3 cursor-pointer select-none group">
              <div
                onClick={() => setSavePassword(v => !v)}
                className={`relative w-10 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${savePassword ? 'bg-blue-500' : 'bg-gray-200'}`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${savePassword ? 'translate-x-4' : 'translate-x-0'}`}
                />
              </div>
              <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                {t('login.remember_me')}
              </span>
            </label>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              data-customizable-id="btn-login-submit"
              data-customizable-type="bg"
              className="mt-1 w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl py-3 text-[0.95rem] shadow-md shadow-blue-100 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <span>{t('login.logging_in')}</span>
                </>
              ) : (
                <span>{t('login.login_button')}</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-6">
          {t('login.footer_help')}
        </p>
      </div>
    </div>
  );
}
