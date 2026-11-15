/* ==========================================================
   Dover & Bloom — PRODUCT CATALOG (single source of truth)

   This one file is used by BOTH:
     • the website (to show prices and build the basket), and
     • the secure checkout function (to look up the REAL price
       before charging — prices sent from a browser are ignored).

   To change a price, a date, or mark something sold out, edit it
   here and redeploy. Prices are in CENTS (1800 = $18.00).

   onSite: true  → buyer must sign the Terms & Liability Waiver
   kind:
     "product" → regular item
     "pickup"  → buyer picks a Friday farm-pickup date (bulk buckets)
     "subscription" → Flower CSA, billed every week / 2 weeks / month
     "ondemand" → video class, watch or download any time after purchase
     "series"  → recurring event (U-pick, happy hour, classes, brunch); buyer
                 picks a date from CATALOG_SETTINGS.schedules[series]
     "event"   → fixed date (set in `date`)
     "class"   → fixed date; in-person classes are onSite
   ========================================================== */

const EVENT_CAP = 20; // happy hours, classes, yoga and brunch: 20 participants per date
// (one-time special events have capacity: null = no limit; private events are booked by request, up to 50 guests)

const CATALOG_SETTINGS = {
  waiverVersion: "2026-11-08",          // bump when you change terms.html
  currency: "usd",
  maxTicketsPerOrder: 12,
  /* ---------- Recurring events ----------
     A schedule is either a fixed list of `dates`, or starts on `firstDate`, adds the days in `dayOffsets`
     (0 = firstDate, 1 = the next day), and repeats every `everyWeeks`
     until `lastDate`. `capacity` = tickets per date. Add a date to
     `closedDates` to skip it. `details` are shown when booking, on the
     Stripe payment page and on the confirmation page. */
  schedules: {
    upick: {
      name: "U-Pick",
      summary: "Every other weekend, Saturdays & Sundays",
      firstDate: "2027-06-19", dayOffsets: [0, 1], everyWeeks: 2, lastDate: "2027-10-15",
      time: "8:00 – 10:00 am",
      ticketChoice: true,                  // single / plus-one bundle chosen from a dropdown when booking
      capacity: 15,
      closedDates: [],
      unit: "ticket · one jar",
      receiptNote: "Check in at the front · Bring a mason jar · One jar of flowers per ticket",
      details: [
        "The farm is open for U-pick from 8:00 to 10:00 am.",
        "Check-in happens at the front of the farm.",
        "Please bring a reusable mason jar to pick your flowers.",
        "We provide water and sanitized snips for harvesting your flowers.",
        "Children and extra guests are welcome to come along, but picking is limited to one jar of flowers per ticket purchased.",
        "We provide flower food, and we're happy to condition your flowers in our cooler for longer vase life if you'd like.",
      ],
    },
    happyhour: {
      name: "BYOB Flower Happy Hour",
      summary: "Thursday evenings, all ages welcome",
      firstDate: "2027-06-17", dayOffsets: [0], everyWeeks: 2, lastDate: "2027-10-15",
      time: "5:30 – 7:00 pm",
      capacity: EVENT_CAP,
      closedDates: [],
      ticketChoice: true,                  // single / plus-one chosen from a dropdown when booking
      unit: "person",
      receiptNote: "BYOB (21+ to drink, bring ID) · Check in at the front",
      details: [
        "Happy hour runs from 5:30 to 7:00 pm. Check-in happens at the front of the farm.",
        "Guests of all ages are welcome. Bring your own beer or wine if you like; anyone drinking must be 21 or older with ID. We provide cups, ice, water and light snacks.",
        "Wander the field, cut a jar of flowers and build a bouquet with help from our florists. Jars and flower food are provided.",
        "Please drink responsibly and plan a safe ride home.",
      ],
    },
    datenight: {
      name: "Friday Flower Date Night",
      summary: "Friday evenings",
      firstDate: "2027-06-18", dayOffsets: [0], everyWeeks: 2, lastDate: "2027-10-15",
      time: "5:30 – 7:00 pm",
      capacity: EVENT_CAP,                 // 20 people = 10 couples
      closedDates: [],
      unit: "couple",
      receiptNote: "Check in at the front · Flowers, tools and wraps provided",
      details: [
        "Friday Flower Date Night runs from 5:30 to 7:00 pm. Check-in happens at the front of the farm.",
        "Stroll the field together at golden hour, cut flowers side by side, and make a bouquet for each other with help from our florists.",
        "Open to everyone and all ages: come with a partner, a friend, or a parent or child. Each ticket is for two people.",
        "Flowers, snips, wraps and flower food are provided.",
      ],
    },
    bouquet: {
      name: "Bouquet Making Class",
      summary: "Saturday mornings",
      firstDate: "2027-06-26", dayOffsets: [0], everyWeeks: 2, lastDate: "2027-10-15",
      time: "10:00 am – 12:00 pm",
      capacity: EVENT_CAP,
      closedDates: [],
      unit: "seat",
      receiptNote: "Check in at the front · All tools and flowers provided",
      details: [
        "Class runs from 10:00 am to 12:00 pm. Please arrive 10 minutes early and check in at the front.",
        "We'll cut flowers together in the field, then learn how to condition stems and build a garden-style, hand-tied bouquet.",
        "Clippers, flowers, wraps and flower food are provided. You take home your bouquet.",
        "Wear closed-toe shoes and bring a water bottle and sun hat.",
      ],
    },
    // One-time special events: a single date, no participant limit
    pollinatorweek: { name: "Pollinator Week Open Farm", summary: "One day only", firstDate: "2027-06-19", dayOffsets: [0], everyWeeks: 1, lastDate: "2027-06-19", time: "9:00 am – 1:00 pm", capacity: null, unit: "ticket", receiptNote: "Check in at the front", details: ["Check-in happens at the front of the farm. Kids 12 and under come free with a ticketed adult."] },
    dahliadays:     { name: "Dahlia Days", summary: "One day only", firstDate: "2027-08-28", dayOffsets: [0], everyWeeks: 1, lastDate: "2027-08-28", time: "10:00 am – 3:00 pm", capacity: null, unit: "ticket", receiptNote: "Check in at the front", details: ["Check-in happens at the front of the farm."] },
    fieldsupper:    { name: "Long-Table Supper in the Field", summary: "One evening only", firstDate: "2027-09-11", dayOffsets: [0], everyWeeks: 1, lastDate: "2027-09-11", time: "5:30 pm", capacity: null, adultsOnly: true, unit: "seat", receiptNote: "21+ · Check in at the front", details: ["Guests 21 and over. Check-in happens at the front of the farm at 5:30 pm."] },
    suncatcher: {
      name: "DIY Suncatcher Class",
      summary: "Two weekends in September and two in October, Saturdays & Sundays",
      dates: ["2027-09-11", "2027-09-12", "2027-09-18", "2027-09-19", "2027-10-09", "2027-10-10", "2027-10-16", "2027-10-17"],
      time: "3:30 – 5:30 pm",
      capacity: EVENT_CAP,
      closedDates: [],
      unit: "seat",
      receiptNote: "Check in at the front · All materials provided",
      details: [
        "Class runs from 3:30 to 5:30 pm. Please check in at the front of the farm.",
        "Using dried flowers from our garden and sparkling crystals, tie your own suncatcher made to withstand the seasons.",
        "All flowers, crystals and materials are provided. Your suncatcher goes home with you the same day, ready to hang in a sunny window.",
      ],
    },
    pumpkin: {
      name: "Pumpkin Decorating Class",
      summary: "Last weekend of September and first weekend of October",
      dates: ["2027-09-25", "2027-09-26", "2027-10-02", "2027-10-03"],
      time: "3:30 – 5:30 pm",
      capacity: EVENT_CAP,
      closedDates: [],
      unit: "seat",
      receiptNote: "Check in at the front · Pumpkin and all materials provided",
      details: [
        "Class runs from 3:30 to 5:30 pm. Please check in at the front of the farm.",
        "Decorate a pumpkin with dried flowers, grasses, seed heads and ribbon from the farm. Your pumpkin and all materials are provided.",
        "Kids are welcome with a ticketed adult. Children who decorate their own pumpkin need their own ticket.",
      ],
    },
    wreath: {
      name: "Wreath Making Class",
      summary: "Three weekends in early October, Saturdays & Sundays",
      dates: ["2027-10-02", "2027-10-03", "2027-10-09", "2027-10-10", "2027-10-16", "2027-10-17"],
      time: "1:00 – 3:00 pm",
      capacity: EVENT_CAP,
      closedDates: [],
      unit: "seat",
      receiptNote: "Check in at the front · All materials provided",
      details: [
        "Class runs from 1:00 to 3:00 pm. Please check in at the front of the farm.",
        "Build a wreath from dried strawflowers, grasses, seed heads and late-season blooms grown on the farm.",
        "Wreath base, tools and all flowers are provided. Dried-flower wreaths last for months indoors.",
      ],
    },
    christmaswreath: {
      name: "Christmas Wreath Making Class",
      summary: "Two weekends in December, Saturdays & Sundays",
      dates: ["2027-12-04", "2027-12-05", "2027-12-11", "2027-12-12"],
      time: "1:00 – 3:00 pm",
      capacity: EVENT_CAP,
      closedDates: [],
      unit: "seat",
      receiptNote: "Check in at the front · Dress warmly · All materials provided",
      details: [
        "Class runs from 1:00 to 3:00 pm. Please check in at the front of the farm and dress warmly.",
        "Make a fresh holiday wreath with evergreen boughs, pine cones, dried flowers from our summer harvest and ribbon.",
        "Wreath frame, greens, tools and all trimmings are provided. Mist your wreath every few days and it will stay fresh through the holidays.",
      ],
    },
    breathe: {
      name: "Bloom & Breathe",
      summary: "Sunday mornings",
      firstDate: "2027-06-27", dayOffsets: [0], everyWeeks: 2, lastDate: "2027-10-15",
      time: "8:00 – 10:00 am",
      capacity: EVENT_CAP,
      closedDates: [],
      unit: "person",
      receiptNote: "Yoga at 8:00 am on the patio · Bring a mat · Check in at the front",
      details: [
        "Yoga starts at 8:00 am sharp on the patio. Please arrive by 7:45 to check in at the front and settle in.",
        "Bring your own yoga mat and a water bottle. All levels are welcome.",
        "After class we'll make bouquets together and take a slow walk through the farm, finishing around 10:00 am.",
        "Wear layers. Colorado mornings can be cool, and the patio warms up quickly.",
      ],
    },
    brunch: {
      name: "Brunch & Blooms",
      summary: "Sunday mornings",
      firstDate: "2027-06-27", dayOffsets: [0], everyWeeks: 2, lastDate: "2027-10-15",
      time: "10:30 am – 12:30 pm",
      capacity: EVENT_CAP,
      closedDates: [],
      unit: "seat",
      receiptNote: "Brunch in the garden · Check in at the front",
      details: [
        "Brunch & Blooms runs from 10:30 am to 12:30 pm. Check-in happens at the front of the farm.",
        "Enjoy a seasonal brunch at a long table in the garden, with coffee, tea and juice.",
        "After brunch, take a short garden walk and make a small bouquet to bring home.",
        "Let us know about any food allergies at least 3 days ahead by replying to your confirmation email.",
      ],
    },
  },
  // Color palettes customers choose for bulk buckets with `palette: true`
  palettes: {
    bright: { name: "Bright & bold", hint: "Hot pinks, oranges, reds, golds and deep magentas" },
    soft:   { name: "Neutral, pastel & blush", hint: "Creams, whites, peaches, blush pinks and soft apricots" },
  },
  bulk: {
    pickupDay: 5,                       // Friday
    time: "3:00 – 6:00 pm",
    seasonStart: "2027-06-18",
    seasonEnd: "2027-10-15",
    leadDays: 14,                       // order at least 2 weeks ahead
  },
  /* Flower CSA subscriptions: billed automatically by Stripe for each
     delivery period. Nobody is charged before `firstDelivery`, and every
     subscription ends on its own at `seasonEnd` (customers re-subscribe
     each year). */
  csa: {
    firstDelivery: "2027-06-18",          // first Friday of the season
    seasonEnd: "2027-10-15",
    deliveryDay: "Friday",
    deliveryArea: "within 5 miles of the farm",
    pickupTime: "3:00 – 6:00 pm",           // Friday farm pickup for everyone outside the delivery area
  },
  shipsKinds: ["tuber"],                 // CSA asks for an address only when delivery is chosen                // collect a shipping address when these are in the basket
};

