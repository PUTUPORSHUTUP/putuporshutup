import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
	extend: {
		colors: {
			border: 'hsl(var(--border))',
			input: 'hsl(var(--input))',
			ring: 'hsl(var(--ring))',
			background: 'hsl(var(--background))',
			foreground: 'hsl(var(--foreground))',
			primary: {
				DEFAULT: 'hsl(var(--primary))',
				foreground: 'hsl(var(--primary-foreground))'
			},
			secondary: {
				DEFAULT: 'hsl(var(--secondary))',
				foreground: 'hsl(var(--secondary-foreground))'
			},
			destructive: {
				DEFAULT: 'hsl(var(--destructive))',
				foreground: 'hsl(var(--destructive-foreground))'
			},
			muted: {
				DEFAULT: 'hsl(var(--muted))',
				foreground: 'hsl(var(--muted-foreground))'
			},
			accent: {
				DEFAULT: 'hsl(var(--accent))',
				foreground: 'hsl(var(--accent-foreground))'
			},
			popover: {
				DEFAULT: 'hsl(var(--popover))',
				foreground: 'hsl(var(--popover-foreground))'
			},
			card: {
				DEFAULT: 'hsl(var(--card))',
				foreground: 'hsl(var(--card-foreground))'
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
			},
			// Gaming-specific neon colors
			'neon-purple': 'hsl(var(--neon-purple))',
			'neon-cyan': 'hsl(var(--neon-cyan))',
			'neon-green': 'hsl(var(--neon-green))',
			'money-green': 'hsl(var(--money-green))'
		},
		backgroundImage: {
			'gradient-primary': 'var(--gradient-primary)',
			'gradient-secondary': 'var(--gradient-secondary)',
			'gradient-gaming': 'var(--gradient-gaming)'
		},
		boxShadow: {
			'glow-primary': 'var(--glow-primary)',
			'glow-secondary': 'var(--glow-secondary)',
			'glow-accent': 'var(--glow-accent)'
		},
		fontFamily: {
			'gaming': ['Orbitron', 'monospace'],
			'orbitron': ['Orbitron', 'sans-serif'],
		},
		borderRadius: {
			lg: 'var(--radius)',
			md: 'calc(var(--radius) - 2px)',
			sm: 'calc(var(--radius) - 4px)'
		},
		keyframes: {
			// Accordion animations
			'accordion-down': {
				from: { height: '0', opacity: '0' },
				to: { height: 'var(--radix-accordion-content-height)', opacity: '1' }
			},
			'accordion-up': {
				from: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
				to: { height: '0', opacity: '0' }
			},

			// Fade animations
			'fade-in': {
				'0%': { opacity: '0', transform: 'translateY(10px)' },
				'100%': { opacity: '1', transform: 'translateY(0)' }
			},
			'fade-in-up': {
				'0%': { opacity: '0', transform: 'translateY(20px)' },
				'100%': { opacity: '1', transform: 'translateY(0)' }
			},
			'fade-in-down': {
				'0%': { opacity: '0', transform: 'translateY(-20px)' },
				'100%': { opacity: '1', transform: 'translateY(0)' }
			},
			'fade-in-left': {
				'0%': { opacity: '0', transform: 'translateX(-20px)' },
				'100%': { opacity: '1', transform: 'translateX(0)' }
			},
			'fade-in-right': {
				'0%': { opacity: '0', transform: 'translateX(20px)' },
				'100%': { opacity: '1', transform: 'translateX(0)' }
			},

			// Scale animations
			'scale-in': {
				'0%': { transform: 'scale(0.9)', opacity: '0' },
				'100%': { transform: 'scale(1)', opacity: '1' }
			},
			'scale-in-center': {
				'0%': { transform: 'scale(0.95)', opacity: '0' },
				'100%': { transform: 'scale(1)', opacity: '1' }
			},
			'bounce-in': {
				'0%': { transform: 'scale(0.3)', opacity: '0' },
				'50%': { transform: 'scale(1.05)' },
				'70%': { transform: 'scale(0.9)' },
				'100%': { transform: 'scale(1)', opacity: '1' }
			},

			// Slide animations
			'slide-up': {
				'0%': { transform: 'translateY(100%)', opacity: '0' },
				'100%': { transform: 'translateY(0)', opacity: '1' }
			},
			'slide-down': {
				'0%': { transform: 'translateY(-100%)', opacity: '0' },
				'100%': { transform: 'translateY(0)', opacity: '1' }
			},
			'slide-left': {
				'0%': { transform: 'translateX(100%)', opacity: '0' },
				'100%': { transform: 'translateX(0)', opacity: '1' }
			},
			'slide-right': {
				'0%': { transform: 'translateX(-100%)', opacity: '0' },
				'100%': { transform: 'translateX(0)', opacity: '1' }
			},

			// Rotate animations
			'rotate-in': {
				'0%': { transform: 'rotate(-200deg) scale(0)', opacity: '0' },
				'100%': { transform: 'rotate(0deg) scale(1)', opacity: '1' }
			},
			'flip-in': {
				'0%': { transform: 'perspective(400px) rotateY(90deg)', opacity: '0' },
				'40%': { transform: 'perspective(400px) rotateY(-10deg)' },
				'70%': { transform: 'perspective(400px) rotateY(10deg)' },
				'100%': { transform: 'perspective(400px) rotateY(0deg)', opacity: '1' }
			},

			// Gaming-specific animations
			'neon-pulse': {
				'0%, 100%': { 
					textShadow: '0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor',
					transform: 'scale(1)'
				},
				'50%': { 
					textShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor',
					transform: 'scale(1.02)'
				}
			},
			'money-float': {
				'0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
				'50%': { transform: 'translateY(-10px) rotate(5deg)' }
			},
			'glow-pulse': {
				'0%, 100%': { boxShadow: 'var(--glow-primary)' },
				'50%': { boxShadow: '0 0 30px hsl(25 100% 55% / 0.8)' }
			},
			'glitch': {
				'0%': { transform: 'translate(0)' },
				'20%': { transform: 'translate(-2px, 2px)' },
				'40%': { transform: 'translate(-2px, -2px)' },
				'60%': { transform: 'translate(2px, 2px)' },
				'80%': { transform: 'translate(2px, -2px)' },
				'100%': { transform: 'translate(0)' }
			},
			'typing': {
				'0%': { width: '0ch' },
				'100%': { width: '20ch' }
			},
			'blink': {
				'0%, 50%': { opacity: '1' },
				'51%, 100%': { opacity: '0' }
			},

			// Micro-interactions
			'gentle-bounce': {
				'0%, 100%': { transform: 'translateY(0)' },
				'50%': { transform: 'translateY(-4px)' }
			},
			'wobble': {
				'0%': { transform: 'rotate(0deg)' },
				'15%': { transform: 'rotate(-5deg)' },
				'30%': { transform: 'rotate(5deg)' },
				'45%': { transform: 'rotate(-3deg)' },
				'60%': { transform: 'rotate(3deg)' },
				'75%': { transform: 'rotate(-1deg)' },
				'100%': { transform: 'rotate(0deg)' }
			},
			'heart-beat': {
				'0%': { transform: 'scale(1)' },
				'14%': { transform: 'scale(1.1)' },
				'28%': { transform: 'scale(1)' },
				'42%': { transform: 'scale(1.1)' },
				'70%': { transform: 'scale(1)' }
			},
			'flash': {
				'0%, 50%, 100%': { opacity: '1' },
				'25%, 75%': { opacity: '0' }
			}
		},
		animation: {
			// Basic animations
			'accordion-down': 'accordion-down 0.3s cubic-bezier(0.87, 0, 0.13, 1)',
			'accordion-up': 'accordion-up 0.3s cubic-bezier(0.87, 0, 0.13, 1)',
			
			// Fade animations
			'fade-in': 'fade-in 0.5s ease-out',
			'fade-in-up': 'fade-in-up 0.6s ease-out',
			'fade-in-down': 'fade-in-down 0.6s ease-out',
			'fade-in-left': 'fade-in-left 0.6s ease-out',
			'fade-in-right': 'fade-in-right 0.6s ease-out',
			
			// Scale animations
			'scale-in': 'scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
			'scale-in-center': 'scale-in-center 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
			'bounce-in': 'bounce-in 0.75s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
			
			// Slide animations
			'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
			'slide-down': 'slide-down 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
			'slide-left': 'slide-left 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
			'slide-right': 'slide-right 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
			
			// Rotate animations
			'rotate-in': 'rotate-in 0.6s ease-out',
			'flip-in': 'flip-in 0.6s ease-out',
			
			// Gaming animations
			'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
			'money-float': 'money-float 3s ease-in-out infinite',
			'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
			'glitch': 'glitch 0.3s ease-in-out',
			'typing': 'typing 2s steps(20, end) forwards',
			'blink': 'blink 1s step-end infinite',
			
			// Micro-interactions
			'gentle-bounce': 'gentle-bounce 0.6s ease-in-out',
			'wobble': 'wobble 1s ease-in-out',
			'heart-beat': 'heart-beat 1.3s ease-in-out infinite',
			'flash': 'flash 2s infinite',
			
			// Delayed animations for staggered effects
			'fade-in-delay-100': 'fade-in 0.5s ease-out 0.1s both',
			'fade-in-delay-200': 'fade-in 0.5s ease-out 0.2s both',
			'fade-in-delay-300': 'fade-in 0.5s ease-out 0.3s both',
			'fade-in-delay-500': 'fade-in 0.5s ease-out 0.5s both'
		}
	}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
