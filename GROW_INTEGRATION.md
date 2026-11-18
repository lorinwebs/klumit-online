# תשלומים ב-Grow דרך Make (Grow app for Make) – סביבת ייצור

האתר לא מדבר עם Grow ישירות (אין `userId` / `pageCode` של ה-Light API). החיבור ל-Grow
(ח.פ + OTP לטלפון) נמצא ב-Make, והאתר קורא לשני תרחישים (scenarios) ב-Make.

תיעוד Grow: <https://developers.grow.business/docs/grow-app-for-make>

```
דפדפן                 האתר (Next.js)                       Make                                   Grow
──────                ──────────────                       ────                                   ────
/checkout ─────────►  POST /api/checkout/create-and-pay
                        │ יוצר Draft Order ב-Shopify
                        │ POST {event: create_payment_link} ─► תרחיש 1 · Router › Create Payment Link ─► createPaymentLink
                        ◄──────────────────────────────────   Webhook response {url, id, token}
/checkout/payment  ◄──  {paymentUrl, …}
   מעבר לדף התשלום של Grow (כרטיס / Bit / Apple Pay / Google Pay)
                                                                                            הלקוח משלם
                                                             תרחיש 2 · Grow › Notify URL Webhook ◄── server update
                      POST /api/grow/webhook  ◄────────────  HTTP › Make a request (X-Klumit-Secret)
                        │ POST {event: get_payment_link_info} ─► תרחיש 1 · Router › Get Payment Link Info (אימות)
                        │ משלים את ההזמנה ב-Shopify
                        └─ 200 ───────────────────────────►  [filter: status = 200] → Grow › Approve Transaction
/checkout/success  (redirect מ-Success URL) → polling ל-/api/checkout/status עד שההזמנה הושלמה
```

למה שני תרחישים ולא שלושה: חשבון Make הוא בתוכנית **Free** (2 תרחישים פעילים, 1,000 פעולות בחודש).
לכן יצירת הקישור והאימות חיים באותו תרחיש, ו-Router בוחר מסלול לפי השדה `event`.

## סטטוס (29/09/2026)

- ✅ **עובד מקצה לקצה:** ב-29/09 בשעה 11:27 הקוד של האתר (`lib/grow.ts`) יצר דרך Make קישור תשלום אמיתי ב-Grow
  (`https://pay.grow.link/…`, paymentLinkProcessId `4053729`), ומסלול האימות החזיר בדיוק את המבנה שהקוד מצפה לו.
- **מה היה הבעיה:** חיבור Grow שנוצר דרך ה-API של Make (`11360216`) עבר את בדיקת Make (`verified: true`) אבל Grow לא הכיר
  אותו – כל מודול החזיר פלט ריק ו-Grow לא ראו שום ניסיון. חיבור שנוצר **בממשק של Make לפי המדריך של Grow** (ב-Safari)
  עובד. ב-Chrome אותו תהליך נגמר ב-`401 Access denied` בחזרה מדף הקוד של Grow.
- **צ'קאאוט במצב redirect:** דף התשלום של Grow שולח `frame-ancestors https://grow.website https://*.grow.website`, ולכן
  אי אפשר להטמיע אותו ב-iframe באתר שלנו. ברירת המחדל של `GROW_OPEN_MODE` היא עכשיו `redirect`.
- ⏳ **נשאר:** commit + deploy של הקוד, משתני הסביבה ב-Vercel, ורכישה אמיתית קטנה (שבודקת גם את תרחיש 2 – התראה → האתר
  → Approve Transaction) עם זיכוי מלא באותו יום.

## משאבים ב-Make

הריפו ציבורי: כתובות ה-webhooks, הסוד המשותף ופרטי העסק נמצאים רק ב-`.env.local`, ב-Vercel וב-Make – לא לכתוב אותם כאן.

