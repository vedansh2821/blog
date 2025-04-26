
import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
        fontFamily: {
            // Use the CSS variable defined in layout.tsx
            sans: ['var(--font-inter)', 'sans-serif'],
            // Keep mono if needed, or remove if Inter is the only font
            // mono: ['var(--font-geist-mono)', 'monospace'],
        },
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
         typography: ({ theme }: { theme: any }) => ({
           DEFAULT: {
             css: {
               '--tw-prose-body': theme('colors.foreground / 0.9'),
               '--tw-prose-headings': theme('colors.foreground'),
               '--tw-prose-lead': theme('colors.foreground / 0.8'),
               '--tw-prose-links': theme('colors.primary.DEFAULT'),
               '--tw-prose-bold': theme('colors.foreground'),
               '--tw-prose-counters': theme('colors.muted.foreground'),
               '--tw-prose-bullets': theme('colors.muted.foreground'),
               '--tw-prose-hr': theme('colors.border'),
               '--tw-prose-quotes': theme('colors.foreground'),
               '--tw-prose-quote-borders': theme('colors.primary.DEFAULT / 0.5'),
               '--tw-prose-captions': theme('colors.muted.foreground'),
               '--tw-prose-code': theme('colors.foreground'),
               '--tw-prose-pre-code': theme('colors.foreground'), // Adjust pre code color if needed
               '--tw-prose-pre-bg': theme('colors.secondary.DEFAULT'),
               '--tw-prose-th-borders': theme('colors.border'),
               '--tw-prose-td-borders': theme('colors.border'),
               '--tw-prose-invert-body': theme('colors.foreground'), // Dark mode settings
               '--tw-prose-invert-headings': theme('colors.foreground'),
               '--tw-prose-invert-lead': theme('colors.foreground / 0.8'),
               '--tw-prose-invert-links': theme('colors.primary.DEFAULT'),
               '--tw-prose-invert-bold': theme('colors.foreground'),
               '--tw-prose-invert-counters': theme('colors.muted.foreground'),
               '--tw-prose-invert-bullets': theme('colors.muted.foreground'),
               '--tw-prose-invert-hr': theme('colors.border'),
               '--tw-prose-invert-quotes': theme('colors.foreground'),
               '--tw-prose-invert-quote-borders': theme('colors.primary.DEFAULT / 0.5'),
               '--tw-prose-invert-captions': theme('colors.muted.foreground'),
               '--tw-prose-invert-code': theme('colors.foreground'),
               '--tw-prose-invert-pre-code': theme('colors.foreground'),
               '--tw-prose-invert-pre-bg': theme('colors.muted.DEFAULT'), // Slightly different pre bg for dark
               '--tw-prose-invert-th-borders': theme('colors.border'),
               '--tw-prose-invert-td-borders': theme('colors.border'),
                // Remove backticks from code blocks
               'code::before': { content: 'none' },
               'code::after': { content: 'none' },
               code: {
                 fontWeight: '500',
                 backgroundColor: 'hsl(var(--muted) / 0.5)',
                 padding: '0.1em 0.3em',
                 borderRadius: '0.25rem',
               },
                pre: {
                  backgroundColor: 'hsl(var(--muted) / 0.7)', // Use prose pre-bg variable
                   color: 'hsl(var(--foreground) / 0.9)', // Use prose pre-code variable
                 },
                 // Style links within prose
                 a: {
                   textDecoration: 'none',
                   fontWeight: '500',
                    transition: 'color 0.2s ease-in-out',
                   '&:hover': {
                     color: 'hsl(var(--primary) / 0.8)',
                     textDecoration: 'underline',
                   },
                 },
                 // Improve image spacing and captions
                  figure: {
                    marginTop: '2em',
                    marginBottom: '2em',
                  },
                  figcaption: {
                    textAlign: 'center',
                    marginTop: '0.5em',
                    fontSize: '0.875rem', // text-sm
                    color: 'hsl(var(--muted-foreground))',
                  },
                 // Adjust heading margins
                 'h1, h2, h3, h4, h5, h6': {
                      marginTop: '1.5em',
                      marginBottom: '0.8em',
                 },
                 // List styling
                 ul: {
                      listStyleType: 'disc', // Or 'square' etc.
                      paddingLeft: '1.5em',
                 },
                 ol: {
                      listStyleType: 'decimal',
                      paddingLeft: '1.5em',
                 },
                 li: {
                      marginTop: '0.5em',
                      marginBottom: '0.5em',
                 },
                  // Blockquote styling
                   blockquote: {
                        paddingLeft: '1em',
                        borderLeftWidth: '0.25rem', // 4px
                        borderLeftColor: 'hsl(var(--primary) / 0.5)', // Use prose variable
                        fontStyle: 'italic',
                        color: 'hsl(var(--foreground) / 0.9)', // Use prose variable
                    },
             },
           },
         }),
  	}
  },
  plugins: [
      require("tailwindcss-animate"),
      require('@tailwindcss/typography')
  ],
} satisfies Config;
