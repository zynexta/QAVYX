'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import {
  ERROR_PREFIX,
  FORM_NOTICE,
  OPTIONAL_MARKER,
  REQUIRED_MARKER,
  SELECT_PLACEHOLDER,
} from '@/content/forms';
import { CONTACT_FORM_FIELDS, CONTACT_FORM_SUBMIT, CONTACT_PAGE } from '@/content/company';
import { CONTACT } from '@/content/site';
import { WHATSAPP_HREF } from '@/components/nav/WhatsAppLink';
import { fieldError } from '@/lib/formValidation';
import type { FormField } from '@/types/forms';

export function ContactPageContent() {
  const prefix = useId();
  const noticeId = `${prefix}-notice`;

  const [values, setValues] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [selectOpen, setSelectOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
        setSelectOpen(false);
      }
    }
    if (selectOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectOpen]);

  const errorFor = (field: FormField): string | null =>
    touched[field.id] ? fieldError(field, values[field.id] ?? '') : null;

  return (
    <section
      id="qx-contact"
      aria-labelledby="qx-contact-heading"
      className="relative w-full pt-4 sm:pt-6 md:pt-8 pb-12 sm:pb-16 bg-black select-none overflow-hidden"
    >
      {/* Main Container - strictly adheres to project shell layout & margin standards, aligning with SiteHeader */}
      <div className="relative mx-auto max-w-[var(--qx-shell)] px-4 sm:px-5 md:px-6 w-full">
        {/* ==============================================================
            PAGE HEADER: LET'S GROW YOUR BUSINESS
            ============================================================== */}
        <div className="mb-6 sm:mb-8 text-left w-full">
          {/* Eyebrow: CONTACT US (Line removed as requested) */}
          <div className="mb-2">
            <span
              id="qx-contact-heading"
              className="font-mono text-xs uppercase tracking-[0.28em] text-[#919A94] font-medium"
            >
              CONTACT US
            </span>
          </div>

          {/* Heading - Scaled up to match site standards, responsive on mobile */}
          <h1 className="qx-display text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-[3.1rem] font-bold tracking-tight text-white leading-tight mb-2 sm:mb-3">
            <span className="block sm:inline">Let&apos;s Grow </span>
            <span className="text-[#2ABD00]">Your Business.</span>
          </h1>

          {/* Intro Description */}
          <p className="text-xs sm:text-sm md:text-base text-[#919A94] max-w-[640px] font-medium leading-relaxed font-sans">
            {CONTACT_PAGE.description}
          </p>
        </div>

        {/* ==============================================================
            THE TWO DUAL CARDS
            Wrapped in <article> for accessibility & test contracts.
            Card 2 (Channels) is 1st in DOM for a11y & tests, visual order-2.
            Card 1 (Form) is 2nd in DOM, visual order-1.
            ============================================================== */}
        <article className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch w-full">
            
            {/* ==========================================================
                CARD 2: GET IN TOUCH (Visual Right, DOM First)
                Col span: lg:col-span-5, lg:order-2
                ========================================================== */}
            <div className="lg:col-span-5 lg:order-2 relative flex flex-col justify-between p-4 sm:p-6 rounded-xl border border-[#2ABD00]/25 bg-gradient-to-b from-[#06180a]/90 via-[#031006]/95 to-[#010602]/98 backdrop-blur-xl shadow-[0_12px_36px_rgba(0,0,0,0.85)] hover:border-[#2ABD00]/40 transition-all duration-300">
              <div>
                {/* Header Row: | GET IN TOUCH */}
                <div className="flex items-center mb-3 sm:mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-3.5 bg-[#2ABD00] rounded-full inline-block" />
                    <span className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.2em] text-white font-bold">
                      GET IN TOUCH
                    </span>
                  </div>
                </div>

                {/* Heading - exactly 2 lines on mobile */}
                <h2 className="text-[17px] xs:text-xl sm:text-2xl md:text-[26px] font-bold text-white tracking-tight leading-snug mb-2">
                  <span className="block sm:inline">Prefer to </span>
                  <span className="text-[#2ABD00]">connect directly?</span>
                </h2>

                {/* Subtitle */}
                <p className="text-xs sm:text-sm text-[#919A94] leading-relaxed mb-5 font-medium font-sans max-w-[340px]">
                  You can also reach us via WhatsApp or email. We&apos;ll get back to you as soon as possible.
                </p>

                {/* 3 Channels List (ul required by e2e tests) - Square container around icon removed */}
                <ul className="flex flex-col gap-3 w-full">
                  {/* Channel 1: WHATSAPP */}
                  <li className="w-full">
                    <a
                      href={WHATSAPP_HREF}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/item flex items-center justify-between p-3.5 rounded-[3px] border border-white/10 bg-[#07150a]/75 hover:bg-[#091b0d] hover:border-[#2ABD00]/50 transition-all shadow-sm w-full"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="flex items-center justify-center text-[#2ABD00] shrink-0">
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                          </svg>
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#919A94] font-medium">
                            WHATSAPP
                          </span>
                          <span className="font-sans text-sm sm:text-base font-bold text-white group-hover/item:text-[#2ABD00] transition-colors whitespace-nowrap">
                            {CONTACT.whatsapp}
                          </span>
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-white/50 group-hover/item:text-white group-hover/item:translate-x-1 transition-all shrink-0 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </a>
                  </li>

                  {/* Channel 2: EMAIL */}
                  <li className="w-full">
                    <a
                      href={`mailto:${CONTACT.email}`}
                      className="group/item flex items-center justify-between p-3.5 rounded-[3px] border border-white/10 bg-[#07150a]/75 hover:bg-[#091b0d] hover:border-[#2ABD00]/50 transition-all shadow-sm w-full"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="flex items-center justify-center text-[#2ABD00] shrink-0">
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                          </svg>
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#919A94] font-medium">
                            EMAIL
                          </span>
                          <span className="font-sans text-sm sm:text-base font-bold text-white group-hover/item:text-[#2ABD00] transition-colors whitespace-nowrap">
                            {CONTACT.email}
                          </span>
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-white/50 group-hover/item:text-white group-hover/item:translate-x-1 transition-all shrink-0 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </a>
                  </li>

                  {/* Channel 3: LOCATIONS */}
                  <li className="w-full">
                    <div className="group/item flex items-center justify-between p-3.5 rounded-[3px] border border-white/10 bg-[#07150a]/75 hover:bg-[#091b0d] hover:border-[#2ABD00]/50 transition-all shadow-sm w-full">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="flex items-center justify-center text-[#2ABD00] shrink-0">
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                          </svg>
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#919A94] font-medium">
                            LOCATIONS
                          </span>
                          <span className="font-sans text-sm sm:text-base font-bold text-white group-hover/item:text-[#2ABD00] transition-colors whitespace-nowrap">
                            {CONTACT.locations}
                          </span>
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-white/50 group-hover/item:text-white group-hover/item:translate-x-1 transition-all shrink-0 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* ==========================================================
                CARD 1: SEND US A MESSAGE (Visual Left, DOM Second)
                Col span: lg:col-span-7, lg:order-1
                ========================================================== */}
            <div className="lg:col-span-7 lg:order-1 relative flex flex-col justify-between p-4 sm:p-6 rounded-xl border border-[#2ABD00]/25 bg-gradient-to-b from-[#06180a]/90 via-[#031006]/95 to-[#010602]/98 backdrop-blur-xl shadow-[0_12px_36px_rgba(0,0,0,0.85)] hover:border-[#2ABD00]/40 transition-all duration-300">
              <div>
                {/* Header Row: | SEND US A MESSAGE */}
                <div className="flex items-center mb-3 sm:mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-3.5 bg-[#2ABD00] rounded-full inline-block" />
                    <span className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.2em] text-white font-bold">
                      SEND US A MESSAGE
                    </span>
                  </div>
                </div>

                {/* Form Elements - Square inputs, NO visible REQUIRED text */}
                <form
                  aria-label={CONTACT_PAGE.cta}
                  noValidate
                  onSubmit={(e) => e.preventDefault()}
                  className="flex flex-col gap-2.5 w-full"
                >
                  {/* Field 1: NAME */}
                  {(() => {
                    const field = CONTACT_FORM_FIELDS[0]!;
                    const inputId = `${prefix}-${field.id}`;
                    const errorId = `${inputId}-error`;
                    const error = errorFor(field);
                    return (
                      <div className="flex flex-col gap-1 w-full">
                        <label htmlFor={inputId}>
                          <span className="font-mono text-[11px] sm:text-xs uppercase tracking-normal sm:tracking-wider text-white font-semibold">
                            {field.label}
                          </span>
                          <span className="sr-only">
                            {field.required ? REQUIRED_MARKER : OPTIONAL_MARKER}
                          </span>
                        </label>
                        <input
                          id={inputId}
                          name={field.id}
                          type="text"
                          placeholder="Your name"
                          value={values[field.id] ?? ''}
                          aria-required={field.required}
                          aria-invalid={error ? true : undefined}
                          aria-describedby={error ? errorId : undefined}
                          onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                          onBlur={() => setTouched((t) => ({ ...t, [field.id]: true }))}
                          className={`w-full h-[38px] rounded-[3px] border bg-[#061208]/90 px-3.5 text-xs sm:text-sm text-white placeholder:text-white/20 focus:border-[#2ABD00] focus:outline-none transition-colors ${
                            error ? 'border-[#2ABD00]' : 'border-white/10'
                          }`}
                        />
                        {error ? (
                          <p id={errorId} className="font-mono text-[9px] text-[#2ABD00]">
                            {ERROR_PREFIX} {error}
                          </p>
                        ) : null}
                      </div>
                    );
                  })()}

                  {/* Field 2: BUSINESS NAME */}
                  {(() => {
                    const field = CONTACT_FORM_FIELDS[1]!;
                    const inputId = `${prefix}-${field.id}`;
                    const errorId = `${inputId}-error`;
                    const error = errorFor(field);
                    return (
                      <div className="flex flex-col gap-1 w-full">
                        <label htmlFor={inputId}>
                          <span className="font-mono text-[11px] sm:text-xs uppercase tracking-normal sm:tracking-wider text-white font-semibold">
                            {field.label}
                          </span>
                          <span className="sr-only">
                            {field.required ? REQUIRED_MARKER : OPTIONAL_MARKER}
                          </span>
                        </label>
                        <input
                          id={inputId}
                          name={field.id}
                          type="text"
                          placeholder="Your business name"
                          value={values[field.id] ?? ''}
                          aria-required={field.required}
                          aria-invalid={error ? true : undefined}
                          aria-describedby={error ? errorId : undefined}
                          onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                          onBlur={() => setTouched((t) => ({ ...t, [field.id]: true }))}
                          className={`w-full h-[38px] rounded-[3px] border bg-[#061208]/90 px-3.5 text-xs sm:text-sm text-white placeholder:text-white/20 focus:border-[#2ABD00] focus:outline-none transition-colors ${
                            error ? 'border-[#2ABD00]' : 'border-white/10'
                          }`}
                        />
                        {error ? (
                          <p id={errorId} className="font-mono text-[9px] text-[#2ABD00]">
                            {ERROR_PREFIX} {error}
                          </p>
                        ) : null}
                      </div>
                    );
                  })()}

                  {/* Field 3: EMAIL */}
                  {(() => {
                    const field = CONTACT_FORM_FIELDS[2]!;
                    const inputId = `${prefix}-${field.id}`;
                    const errorId = `${inputId}-error`;
                    const error = errorFor(field);
                    return (
                      <div className="flex flex-col gap-1 w-full">
                        <label htmlFor={inputId}>
                          <span className="font-mono text-[11px] sm:text-xs uppercase tracking-normal sm:tracking-wider text-white font-semibold">
                            {field.label}
                          </span>
                          <span className="sr-only">
                            {field.required ? REQUIRED_MARKER : OPTIONAL_MARKER}
                          </span>
                        </label>
                        <input
                          id={inputId}
                          name={field.id}
                          type="email"
                          placeholder="you@yourcompany.com"
                          value={values[field.id] ?? ''}
                          aria-required={field.required}
                          aria-invalid={error ? true : undefined}
                          aria-describedby={error ? errorId : undefined}
                          onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                          onBlur={() => setTouched((t) => ({ ...t, [field.id]: true }))}
                          className={`w-full h-[38px] rounded-[3px] border bg-[#061208]/90 px-3.5 text-xs sm:text-sm text-white placeholder:text-white/20 focus:border-[#2ABD00] focus:outline-none transition-colors ${
                            error ? 'border-[#2ABD00]' : 'border-white/10'
                          }`}
                        />
                        {error ? (
                          <p id={errorId} className="font-mono text-[9px] text-[#2ABD00]">
                            {ERROR_PREFIX} {error}
                          </p>
                        ) : null}
                      </div>
                    );
                  })()}

                  {/* Field 4: WHATSAPP NUMBER (Split +91 Square Box) */}
                  {(() => {
                    const field = CONTACT_FORM_FIELDS[3]!;
                    const inputId = `${prefix}-${field.id}`;
                    const errorId = `${inputId}-error`;
                    const error = errorFor(field);
                    return (
                      <div className="flex flex-col gap-1 w-full">
                        <label htmlFor={inputId}>
                          <span className="font-mono text-[11px] sm:text-xs uppercase tracking-normal sm:tracking-wider text-white font-semibold">
                            {field.label}
                          </span>
                          <span className="sr-only">
                            {field.required ? REQUIRED_MARKER : OPTIONAL_MARKER}
                          </span>
                        </label>
                        <div className="flex gap-2 w-full">
                          {/* Square +91 Selector */}
                          <div className="shrink-0 flex items-center justify-between gap-1.5 h-[38px] px-2.5 sm:px-3 rounded-[3px] border border-white/10 bg-[#061208]/90 text-white text-xs sm:text-sm font-mono select-none">
                            <span>+91</span>
                            <svg className="w-3 h-3 text-[#919A94]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </div>
                          {/* Square Phone Input */}
                          <input
                            id={inputId}
                            name={field.id}
                            type="tel"
                            placeholder="WhatsApp number"
                            value={values[field.id] ?? ''}
                            aria-required={field.required}
                            aria-invalid={error ? true : undefined}
                            aria-describedby={error ? errorId : undefined}
                            onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                            onBlur={() => setTouched((t) => ({ ...t, [field.id]: true }))}
                            className={`flex-1 min-w-0 h-[38px] rounded-[3px] border bg-[#061208]/90 px-3.5 text-xs sm:text-sm text-white placeholder:text-white/20 focus:border-[#2ABD00] focus:outline-none transition-colors ${
                              error ? 'border-[#2ABD00]' : 'border-white/10'
                            }`}
                          />
                        </div>
                        {error ? (
                          <p id={errorId} className="font-mono text-[9px] text-[#2ABD00]">
                            {ERROR_PREFIX} {error}
                          </p>
                        ) : null}
                      </div>
                    );
                  })()}

                  {/* Field 5: WHAT ARE YOU LOOKING TO GROW? (Custom Themed Dropdown + Hidden Select for Test Contracts) */}
                  {(() => {
                    const field = CONTACT_FORM_FIELDS[4]!;
                    const inputId = `${prefix}-${field.id}`;
                    const errorId = `${inputId}-error`;
                    const error = errorFor(field);
                    const selectedValue = values[field.id] ?? '';
                    return (
                      <div className="flex flex-col gap-1 w-full" ref={selectRef}>
                        <label htmlFor={inputId}>
                          <span className="font-mono text-[11px] sm:text-xs uppercase tracking-normal sm:tracking-wider text-white font-semibold">
                            {field.label}
                          </span>
                          <span className="sr-only">
                            {field.required ? REQUIRED_MARKER : OPTIONAL_MARKER}
                          </span>
                        </label>

                        {/* Hidden native select for accessibility and test contracts */}
                        <select
                          id={inputId}
                          name={field.id}
                          value={selectedValue}
                          aria-required={field.required}
                          aria-invalid={error ? true : undefined}
                          aria-describedby={error ? errorId : undefined}
                          onChange={(e) => {
                            setValues((v) => ({ ...v, [field.id]: e.target.value }));
                            setTouched((t) => ({ ...t, [field.id]: true }));
                          }}
                          className="sr-only"
                          tabIndex={-1}
                          aria-hidden="true"
                        >
                          <option value="">{SELECT_PLACEHOLDER}</option>
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>

                        {/* Custom QAVYX Themed Dropdown Trigger */}
                        <div className="relative w-full">
                          <button
                            type="button"
                            aria-haspopup="listbox"
                            aria-expanded={selectOpen}
                            onClick={() => setSelectOpen((open) => !open)}
                            onBlur={() => setTouched((t) => ({ ...t, [field.id]: true }))}
                            className={`w-full h-[38px] flex items-center justify-between rounded-[3px] border bg-[#061208]/90 px-3 sm:px-3.5 text-xs sm:text-sm text-left transition-colors cursor-pointer select-none ${
                              error
                                ? 'border-[#2ABD00]'
                                : selectOpen
                                ? 'border-[#2ABD00] shadow-[0_0_10px_rgba(42,189,0,0.25)]'
                                : 'border-white/10 hover:border-[#2ABD00]/40'
                            }`}
                          >
                            <span
                              className={`truncate font-sans ${
                                selectedValue ? 'text-white font-medium' : 'text-white/35 font-normal'
                              }`}
                            >
                              {selectedValue || SELECT_PLACEHOLDER}
                            </span>
                            <div className={`shrink-0 ml-2 text-[#919A94] transition-transform duration-200 ${selectOpen ? 'rotate-180 text-[#2ABD00]' : ''}`}>
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </div>
                          </button>

                          {/* Custom Dropdown Menu Popup - 100% perfectly aligned with trigger */}
                          {selectOpen && (
                            <ul
                              role="listbox"
                              aria-label={field.label}
                              className="absolute top-[calc(100%+4px)] left-0 w-full z-50 rounded-[3px] border border-[#2ABD00]/40 bg-[#061509] shadow-[0_16px_40px_rgba(0,0,0,0.98),0_0_20px_rgba(42,189,0,0.2)] py-1 overflow-hidden"
                            >
                              {/* Placeholder / Reset Option */}
                              <li
                                role="option"
                                aria-selected={!selectedValue}
                                onClick={() => {
                                  setValues((v) => ({ ...v, [field.id]: '' }));
                                  setTouched((t) => ({ ...t, [field.id]: true }));
                                  setSelectOpen(false);
                                }}
                                className={`px-3 sm:px-3.5 py-2 text-xs sm:text-sm cursor-pointer transition-colors font-sans flex items-center justify-between ${
                                  !selectedValue
                                    ? 'bg-[#2ABD00]/15 text-[#2ABD00] font-semibold'
                                    : 'text-[#919A94]/70 hover:bg-[#2ABD00]/10 hover:text-white'
                                }`}
                              >
                                <span>{SELECT_PLACEHOLDER}</span>
                                {!selectedValue && (
                                  <svg className="w-3.5 h-3.5 text-[#2ABD00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </li>

                              {/* 6 Document Options */}
                              {field.options?.map((opt) => {
                                const isSelected = selectedValue === opt;
                                return (
                                  <li
                                    key={opt}
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => {
                                      setValues((v) => ({ ...v, [field.id]: opt }));
                                      setTouched((t) => ({ ...t, [field.id]: true }));
                                      setSelectOpen(false);
                                    }}
                                    className={`px-3 sm:px-3.5 py-2 text-xs sm:text-sm cursor-pointer transition-colors font-sans flex items-center justify-between ${
                                      isSelected
                                        ? 'bg-[#2ABD00]/20 text-[#2ABD00] font-semibold'
                                        : 'text-white/90 hover:bg-[#2ABD00]/15 hover:text-white'
                                    }`}
                                  >
                                    <span>{opt}</span>
                                    {isSelected && (
                                      <svg className="w-3.5 h-3.5 text-[#2ABD00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                        {error ? (
                          <p id={errorId} className="font-mono text-[9px] text-[#2ABD00]">
                            {ERROR_PREFIX} {error}
                          </p>
                        ) : null}
                      </div>
                    );
                  })()}

                  {/* Field 6: MESSAGE (Square Textarea) */}
                  {(() => {
                    const field = CONTACT_FORM_FIELDS[5]!;
                    const inputId = `${prefix}-${field.id}`;
                    const errorId = `${inputId}-error`;
                    const error = errorFor(field);
                    return (
                      <div className="flex flex-col gap-1 w-full">
                        <label htmlFor={inputId}>
                          <span className="font-mono text-[11px] sm:text-xs uppercase tracking-normal sm:tracking-wider text-white font-semibold">
                            {field.label}
                          </span>
                          <span className="sr-only">
                            {field.required ? REQUIRED_MARKER : OPTIONAL_MARKER}
                          </span>
                        </label>
                        <div className="relative w-full">
                          <textarea
                            id={inputId}
                            name={field.id}
                            rows={3}
                            placeholder="Tell us about your project, goals, or any specific requirements..."
                            value={values[field.id] ?? ''}
                            aria-required={field.required ? true : undefined}
                            aria-invalid={error ? true : undefined}
                            aria-describedby={error ? errorId : undefined}
                            onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                            onBlur={() => setTouched((t) => ({ ...t, [field.id]: true }))}
                            className={`w-full h-[68px] min-h-[68px] rounded-[3px] border bg-[#061208]/90 px-3.5 py-2 text-xs sm:text-sm text-white placeholder:text-white/20 focus:border-[#2ABD00] focus:outline-none transition-colors resize-none ${
                              error ? 'border-[#2ABD00]' : 'border-white/10'
                            }`}
                          />
                          {/* Corner resize indicator */}
                          <div className="pointer-events-none absolute right-2 bottom-2 text-white/20">
                            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="19" y1="19" x2="19" y2="19" />
                              <line x1="15" y1="19" x2="19" y2="15" />
                              <line x1="11" y1="19" x2="19" y2="11" />
                            </svg>
                          </div>
                        </div>
                        {error ? (
                          <p id={errorId} className="font-mono text-[9px] text-[#2ABD00]">
                            {ERROR_PREFIX} {error}
                          </p>
                        ) : null}
                      </div>
                    );
                  })()}

                  {/* Submit Button - Clean, centered, NO arrow mark */}
                  <div className="pt-2 w-full">
                    <button
                      type="submit"
                      disabled
                      aria-describedby={noticeId}
                      className="w-full h-[42px] rounded-[3px] font-mono text-xs sm:text-[13px] uppercase tracking-[0.25em] font-bold text-white bg-gradient-to-r from-[#0d3b14] via-[#1a6e24] to-[#0d3b14] border border-[#2ABD00]/70 shadow-[0_0_16px_rgba(42,189,0,0.22)] hover:shadow-[0_0_24px_rgba(42,189,0,0.38)] hover:border-[#2ABD00] transition-all flex items-center justify-center cursor-pointer select-none px-4"
                    >
                      <span>{CONTACT_FORM_SUBMIT}</span>
                    </button>
                    {/* Screen reader notification for accessibility */}
                    <p id={noticeId} className="sr-only">
                      {FORM_NOTICE.body.replace('{email}', CONTACT.email)}
                    </p>
                  </div>
                </form>
              </div>

            </div>

          </div>
        </article>
      </div>
    </section>
  );
}

export default ContactPageContent;