| משאב | מזהה | הערות |
|---|---|---|
| Organization / Team | `9122734` / `2964914` ("My Team") | eu1.make.com, תוכנית Free |
| Custom webhook `klumit-grow-payment-link` | hook `3798590` | הכתובת שלו היא `MAKE_GROW_CREATE_LINK_WEBHOOK_URL` וגם `MAKE_GROW_LINK_INFO_WEBHOOK_URL` |
| תרחיש 1 "KLUMIT · Grow payment link" | scenario `7653372` (פעיל) | Custom webhook → Router → (Create Payment Link → Webhook response) / (Get Payment Link Info → JSON → Webhook response) |
| חיבור Grow (ייצור) "Mor's Grow connection" | connection `11393088` | נוצר בממשק של Make (Safari) לפי המדריך, עם ח.פ העסק והנייד שמשמש להתחברות ל-Grow. סוג `grow` = **Grow**; `grow3` = Grow Sandbox – לא להשתמש בו בייצור |
| Grow webhook `klumit-grow-notify-v2` | hook `3805933` | ה-Notify URL של כל קישור תשלום (= `MAKE_GROW_NOTIFY_WEBHOOK_URL`) |
| תרחיש 2 "KLUMIT · Grow notify" | scenario `7656242` (פעיל) | Notify URL Webhook → JSON → HTTP POST לאתר → [200] → Approve Transaction |
| תרחיש בדיקה "KLUMIT · Grow test (Run once)" | scenario `7665214` (כבוי) | מודול Create Payment Link אחד עם ערכים קבועים (₪1) – להרצה ידנית ב-Run once |
| לא בשימוש | connection `11360216`, hook `3799672` | החיבור שנוצר דרך ה-API והwebhook שעליו – לא עובדים מול Grow, אפשר למחוק |

## חיבור Grow ב-Make (רק אם צריך לחבר מחדש)

