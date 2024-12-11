'use client'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export default function ModeToggle() {
	const { setTheme, resolvedTheme } = useTheme()

	return (
		<Button
			variant="outline"
			size="icon"
			onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
			className="rounded-full size-10 bg-transparent border-none"
		>
			<Sun className="size-[25px] rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
			<Moon className="size-[25px] absolute rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
			<span className="sr-only">Toggle theme</span>
		</Button>
	)
}