const CATALOG = {
  // ---------- Dahlia tubers ----------
  /* Dahlia tubers, priced per tuber. All currently sold out: delete `soldOut: true`
     to put one back on sale. Optional fields used by the shop filters and variety pages:
       form:   "Dinnerplate" | "Ball" | "Pompon" | "Decorative" | "Anemone" | "Cactus" | "Waterlily" | "Collarette" | "Single" | "Mixed"
       colors: color filters it appears under (first = main color): blush, bronze, burgundy, coral, orange, peach,
               pink, purple, raspberry, red, salmon, white, yellow
       colorName: color as described on the variety page, e.g. "Bronze-peach with a lavender tint"
       note:   extra line shown on the variety page
       size:   bloom size, e.g. "8–10 in"     height: e.g. "4–5 ft"
       desc:   a sentence or two about the variety
       ads:    American Dahlia Society classification, e.g. { size: "B", form: "ID", color: "PK" }
               size: AA A B BB M BA MB P · form: FD ID SC C IC LC BA MB P WL AN CO S MS O NO NC ST PE
               color: W Y OR PK DP R DR L PR LB BR FL DB V BI
       photos: ["images/dahlias/thomas-edison-1.webp", ...]  (added by tools/add-dahlia-photos.py) */
  "tuber-mystery": { name: "Mystery Tuber", price: 800, kind: "product", group: "tuber", soldOut: true, form: "Mixed", colorName: "Unknown: every one is a surprise" },
  "tuber-20th-ave-softer-peach": { name: "Dahlia tuber: 20th Ave Softer Peach", price: 2200, kind: "product", group: "tuber", colors: ["peach"], soldOut: true, form: "Decorative", colorName: "Soft peach", size: "4–6 in", height: "4–5 ft", ads: { size: "BB", form: "FD" } },
  "tuber-american-dawn": { name: "Dahlia tuber: American Dawn", price: 1500, kind: "product", group: "tuber", colors: ["pink", "purple", "peach"], soldOut: true, form: "Decorative", colorName: "Pink-purple fading to apricot", size: "4–8 in", height: "~3 ft", ads: { size: "BB/B", form: "FD" } },
  "tuber-bloomquist-jean": { name: "Dahlia tuber: Bloomquist Jean", price: 2500, kind: "product", group: "tuber", colors: ["orange"], soldOut: true, form: "Decorative", colorName: "Deep orange", size: "6–8 in", height: "~4 ft", ads: { size: "B", form: "ID" } },
  "tuber-bloomquist-tory-p": { name: "Dahlia tuber: Bloomquist Tory P", price: 2400, kind: "product", group: "tuber", colors: ["blush", "purple"], soldOut: true, form: "Decorative", colorName: "Blush-lavender", size: "4–5 in", height: "2.5–4.5 ft", ads: { size: "M/BB", form: "FD" } },
  "tuber-boom-boom-white": { name: "Dahlia tuber: Boom Boom White", price: 1000, kind: "product", group: "tuber", colors: ["white"], soldOut: true, form: "Ball", colorName: "White", size: "3.5–4 in", height: "3–4 ft", ads: { size: "BA", form: "BA" } },
  "tuber-bracken-rose": { name: "Dahlia tuber: Bracken Rose", price: 2100, kind: "product", group: "tuber", colors: ["pink"], soldOut: true, form: "Ball", colorName: "Dusty rose / lavender-pink", size: "3–4 in", height: "3–4 ft", ads: { size: "BA/MB", form: "BA" }, note: "Some growers list this one as a formal decorative." },
  "tuber-cafe-au-lait": { name: "Dahlia tuber: Café au Lait", price: 1700, kind: "product", group: "tuber", colors: ["blush"], soldOut: true, form: "Decorative", colorName: "Blush / cream", size: "8–10 in", height: "3–4 ft", ads: { size: "A", form: "ID" } },
  "tuber-camano-buzz": { name: "Dahlia tuber: Camano Buzz", price: 1000, kind: "product", group: "tuber", colors: ["orange"], soldOut: true, colorName: "Orange" },
  "tuber-camano-zoe": { name: "Dahlia tuber: Camano Zoe", price: 1800, kind: "product", group: "tuber", colors: ["blush", "pink"], soldOut: true, form: "Ball", colorName: "Blush pink with an ivory center", size: "2–3.5 in", height: "4–5 ft", ads: { size: "MB", form: "MB" } },
  "tuber-cantaloupe": { name: "Dahlia tuber: Cantaloupe", price: 1200, kind: "product", group: "tuber", soldOut: true },
  "tuber-chewy": { name: "Dahlia tuber: Chewy", price: 1500, kind: "product", group: "tuber", colors: ["bronze", "peach"], soldOut: true, form: "Decorative", colorName: "Bronze-peach with a lavender tint", size: "~3 in", height: "~4 ft", ads: { size: "M", form: "FD" } },
  "tuber-copper-boy": { name: "Dahlia tuber: Copper Boy", price: 1600, kind: "product", group: "tuber", colors: ["bronze", "orange"], soldOut: true, form: "Ball", colorName: "Copper-orange", size: "3–4 in", height: "~3 ft", ads: { size: "MB/BA", form: "BA/MB" } },
  "tuber-cornel": { name: "Dahlia tuber: Cornel", price: 1200, kind: "product", group: "tuber", colors: ["red"], soldOut: true, form: "Ball", colorName: "Red", size: "3–4 in", height: "~4 ft", ads: { size: "BA", form: "BA" } },
  "tuber-cornel-bronze": { name: "Dahlia tuber: Cornel Bronze", price: 1200, kind: "product", group: "tuber", colors: ["bronze", "orange"], soldOut: true, form: "Ball", colorName: "Bronze-orange", size: "3–4 in", height: "3.5–4 ft", ads: { size: "BA", form: "BA" } },
  "tuber-crazy-4-wylie-quinn": { name: "Dahlia tuber: Crazy 4 Wylie Quinn", price: 2200, kind: "product", group: "tuber", colors: ["coral"], soldOut: true, form: "Ball", colorName: "Coral", size: "3–4 in", height: "4.5 ft", ads: { form: "BA" } },
  "tuber-diva": { name: "Dahlia tuber: Diva", price: 1200, kind: "product", group: "tuber", colors: ["burgundy", "raspberry"], soldOut: true, form: "Decorative", colorName: "Deep magenta / wine", size: "4–6 in", height: "~4 ft", ads: { size: "BB", form: "FD" } },
  "tuber-eveline": { name: "Dahlia tuber: Eveline", price: 1200, kind: "product", group: "tuber", colors: ["white"], soldOut: true, form: "Decorative", colorName: "White with a lilac center", size: "4–6 in", height: "3–4 ft", ads: { size: "BB", form: "FD" } },
  "tuber-ferncliff-rusty": { name: "Dahlia tuber: Ferncliff Rusty", price: 2000, kind: "product", group: "tuber", colors: ["bronze", "pink"], soldOut: true, form: "Ball", colorName: "Rust / dusty rose", size: "Over 3.5 in", height: "~4 ft", ads: { size: "BA", form: "BA" } },
  "tuber-firepot": { name: "Dahlia tuber: Firepot", price: 1200, kind: "product", group: "tuber", colors: ["orange", "yellow", "red"], soldOut: true, form: "Waterlily", colorName: "Crimson center with yellow-orange petals", height: "18–24 in", ads: { form: "WL" } },
  "tuber-frank-holmes": { name: "Dahlia tuber: Frank Holmes", price: 1300, kind: "product", group: "tuber", colors: ["pink", "purple"], soldOut: true, form: "Pompon", colorName: "Lavender-pink", size: "1.5–2 in", ads: { size: "P", form: "P" } },
  "tuber-golden-scepter": { name: "Dahlia tuber: Golden Scepter", price: 1200, kind: "product", group: "tuber", colors: ["yellow"], soldOut: true, form: "Decorative", colorName: "Golden yellow", size: "2.5–3 in", height: "3–4 ft", ads: { size: "M", form: "FD" }, note: "Often sold as a pompon." },
  "tuber-hollyhill-creamy": { name: "Dahlia tuber: Hollyhill Creamy", price: 2000, kind: "product", group: "tuber", colors: ["white"], soldOut: true, colorName: "Cream", note: "A newer variety, so detailed specs haven't been published yet." },
  "tuber-ka-s-cinder-rose": { name: "Dahlia tuber: KA's Cinder Rose", price: 3500, kind: "product", group: "tuber", colors: ["blush"], soldOut: true, form: "Decorative", colorName: "Blush with a lavender wash and gold tips", size: "Up to 4 in", height: "~3 ft", ads: { size: "M", form: "FD" } },
  "tuber-ka-s-pearl": { name: "Dahlia tuber: KA's Pearl", price: 3500, kind: "product", group: "tuber", colors: ["white", "blush"], soldOut: true, form: "Decorative", colorName: "Pearly cream / blush", size: "4–8 in", height: "4–4.5 ft", ads: { size: "BB/B", form: "FD/ID" } },
  "tuber-ka-s-rosie-jo": { name: "Dahlia tuber: KA's Rosie Jo", price: 3000, kind: "product", group: "tuber", colors: ["raspberry"], soldOut: true, form: "Decorative", colorName: "Smoky raspberry", size: "3–4 in", height: "3.5–4 ft", ads: { size: "M", form: "FD" } },
  "tuber-levi-s-blue-smoke": { name: "Dahlia tuber: Levi's Blue Smoke", price: 3000, kind: "product", group: "tuber", colors: ["purple", "pink"], soldOut: true, form: "Decorative", colorName: "Smoky lavender, pink and cream", size: "3–4 in", height: "3.5–5 ft", ads: { size: "M", form: "FD" } },
  "tuber-linda-s-baby": { name: "Dahlia tuber: Linda's Baby", price: 1700, kind: "product", group: "tuber", colors: ["salmon", "coral", "peach"], soldOut: true, form: "Ball", colorName: "Peach / coral-pink", size: "3–4 in", height: "3–4 ft", ads: { size: "BA", form: "BA" } },
  "tuber-marble-ball": { name: "Dahlia tuber: Marble Ball", price: 1200, kind: "product", group: "tuber", colors: ["white", "purple"], soldOut: true, form: "Ball", colorName: "White marbled with purple", size: "3–4 in", height: "3–4 ft", ads: { size: "BA", form: "BA" } },
  "tuber-mini-cafe-au-lait": { name: "Dahlia tuber: Mini Café au Lait", price: 2000, kind: "product", group: "tuber", colors: ["blush"], soldOut: true, colorName: "Blush / cream", size: "3–5 in", height: "~4 ft", note: "Not a registered ADS variety; a smaller-flowered take on Café au Lait." },
  "tuber-mm-buttercream": { name: "Dahlia tuber: MM Buttercream", price: 1500, kind: "product", group: "tuber", colors: ["yellow"], soldOut: true, form: "Ball", colorName: "Pale buttercream yellow", size: "Over 3.5 in", ads: { size: "BA", form: "BA" } },
  "tuber-mystery-day": { name: "Dahlia tuber: Mystery Day", price: 1200, kind: "product", group: "tuber", colors: ["burgundy", "white"], soldOut: true, form: "Decorative", colorName: "Dark red-purple with white tips", size: "6–8 in", height: "3–4 ft", ads: { size: "B", form: "FD" } },
  "tuber-oreti-adele": { name: "Dahlia tuber: Oreti Adele", price: 1600, kind: "product", group: "tuber", colors: ["peach", "pink"], soldOut: true, form: "Decorative", colorName: "Peach-gold with pink tips", size: "4–6 in", height: "~3 ft", ads: { size: "BB", form: "FD" } },
  "tuber-parkland-tribute": { name: "Dahlia tuber: Parkland Tribute", price: 1200, kind: "product", group: "tuber", colors: ["coral"], soldOut: true, form: "Ball", colorName: "Deep coral", size: "3–4 in", height: "4 ft", ads: { form: "BA" } },
  "tuber-pink-ivan": { name: "Dahlia tuber: Pink Ivan", price: 800, kind: "product", group: "tuber", colors: ["pink"], soldOut: true, form: "Ball", colorName: "Pink", size: "2.5–3 in", ads: { form: "BA" } },
  "tuber-pink-runner": { name: "Dahlia tuber: Pink Runner", price: 1200, kind: "product", group: "tuber", colors: ["pink", "peach"], soldOut: true, form: "Decorative", colorName: "Warm pink with a peach undertone", size: "~4 in", height: "3–4 ft", ads: { size: "M", form: "FD" } },
  "tuber-platinum-blonde": { name: "Dahlia tuber: Platinum Blonde", price: 1700, kind: "product", group: "tuber", colors: ["white"], soldOut: true, form: "Anemone", colorName: "White with a cream-yellow center", size: "~4 in", height: "~4 ft", ads: { size: "M", form: "AN" } },
  "tuber-purple-rogue": { name: "Dahlia tuber: Purple Rogue", price: 800, kind: "product", group: "tuber", colors: ["purple"], soldOut: true, form: "Decorative", colorName: "Purple / lavender", size: "3–4 in", ads: { form: "ID" } },
  "tuber-rm-rose-gold": { name: "Dahlia tuber: RM Rose Gold", price: 3500, kind: "product", group: "tuber", colors: ["blush", "peach"], soldOut: true, form: "Decorative", colorName: "Rose gold", size: "3–4 in", height: "3.5 ft", ads: { form: "FD" } },
  "tuber-sandia-bertha": { name: "Dahlia tuber: Sandia Bertha", price: 2500, kind: "product", group: "tuber", colors: ["burgundy", "raspberry", "purple"], soldOut: true, form: "Waterlily", colorName: "Burgundy / magenta-purple", size: "4–7 in", height: "4–5 ft", ads: { size: "BB/B", form: "WL" } },
  "tuber-swan-lake": { name: "Dahlia tuber: Swan Lake (Classic Swanlake)", price: 1000, kind: "product", group: "tuber", colors: ["white"], soldOut: true, form: "Single", colorName: "Creamy white over dark foliage", height: "2–3 ft", note: "Single to semi-double blooms. Also sold as Classic Swanlake." },
  "tuber-sweet-suzanne": { name: "Dahlia tuber: Sweet Suzanne", price: 1500, kind: "product", group: "tuber", colors: ["peach", "blush"], soldOut: true, form: "Ball", colorName: "Peach / apricot blush", size: "2–4 in", height: "3–4 ft", ads: { size: "BA/MB", form: "BA/MB" } },
  "tuber-thomas-edison": { name: "Dahlia tuber: Thomas Edison", price: 1500, kind: "product", group: "tuber", colors: ["purple"], soldOut: true, form: "Decorative", colorName: "Royal purple", size: "6–8 in", height: "3–4 ft", ads: { size: "B", form: "ID" } },
  "tuber-totally-tangerine": { name: "Dahlia tuber: Totally Tangerine", price: 1200, kind: "product", group: "tuber", colors: ["orange", "peach"], soldOut: true, form: "Anemone", colorName: "Orange with an apricot-pink center", size: "3–4 in", height: "2–3 ft", ads: { size: "M", form: "AN" } },
  "tuber-yvonne": { name: "Dahlia tuber: Yvonne", price: 2000, kind: "product", group: "tuber", colors: ["coral"], soldOut: true, form: "Waterlily", colorName: "Coral", size: "~4 in", ads: { size: "M/BB", form: "WL" } },
  "tuber-lee-s-swiss-miss": { name: "Dahlia tuber: Lee's Swiss Miss", price: 4000, kind: "product", group: "tuber", colors: ["pink", "bronze"], soldOut: true, form: "Decorative", colorName: "Dusty muted rose with a cocoa overlay", size: "~4 in", height: "~4 ft", ads: { size: "M", form: "FD" } },
  "tuber-dl-s-the-special": { name: "Dahlia tuber: DL's The Special", price: 3500, kind: "product", group: "tuber", soldOut: true, form: "Decorative", size: "4–5 in", height: "3.5–5 ft", ads: { size: "M/BB", form: "ID" }, note: "Most growers list this as an informal decorative; some list it as a formal decorative (FD)." },
  "tuber-rm-ursula": { name: "Dahlia tuber: RM Ursula", price: 4500, kind: "product", group: "tuber", colors: ["purple", "white"], soldOut: true, colorName: "Deep purple with white-tipped petals", size: "3.5–4 in", ads: { size: "M" } },
  "tuber-rm-party-popper": { name: "Dahlia tuber: RM Party Popper", price: 4500, kind: "product", group: "tuber", colors: ["pink"], soldOut: true, colorName: "Pink", size: "2.5–3 in", height: "4.5–5 ft", ads: { size: "M" } },
  "tuber-rm-lure": { name: "Dahlia tuber: RM Lure", price: 4000, kind: "product", group: "tuber", colors: ["peach", "orange"], soldOut: true, form: "Decorative", colorName: "Soft peachy orange", size: "4–6 in", height: "~4 ft", ads: { size: "BB", form: "FD" }, note: "Also described as an informal decorative (ID)." },
  "tuber-rm-copper-shimmer": { name: "Dahlia tuber: RM Copper Shimmer", price: 4000, kind: "product", group: "tuber", colors: ["bronze", "yellow"], soldOut: true, form: "Decorative", colorName: "Copper with gold tips", size: "~3 in", height: "~4.5 ft", ads: { size: "M", form: "FD" }, note: "A miniature formal decorative." },
  "tuber-rm-dreamy": { name: "Dahlia tuber: RM Dreamy", price: 4000, kind: "product", group: "tuber", soldOut: true, size: "4.5–5 in", height: "~6 ft", ads: { size: "BB" } },
  "tuber-rm-baby-girl": { name: "Dahlia tuber: RM Baby Girl", price: 3000, kind: "product", group: "tuber", colors: ["pink", "blush"], soldOut: true, form: "Decorative", colorName: "Soft pink with lighter streaks", size: "3–4 in", height: "3–4.5 ft", ads: { size: "M", form: "FD/ID" }, note: "Growers disagree on whether this is a formal or informal decorative." },
  "tuber-ka-s-sicilian-summer": { name: "Dahlia tuber: KA's Sicilian Summer", price: 4000, kind: "product", group: "tuber", colors: ["peach"], soldOut: true, form: "Decorative", colorName: "Soft apricot with a slightly darker center", size: "~3 in", height: "~3.5 ft", ads: { size: "M", form: "FD" }, note: "A mini, ball-shaped formal decorative." },
  "tuber-ka-s-penny-lane": { name: "Dahlia tuber: KA's Penny Lane", price: 3500, kind: "product", group: "tuber", colors: ["blush", "peach"], soldOut: true, form: "Decorative", colorName: "Blush / pale pink-peach with a dusty mauve center", size: "~5 in", ads: { size: "BB", form: "FD" } },

  // ---------- Recurring events (date chosen from a schedule above) ----------
  // `spots` = how many of a date's capacity one purchase uses
  "upick-jar":          { name: "U-Pick Ticket (1 person)",                 price: 6500,  kind: "series", series: "upick",     onSite: true, spots: 1 },
  "upick-plus-one":     { name: "U-Pick Plus-One Bundle (2 people)",        price: 11000, kind: "series", series: "upick",     onSite: true, spots: 2 },
  "happyhour-single":   { name: "BYOB Flower Happy Hour (1 person)",        price: 6500,  kind: "series", series: "happyhour", onSite: true, spots: 1 },
  "happyhour-plus-one": { name: "BYOB Flower Happy Hour Plus-One (2 people)", price: 11000, kind: "series", series: "happyhour", onSite: true, spots: 2 },
  "datenight-couple":   { name: "Friday Flower Date Night (per couple)",  price: 11000, kind: "series", series: "datenight", onSite: true, spots: 2, unit: "couple" },
  "bouquet-class":      { name: "Bouquet Making Class",                     price: 9500,  kind: "series", series: "bouquet",   onSite: true, spots: 1 },
  "suncatcher-class":   { name: "DIY Suncatcher Class",                     price: 6500,  kind: "series", series: "suncatcher", onSite: true, spots: 1 },
  "pumpkin-class":      { name: "Pumpkin Decorating Class",                 price: 7500,  kind: "series", series: "pumpkin",   onSite: true, spots: 1 },
  "wreath-class":       { name: "Wreath Making Class",                      price: 9500,  kind: "series", series: "wreath",    onSite: true, spots: 1 },
  "christmas-wreath-class": { name: "Christmas Wreath Making Class",        price: 11000, kind: "series", series: "christmaswreath", onSite: true, spots: 1 },
  "bloom-breathe":      { name: "Bloom & Breathe (yoga + bouquets)",        price: 8500,  kind: "series", series: "breathe",   onSite: true, spots: 1 },
  "brunch-blooms":      { name: "Brunch & Blooms",                          price: 9500,  kind: "series", series: "brunch",    onSite: true, spots: 1 },

  // ---------- Flower CSA (recurring subscriptions) ----------
  "csa-weekly":   { name: "Flower CSA: Weekly",         price: 4000, kind: "subscription", group: "csa", interval: "week",  intervalCount: 1, per: "week" },
  "csa-biweekly": { name: "Flower CSA: Every Two Weeks", price: 4000, kind: "subscription", group: "csa", interval: "week",  intervalCount: 2, per: "2 weeks" },
  "csa-monthly":  { name: "Flower CSA: Monthly",        price: 4000, kind: "subscription", group: "csa", interval: "month", intervalCount: 1, per: "month" },

  // ---------- Bulk flower buckets (farm pickup on a chosen Friday) ----------
  "bulk-seasonal":  { name: "Bulk Bucket: Seasonal Mix (~50 stems)",      price: 12000,  kind: "pickup", palette: true },
  "bulk-dahlia":    { name: "Bulk Bucket: Dahlias (~40 stems)",           price: 16500, kind: "pickup", palette: true, availableFrom: "2027-08-01" },
  "bulk-foliage":   { name: "Bulk Bucket: Foliage & Fillers (~60 stems)", price: 6500,  kind: "pickup" },
  "bulk-diy-event": { name: "DIY Event Package (5 buckets)",              price: 42500, kind: "pickup", palette: true },

  // ---------- Events ----------
  "event-pollinator-week": { name: "Pollinator Week Open Farm",      price: 500,   kind: "series", series: "pollinatorweek", onSite: true, spots: 1 },
  "event-dahlia-days":     { name: "Dahlia Days",                    price: 1000,  kind: "series", series: "dahliadays",     onSite: true, spots: 1 },
  "event-field-supper":    { name: "Long-Table Supper in the Field", price: 12500, kind: "series", series: "fieldsupper",    onSite: true, spots: 1, adultsOnly: true },

  // ---------- Plants & seeds ----------
  "seed-snapdragon":   { name: "Snapdragon Seed Mix",                 price: 500,  kind: "product", group: "seed" },
  "seed-strawflower":  { name: "Strawflower 'Apricot Mix' Seed",      price: 500,  kind: "product", group: "seed" },
  "seed-pollinator":   { name: "Front Range Pollinator Seed Blend",   price: 1400, kind: "product", group: "seed" },
  "plant-native-flat": { name: "Native Plant Starter Flat (pickup)",  price: 4200, kind: "product", group: "plant", pickup: true },
  "plant-seedlings":   { name: "Cut-Flower Seedling Six-Pack (pickup)", price: 1800, kind: "product", group: "plant", pickup: true },

  // ---------- Classes & webinars ----------
  "class-tuber-dividing": { name: "Dahlia Tuber Dividing Workshop", price: 6500, kind: "class", onSite: true, date: "2027-03-13", time: "10:00 am – 12:00 pm" },
  // On-demand video classes: bought once, streamed or downloaded any time.
  // The video links live in Netlify environment variables (see README), never in this file.
  "ondemand-regenerative": { name: "On-Demand Class: What Is Regenerative Farming and How to Implement It in Your Own Garden", price: 3000, kind: "ondemand", length: "90 min" },
  "ondemand-compost":      { name: "On-Demand Class: How to Build and Make Compost", price: 3000, kind: "ondemand", length: "75 min" },
  "ondemand-soil":         { name: "On-Demand Class: How to Amend Soil", price: 3000, kind: "ondemand", length: "75 min" },
  "ondemand-cover-crops":  { name: "On-Demand Class: Cover Cropping 101: Why Diversity Matters", price: 2500, kind: "ondemand", length: "60 min" },
  "ondemand-dahlias":      { name: "On-Demand Class: The Low Down on Dahlias", price: 3000, kind: "ondemand", length: "90 min" },
  "webinar-pollinator":   { name: "Webinar: Planting a Pollinator Garden in Colorado", price: 2500, kind: "class", date: "2027-04-15", time: "6:00 – 7:00 pm MT (online)" },
};

