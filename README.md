# Dover & Bloom website

Static website with a basket, ticket booking with a signed liability waiver, and secure Stripe checkout.

## How checkout works
1. A customer adds items. On-farm tickets (U-pick, events, in-person classes) open a booking window where the buyer picks a date or time, reads the waiver summary, types their full name as an electronic signature, and checks the agreement box. U-pick buyers choose one of the U-pick days, which show live "spots left". Without that signature the ticket can't be added to the basket.
2. **Secure Checkout** sends the basket to `netlify/lib/handlers/create-checkout.js`. That function looks up the real prices in `js/catalog.js`, rejects any ticket without a current signed waiver, and creates a Stripe Checkout session.
3. The customer pays on Stripe's hosted page. Card details never reach this website.
4. In your Stripe Dashboard, each payment carries the waiver record in its metadata: signer name, timestamp, terms version, and whether minors are in the party.

## Going live (about 30 minutes)
1. **Create a Stripe account** at stripe.com. To collect sales tax, set up Stripe Tax (Stripe → Tax: add the farm address and your Colorado/Lakewood registrations), then set `STRIPE_TAX=true` in Netlify. Prices on the site are before tax. Ask your accountant which items are taxable.
2. **Deploy to Netlify.** Drag the folder into app.netlify.com or connect a Git repo, then add your domain. HTTPS is automatic.
3. In Netlify → Site configuration → Environment variables, add `STRIPE_SECRET_KEY` (start with your `sk_test_…` key).
4. **Turn on spot tracking for U-pick and events (Stripe webhook).** In Stripe → Developers → Webhooks → Add endpoint:
   - URL: `https://YOURDOMAIN/.netlify/functions/stripe-webhook`
   - Events: `checkout.session.completed`, `checkout.session.expired`, `charge.refunded`
   - Copy the signing secret (`whsec_…`) into Netlify as `STRIPE_WEBHOOK_SECRET`.
   Spot counts are stored automatically in Netlify Blobs; nothing else to set up.
5. Test a purchase with card `4242 4242 4242 4242`, then switch to your `sk_live_…` key.
6. (Optional) In Stripe → Settings → Public details, add `https://YOURDOMAIN/terms.html` as the Terms of Service URL, then set `STRIPE_TOS_CONSENT=true` in Netlify. Stripe will then add its own required terms checkbox on the payment page.

## Everyday edits
- **Prices, dates, sold out, and every schedule** are in `js/catalog.js`. The website and the checkout both read from this file.
  - Recurring events live in `CATALOG_SETTINGS.schedules`: U-pick, BYOB Flower Happy Hour, Bouquet Making, DIY Suncatcher, Wreath Making, Bloom & Breathe and Brunch & Blooms. Each has a `firstDate`, repeats every `everyWeeks` until `lastDate`, and has its own `time`, `capacity` and `details` (shown when booking and at checkout).
  - Limits: U-pick 15 per day; happy hours, classes, yoga and brunch 20 per date (`EVENT_CAP`). One-time special events have `capacity: null` (no limit). Private events (up to 50 guests) are booked by request through the contact form.
  - To cancel a single date, add it to that schedule's `closedDates`.
- **If you change `terms.html`**, update `waiverVersion` in `js/catalog.js` and the version/date at the top of the terms page, so new buyers sign the new version.

## Shop category pages
`shop.html` opens on a welcome page with a tile for each category. Each category also has its own page: `shop.html#u-pick`, `#events`, `#bulk-buckets`, `#flower-csa`, `#bloom-bar`, `#private-events`, `#dahlia-tubers`, `#plants-seeds` and `#classes`. Each category page highlights its button in the row of category buttons, shows a "Shop › Category" trail and names the browser tab. Tiles, trails and titles are built by `js/shop-pages.js` from each section on `shop.html` (its heading, intro and cards), so adding a card or a new `<section class="shop-section" id="…">` with a matching button in the category row is all it takes.

## Product pages
Every shop item has its own page at `product.html#<item>`, for example `product.html#upick-jar`, `product.html#csa-biweekly` or `product.html#tuber-cafe-au-lait`. The page is built from the item's card on `shop.html` (title, description, what's included, price, button) plus `js/catalog.js` (dates, visit details, live prices), so there is nothing extra to update: edit the card or the catalog and the product page follows. Each card's id is its `data-item` attribute.

## Dahlia tuber shop & photos
The Dahlia Tubers section is built from `js/catalog.js` by `js/tubers.js`: a filterable grid (color, dahlia type, price, available only, sort) where each card opens a full variety page with a photo gallery, details, FAQs and "You may also like". It shows 30 varieties per page, with page buttons above and below the grid; to change that number, edit `PER_PAGE` in `js/tubers.js`.

