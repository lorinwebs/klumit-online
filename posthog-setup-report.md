# PostHog post-wizard report

The wizard completed a PostHog integration for this Next.js storefront. The browser SDK initializes through `instrumentation-client.ts` with environment-based configuration, preserving PostHog defaults for autocapture and session recording while enabling exception capture. Authenticated Supabase users are identified on session restore and authentication changes, and PostHog is reset on sign-out.

Existing commerce tracking helpers now also send privacy-safe PostHog events for the product, cart, and checkout journey. The Shopify orders webhook captures a server-side `order_paid` event after webhook verification and awaits SDK shutdown so the event is sent before the request finishes. Existing Google Analytics, Meta Pixel, and Telegram behavior remains intact.

| Event name | Description | File |
| --- | --- | --- |
| `product_viewed` | A shopper views a product detail page. | `lib/analytics.ts` |
| `product_added_to_cart` | A shopper adds a product variant to the cart. | `lib/analytics.ts` |
| `cart_viewed` | A shopper views a cart containing products. | `lib/analytics.ts` |
| `checkout_started` | A shopper begins the checkout flow with a populated cart. | `lib/analytics.ts` |
| `order_paid` | A Shopify order webhook confirms that an order has been created. | `app/api/shopify/webhook/orders/route.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) dashboard](https://eu.posthog.com/project/227085/dashboard/831186)
- [Commerce funnel (wizard)](https://eu.posthog.com/project/227085/insights/DL6eVUfG)
- [Products added to cart (wizard)](https://eu.posthog.com/project/227085/insights/9VKv6W5h)
- [Checkout starts (wizard)](https://eu.posthog.com/project/227085/insights/zh0BLxIy)
- [Paid orders (wizard)](https://eu.posthog.com/project/227085/insights/j3VPmugD)

## Verify before merging

- [ ] Run a full production build (the wizard only verified the files it touched) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add the exact PostHog env var names to any monorepo/bootstrap scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.
- [ ] Confirm the returning-visitor path also calls `identify` — a handler that only identifies on fresh login can leave returning sessions on anonymous distinct IDs.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
