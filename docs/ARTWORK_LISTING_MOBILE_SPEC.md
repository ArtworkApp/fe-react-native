# Artwork Listing — React Native App

> * **Version:** 1.0  
> * **Application:** ArtworkApp Mobile (React Native / Expo)  

## 1. User Story

As a mobile user, I want to browse and filter original artworks in a visual, touch-friendly interface so I can discover artworks easily on a phone or tablet.

## 2. Scope

### Included

- Artwork listing, cards, filters, sorting, and Load More
- Loading, empty, and error states
- Artwork image loading and fallback
- Accessibility and mobile performance

### Excluded

- Artwork detail page, checkout, and payment
- User accounts and favorites
- Sold artwork listings and Sold badges
- Artist-name sorting

Only artworks with status `AVAILABLE` are shown. The backend enforces this.

## 3. Web Parity and Native Adaptation

The app shall match the mobile web experience in visual design and product behavior:

- Use the same colors, typography, spacing, card content, image treatment, labels, filter choices, sorting choices, and result states.
- Keep the same filter semantics, backend query contract, page size, and artwork ordering.
- Show a two-column grid on phones and tablets.
- Reuse design tokens and business rules where practical. React Native controls and components are platform-specific; pixel-identical rendering is not required.

Native adaptations are allowed when they improve usability and preserve the same behavior. Examples include the on-screen keyboard, safe areas, screen-reader semantics, Android Back handling, and a native picker or action sheet for sorting. The sort labels and values must remain the same as web.

## 4. Listing Layout

The listing presents the page title, filter and sort controls, then the artwork grid. Filters open in a bottom sheet and do not permanently occupy phone screen space.

### Grid

- Two artwork cards per row on phones and tablets.
- Initially request up to 21 artworks.
- Keep cards equal in width and use consistent image aspect ratios.
- Avoid horizontal overflow and preserve scroll position when more results are appended.

## 5. Artwork Card

Each card shows an artwork image, title, all associated artist names, and price.

### Image

- The listing response provides nullable `primaryImage` with `url` and `altText`.
- Load the backend-provided image URL at a listing-appropriate size; lazy-load images where supported.
- Use meaningful alternative text and a consistent crop/aspect ratio.
- Show the same artwork placeholder as mobile web when the image is missing or fails to load.

### Artist and Price

- Treat `artist` as an array and show all associated names, truncating long text without overflow.
- Show `Unknown artist` when the array is empty.
- Show price and its currency when present. If price is null, show **Price on Request**.
- Do not assume USD or convert currencies when the API omits currency.

Do not show a Sold badge. Sold artworks are outside this listing's scope.

## 6. Filters

Filtering is performed by the backend. The filter sheet shows the same options and selection semantics as mobile web.

### Artist

- Search names through `GET /artists?search=...`.
- Select one artist and send its ID as `artistId`.
- Show the selected artist and allow clearing the selection.
- Support touch selection and accessible keyboard/screen-reader interaction.

### Artwork Type and Materials

- Load options from `GET /artwork-types` and `GET /materials`.
- Select one artwork type as `artworkTypeId`.
- Select multiple materials as `materialIds`.
- When a type is selected, show only its associated materials and clear incompatible material selections when the type changes.
- With no type selected, show all materials.

### Year Range

- Provide numeric text inputs labeled **From** and **To**; years range from `0000` through `9999`.
- Boundaries are optional and inclusive. Equal values are allowed.
- If both are supplied, require From ≤ To. Show validation feedback and do not send invalid values.

### Artist Country

- Provide one searchable country input; users may search by a full or partial country name.
- Suggestions include all country names, independent of which countries appear in current artwork data.
- Send the selected country as the backend's `country` query parameter. Allow clearing it.

## 7. Filter Sheet

- Open from a **Filter** button.
- Slide up from the bottom and scroll when its content exceeds the available height.
- Preserve applied selections when opened.
- **Apply Filters** closes the sheet and requests the filtered listing.
- **Cancel** or dismissal by tapping outside, swiping down, or pressing Android Back closes the sheet and discards unsubmitted edits.
- Keep the sheet accessible to screen readers and ensure touch targets are comfortable to activate.

## 8. Sorting

Sorting remains separate from filters. A native picker or action sheet may replace the web dropdown, but it must use the same four choices and backend values:

| Label | API value |
|---|---|
| Year: Oldest First | `year_asc` |
| Year: Newest First | `year_desc` |
| Price: Lowest First | `price_asc` |
| Price: Highest First | `price_desc` |

Default to `year_desc`. Do not add artist-name sorting. Sorting is performed by the backend across the full result set.

## 9. API and State

Use the current backend contract. `GET /artworks` accepts:

| Parameter | Meaning |
|---|---|
| `page` | 1-based page number |
| `limit` | Page size, at most 21 |
| `artistId` | One selected artist ID |
| `artworkTypeId` | One selected type ID |
| `materialIds` | Comma-separated material IDs |
| `yearStart`, `yearEnd` | Inclusive year boundaries |
| `country` | One artist country value |
| `sort` | One of the four values above |

- Initialize the app listing with the default sort and first page.
- Applying filters or changing sort resets to page 1 and replaces results.
- Load More requests the next page and appends results. Derive availability from pagination metadata.
- Prevent duplicate page requests and ignore stale responses after filter or sort changes.
- Preserve already loaded cards when Load More fails and offer a retry for the same page.
- Web URL query synchronization is not applicable to native navigation. Preserve state in the app's navigation/session model; deep links are outside this spec.

## 10. Loading, Empty, and Error States

- Initial loading: show skeleton cards in the two-column grid.
- Load More: change the button label to **Loading...** and prevent repeated activation.
- Empty results: show **No artworks found. Try adjusting your filters.** and a working **Clear Filters** action.
- Initial API failure: show **Unable to load artworks. Please try again.** with **Retry**.
- Load More failure: keep current cards visible and offer retry for that page.
- Lookup failures must not crash the listing; show a recoverable message or retry control.

## 11. Performance and Accessibility

- Fetch only listing and lookup fields required by the interface. Cache artwork types and materials where appropriate.
- Avoid loading full-resolution images for grid cards; use lazy loading and efficient rendering for long lists.
- Provide screen-reader labels, visible focus/selection feedback, sufficient contrast, and touch-friendly controls.
- Respect platform safe areas, status/navigation bars, and Android Back behavior.

## 12. Testing and Verification

Cover:

- Card content, multiple/empty artists, missing price/currency, image fallback, and long text
- Artist selection, type/material dependency, country search, and year validation
- Sorting values, filter apply/cancel, and preservation of applied selections
- Pagination, Load More retry, duplicate requests, and stale responses
- Loading, empty, lookup-failure, and request-error states
- Screen-reader labels, touch interactions, and phone/tablet two-column layout

Verify on iOS and Android devices or simulators where available. Report platform checks that could not be run.

## 13. Definition of Done

- [ ] Mobile app matches mobile web visual design and listing behavior, with documented native control adaptations.
- [ ] Two-column artwork grid and matching cards are implemented.
- [ ] Filters and sort options match web and use the current backend contract.
- [ ] Filter sheet supports apply and cancel/dismiss behavior.
- [ ] Load More, loading, empty, error, and retry states are implemented.
- [ ] Images are appropriately sized and have a fallback.
- [ ] Accessibility, phone/tablet layouts, and performance requirements are verified.
- [ ] Automated tests pass and iOS/Android verification is reported.
