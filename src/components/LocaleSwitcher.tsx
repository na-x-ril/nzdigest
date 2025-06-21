
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/navigation';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTransition } from 'react';

export default function LocaleSwitcher() {
  const t = useTranslations('LocaleSwitcher');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const onSelectChange = (nextLocale: string) => {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "bg-background/80 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60 hover:bg-accent/70",
            isPending && "opacity-50 cursor-not-allowed"
          )}
          disabled={isPending}
        >
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">{t('label')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn(
           "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 text-foreground border-border/80"
        )}
      >
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={onSelectChange}
        >
          <DropdownMenuRadioItem value="en">{t('en')}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="id">{t('id')}</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
