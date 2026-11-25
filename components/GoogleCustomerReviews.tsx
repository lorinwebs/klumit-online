'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useSyncExternalStore } from 'react';

/**
 * Google Customer Reviews (Merchant Center):
 *   - GoogleReviewsOptIn – on the order confirmation page, asks the customer whether
 *     Google may email them a survey about the purchase.
 *   - GoogleStoreBadge – Google's floating store-rating badge on the shop pages.
 */

const MERCHANT_ID = 5907822213;

/** The shop sells and delivers within Israel only. */
const SHOP_COUNTRY = 'IL';

declare global {
  interface Window {
    gapi?: {
      load: (module: string, onLoad: () => void) => void;
      surveyoptin?: { render: (order: Record<string, string | number>) => void };
    };
    merchantwidget?: { start: (options: Record<string, string | number>) => void };
  }
}

interface GoogleReviewsOptInProps {
  /** Order number without the leading "#", e.g. 1012 */
  orderId: string;
  email: string;
  /** YYYY-MM-DD. Google sends its survey after this date. */
  estimatedDeliveryDate: string;
}

/**
 * Google draws the opt-in as a dialog in front of a veil that covers and blocks the whole page.
 * These rules turn it into a card in the bottom corner (a bottom sheet on phones) and leave the
 * page readable and usable. The box itself, its size and its text are Google's and stay as they are.
 * Should Google's markup change so that the rules stop matching, the opt-in shows as Google's own dialog.
 */
const OPT_IN_FRAME = 'iframe[src*="/customerreviews/optin"]';
const OPT_IN_DIALOG = `body > div[role="dialog"]:has(${OPT_IN_FRAME})`;
const OPT_IN_CARD_CSS = `
  /* the veil over the page, and the invisible layer under it that swallows clicks and scrolling */
  body > div:has(+ div[role="dialog"] ${OPT_IN_FRAME}),
  body > iframe:has(+ div + div[role="dialog"] ${OPT_IN_FRAME}) {
    display: none !important;
  }
  ${OPT_IN_DIALOG} {
    position: fixed !important;
    top: auto !important;
    left: auto !important;
    right: auto !important;
    bottom: 0 !important;
    inset-inline-start: 0 !important;
    padding-bottom: env(safe-area-inset-bottom, 0px) !important;
    border: solid #e5ddd1 !important;
    border-width: 1px 0 0 !important;
    box-shadow: 0 0 40px rgba(43, 33, 27, 0.12) !important;
    animation: gcr-opt-in-appear 0.4s ease-out both;
  }
  /* wide enough for Google's 650px box with a margin around it */
  @media (min-width: 700px) {
    ${OPT_IN_DIALOG} {
      bottom: 20px !important;
      inset-inline-start: 20px !important;
      border-width: 1px !important;
    }
  }
  @keyframes gcr-opt-in-appear {
    from { opacity: 0; }
  }
`;

export function GoogleReviewsOptIn({ orderId, email, estimatedDeliveryDate }: GoogleReviewsOptInProps) {
  const askOnce = () => {
    // Coming back to the confirmation page must not ask about the same order again
    const storageKey = `klumit.gcr.optin.${orderId}`;
    try {
      if (localStorage.getItem(storageKey)) return;
    } catch {
      // storage unavailable – ask anyway
    }

    window.gapi?.load('surveyoptin', () => {
      window.gapi?.surveyoptin?.render({
        merchant_id: MERCHANT_ID,
        order_id: orderId,
        email,
        delivery_country: SHOP_COUNTRY,
        estimated_delivery_date: estimatedDeliveryDate,
        // Where Google puts its dialog in browsers that don't apply the card styling above
        opt_in_style: 'BOTTOM_RIGHT_DIALOG',
      });
      try {
        localStorage.setItem(storageKey, '1');
      } catch {
        // storage unavailable
      }
    });
  };

  return (
    <>
      <style>{OPT_IN_CARD_CSS}</style>
      <Script src="https://apis.google.com/js/platform.js" strategy="afterInteractive" onReady={askOnce} />
    </>
  );
}

/** The element Google's badge script adds to <body>. It stays there across page navigations. */
const BADGE_ELEMENT = '#google-merchantwidget-iframe-wrapper';

/** Shop pages that show the badge. Cart, checkout, account and the non-shop pages on this domain don't. */
const BADGE_PATHS = [
  '/products',
  '/bags',
  '/wallets',
  '/belts',
  '/brands',
  '/blog',
  '/about',
  '/faq',
  '/shipping',
  '/returns',
  '/terms',
  '/privacy',
  '/accessibility',
];

export function GoogleStoreBadge() {
  const pathname = usePathname();
  // The server doesn't reliably know the page: Vercel prerenders the home page as "/index",
  // so CSS chosen there differs from the browser's and React reports a hydration error (#418).
  // Nothing is rendered on the server; the badge only ever exists in the browser anyway.
  const inBrowser = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const onBadgePage =
    pathname === '/' || BADGE_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const onProductPage = pathname.startsWith('/products/');

  const start = () => {
    // Google's script throws if it is started while its badge is already on the page
    if (document.querySelector(BADGE_ELEMENT)) return;
    window.merchantwidget?.start({
      merchant_id: MERCHANT_ID,
      region: SHOP_COUNTRY,
      // Bottom left, raised above the chat and cart buttons that occupy the bottom corners
      position: 'LEFT_BOTTOM',
      bottomMargin: 88,
      mobileBottomMargin: 88,
    });
  };

  const hidden = `${BADGE_ELEMENT} { display: none !important; }`;
  const css = [
    // Google gives the badge the highest possible z-index; menus and dialogs should open over it
    `${BADGE_ELEMENT} { z-index: 45 !important; }`,
    !onBadgePage && hidden,
    // On phones the bottom of a product page belongs to the add-to-cart bar
    onProductPage && `@media (max-width: 767px) { ${hidden} }`,
  ]
    .filter(Boolean)
    .join('\n');

  if (!inBrowser) return null;

  return (
    <>
      {onBadgePage && (
        <Script
          src="https://www.gstatic.com/shopping/merchant/merchantwidget.js"
          strategy="lazyOnload"
          onReady={start}
        />
      )}
      <style>{css}</style>
    </>
  );
}