לחבר **רק בממשק של Make, לפי [המדריך של Grow](https://developers.grow.business/docs/grow-app-for-make)**: במודול Grow
→ Add (Create a connection) → **Grow** → ח.פ + הנייד שמשמש להתחברות לממשק של Grow → Save → בחלון שנפתח מזינים את קוד ה-SMS.
אצלנו זה עבד ב-Safari; ב-Chrome התהליך נגמר ב-`401 Access denied`. **לא ליצור את החיבור דרך ה-API של Make** – Make מאשר
אותו, אבל Grow לא מכיר אותו והמודולים מחזירים פלט ריק.

אחרי חיבור מחדש:
1. להחליף את `__IMTCONN__` בשלושת מודולי Grow (Create Payment Link, Get Payment Link Info, Approve Transaction) ובתרחיש הבדיקה.
2. ליצור Grow webhook חדש על החיבור החדש (אי אפשר להחליף חיבור ב-webhook קיים – `hooks_update` מחזיר Access denied),
   לחבר אותו לתרחיש 2 ולעדכן את `MAKE_GROW_NOTIFY_WEBHOOK_URL` (וגם את כתובת ה-fallback במודול Create Payment Link).
3. לבדוק ב-Run once בתרחיש הבדיקה שיש Output עם `Status: 1` ו-`Data.url`.

## משתני סביבה (מקומי ו-Vercel)

| משתנה | חובה | ערך / תיאור |
|---|---|---|
| `MAKE_GROW_CREATE_LINK_WEBHOOK_URL` | כן | כתובת ה-Custom webhook של תרחיש 1 (`https://hook.eu1.make.com/…`) |
| `MAKE_GROW_LINK_INFO_WEBHOOK_URL` | לא (מומלץ) | אותה כתובת. כשמוגדר, האתר מאמת כל תשלום מול Grow לפני שהוא משלים הזמנה; להסרת האימות – להשאיר ריק |
| `MAKE_WEBHOOK_SECRET` | כן | מחרוזת אקראית (`openssl rand -hex 32`). האתר שולח אותה ל-Make (header `X-Klumit-Secret` + שדה `secret` בגוף) והפילטרים בתרחיש 1 דוחים בקשה בלעדיה; Make שולח אותה בחזרה ל-`/api/grow/webhook` |
| `MAKE_GROW_NOTIFY_WEBHOOK_URL` | לא | כתובת ה-Grow webhook של תרחיש 2. המודול Create Payment Link משתמש בה אם נשלחה, ואחרת בכתובת הקבועה שמוטמעת בו |
| `GROW_OPEN_MODE` | לא | `redirect` (ברירת מחדל) – מעבר לדף התשלום של Grow. `iframe` לא עובד: דף התשלום של Grow מתיר הטמעה רק ב-grow.website |
| `GROW_MAX_PAYMENTS` | לא | נשלח ל-Make כ-`maxPayments`, אבל מודול Create Payment Link מוגדר כרגע ל**תשלום אחד** קבוע. לתשלומים – לשנות במודול (ראו תרחיש 1) |

כל עוד `MAKE_GROW_CREATE_LINK_WEBHOOK_URL` או `MAKE_WEBHOOK_SECRET` חסרים, `/api/checkout/create-and-pay`
מחזיר 503 עם `fallback: "shopify"` והאתר ממשיך ל-Shopify Checkout. **ב-Vercel צריך להגדיר את אותם משתנים
(Production) ולעשות redeploy.** את המשתנים הישנים של ה-Light API (`GROW_ENVIRONMENT`, `GROW_USER_ID`,
`GROW_PAGE_CODE`, `GROW_APPLE_PAGE_CODE`, `GROW_GOOGLE_PAGE_CODE`) אפשר למחוק – הקוד לא קורא אותם יותר.

## תרחיש 1 – "KLUMIT · Grow payment link"

`Webhooks › Custom webhook (3798590)` → `Router`

**מסלול A – פילטר** `{{1.event}} = create_payment_link` **וגם** `{{1.secret}} = MAKE_WEBHOOK_SECRET`
→ `Grow › Create Payment Link` → `Webhooks › Webhook response`

הגוף שהאתר שולח (`buildCreatePaymentLinkPayload` ב-`lib/grow.ts`) ומיפויו במודול:

| שדה בגוף | שדה במודול Create Payment Link |
|---|---|
| `title` | Title |
| `successUrl` | Success URL |
| `notifyUrl` | Notify URL – `{{ifempty(1.notifyUrl; "<כתובת ה-Grow webhook>")}}` |
| (קבוע במודול) | Payment Type = `payments`, Custom Payments = 1 (תשלום אחד). ה-validator של Make לא מקבל ביטוי דינמי בבחירה Max/Custom, לכן כדי להציע תשלומים משנים ידנית ל-Max Payments = N (2–12) |
| `products[]` – `{catalogNumber?, name, price, quantity, minQuantity, vatType: 1}` | Products › Products List (מיפוי של המערך כולו; המפתחות זהים למפתחות המודול) |
| `customField1` (= מזהה ה-Draft Order) | Custom Field 1 **(חובה – בלעדיו האתר לא מקשר תשלום להזמנה)** |
| `customField2` (`klumit-web`) | Custom Field 2 |
| `fullName`, `phone` (`05XXXXXXXX`), `email` | Page Field Settings |
| קבועים במודול | Sending Mode = none · Charge Type = Regular · Transaction Type = ריק (כל אמצעי התשלום) · Invoice Name / License Number = Optional |

Webhook response (200, `Content-Type: application/json`):

```json
{"status":"{{3.status}}","err":{"id":"{{3.err.id}}","message":"{{3.err.message}}"},"url":"{{3.data.url}}","paymentLinkProcessId":"{{3.data.paymentLinkProcessId}}","paymentLinkProcessToken":"{{3.data.paymentLinkProcessToken}}"}
```

`status` / `err` מועברים כדי שהאתר יציג את שגיאת Grow המקורית (`makeRequest` ב-`lib/grow.ts` זורק `GrowApiError` כש-`status` הוא 0).

Error handler על מודול Grow: `Webhook response` 502 עם `{"error":"grow_create_payment_link_failed","message":…}` → `Ignore`,
כך שהאתר מקבל שגיאה ברורה והתרחיש לא נכבה אחרי כמה כשלונות רצופים.

**מסלול B – פילטר** `{{1.event}} = get_payment_link_info` **וגם** `secret`
→ `Grow › Get Payment Link Info` (`paymentLinkProcessId`, `paymentLinkProcessToken` מהגוף) → `JSON › Transform to JSON` של `{{5.data}}`
→ `Webhook response` 200 עם `{{6.json}}`. האתר (`extractPaymentLinkTransaction`) מאתר בתוך
`paymentLinkTransactions[].transactions[]` את העסקה עם ה-`transactionId` שדווח בהתראה.

בקשת דוגמה (מסלול A):

```bash
curl -X POST "$MAKE_GROW_CREATE_LINK_WEBHOOK_URL" -H "Content-Type: application/json" \
  -H "X-Klumit-Secret: $MAKE_WEBHOOK_SECRET" -d '{
    "event": "create_payment_link", "secret": "'"$MAKE_WEBHOOK_SECRET"'", "reference": "1234567890",
    "title": "KLUMIT הזמנה D1001", "description": "KLUMIT הזמנה D1001", "sum": 539, "maxPayments": 1,
    "fullName": "דנה כהן", "firstName": "דנה", "lastName": "כהן", "phone": "0541234567", "email": "dana@example.com",
    "successUrl": "https://www.klumit-online.co.il/checkout/success?ref=1234567890&sig=abc",
    "cancelUrl": "https://www.klumit-online.co.il/checkout/payment?response=cancel", "notifyUrl": "",
    "customField1": "1234567890", "customField2": "klumit-web",
    "products": [
      {"name": "תיק לואי שחור", "price": 500, "quantity": 1, "minQuantity": 1, "vatType": 1},
      {"name": "משלוח", "price": 39, "quantity": 1, "minQuantity": 1, "vatType": 1}
    ]}'
```

הערות: סכום שורות המוצרים תמיד שווה ל-`sum` (Grow מחשב את הסכום מהמוצרים). כשיש קוד הנחה האתר שולח
שורה אחת "הזמנה D1001 (N פריטים)" בסכום הכולל (`buildPaymentLinkProducts` ב-`lib/checkout-payment.ts`).
**שימו לב: כל קריאה למסלול A יוצרת קישור תשלום אמיתי בחשבון Grow (בלי חיוב).**

## תרחיש 2 – "KLUMIT · Grow notify"

`Grow › Notify URL Webhook` → `JSON › Transform to JSON` (`{{1.data}}`) → `HTTP › Make a request` → [filter] → `Grow › Approve Transaction`

- HTTP: `POST https://www.klumit-online.co.il/api/grow/webhook`, header `X-Klumit-Secret`, body raw JSON = `{{2.json}}`,
  Parse response = Yes, **Evaluate all states as errors = No**, timeout 60s. Error handler: `Ignore` (האתר לא זמין → אין Approve → Grow שולח שוב).
- Filter לפני Approve: `{{3.statusCode}}` Numeric: Equal to `200`.
- Approve Transaction: `transactionId`, `transactionToken`, `fullName`, `payerPhone`, `asmachta` מ-`{{1.data.*}}`. Error handler: `Ignore`.

הגוף שמגיע לאתר הוא אובייקט ה-`data` של הטריגר: `statusCode`, `status`, `sum`, `transactionId`, `transactionToken`,
`paymentLinkProcessId`, `paymentLinkProcessToken`, `processId`, `processToken`, `asmachta`, `cardBrand`, `cardSuffix`,
`transactionTypeId`, `allPaymentsNum`, `fullName`, `payerPhone`, `payerEmail`, `customFields.cField1/2`, `productData[]`.

חוזה התגובה של האתר:

| תגובה | משמעות | מה Make עושה |
|---|---|---|
| `200 {ok:true, orderName}` | ההזמנה הושלמה (או כבר הייתה מושלמת) | Approve Transaction |
| `200 {ok:true, ignored:"not_paid"}` | סטטוס שאינו "שולם" (statusCode ≠ 2) | Approve Transaction (אין מה לנסות שוב) |
| `200 {ok:true, ignored:"missing_reference"}` | תשלום בלי Custom Field 1 – נשלחת התראת טלגרם | Approve Transaction; לטפל ידנית |
| `200 {ok:false, reason:"amount_mismatch"}` | הסכום ששולם ≠ סכום ההזמנה – התראת טלגרם, ההזמנה **לא** הושלמה | Approve Transaction; לטפל ידנית |
| `401` | ה-Secret חסר/שגוי | בלי Approve → Grow ישלח שוב (≈10/20/30 דק') – לתקן את ה-header |
| `502 verification_failed` | האימות מול Grow נכשל / העסקה לא מופיעה בקישור – התראת טלגרם | בלי Approve → Grow ישלח שוב |
| `502 order_completion_failed` | Shopify לא זמין – התראת טלגרם | בלי Approve → Grow ישלח שוב ואז ההזמנה תושלם |

## בדיקה בייצור

1. `GET https://www.klumit-online.co.il/api/grow/webhook` → `configured: true`, `verification: get_payment_link_info`.
2. רכישה אמיתית קטנה מהאתר, בדיקה שההזמנה עברה מ-Draft ל-Order ב-Shopify עם תגית `grow`, ואז **זיכוי מלא באותו יום** מהממשק של Grow.
3. History של שני התרחישים ב-Make: מסלול A (Create), מסלול B (Get Info) ו-Notify → HTTP 200 → Approve.

Sandbox: המודולים מחוברים ל-**Grow** (ייצור). כדי לבדוק ב-Sandbox יש ליצור חיבור `Grow Sandbox` ולהחליף אותו
בשלושת מודולי Grow וב-Grow webhook (בתוכנית Free אין מקום לעותק נפרד של התרחישים). כרטיסי בדיקה:
`4580458045804580`, `4580000000000000`, `4580111111111121`. ארנקים (Bit / Apple Pay / Google Pay) **מחייבים באמת גם ב-Sandbox**.
עסקה שמופיעה עם שם עסק **MAKE** נוצרה ב-Sandbox.

## עלות ב-Make

כל הזמנה ≈ 12 פעולות (תרחיש 1: מסלול A ≈ 4, מסלול B ≈ 5; תרחיש 2 ≈ 4). בתוכנית Free (1,000 פעולות/חודש) זה ≈ 80 הזמנות.
בלי אימות (`MAKE_GROW_LINK_INFO_WEBHOOK_URL` ריק) ≈ 8 פעולות → ≈ 125 הזמנות. תוכנית Core מעלה את התקרה ל-10,000.

## תקלות נפוצות

| תסמין | סיבה | פתרון |
|---|---|---|
| `Make scenario ended without a "Webhook response"` בלוגים | הפילטר לא עבר (event/secret שגויים) או שהתרחיש כבוי | לבדוק את ה-Secret ואת History של תרחיש 1 |
| `Make responded HTTP 400: There is no scenario listening` | תרחיש 1 כבוי | להפעיל (ON) |
| `grow_create_payment_link_failed` עם הודעה מ-Grow | Grow דחה את הבקשה (טלפון לא תקין, תו מיוחד בכותרת…) | ההודעה המקורית של Grow נמצאת ב-details של הלוג |
| התראת טלגרם "תשלום בלי הזמנה מקושרת" | Custom Field 1 לא הגיע | לבדוק את המיפוי `cField1 ← {{1.customField1}}`; להשלים את ההזמנה ידנית ב-Shopify |
| התראת טלגרם "לא ניתן לאמת תשלום" | Get Payment Link Info נכשל או שלא מצא את העסקה | Grow ינסה שוב; אם נמשך – לבדוק את מסלול B, או להשבית אימות זמנית (`MAKE_GROW_LINK_INFO_WEBHOOK_URL` ריק) |
| הלקוח שילם אבל ההזמנה נשארה Draft | תרחיש 2 כבוי / Secret שגוי (401) / Shopify נפל (502) | Grow ישלח שוב עד 3 פעמים; אחרי תיקון אפשר להריץ את ה-bundle מחדש מ-Make |
| ה-iframe ריק | דף התשלום של Grow מתיר הטמעה רק ב-grow.website (CSP `frame-ancestors`) | להשאיר `GROW_OPEN_MODE=redirect` (ברירת המחדל) |
| מודול Grow מסתיים בלי Output (בלי url) | החיבור לא מוכר ל-Grow (למשל נוצר דרך ה-API של Make) | לחבר מחדש בממשק של Make לפי המדריך (ראו "חיבור Grow ב-Make") |