/* All dates for a recurring schedule. Used by site AND server. */
function seriesDates(key) {
  const c = CATALOG_SETTINGS.schedules[key];
  if (!c) return [];
  if (c.dates) return c.dates.filter((d) => !(c.closedDates || []).includes(d)).sort(); // explicit list of dates
  const [y, m, d] = c.firstDate.split("-").map(Number);
  const out = [];
  for (let wk = new Date(Date.UTC(y, m - 1, d)); ; wk.setUTCDate(wk.getUTCDate() + 7 * c.everyWeeks)) {
    if (wk.toISOString().slice(0, 10) > c.lastDate) break;
    for (const off of c.dayOffsets) {
      const dt = new Date(wk);
      dt.setUTCDate(dt.getUTCDate() + off);
      const iso = dt.toISOString().slice(0, 10);
      if (iso <= c.lastDate && !(c.closedDates || []).includes(iso)) out.push(iso);
    }
  }
  return out.sort();
}

/* Shared rule: is this a bookable date for the schedule? */
function isValidSeriesDate(key, dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr || "")) return false;
  const today = new Date().toISOString().slice(0, 10);
  return dateStr >= today && seriesDates(key).includes(dateStr);
}
const upickDates = () => seriesDates("upick");

/* Friday pickup dates for bulk buckets, at least `leadDays` from today */
function bulkPickupDates(item) {
  const b = CATALOG_SETTINGS.bulk;
  const earliest = new Date(Date.now() + b.leadDays * 864e5).toISOString().slice(0, 10);
  const from = [b.seasonStart, earliest, (item && item.availableFrom) || ""].sort().pop();
  const [y, m, d] = b.seasonStart.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + ((b.pickupDay - dt.getUTCDay() + 7) % 7));
  const out = [];
  for (; dt.toISOString().slice(0, 10) <= b.seasonEnd; dt.setUTCDate(dt.getUTCDate() + 7)) {
    const iso = dt.toISOString().slice(0, 10);
    if (iso >= from) out.push(iso);
  }
  return out;
}

if (typeof module !== "undefined") module.exports = { CATALOG, CATALOG_SETTINGS, seriesDates, isValidSeriesDate, upickDates, bulkPickupDates };
