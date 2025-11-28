# Self Promotion & Unpaid Promotion Category Split

## Overview

Successfully split the combined "Unpaid/Self Promotion" category into two distinct categories:

-   **Self Promotion** (SP): Creator's own products/services (Yellow: #ffff00)
-   **Unpaid Promotion** (UP): Charity/friend shout-outs (Orange: #ff8800)

## Files Modified

### Core Configuration

1. **extension/options/modules/settings-manager.js**
    - Split SEGMENT_CATEGORIES array
    - Self Promotion: #ffff00 (Yellow)
    - Unpaid Promotion: #ff8800 (Orange)

### UI Components

2. **extension/content/ui/components/segment-legend.js**

    - Updated color map with separate entries

3. **extension/content/ui/renderers/segments.js**

    - Updated color map for segment rendering

4. **extension/sidepanel/sidepanel.js**
    - Updated getSgClass() mapping
    - Updated getSgDesc() descriptions

### Visual Elements

5. **extension/content/segments/timeline.js**

    - Updated timeline color map

6. **extension/content/segments/markers.js**

    - Updated getSegmentColor() function

7. **extension/content/content.css**
    - Split .UnpaidSelfPromotion into:
        - .SelfPromotion (border: #ffff00)
        - .UnpaidPromotion (border: #ff8800)

### AI Prompt

8. **extension/api/prompts/segments.js**
    - Updated category reference in Interaction Reminder description

### Classification Rules

9. **extension/services/segments/rules/unpaid-promotion.js** (NEW)

    - Created detection rule for unpaid promotions
    - Keywords: shout out, charity, donate, support, friend, channel

10. **extension/services/segments/rule-engine.js**
    - Imported unpaidPromo rule
    - Added to rules array

### Documentation

11. **extension/services/segments/README.md**
    -   Updated color coding section with accurate hex values

## Color Scheme

| Category         | Color  | Hex Code |
| ---------------- | ------ | -------- |
| Self Promotion   | Yellow | #ffff00  |
| Unpaid Promotion | Orange | #ff8800  |

## Testing

✅ No syntax errors detected
✅ All color references updated
✅ Settings manager properly configured
✅ UI components synchronized
✅ CSS classes properly split
✅ Rule engine includes both categories

## Impact

-   Options page will now show two separate category controls
-   Timeline markers will use distinct colors
-   Segment legend displays both categories
-   AI classification can distinguish between paid self-promotion and unpaid shout-outs
