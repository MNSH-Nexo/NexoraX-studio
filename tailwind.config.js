/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // اضافه کردن این خط برای استفاده از کلاس 'dark' برای مدیریت تم
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6', // برای دکمه‌ها و هایلایت‌ها
        secondary: '#60a5fa', // برای گرادیانت‌ها
        accent: '#34d399', // برای دکمه‌های موفقیت
      },
      fontSize: {
        'xs': '0.75rem', // برای متن‌های کوچک زیرنویس
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // برای استایل بهتر input و textarea
  ],
}