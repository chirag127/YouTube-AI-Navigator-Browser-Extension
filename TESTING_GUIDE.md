# Testing Guide for YouTube AI Master

## Pre-Testing Checklist

Before testing, ensure:

-   [ ] Extension is loaded in Chrome (chrome://extensions)
-   [ ] Developer mode is enabled
-   [ ] Extension has been reloaded after changes
-   [ ] You have a Gemini API key ready

## Setup Instructions

### 1. Load Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `extension` folder
5. Verify extension appears in the list

### 2. Configure API Key

1. Click the extension icon in toolbar
2. Click "Settings" or right-click extension → Options
3. Enter your Gemini API key
4. Save settings

### 3. Verify Installation

1. Open any YouTube video
2. Check browser console (F12) for initialization messages
3. Look for: `[YTAI] === Initialization Complete ✓ ===`

## Test Cases

### Test 1: Basic Functionality

**Objective:** Verify extension loads without errors

**Steps:**

1. Open YouTube homepage
2. Open browser console (F12)
3. Navigate to any video with captions
4. Check console for errors

**Expected Result:**

-   No red errors in console
-   Initialization messages appear
-   Extension icon is active

**Pass/Fail:** \_\_\_

---

### Test 2: Metadata Extraction

**Objective:** Verify video metadata is fetched correctly

**Steps:**

1. Open a YouTube video
2. Click extension icon
3. Click "Analyze Video"
4. Check sidepanel opens

**Expected Result:**

-   Sidepanel opens
-   Status shows "Fetching video info..."
-   No "Failed to get metadata" error

**Pass/Fail:** \_\_\_

---

### Test 3: Transcript Fetching

**Objective:** Verify transcript extraction works

**Steps:**

1. Open a video WITH captions (check CC button)
2. Click "Analyze Video"
3. Wait for process to complete

**Expected Result:**

-   Status progresses through stages
-   Transcript tab shows segments
-   No errors displayed

**Pass/Fail:** \_\_\_

---

### Test 4: No Captions Handling

**Objective:** Verify graceful handling of videos without captions

**Steps:**

1. Find a video WITHOUT captions
2. Click "Analyze Video"
3. Observe error message

**Expected Result:**

-   Clear error message: "No Captions Available"
-   Helpful guidance provided
-   "Try Again" button visible
-   No console errors

**Pass/Fail:** \_\_\_

---

### Test 5: Summary Generation

**Objective:** Verify AI summary is generated

**Steps:**

1. Open a video with captions
2. Click "Analyze Video"
3. Wait for completion
4. Check Summary tab

**Expected Result:**

-   Summary appears in markdown format
-   Well-formatted with headings
-   Relevant to video content
-   No placeholder text

**Pass/Fail:** \_\_\_

---

### Test 6: Segment Classification

**Objective:** Verify video segments are classified

**Steps:**

1. Analyze a video
2. Go to Transcript tab
3. Check for colored segment labels

**Expected Result:**

-   Segments have labels (Sponsor, Content, etc.)
-   Colors match segment types
-   Timestamps are clickable
-   Segments are accurate

**Pass/Fail:** \_\_\_

---

### Test 7: Chat Functionality

**Objective:** Verify chat with video content works

**Steps:**

1. Analyze a video
2. Go to Chat tab
3. Type a question about the video
4. Press Enter or click send

**Expected Result:**

-   Question appears in chat
-   AI response is generated
-   Response is relevant
-   No errors

**Pass/Fail:** \_\_\_

---

### Test 8: Insights Tab

**Objective:** Verify insights and FAQ generation

**Steps:**

1. Analyze a video
2. Go to Insights tab
3. Check content

**Expected Result:**

-   Key Insights section present
-   FAQ section present
-   Comments Analysis section present
-   All sections have content

**Pass/Fail:** \_\_\_

---

### Test 9: Error Recovery

**Objective:** Verify retry functionality works

**Steps:**

1. Disconnect internet
2. Try to analyze a video
3. Reconnect internet
4. Click "Try Again"

**Expected Result:**

-   Error message appears
-   "Try Again" button works
-   Analysis succeeds after retry
-   No lingering errors

**Pass/Fail:** \_\_\_

---

### Test 10: Multiple Videos

**Objective:** Verify extension works across video changes

**Steps:**

1. Analyze video A
2. Navigate to video B
3. Analyze video B
4. Check both analyses are separate

**Expected Result:**

-   Each video analyzed independently
-   No data mixing between videos
-   Widget updates correctly
-   No memory leaks

**Pass/Fail:** \_\_\_

---

## Performance Tests

### Load Time Test

**Objective:** Verify extension loads quickly

**Steps:**

1. Open YouTube video
2. Measure time to initialization complete
3. Record in console

**Expected Result:**

-   Initialization < 1 second
-   No blocking of page load
-   Smooth user experience

**Measurement:** \_\_\_ ms

---

### Analysis Time Test

**Objective:** Verify analysis completes in reasonable time

**Steps:**

1. Start analysis
2. Time from start to completion
3. Test with 5-minute video

**Expected Result:**

-   Analysis < 30 seconds
-   Progress indicators update
-   No freezing

**Measurement:** \_\_\_ seconds

---

## Browser Compatibility

Test in multiple browsers:

-   [ ] Chrome (latest)
-   [ ] Chrome (one version back)
-   [ ] Edge (Chromium)
-   [ ] Brave
-   [ ] Opera

## Common Issues & Solutions

### Issue: "Failed to get metadata"

**Solution:**

-   Check manifest.json has services in web_accessible_resources
-   Reload extension
-   Check API key is configured

### Issue: "No captions available"

**Solution:**

-   Verify video actually has captions (CC button)
-   Try different video
-   Check console for specific error

### Issue: Extension not loading

**Solution:**

-   Check for console errors
-   Verify all files are present
-   Reload extension
-   Clear browser cache

### Issue: Slow analysis

**Solution:**

-   Check internet connection
-   Verify API key is valid
-   Try shorter video
-   Check Gemini API quota

## Debug Mode

To enable verbose logging:

1. Open `extension/content/core/debug.js`
2. Add at top:

```javascript
const DEBUG_MODE = true;
```

3. Reload extension

## Console Commands

Useful commands for debugging:

```javascript
// Check if extension loaded
console.log(chrome.runtime.getManifest());

// Check storage
chrome.storage.local.get(null, console.log);

// Test message passing
chrome.runtime.sendMessage({ action: "TEST" }, console.log);

// Check current video ID
new URLSearchParams(window.location.search).get("v");
```

## Reporting Issues

When reporting issues, include:

1. Chrome version
2. Extension version
3. Video URL (if public)
4. Console errors (screenshot)
5. Steps to reproduce
6. Expected vs actual behavior

## Success Criteria

Extension is ready for release when:

-   [ ] All 10 test cases pass
-   [ ] No console errors
-   [ ] Performance is acceptable
-   [ ] Error messages are clear
-   [ ] UI is polished
-   [ ] Works across browsers
-   [ ] Documentation is complete

## Next Steps After Testing

1. Fix any failing tests
2. Optimize performance issues
3. Polish UI based on feedback
4. Prepare for Chrome Web Store submission
5. Create demo video
6. Write user documentation
