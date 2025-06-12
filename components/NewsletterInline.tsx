'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslations } from 'next-intl';

export default function NewsletterInline() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [validationError, setValidationError] = useState('');
  const t = useTranslations('newsletter');

  // 邮箱验证函数
  const validateEmail = (email: string) => {
    if (!email.trim()) {
      return t('validation.required');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return t('validation.invalid');
    }
    return '';
  };

  async function subscribe(e: FormEvent) {
    e.preventDefault();
    
    // 防止重复提交
    if (isLoading || isSubscribed) return;
    
    // 自定义验证
    const error = validateEmail(email);
    if (error) {
      setValidationError(error);
      return;
    }
    
    setValidationError('');
    setIsLoading(true);
    setMsg('');
    
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const { ok, error } = await res.json();
      
      if (ok) {
        setIsSubscribed(true);
        setEmail(''); // 清空邮箱输入
      } else {
        setMsg(`${t('error')}: ${error}`);
      }
    } catch (error) {
      setMsg(`${t('error')}: 网络错误`);
    } finally {
      setIsLoading(false);
    }
  }

  // 清除验证错误
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (validationError) {
      setValidationError('');
    }
  };

  return (
    <section className="relative mx-auto max-w-4xl rounded-3xl px-8 py-20 text-center text-white overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-500 dark:via-purple-500 dark:to-pink-500 shadow-xl mb-16">
      {/* 背景发光层 */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-2xl opacity-20" width="800" height="800">
          <circle cx="400" cy="400" r="300" fill="#ffffff" fillOpacity="0.1" />
        </svg>
      </div>

      <h2 className="text-3xl font-bold">{t('title')}</h2>
      <p className="mx-auto mt-4 max-w-2xl text-lg sm:text-xl text-white/90">
        {t('description')}
      </p>

      {!isSubscribed ? (
        <form
          onSubmit={subscribe}
          className="mt-8 flex flex-col gap-4 max-w-2xl mx-auto"
          noValidate
        >
          <div className="flex flex-row justify-center gap-4">
            <input
              type="email"
              value={email}
              onChange={e => handleEmailChange(e.target.value)}
              placeholder={t('placeholder')}
              disabled={isLoading}
              className={`flex-1 rounded-md px-4 py-3 text-black placeholder-gray-500 bg-white focus:outline-none focus:ring-2 min-w-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                validationError 
                  ? 'focus:ring-red-300 border-2 border-red-300' 
                  : 'focus:ring-white/60'
              }`}
            />
            <button 
              type="submit" 
              disabled={isLoading}
              className="px-6 py-3 bg-white text-blue-600 font-medium rounded-md hover:bg-gray-100 transition-colors whitespace-nowrap flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  {t('loading')}
                </>
              ) : (
                t('button')
              )}
            </button>
          </div>
          
          {/* 自定义验证错误提示 */}
          {validationError && (
            <div className="flex justify-center">
              <p className="text-sm text-red-200 bg-red-500/20 py-1 px-3 rounded-full">
                ⚠️ {validationError}
              </p>
            </div>
          )}
        </form>
      ) : (
        <div className="mt-8 p-6 bg-green-500/20 border border-green-400/30 rounded-lg max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-medium">{t('subscribed')}</p>
          </div>
          <p className="text-sm text-white/90">{t('success')}</p>
        </div>
      )}

      {msg && !isSubscribed && (
        <p className="mt-4 text-sm text-white/90 bg-white/10 py-2 px-4 rounded-full inline-block">
          {msg}
        </p>
      )}
    </section>
  );
} 