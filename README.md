# SkillRadius — website (static HTML/CSS/JS)

This is the multi-page front end for SkillRadius, built from the Figma file and extended with the pages a
production learning platform needs. There is no build step: open `index.html` in a browser, or serve the folder
with any static server.

```bash
# any of these works
npx serve .
python3 -m http.server 8080
```

## Demo accounts

| What | Value |
|---|---|
| Learner | `satishhebbal@gmail.com` / `Skill@2026`. This account already has courses, batches, orders, exam history and certificates. |
| Admin | `admin@skillradius.in` / `Admin@2026`. Opens `admin.html`. |
| Trainer | `priya@skillradius.in` / `Trainer@2026`. Opens `trainer.html`. |
| New sign-up | Enter any details. The email verification code is `482913`. |
| Coupons | `SKILL10` (10% off) and `WELCOME20` (20% off). Admins can create more. Referral codes look like `REF-NAME1234` and take ₹500 off orders of ₹2,000 or more. |
| Certificate IDs to verify | `CERT-SR-PD-2026-001`, `CERT-SR-RJS-2026-047` |

The login page has a "Use a demo account" picker for all three roles.

All state is kept in `localStorage` (keys prefixed `sr_`), so the whole journey works without a server, including
admin and trainer actions showing up for learners. Clear site data to reset it.

## Pages (52)

| Area | Pages |
|---|---|
| Home & catalog | `index.html`, `courses.html`, `course.html#<id>`, `trainings.html`, `training.html#<id>`, `certifications.html`, `certification.html#<id>`, `paths.html`, `path.html#<id>`, `instructors.html`, `instructor.html#<key>` |
| Community & content | `events.html`, `blog.html`, `article.html#<slug>`, `placements.html`, `scholarships.html` |
| Company | `about.html`, `business.html`, `teach.html`, `careers.html`, `press.html`, `contact.html`, `sitemap.html` |
| Help | `help.html`, `support.html` (tickets, sign-in required), `verify.html` |
| Legal | `privacy.html`, `terms.html`, `refund-policy.html`, `delivery-policy.html`, `cookie-policy.html`, plus a cookie consent banner on every public page |
| Auth | `login.html`, `signup.html`, `forgot-password.html`, `verify-otp.html`, `reset-password.html` |
| Purchase | `checkout.html#course/<id>`, `#training/<id>`, `#cert/<id>`, `#path/<id>`, and `invoice.html#<order-id>` (GST tax invoice) |
| Learner | `dashboard.html` (`#overview`, `#courses`, `#trainings`, `#certifications`, `#certificates`, `#orders`, `#wishlist`), `learn.html#<course>/<module>-<lesson>` (includes lesson Q&A), `assignment.html#<batch>`, `profile.html`, `certificate.html#<CERT-ID>`, `refer.html` |
| Exam | `cert-notes.html#<cert>/<module>/<lesson>` (study notes; finishing every module unlocks the test), `mock-test.html#<cert>`, `exam-rules.html#<cert>`, `exam.html#<cert>`, `exam-result.html#<cert>` |
| Staff | `admin.html`, `trainer.html` |
| Other | `404.html` |

Detail pages read their ID from the URL hash, so the site works from any static host and from `file://`. If you
move to a router, swap `SR.hashId()` for a path parameter.

### Admin panel (`admin.html`)

- **Dashboard**: revenue, learner and ticket KPIs, a 14-day revenue chart, recent orders and new leads.
- **Courses**: edit price, MRP, the bestseller badge and published state. Changes show on the website straight away. You can also create a new draft course.
- **Batches**: edit start date, seats and fee, and view the roster.
- **Certifications**: edit fee and published state.
- **Learners**: view all learners and suspend or reactivate accounts.
- **Orders**: view all orders and approve refund requests. Approving one replies on the learner's ticket.
- **Coupons**: create coupons and turn them on or off. New codes work at checkout.
- **Exams & certificates**: clear flagged attempts, and revoke or restore certificates (`verify.html` reflects this).
- **Leads**: business, scholarship, trainer, job, event and contact submissions, with a status for each.
- **Support tickets**: reply to or close tickets. Replies appear on the learner's Support page.
- **Reviews**: hide or publish course reviews.
- **Content**: publish or unpublish blog posts, and see event registrations.

### Trainer panel (`trainer.html`)

- **Overview**: the next session, KPIs, recent attendance and a grading queue.
- **My batches**: rosters with attendance percentages, and recording uploads.
- **Attendance**: mark each learner present, absent or late for each session.
- **Submissions**: grade assignments with a score and feedback. The learner sees the result on `assignment.html`.
- **Learner Q&A**: answer lesson questions. Answers appear under the lesson for every learner.
- **Schedule**: upcoming sessions, grouped by day.

