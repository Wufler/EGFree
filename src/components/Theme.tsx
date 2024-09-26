'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun, Monitor, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function Theme() {
	const [mounted, setMounted] = useState(false)
	const { theme, setTheme } = useTheme()

	useEffect(() => setMounted(true), [])

	if (!mounted) return null

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="icon"
					className="rounded-full size-10 bg-transparent border-none"
				>
					<Sun className="size-[25px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
					<Moon className="size-[25px] absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
					<span className="sr-only">Toggle theme</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="bg-epic-white dark:bg-epic-darkBlue">
				<DropdownMenuItem
					onClick={() => setTheme('light')}
					className="text-epic-black dark:text-epic-white"
				>
					<Sun className="mr-2 size-4" />
					<span>Light</span>
					{theme === 'light' && <Check className="ml-2 size-4" />}
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => setTheme('dark')}
					className="text-epic-black dark:text-epic-white"
				>
					<Moon className="mr-2 size-4" />
					<span>Dark</span>
					{theme === 'dark' && <Check className="ml-2 size-4" />}
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => setTheme('system')}
					className="text-epic-black dark:text-epic-white"
				>
					<Monitor className="mr-2 size-4" />
					<span>System</span>
					{theme === 'system' && <Check className="ml-2 size-4" />}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