**Variety details** (optional, per tuber in `js/catalog.js`): `form` (Dinnerplate, Ball, Pompon, Decorative, Anemone, Cactus, Waterlily, Collarette, Single), `color` (white, blush, pink, orange, red, yellow, lavender, bicolor), `size` (e.g. "8–10 in"), `height` (e.g. "4–5 ft") and `desc`. Varieties without a color or type still show, but won't appear when shoppers filter by those.

**ADS codes** (optional): add `ads: { size: "B", form: "ID", color: "PK" }` to a tuber to show its American Dahlia Society size class, form and color on its page, with the note "Codes follow the American Dahlia Society classification." Look codes up in the ADS Online Classification Guide (dahlia.org/ocg); supplier tags usually list them too.

**Photos:**
1. Put photos in a folder named after each variety. For several photos of one variety, number them in display order: `Thomas Edison 1.jpg`, `Thomas Edison 2.jpg`, `Mystery Tubers.jpg` (capitals, spaces and accents don't matter).
2. From the site folder run `python3 tools/add-dahlia-photos.py path/to/folder` (needs `pip install Pillow`).
3. Photos are cropped to centered squares, resized to 1000 × 1000, saved in `images/dahlias/`, and linked as that variety's gallery. Files that don't match a variety are listed so you can rename them. Re-running replaces a variety's gallery.

Link straight to a variety with `product.html#tuber-<name>`, e.g. `product.html#tuber-thomas-edison`.

## On-demand video classes
Customers buy a class once, then stream or download it from their order confirmation page (they can bookmark it and come back any time). Links are only shown after Stripe confirms payment.

1. Upload each class video somewhere that gives you a share link with downloading allowed, for example **Google Drive** (Share → "Anyone with the link"), **Vimeo** (Privacy → Hide from Vimeo, enable Downloads) or **Dropbox**.
2. In Netlify → Site configuration → Environment variables, add one variable per class with its link:
   - `CLASS_URL_ONDEMAND_REGENERATIVE`: What Is Regenerative Farming and How to Implement It in Your Own Garden
   - `CLASS_URL_ONDEMAND_COMPOST`: How to Build and Make Compost
   - `CLASS_URL_ONDEMAND_SOIL`: How to Amend Soil
   - `CLASS_URL_ONDEMAND_COVER_CROPS`: Cover Cropping 101: Why Diversity Matters
   - `CLASS_URL_ONDEMAND_DAHLIAS`: The Low Down on Dahlias
3. Redeploy. Until a link is added, buyers see "Available soon" for that class.

Anyone who has the share link itself could pass it on, so for stronger protection use Vimeo's domain-level privacy or a course platform.

## Farm address
The street address (2055 Dover Street, Lakewood, CO 80226) is kept out of the public pages. Customers whose order brings them to the farm (tickets, in-person classes, bulk bucket pickup or Flower CSA farm pickup) see it:
- at the top of Stripe's payment page,
- in each item's description on their payment,
- on the order confirmation page, with an "Open in Google Maps" button, once Stripe confirms payment.

Video-only orders and CSA home deliveries don't show it. To change the address, edit `netlify/lib/farm.js`, or add a `FARM_ADDRESS` environment variable in Netlify (it takes priority).

Netlify publishes this whole folder, so `netlify.toml` blocks the server code (`netlify/`), `tools/`, this README and the package files from being downloaded, and sends those addresses to the "page not found" page (`404.html`).

## Newsletter (Kit)
The "Subscribe" boxes on the Home, Our Story and Shop pages send sign-ups to your Kit landing page through `netlify/functions/subscribe.js`, so your Kit key stays private.

- **Kit landing page:** https://dover-bloom.kit.com/5733c30f5f
- **Form ID:** `10191112` (already set in the code)

To connect it:
1. In Netlify → Site configuration → Environment variables, add `KIT_API_KEY` with your Kit API key. A v4 key (starts with `kit_`) or the older v3 **API Key** both work. Never use the v3 **API Secret**.
2. Redeploy.
3. **Test:** subscribe with your own email on the live site, click the confirmation email if you turned it on, and check Kit → Subscribers.

To send sign-ups to a different Kit form later, add a `KIT_FORM_ID` variable with that form's number. It overrides the one in the code.

A hidden spam-trap field quietly drops sign-ups from bots. Until `KIT_API_KEY` is set, the box tells visitors to email you instead.

## Contact form
Messages are collected by Netlify Forms. In Netlify → Forms → `contact` → Form notifications, add your email to be notified of each message.

## Before launch
- Have a **Colorado attorney review `terms.html`**. It's a solid starting point, not legal advice.
- Print a paper (or tablet) copy of the waiver for **every adult to sign at check-in**.
- Spots for U-pick and limited events are held for 30 minutes while someone pays, confirmed after payment, and released if checkout is abandoned or fully refunded. Plus-One tickets count as 2. Handle refunds in Stripe so the counts stay right.
- To see who is coming: in Stripe Dashboard → Payments, each ticket payment shows the event, date, ticket count and waiver signer.
