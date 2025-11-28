# PersonAvatar Component

A reusable component for displaying a person's avatar with their name. Used consistently across work portfolio pages and the career odyssey visualization.

## Overview

The PersonAvatar component displays a circular avatar image alongside a person's name. If a URL is provided, both the avatar and name become clickable links. The component is available in both Astro and React versions to support different contexts.

## Files

- **`PersonAvatar.astro`** - Astro version for use in Astro pages and components
- **`PersonAvatar.tsx`** - React version for use in React components (e.g., CareerOdyssey)
- **`PeopleAvatars.astro`** - Wrapper component for displaying multiple PersonAvatar components in a grid

## Usage

### Astro Version

```astro
---
import PersonAvatar from '../components/PersonAvatar.astro';
---

<PersonAvatar 
  person={{
    name: "John Doe",
    image: "/images/people/john.jpg",
    url: "https://johndoe.com",
    linkedin: "https://linkedin.com/in/johndoe"
  }}
  size={24}
/>
```

### React Version

```tsx
import { PersonAvatar } from './PersonAvatar';

<PersonAvatar 
  person={{
    name: "John Doe",
    image: "/images/people/john.jpg",
    url: "https://johndoe.com"
  }}
  size={40}
  className="custom-class"
/>
```

### Using PeopleAvatars (Multiple People)

```astro
---
import PeopleAvatars from '../components/PeopleAvatars.astro';
---

<PeopleAvatars 
  people={[
    {
      name: "John Doe",
      image: "/images/people/john.jpg",
      url: "https://johndoe.com"
    },
    {
      name: "Jane Smith",
      image: "/images/people/jane.jpg"
    }
  ]}
  avatarSize={24}
/>
```

## Props

### PersonAvatar

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `person` | `object` | **required** | Person object with name, image, and optional url/linkedin |
| `person.name` | `string` | **required** | Person's full name |
| `person.image` | `string` | **required** | Path to person's avatar image |
| `person.url` | `string` | `undefined` | Optional website URL (makes avatar and name clickable) |
| `person.linkedin` | `string` | `undefined` | Optional LinkedIn URL (currently only used in data, not displayed) |
| `size` | `number` | `24` | Avatar size in pixels |
| `className` | `string` | `""` | Additional CSS class names (React version only) |

## Where It's Used

### Work Portfolio Pages

The component is used in work detail pages (`src/pages/work/[...slug].astro`) to display people who worked on each project. The data comes from the `people` field in work collection frontmatter.

**Example in work frontmatter:**
```yaml
---
people:
  - name: "Matilda Dackevall"
    image: "/images/people/img-matilda-dackevall.jpeg"
    url: "https://matilda.dackevall.com/"
---
```

**Default size:** 24px

### Career Odyssey

The component is used in the CareerOdyssey React component (`src/components/CareerOdyssey.tsx`) to display people in the "Worked with" section of node cards.

**Data structure in career-odyssey.json:**
```json
{
  "workedWith": [
    {
      "name": "John Doe",
      "image": "/images/people/john.jpg",
      "url": "https://johndoe.com"
    }
  ]
}
```

**Default size:** 24px (matches work pages for consistency)

## Styling

The component uses CSS custom properties for size control:

- `--avatar-size`: Controls the width and height of the avatar (set via inline style)

The component automatically adapts to your site's theme:
- Uses CSS variables from `global.css` (e.g., `--color-link`, `--color-text`)
- Supports dark mode automatically
- Responsive and accessible

## Image Requirements

- Images should be square or will be cropped to a circle
- Recommended size: At least 2x the display size for retina displays
- Format: JPG, PNG, or WebP
- Location: Store in `public/images/people/` directory

## Accessibility

- Proper `alt` text on images
- ARIA labels on links
- Keyboard navigable
- Screen reader friendly

## Examples

### Basic Usage (No Link)

```astro
<PersonAvatar 
  person={{
    name: "Jane Smith",
    image: "/images/people/jane.jpg"
  }}
/>
```

### With Website Link

```astro
<PersonAvatar 
  person={{
    name: "John Doe",
    image: "/images/people/john.jpg",
    url: "https://johndoe.com"
  }}
  size={32}
/>
```

### Multiple People

```astro
<PeopleAvatars 
  people={resolvedPeople}
  avatarSize={24}
/>
```

## Notes

- The `linkedin` field is currently stored in the data structure but not displayed in the component. This is reserved for future enhancements.
- Both Astro and React versions share the same styling approach for consistency.
- The component automatically handles missing images with a fallback background color.
