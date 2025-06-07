'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Velan Home – high-standard landing page
 * – Hero with background glow & CTA
 * – Features grid
 * – Latest blog posts (placeholder – replace with dynamic)
 * – Newsletter section
 */
export default function Home() {
  return (
    <main className="relative overflow-x-clip text-gray-900 dark:text-gray-100">
      {/* background radial gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex justify-center">
        <div className="h-[600px] w-[600px] rounded-full bg-blue-500/30 blur-3xl dark:bg-blue-400/20" />
      </div>

      {/* Hero Section */}
      <section className="mx-auto max-w-5xl px-6 pt-32 pb-24 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl font-extrabold leading-tight md:text-6xl"
        >
          Build <span className="text-blue-600 dark:text-blue-400">Systems</span>,<br />
          Craft <span className="text-blue-600 dark:text-blue-400">Clarity</span>
        </motion.h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-gray-600 dark:text-gray-400 md:text-xl">
          I'm Velan—solo system builder documenting the journey of designing
          intentional digital products & workflows.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/en/blog" className="inline-flex items-center gap-2">
              Read the Blog <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/about">About Me</Link>
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="mb-8 text-center text-3xl font-bold">What You'll Find Here</h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "In-depth Essays",
              desc: "Actionable long-form writing on system thinking, solo entrepreneurship, and digital craft.",
              icon: "📝",
            },
            {
              title: "Open-source Templates",
              desc: "Minimal Notion + Next.js blueprints you can copy for your own workflow.",
              icon: "📂",
            },
            {
              title: "Build-in-Public Logs",
              desc: "Transparent reports on revenue, experiments, and failures of running a one-person business.",
              icon: "📈",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-gray-200 bg-white/60 p-6 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-800/60"
            >
              <div className="mb-4 text-3xl">{f.icon}</div>
              <h3 className="mb-2 text-xl font-semibold">{f.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Latest Posts placeholder */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl font-bold">Latest Posts</h2>
          <Link href="/en/blog" className="text-blue-600 hover:underline dark:text-blue-400">
            View all →
          </Link>
        </div>
        {/* TODO: replace static cards with dynamic fetch */}
        <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <article
              key={i}
              className="rounded-xl border border-gray-200 p-5 transition hover:shadow-lg dark:border-gray-700"
            >
              <time className="text-sm text-gray-500 dark:text-gray-400">June 8, 2025</time>
              <h3 className="mt-2 text-lg font-semibold">
                <Link href="#">Why I Choose a One-Person Company</Link>
              </h3>
              <p className="mt-2 line-clamp-3 text-gray-600 dark:text-gray-400">
                Leaving corporate structures isn't an escape; it's stepping into a
                tighter personal operating system. Here's the philosophy and
                tactics behind that move…
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="mx-auto max-w-3xl rounded-2xl bg-blue-600 py-14 px-8 text-center text-white dark:bg-blue-500">
        <h2 className="text-3xl font-bold">Join the Velan Letter</h2>
        <p className="mx-auto mt-3 max-w-md text-lg">
          One concise email each month on building systems & living deliberately.
        </p>
        <form
          action="https://buttondown.email/api/subscribers"
          method="post"
          target="_blank"
          className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-center"
        >
          <input
            type="email"
            name="email"
            required
            placeholder="your@email.com"
            className="w-full rounded-md px-4 py-3 text-black placeholder-gray-400 bg-white/95 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <Button type="submit" size="lg" className="w-full sm:w-auto">
            Subscribe
          </Button>
        </form>
      </section>

      {/* Footer */}
      <footer className="mx-auto mt-24 max-w-4xl px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} Velan • Built with Next.js & Notion •
        <Link href="/about" className="ml-1 underline">
          About
        </Link>
      </footer>
    </main>
  );
}