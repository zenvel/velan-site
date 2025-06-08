'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { Compass, Blocks, Globe, ExternalLink } from "lucide-react";
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Footer from '@/components/Footer';
import LocalizedHead from '@/components/LocalizedHead';

export default function About() {
  const t = useTranslations('About');
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  
  return (
    <>
      <LocalizedHead 
        titleKey="about.title" 
        descriptionKey="about.description" 
      />

      <main className="relative overflow-x-clip text-gray-900 dark:text-gray-100">
        {/* blurred background */}
        <div className="pointer-events-none absolute inset-0 -z-10 flex justify-center">
          <div className="h-[700px] w-[700px] rounded-full bg-purple-500/30 blur-3xl dark:bg-purple-400/20" />
        </div>

        {/* HERO */}
        <section className="mx-auto max-w-4xl px-6 pt-32 pb-24 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold mb-6"
          >
            {t('title')}
          </motion.h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t('bio')}
          </p>
        </section>

        {/* PHILOSOPHY */}
        <section className="mx-auto max-w-4xl px-6 pb-24">
          <h2 className="text-2xl font-semibold mt-12 mb-4">
            {t('philosophyTitle')}
          </h2>
          <p className="text-base">
            {t('philosophyText')}
          </p>
        </section>

        {/* MISSION & VISION */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <h2 className="mb-12 text-center text-3xl font-bold">{t('valuesTitle')}</h2>
          <div className="grid gap-10 md:grid-cols-3">
            {[
              {
                icon: <Compass className="h-8 w-8" />,
                title: t('mission.title'),
                desc: t('mission.desc'),
              },
              {
                icon: <Blocks className="h-8 w-8" />,
                title: t('vision.title'),
                desc: t('vision.desc'),
              },
              {
                icon: <Globe className="h-8 w-8" />,
                title: t('values.title'),
                desc: t('values.desc'),
              },
            ].map((card) => (
              <article
                key={card.title}
                className="rounded-2xl border border-gray-200 bg-white/50 p-8 backdrop-blur-lg dark:border-gray-700 dark:bg-gray-800/50"
              >
                <div className="mb-4 text-purple-600 dark:text-purple-400">{card.icon}</div>
                <h3 className="mb-2 text-2xl font-semibold">{card.title}</h3>
                <p className="text-gray-700 dark:text-gray-300">{card.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* TIMELINE */}
        <section className="mx-auto max-w-4xl px-6 pb-24">
          <h2 className="mb-12 text-center text-3xl font-bold">{t('timelineTitle')}</h2>
          <ol className="relative border-s border-gray-300 dark:border-gray-600">
            {[
              {
                year: "2010",
                heading: t('timeline.2010.title'),
                body: t('timeline.2010.desc'),
              },
              {
                year: "2015",
                heading: t('timeline.2015.title'),
                body: t('timeline.2015.desc'),
              },
              {
                year: "2023",
                heading: t('timeline.2023.title'),
                body: t('timeline.2023.desc'),
              },
              {
                year: "2025",
                heading: t('timeline.2025.title'),
                body: t('timeline.2025.desc'),
              },
            ].map((item) => (
              <li key={item.year} className="mb-10 ms-4">
                <div className="absolute -left-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 ring-8 ring-white dark:bg-purple-400 dark:ring-gray-900" />
                <time className="mb-1 text-sm font-normal leading-none text-gray-500 dark:text-gray-400">
                  {item.year}
                </time>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {item.heading}
                </h3>
                <p className="text-base font-normal text-gray-700 dark:text-gray-300">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* CALL TO ACTION */}
        <section className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 py-14 px-8 text-center text-white shadow-lg">
          <h2 className="text-3xl font-bold">{t('cta.title')}</h2>
          <p className="mx-auto mt-3 max-w-md text-lg">
            {t('cta.desc')}
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-6 bg-white text-purple-700 hover:bg-gray-100">
            <Link href="mailto:velan@zenvel.io" className="inline-flex items-center gap-2">
              {t('cta.button')} <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </section>

        {/* FOOTER */}
        <Footer />
      </main>
    </>
  );
} 