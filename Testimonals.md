The effect you’re thinking of is commonly called a **“marquee”** or **“infinite scrolling carousel.”**
It’s a row of cards that **continuously moves left → right (or right → left) like a belt**, often used for testimonials or logos.

Modern sites usually implement this with animation libraries like Framer Motion instead of the old HTML `<marquee>`.

---

# Claude Prompt You Can Use

You can paste this directly into Claude.

---

**Prompt for Claude**

You are a senior React + UI engineer.

Create a **testimonial section** for my landing page.

### Section Title

**What users say**

### Layout

* A horizontal row of testimonial cards
* Cards should **continuously scroll from right to left like an infinite belt (marquee effect)**
* The animation should be **smooth and seamless**
* When the last card exits, it loops continuously
* Cards should pause animation on hover

### Card Design

Each testimonial card should contain:

* Star rating (⭐)
* Short quote
* Name
* Age

Card styling:

* Rounded corners
* Soft shadow
* Clean SaaS look
* Light background
* Padding
* Width ~280px

### Animation

Use **Framer Motion** to create the **infinite scrolling marquee effect**.

Requirements:

* Continuous horizontal animation
* Duplicate the list to create a seamless loop
* Smooth linear animation
* Pause animation on hover

### Data

Create a `testimonials` array and map over it.

Example structure:

```ts
{
  name: "Anna",
  age: 29,
  rating: 5,
  quote: "This is the first app that actually helped me understand why my mood and energy change during the month."
}
```

Use these testimonials:

(then paste your testimonials list here)

### Code Requirements

* React component called `TestimonialsSection`
* Reusable `TestimonialCard` component
* Map testimonials into cards
* Responsive layout
* Clean modern styling

### Bonus

Add subtle gradient fade on the left and right edges of the section so the cards appear to enter and exit smoothly.

---

💡 **UX tip:**
For landing pages, the **best performing testimonial layout** is actually **two opposite moving belts**:

```
→ → → → testimonials
← ← ← ← testimonials
```

It looks **much more dynamic and premium**.

If you want, I can also give you a **better Claude prompt that generates a Stripe-style testimonial section** (which looks **much more premium than the standard marquee**).
