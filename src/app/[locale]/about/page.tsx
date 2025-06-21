
import {useTranslations} from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BrainCircuitIcon, LightbulbIcon } from 'lucide-react';

export default function AboutPage() {
  const t = useTranslations('AboutPage');
  
  return (
    <div className="container mx-auto max-w-3xl py-8 px-4 sm:py-12">
      <Card className="shadow-lg rounded-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <BrainCircuitIcon className="h-16 w-16 text-primary" /> 
          </div>
          <CardTitle className="flex justify-center text-4xl font-headline tracking-tight gap-2">
            <span>{t('title')}</span>
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-foreground/90">
          <section aria-labelledby="what-is-nzdigest">
            <h2 id="what-is-nzdigest" className="text-2xl font-semibold mb-3 flex items-center">
              <LightbulbIcon className="mr-2 h-6 w-6 text-primary" />
              {t('whatIsItTitle')}
            </h2>
            <p className="leading-relaxed">
              {t('whatIsItContent')}
            </p>
          </section>

          <section aria-labelledby="how-it-works">
            <h2 id="how-it-works" className="text-2xl font-semibold mb-3 flex items-center">
              <BrainCircuitIcon className="mr-2 h-6 w-6 text-primary" />
              {t('howItWorksTitle')}
            </h2>
            <p className="leading-relaxed">
              {t('howItWorksContent')}
            </p>
            <ul className="list-disc list-inside space-y-1 pl-4 mt-2">
              <li>{t('howItWorksStep1')}</li>
              <li>{t('howItWorksStep2')}</li>
              <li>{t('howItWorksStep3')}</li>
            </ul>
            <p className="mt-2 leading-relaxed">
              {t('howItWorksPostContent')}
            </p>
          </section>

          <section aria-labelledby="our-mission">
            <h2 id="our-mission" className="text-2xl font-semibold mb-3">
              {t('missionTitle')}
            </h2>
            <p className="leading-relaxed">
              {t('missionContent')}
            </p>
          </section>

          <section aria-labelledby="tech-stack">
            <h2 id="tech-stack" className="text-2xl font-semibold mb-3">
              {t('techStackTitle')}
            </h2>
            <p className="leading-relaxed">
              {t('techStackContent')}
            </p>
            <ul className="list-disc list-inside space-y-1 pl-4 mt-2">
              <li>{t('techStackItem1')}</li>
              <li>{t('techStackItem2')}</li>
              <li>{t('techStackItem3')}</li>
              <li>{t('techStackItem4')}</li>
            </ul>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
