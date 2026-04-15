# Design System Document: The Editorial Capture

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Curator"**

This design system moves beyond the utility of a "tool" and into the realm of a professional "workspace." We are moving away from the generic, boxed-in look of standard SaaS landing pages. Instead, we embrace **The Digital Curator**—a philosophy that treats every tweet snapshot like a piece of high-end editorial content.

The system breaks the "template" feel through **intentional asymmetry** and **tonal depth**. We use generous white space (the "Spacious" requirement) not just to separate elements, but to frame them. By overlapping high-fidelity browser mockups with skewed typography and layered surfaces, we create a sense of motion and efficiency that feels premium, reliable, and "no-fluff."

---

## 2. Colors & Surface Architecture

### The Palette
We utilize a sophisticated range of blues and greens, anchored by a deep neutral scale to ensure high contrast and professional gravity.

*   **Primary (`#006399`):** Our "Authoritative Blue." Used for key brand moments.
*   **Primary Container (`#1DA1F2`):** The "Twitter Legacy Blue." Reserved for accents that bridge the gap between our tool and the platform it serves.
*   **Secondary (`#006C46`):** Our "Action Green." This is the high-conversion engine. It must be used sparingly but boldly on primary CTA buttons to trigger the "Success" psychology.
*   **Tertiary (`#8A5100`):** An "Amber Accent." Used for subtle highlights or notifications that require attention without the alarm of red.

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders for sectioning. 
Structure is created through **Tonal Transitions**. A section change is signaled by a shift from `surface` to `surface-container-low`. This creates a seamless, infinite-scroll feel that mimics high-end editorial layouts.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. 
*   **The Base:** `surface` (`#f7f9ff`)
*   **The Section:** `surface-container-low` (`#f0f4fb`)
*   **The Card/Element:** `surface-container-lowest` (`#ffffff`)
By nesting a "Lowest" (bright white) card on a "Low" (soft blue-grey) background, you create a natural lift that feels lighter and more modern than a heavy drop shadow.

### The "Glass & Gradient" Rule
To elevate the "Modern" aesthetic:
*   **Floating Elements:** Use `surface-container-lowest` with an 80% opacity and a `24px` backdrop-blur.
*   **Signature Textures:** Apply a subtle linear gradient (Top-Down: `primary` to `primary_container`) on the Hero CTA to give it a "jewel" effect, making it feel more clickable and premium than a flat hex code.

---

## 3. Typography: Editorial Authority

We use **Inter** exclusively to maintain a clean, Swiss-style readability. The hierarchy is designed to feel like a high-end magazine.

*   **Display Large (3.5rem):** Used for the "Hook." Tight letter-spacing (-0.02em) and heavy weight. This is the "No Fluff" voice.
*   **Headline Medium (1.75rem):** Used for feature headers. These should be paired with generous top-margin to let the copy breathe.
*   **Body Large (1rem):** The workhorse. Increased line-height (1.6) is required to ensure "high readability" on desktop and mobile.
*   **Label Medium (0.75rem):** All-caps with increased letter-spacing (0.05em) for category tags or small "over-line" text above headlines.

---

## 4. Elevation & Depth: The Layering Principle

### Tonal Layering
Avoid shadows where color can do the work.
1.  **Level 0 (Background):** `surface`
2.  **Level 1 (Content Block):** `surface-container`
3.  **Level 2 (Interactive Card):** `surface-container-highest`

### Ambient Shadows
When a floating effect is required (e.g., a "Tweet Preview" floating over the hero):
*   **Blur:** `40px` to `60px`
*   **Opacity:** 6%
*   **Color:** Use a tinted version of `on-surface` (a deep navy-grey) rather than pure black to keep the shadow "airy."

### The "Ghost Border" Fallback
If an element lacks contrast against its background, use a **Ghost Border**: `outline-variant` at 15% opacity. It should be felt, not seen.

---

## 5. Components

### Buttons (High-Conversion Focus)
*   **Primary (The "Success" Button):** Background `secondary`, Text `on-secondary`. Use `rounded-md` (0.75rem) for a friendly yet professional look. Add a subtle inner-glow (1px white at 10% opacity) on the top edge.
*   **Secondary:** Ghost style. No background, `outline` at 20% opacity. 
*   **Tertiary:** Text-only in `primary` blue, with a `0.5rem` icon for "Learn More" links.

### Cards & Content Lists
*   **The "No-Divider" Mandate:** Never use horizontal lines to separate list items. Use 16px to 24px of vertical white space or a subtle `surface-container-low` background on hover to define boundaries.
*   **Roundedness:** All cards must use `rounded-xl` (1.5rem) to soften the "efficient" personality and make it feel user-friendly.

### Input Fields
*   Floating label design using `body-sm`. 
*   **State:** On focus, the border disappears and is replaced by a 2px `primary` blue "Glow" (shadow) to indicate activity without adding structural bulk.

### Signature Component: The "Snap Preview"
A specialized container for displaying tweet captures.
*   **Style:** `surface-container-lowest` with a `rounded-lg` corner. 
*   **Detail:** A 10% opacity `outline-variant` border. 
*   **Animation:** On hover, the card should lift using the Ambient Shadow (6% opacity) and scale by 1.02x.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical layouts (e.g., text on the left, image bleeding off the right edge).
*   **Do** use `primary-fixed-dim` for background accents to create a "layered paper" look.
*   **Do** prioritize "Breathing Room"—if you think a section has enough padding, add 24px more.

### Don't:
*   **Don't** use pure black (`#000000`) for text. Use `on-surface` (`#171c21`) for a more expensive, ink-like feel.
*   **Don't** use standard 1px grey dividers. They create "visual noise" that contradicts the "No Fluff" personality.
*   **Don't** use sharp corners. Nothing in this system should be `none` or `sm` roundedness unless it's a technical micro-label.