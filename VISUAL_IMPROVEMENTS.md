# Visual UI Improvements Guide

## Before & After Comparison

### 1. Error State

#### Before

```
❌ Failed to get metadata
[Try Again button]
```

#### After

```
┌─────────────────────────────────┐
│                                 │
│    ╔═══════════╗          │
│         ║     ✗   ║          │
│         ╚═══════════╝          │
│                                 │
│    Failed to get metadata       │
│                                 │
│  This video does not have       │
│  captions/subtitles. Please     │
│  try a different video that     │
│  has closed captions enabled.   │
│                                 │
│      ┌─────────────┐           │
│      │  Try Again  │           │
│      └─────────────┘           │
│                                 │
└─────────────────────────────────┘
```

### 2. Loading State

#### Before

```
Generating summary...
```

#### After

```
┌─────────────────────────────────┐
│                 │
│         ⟳ (spinning)            │
│                                 │
│    Generating summary...        │
│                                 │
└─────────────────────────────────┘

Status bar: ⟳ Fetching transcript...
```

### 3. Empty State

#### Before

```
Click "Analyze Video" to generate a summary.
```

#### After

```
┌─────────────────────────────────┐
│                                 │
│         ▢ (icon)                │
│                                 │
│      No Summary Yet             │
│                                 │
│  Click "Analyze Video" to       │
│  generate an AI summary         │
│                                 │
└─────────────────────────────────┘
```

## Color Scheme

### Status Colors

-   **Loading**: `#3ea6ff` (Blue) - Indicates progress
-   **Success**: `#00c853` (Green) - Completed successfully
-   **Error**: `#ff4e45` (Red) - Something went wrong
-   **Warning**: `#ff9800` (Orange) - Attention needed

### UI Elements

-   **Background**: `#0f0f0f` (Dark) / `#ffffff` (Light)
-   **Secondary BG**: `#272727` (Dark) / `#f2f2f2` (Light)
-   **Text**: `#f1f1f1` (Dark) / `#0f0f0f` (Light)
-   **Border**: `#3f3f3f` (Dark) / `#e5e5e5` (Light)
-   **Accent**: `#3ea6ff` (YouTube Blue)

## Animation Details

### Spinner

```css
@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
```

-   Duration: 0.8s
-   Timing: linear
-   Infinite loop

### Fade In

```css
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(5px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```

-   Duration: 0.2s
-   Timing: ease-in-out

## Typography

### Font Stack

```
'Roboto', 'Segoe UI', Arial, sans-serif
```

### Font Sizes

-   **Header**: 16px (600 weight)
-   **Body**: 14px (400 weight)
-   **Small**: 12px (400 weight)
-   **Tiny**: 10px (600 weight for labels)

## Spacing System

### Padding

-   **Small**: 8px
-   **Medium**: 12px
-   **Large**: 16px
-   **XLarge**: 20px

### Gaps

-   **Tight**: 4px
-   **Normal**: 8px
-   **Loose**: 12px
-   **XLoose**: 16px

## Interactive Elements

### Buttons

```css
.primary-btn {
    padding: 10px;
    border-radius: 18px;
    font-weight: 600;
    transition: opacity 0.2s;
}

.primary-btn:hover {
    opacity: 0.9;
}

.primary-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
```

### Tabs

```css
.tab-btn {
    opacity: 0.7;
    transition: opacity 0.2s, background-color 0.2s;
}

.tab-btn:hover {
    opacity: 1;
    background-color: var(--hover-color);
}

.tab-btn.active {
    opacity: 1;
    border-bottom: 2px solid var(--text-color);
    font-weight: 600;
}
```

## Segment Colors

Visual indicators for different video segments:

| Segment Type | Color              | Usage                    |
| ------------ | ------------------ | ------------------------ |
| Sponsor      | `#ff4444` (Red)    | Paid advertisements      |
| Interaction  | `#ff8800` (Orange) | Like/Subscribe reminders |
| Self Promo   | `#ffaa00` (Yellow) | Creator's products       |
| Unpaid Promo | `#88cc00` (Lime)   | Shout-outs               |
| Highlight    | `#00cc44` (Green)  | Important parts          |
| Preview      | `#00aaff` (Cyan)   | Coming up next           |
| Hook         | `#aa66cc` (Purple) | Introduction             |
| Tangent      | `#cc66aa` (Pink)   | Off-topic content        |
| Content      | `#666666` (Gray)   | Main content             |

## Responsive Design

### Sidepanel Width

-   Fixed width for consistency
-   Scrollable content area
-   Sticky header and tabs

### Content Area

```css
.content-area {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    scroll-behavior: smooth;
}
```

## Accessibility Features

### High Contrast

-   Text meets WCAG AA standards
-   Clear visual hierarchy
-   Sufficient color contrast ratios

### Keyboard Navigation

-   Tab order follows visual flow
-   Focus indicators visible
-   Enter key submits forms

### Screen Reader Support

-   Semantic HTML elements
-   ARIA labels where needed
-   Status announcements

## Dark Mode Support

Automatic detection via:

```css
@media (prefers-color-scheme: dark) {
    /* Dark mode styles */
}
```

All colors have dark mode variants for optimal viewing in any lighting condition.