## Design system (from the Figma file)

- Type: **Instrument Sans** (Google Fonts). The SkillRadius wordmark is exported from the file as SVG (`assets/img/logo-*.svg`).
- Colours: primary `#3c5ac7`, primary dark `#1a3ebe`, headings `#3f3f3f`, body `#535353`, tint `#e1e7ff`.
- Icons: the Material Symbols used in the design are exported as exact paths (`SR.ficon(name)` in `ui.js`).
- Decorative curves, partner logos and certificate art are exported from the Figma file (`assets/img/deco/`, `assets/img/brand-*.svg`).
- Spacing on the home page follows the measured gaps in the 1728px frame, scaled down for smaller screens.

## Structure

```
assets/
  css/styles.css      shared design tokens + components for public pages
  css/learn.css       lesson player, quiz, exam, results, certificate, profile
  css/dashboard.css   app shell (sidebar layout) for the learner dashboard and staff panels
  js/data.js          catalog: courses, trainings, certifications, paths, events, posts, jobs, FAQ…  ← replace with API
  js/ui.js            header/footer, auth + roles, SR.store, orders/coupons/GST, wishlist, leads, tickets, Q&A, modal, icons
  js/catalog.js       search + filters + sort engine for the listing pages
  js/panel.js         staff panel engine: sidebar, hash router, filterable tables, KPI tiles
  js/pages/*.js       one script per page
  img/                course and certification artwork from the Figma file
```

Every page loads `data.js`, then `ui.js`, then its own page script. The staff panels also load `panel.js` before
their page script. Everything hangs off one global, `SR`.

### localStorage keys (each one maps to a future API resource)

| Key | What it holds |
|---|---|
| `user`, `accounts` | signed-in user, accounts created in this browser |
| `enrolled`, `progress`, `certprog`, `mynotes`, `activity` | enrolments, lesson progress, certification prep, notes, streak |
| `attempts`, `certificates`, `mocks`, `revoked`, `examReviewed` | exam attempts, issued certificates, mock tests, revocations, proctoring reviews |
| `orders`, `coupons`, `wishlist` | orders and invoices, coupon codes, saved items |
| `submissions`, `sampleGrades`, `attendanceMarks`, `recordings` | assignments and grades, attendance, session recordings |
| `qa`, `reviews` | lesson Q&A, course reviews |
| `tickets`, `leads`, `leadStatus`, `eventRegs` | support tickets, form submissions, event registrations |
| `overrides`, `draftCourses`, `suspended`, `postsHidden` | admin edits to the catalog, draft courses, suspended accounts, unpublished posts |
| `consent` | cookie preferences |

## Connecting a backend

Search the code for `→ Replace with` to find each integration point:

- **Auth and roles** (`pages/auth.js`, `SR.auth` in `ui.js`): login, signup, verify code, reset password, and role-based redirects. Enforce roles on the server as well; the client check only hides the UI.
- **Catalog** (`data.js`): `SR.courses`, `SR.trainings`, `SR.certifications`, `SR.paths`, `SR.events`, `SR.posts`, `SR.jobs`.
- **Enrolment and progress** (`ui.js`): `SR.enroll`, `SR.setLessonDone`, `SR.progressOf`, `SR.store`.
- **Payments** (`pages/checkout.js`): hook the Pay button to Razorpay or Stripe, and enrol on the success webhook. Invoices should be numbered and generated on the server.
- **Exams** (`pages/exam.js`): serve questions and score on the server, and add webcam proctoring.
- **Certificates and verification** (`pages/certificate.js`, `verify.html`): `GET /api/certificates/:id`.
- **Forms** (`SR.addLead` in `ui.js`): contact, business, scholarship, trainer, careers and event forms all go through this function.
- **Tickets, Q&A and assignments**: `SR.tickets`, `SR.addQA`, and the `submissions` store.
- **Admin and trainer panels** (`pages/admin.js`, `pages/trainer.js`): every action reads from or writes to `SR.store`. Swap each one for its API call.

## Placeholder content to confirm before launch

- Headline numbers (50,000+ certified, 120+ trainers, ratings and review counts), and placement statistics and stories.
- Training fees, dates, seat counts, and trainer bios and photos.
- Certification codes other than DIC-PDI158. The other codes were unreadable in the PDF.
- Course prices other than AI Automation, which comes from the Figma file at ₹1,200 / ₹7,300.
- Company details: GSTIN, registered address, phone number, support emails and social links.
- Legal copy: privacy, terms, refund, delivery and cookie policies need a lawyer's review.
- Signatories on the certificate (Dr. Rahul Sharma and Priya Singh, from the Figma file).
- Blog posts, events, job openings, scholarships, press releases and partner logos.
- Sample learners, orders and leads in the admin panel. These are generated for the demo.
