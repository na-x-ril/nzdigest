
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';

export default function NotFound() {
  const t = useTranslations('NotFound');
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-14rem)] text-center px-4">
      <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
      <p className="text-lg text-muted-foreground mb-6">{t('description')}</p>
      <Link href="/" className="text-primary underline hover:text-primary/80 transition-colors">
        {t('returnHome')}
      </Link>
    </div>
  );
}
