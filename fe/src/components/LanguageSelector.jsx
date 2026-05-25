import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import vietnamFlag from '../assets/vn.svg';
import englishFlag from '../assets/us.svg';

const languages = [
  { code: 'vi', name: 'Tiếng Việt', flagUrl: vietnamFlag },
  { code: 'en', name: 'English', flagUrl: englishFlag }
];

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const currentLang = languages.find(lang => lang.code === (i18n.language || 'vi')) || languages[0];

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
  };

  return (
    <Menu as="div" className="relative ml-2">
      <MenuButton className="flex items-center justify-center rounded-full bg-white w-9 h-9 text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#86b7fe] focus:ring-offset-1 select-none active:scale-95 overflow-hidden">
        <img 
          src={currentLang.flagUrl} 
          alt={currentLang.name} 
          className="w-5.5 h-5.5 rounded-full object-cover border border-gray-100" 
          style={{ width: '22px', height: '22px' }}
        />
      </MenuButton>

      <MenuItems
        transition
        className="absolute right-0 z-50 mt-1.5 w-36 origin-top-right rounded-md bg-white py-1 shadow-lg border border-gray-100 transition focus:outline-none data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
      >
        {languages.map((lang) => {
          const isSelected = lang.code === currentLang.code;
          return (
            <MenuItem key={lang.code}>
              <button
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  isSelected 
                    ? 'bg-blue-50 text-blue-700 font-bold' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <img 
                  src={lang.flagUrl} 
                  alt={lang.name} 
                  className="rounded-full object-cover border border-gray-100"
                  style={{ width: '18px', height: '18px' }}
                />
                <span>{lang.name}</span>
              </button>
            </MenuItem>
          );
        })}
      </MenuItems>
    </Menu>
  );
}
