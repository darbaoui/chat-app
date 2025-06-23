const { fontFamily, colors } = require('tailwindcss/defaultTheme');
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './components/**/**/*.{js,jsx}',
    './components/**/**/**/*.{js,jsx}',
    './examples/**/*.{js,jsx}',
    './examples/**/**/*.{js,jsx}',
    './examples/**/**/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './icons/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
    './src/**/**/*.{js,jsx}',
    './data/**/*.{js,jsx}',
    './layouts/**/*.{js,jsx}',
    './lib/*.{js,jsx}',
  ],
  theme: {
    container: {
      center: true,
      // padding: "2rem",
      screens: {
        '2xl': '1200px',
      },
    },
    extend: {
      spacing: {
        4.5: '18px', // Adds 4.5 to the spacing scale
      },
      width: {
        4.5: '1.125rem', // 18px
        5.5: '1.375rem', // 22px
        8.5: '2.125rem', // 34px
        7.5: '1.875rem', // 30px
        187.5: '46.875rem', // 750px
        220.5: '55.125rem', // 882px
        6.5: '1.625rem', // 26px
      },
      height: {
        4.5: '1.125rem', // 18px
        7.5: '1.875rem', // 30px
        5.5: '1.375rem', // 22px
        8.5: '2.125rem', // 34px
        6.5: '1.625rem', // 26px
      },
      fontSize: {
        sm: [
          '13px',
          {
            lineHeight: '20px',
          },
        ],
        13: '13px',
        exs: '11px',
        10: '10px',
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans],
      },
      colors: {
        chatBox: 'var(--chat-box-color)',
        chat: 'var(--chat-background)',
        'chat-sp': 'var(--chat-sperator)',
        chatBoxMe: {
          DEFAULT: 'var(--chat-box-me)',
          foreground: 'var(--chat-box-me-forground)',
        },
        sideMenu: 'var(--side_menu-background)',
        title: {
          DEFAULT: 'var(--title)',
          secondary: 'var(--title-secondary)',
        },
        meta: 'var(--meta)',
        'meta-icon': 'var(--meta-icon)',
        'box-bg': 'var(--box-bg)',
        'base-alt': 'var(--base-alt)',
        field: 'var(--field)',
        'field-off': 'var(--field-off)',
        'accent-2': 'var(--accent-2)',
        kanban: 'var(--kanban-bg)',
        'border-kanban': 'var(--border-kanban)',
        description: 'var(--description)',
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },

        bg: {
          DEFAULT: 'var(--bg-colors)',
          alt: 'var(--bg-colors-alt)',
        },
        red: {
          ...colors.red,
          950: 'var(--red-title)',
          900: 'var(--red-meta)',
          300: 'var(--red-stroke)',
          200: 'var(--red-bg-2)',
          100: 'var(--red-bg)',
        },
        orange: {
          ...colors.orange,
          950: 'var(--orange-title)',
          900: 'var(--orange-meta)',
          300: 'var(--orange-stroke)',
          200: 'var(--orange-bg-2)',
          100: 'var(--orange-bg)',
        },
        yellow: {
          ...colors.yellow,
          950: 'var(--yellow-title)',
          900: 'var(--yellow-meta)',
          300: 'var(--yellow-stroke)',
          200: 'var(--yellow-bg-2)',
          100: 'var(--yellow-bg)',
        },
        olive: {
          950: 'var(--olive-title)',
          900: 'var(--olive-meta)',
          300: 'var(--olive-stroke)',
          200: 'var(--olive-bg-2)',
          100: 'var(--olive-bg)',
        },
        green: {
          ...colors.green,
          950: 'var(--green-title)',
          900: 'var(--green-meta)',
          400: 'var(--green-h)',
          300: 'var(--green-stroke)',
          200: 'var(--green-bg-2)',
          100: 'var(--green-bg)',
        },
        teal: {
          ...colors.teal,
          950: 'var(--teal-title)',
          900: 'var(--teal-meta)',
          300: 'var(--teal-stroke)',
          200: 'var(--teal-bg-2)',
          100: 'var(--teal-bg)',
        },
        blue: {
          ...colors.blue,
          950: 'var(--blue-title)',
          900: 'var(--blue-meta)',
          300: 'var(--blue-stroke)',
          200: 'var(--blue-bg)',
          100: 'var(--blue-bg-2)',
        },
        violette: {
          950: 'var(--violette-title)',
          900: 'var(--violette-meta)',
          300: 'var(--violette-stroke)',
          200: 'var(--violette-bg-2)',
          100: 'var(--violette-bg)',
        },
        purple: {
          ...colors.purple,
          950: 'var(--purple-title)',
          900: 'var(--purple-meta)',
          300: 'var(--purple-stroke)',
          200: 'var(--purple-bg-2)',
          100: 'var(--purple-bg)',
        },
        pink: {
          ...colors.pink,
          950: 'var(--pink-title)',
          900: 'var(--pink-meta)',
          300: 'var(--pink-stroke)',
          200: 'var(--pink-bg-2)',
          100: 'var(--pink-bg)',
        },
        gray: {
          ...colors.gray,
          950: 'var(--gray-title)',
          900: 'var(--gray-meta)',
          300: 'var(--gray-stroke)',
          200: 'var(--gray-bg-2)',
          100: 'var(--gray-bg)',
        },
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'caret-blink': {
          '0%,70%,100%': { opacity: '1' },
          '20%,50%': { opacity: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'caret-blink': 'caret-blink 1.25s ease-out infinite',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '3xl': '20px',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      borderWidth: {
        0.5: '0.5px',
      },
      boxShadow: {
        box: 'rgb(0 0 0 / 9%) 0px 3px 6px',
        'ring-bottom': '0px 1px 0px 0px var(--border)', // Customize the shadow effect
        'ring-top': '0 -1px 0 0 var(--border)',

        // modal: 'rgba(0, 0, 0, 0.5) 0px 16px 70px',
        // dropDown:"var(--border) 0px 0px 0px 1px inset;",
        // dropDownCard: "var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)"
      },
      borderColor: ({ theme }) => ({
        ...theme('colors'),
        DEFAULT: 'var(--border)',
        dropdown: 'var(--border-dropdown)',
      }),
    },
  },
  plugins: [require('tailwindcss-animate')],
};
