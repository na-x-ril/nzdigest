import Link from "next/link";
import { ModelSelectorDropdown } from "../ModelSelectorDropdown";
import { ThemeToggle } from "../theme-toggle";

export default function Header() {
  return(
    <header className="fixed h-16 top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex justify-center items-center">
      <div className="w-[80%] mx-auto flex h-14 items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-0">
            <span className="font-bold text-2xl text-primary">
              <span style={{ letterSpacing: '-0.120em' }}>NZD</span>
              <span className="ml-[2px] text-primary">igest</span>
            </span>
          </Link>
          <ModelSelectorDropdown />
        </div>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}