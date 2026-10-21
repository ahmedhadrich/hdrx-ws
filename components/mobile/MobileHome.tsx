'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { projects, projectTarget } from '@/content/projects';
import { mobile, screen, sectionHeads, site } from '@/content/copy';

// Phones and tablets. No WebGL, no animation loops: the browser does the swiping
// (CSS scroll-snap), JS only tracks which card is centred.
export function MobileHome() {
  const trackRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);

  // Centred card = the one whose middle is nearest the track's middle
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const mid = track.scrollLeft + track.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      Array.from(track.children).forEach((el, i) => {
        const card = el as HTMLElement;
        const d = Math.abs(card.offsetLeft + card.offsetWidth / 2 - mid);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActive(best);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      track.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const goTo = useCallback((i: number) => {
    const card = trackRef.current?.children[i] as HTMLElement | undefined;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    card?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', inline: 'center', block: 'nearest' });
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked: the mailto link still works */
    }
  };

  const total = projects.length;
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="mhome">
      <header className="mhome__bar">
        <h1 className="sr-only">{screen.heading}</h1>
        <span className="mhome__mark" aria-hidden="true">
          {site.name}
        </span>
        <span className="mhome__count" aria-hidden="true">
          {pad(active + 1)} / {pad(total)}
        </span>
      </header>

      <div
        ref={trackRef}
        className="mhome__track"
        role="region"
        aria-roledescription="carousel"
        aria-label={mobile.carouselLabel}
        tabIndex={0}
      >
        {projects.map((p, i) => {
          const target = projectTarget(p);
          const body = (
            <>
              <div className="mhome__thumb">
                <Image
                  src={p.thumbnail}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 84vw, 36rem"
                  className="object-cover"
                  priority={i === 0}
                />
              </div>
              <div className="mhome__text">
                <p className="mhome__meta">
                  {p.type} · {p.year}
                </p>
                <h2 className="mhome__title">{p.title}</h2>
                <p className="mhome__role">{p.role}</p>
                <p className="mhome__impact">{p.impact}</p>
                {target && (
                  <span className="mhome__open">
                    {target.external ? screen.visitLabel : screen.openLabel} ↗
                  </span>
                )}
              </div>
            </>
          );

          return (
            <article
              key={p.slug}
              className="mhome__slide"
              data-active={i === active || undefined}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} ${mobile.slideOf} ${total}`}
            >
              {target ? (
                <a
                  href={target.href}
                  className="mhome__card"
                  {...(target.external && { target: '_blank', rel: 'noopener noreferrer' })}
                >
                  {body}
                </a>
              ) : (
                <div className="mhome__card">{body}</div>
              )}
            </article>
          );
        })}
      </div>

      <div className="mhome__dots">
        {projects.map((p, i) => (
          <button
            key={p.slug}
            type="button"
            className="mhome__dot"
            aria-label={`${mobile.goToLabel}: ${p.title}`}
            aria-current={i === active || undefined}
            onClick={() => goTo(i)}
          />
        ))}
      </div>

      <footer className="mhome__foot">
        <button type="button" className="mhome__cta" onClick={() => sheetRef.current?.showModal()}>
          {mobile.contactLabel}
        </button>
      </footer>

      {/* Native modal: focus trap, Esc and the back gesture come for free */}
      <dialog
        ref={sheetRef}
        className="mhome__sheet"
        aria-labelledby="mhome-contact"
        onClick={(e) => {
          // A tap on the backdrop lands on the dialog itself
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <div className="mhome__sheet-body">
          <div className="mhome__grip" aria-hidden="true" />
          <h2 id="mhome-contact" className="mhome__sheet-title">
            {sectionHeads.contact.title}
          </h2>
          <a href={`mailto:${site.email}`} className="mhome__email">
            {site.email}
          </a>
          <div className="mhome__sheet-row">
            <button type="button" className="mhome__ghost" onClick={copy} aria-live="polite">
              {copied ? screen.copiedLabel : screen.copyLabel}
            </button>
            {site.social
              .filter((s) => !s.href.startsWith('mailto:'))
              .map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="mhome__ghost">
                  {s.label} ↗
                </a>
              ))}
          </div>
          <form method="dialog">
            <button type="submit" className="mhome__close">
              {screen.closeLabel}
            </button>
          </form>
        </div>
      </dialog>
    </div>
  );
}
