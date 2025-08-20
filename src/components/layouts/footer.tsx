import { InfoIcon } from "lucide-react";
import Link from "next/link";
import { SiGithub } from "react-icons/si"

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return(
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 max-md:py-4 max-md:pb-6 flex justify-center bottom-0 w-full">
      <div className="w-[80%] mx-auto flex flex-col items-center justify-between gap-2 md:h-16 md:flex-row">
        <div className="text-center md:text-left">
          <p className="text-xs md:text-sm leading-loose text-muted-foreground">
            Built by Nazril.
          </p>
          <p className="text-xs md:text-sm leading-loose text-muted-foreground">
            © {currentYear} NZDigest. All rights reserved.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/about"
            className="text-xs md:text-sm font-medium underline underline-offset-4 flex items-center gap-1"
          >
            <InfoIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
            About
          </Link>
          <a
            href="https://github.com/na-x-ril/"
            target="_blank"
            rel="noreferrer"
            className="text-xs md:text-sm font-medium underline underline-offset-4 flex items-center gap-1"
          >
            <SiGithub className="h-3.5 w-3.5 md:h-4 md:w-4" />
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}