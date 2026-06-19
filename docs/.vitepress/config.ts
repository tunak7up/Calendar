import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Intern Management App',
  description: 'Hệ thống quản lý thực tập sinh và giao việc nội bộ',
  lang: 'vi-VN',
  base: '/', // Có thể cấu hình lại tuỳ môi trường deploy

  head: [
    ['meta', { name: 'theme-color', content: '#1976D2' }],
  ],

  themeConfig: {
    nav: [
      { text: 'Hướng dẫn', link: '/guide/installation' },
      { text: 'Sử dụng', link: '/usage/tasks' },
      { text: 'Tham khảo', link: '/reference/env-vars' },
    ],

    sidebar: [
      {
        text: 'Bắt đầu',
        items: [
          { text: 'Giới thiệu', link: '/guide/introduction' },
          { text: 'Cài đặt', link: '/guide/installation' },
          { text: 'Thiết lập ban đầu', link: '/guide/initial-setup' },
          { text: 'Cập nhật phiên bản', link: '/guide/updates' },
          { text: 'Tên miền & SSL', link: '/guide/domain-ssl' },
        ],
      },
      {
        text: 'Sử dụng',
        items: [
          { text: 'Dashboard', link: '/usage/dashboard' },
          { text: 'Quản lý Công việc', link: '/usage/tasks' },
          { text: 'Import/Export Excel', link: '/usage/import-export' },
          { text: 'Báo cáo ngày', link: '/usage/reports' },
          { text: 'Lịch làm việc', link: '/usage/schedule' },
          { text: 'Quản lý Yêu cầu', link: '/usage/requests' },
          { text: 'Thông báo & Email', link: '/usage/notifications' },
          { text: 'Thay đổi màu giao diện', link: '/usage/changecolor' },
        ],
      },
      {
        text: 'Quản trị',
        items: [
          { text: 'Quản lý Tài khoản & Phân quyền', link: '/admin/users' },
        ],
      },
      {
        text: 'Tham khảo',
        items: [
          { text: 'Biến môi trường', link: '/reference/env-vars' },
          { text: 'REST API', link: '/reference/api' },
        ],
      },
      {
        text: 'Hỗ trợ',
        items: [
          { text: 'FAQ & Xử lý lỗi', link: '/faq' },
          { text: 'Changelog', link: '/changelog' },
        ],
      },
    ],

    search: {
      provider: 'local',
    },

    footer: {
      message: 'Phát hành nội bộ',
      copyright: 'Copyright 2026',
    },
  },
})
