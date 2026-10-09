# Dedicated public information pages

## Goal
Replace homepage jump links with clear, standalone pages that visitors and search engines can open directly. Keep Case Broker’s current UK legal and regulatory scope explicit while making the explanations useful to visitors from any location.

## Navigation changes
- Change **How It Works** to `/how-it-works` in the navbar and footer.
- Change **Practice Areas** to `/practice-areas` in the navbar and footer.
- Change **For Law Firms** to `/for-law-firms` in the navbar and footer.
- Change footer **Pricing** to the existing `/pricing` page.
- Change footer **Contact** from a pop-up to `/contact`.
- Keep the existing dedicated Company, Legal, and Support destinations, but make internal navigation consistent and remove remaining placeholder jump links.
- Preserve account, admin, and sign-up actions as actions rather than informational pages.

## New pages
### How It Works
Explain the full client journey: submit a matter, protected initial review, matching, compare interested firms, select and pay for a video consultation, and choose next steps. Include privacy, fees, and what Case Broker does and does not do.

### Practice Areas
Turn the existing 22-area directory into a searchable standalone page with plain-English summaries, detailed area information, and a route into case submission. Clarify that availability depends on jurisdiction and regulated firm coverage.

### For Law Firms
Explain eligibility, regulator verification, NDA and approval stages, case-interest workflow, consultation pricing, profile evidence such as reviews and awards, video-only consultations, subscriptions, and the 20% transaction commission. Link to firm registration and pricing.

### Contact
Provide a full contact page with enquiry guidance, relevant Case Broker email addresses, expected response guidance, links to support and legal/privacy channels, and the existing enquiry form embedded directly on the page.

## Existing public pages
- Retain the existing routes for About, Careers, Blog, Privacy, Terms, Cookies, GDPR, FAQs, Help, Community, Status, and Pricing.
- Review their visible links and wording while touching navigation so they point to standalone pages and remain consistent with video-only consultations and Case Broker’s current UK jurisdiction.
- Do not invent new offices, telephone numbers, social profiles, team members, statistics, jobs, or international availability.

## Search and discovery
- Add page-specific titles and descriptions for all new routes.
- Add the new routes to the sitemap.
- Ensure every route scrolls to the top and works as a direct URL.

## Validation
- Verify desktop and mobile navigation.
- Open every navbar and footer destination and confirm no internal informational link uses `#`.
- Submit the Contact form through the page and confirm its success state when an authenticated test path is available; otherwise validate the public form and report the limitation.
- Check the preview for layout, console, network, and build errors.

## Technical details
- Reuse the existing React Router, design tokens, Navbar, Footer, Button, breadcrumb, and back-to-top patterns.
- Extract shared practice-area data and contact form UI where needed so homepage and standalone pages do not drift.
- No database or permission changes are planned; the existing contact enquiry storage remains unchanged.
