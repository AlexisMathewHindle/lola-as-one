# Newsletter Signup Testing Guide

## Pre-Testing Checklist

Before testing, ensure you have:

1. ✅ Set up Mailchimp API credentials (see NEWSLETTER_SETUP.md)
2. ✅ Created a `.env` file in the `functions` directory with your Mailchimp credentials
3. ✅ Installed dependencies: `cd functions && npm install`
4. ✅ Built the frontend: `npm run build:dev` or `npm run serve`

## Local Testing

### Step 1: Start Firebase Emulators

```bash
cd functions
npm run serve
```

This will start the Firebase Functions emulator. Note the URL for the newsletter function (usually `http://localhost:5001/lola-workshops/us-central1/newsletter-subscribeToNewsletter`).

### Step 2: Start the Development Server

In a new terminal:

```bash
npm run serve
```

This will start the Vue development server (usually at `http://localhost:8080`).

### Step 3: Test the Newsletter Signup

1. Open your browser and navigate to `http://localhost:8080`
2. Scroll down to the footer
3. You should see a "Stay Updated" section with:
   - A title: "Stay Updated"
   - A description about newsletter updates
   - An email input field
   - A "Subscribe" button

### Step 4: Test Different Scenarios

#### Test Case 1: Valid Email Subscription
1. Enter a valid email address (e.g., `test@example.com`)
2. Click "Subscribe"
3. Expected result: 
   - Button shows "Subscribing..." while processing
   - Success message appears: "Thank you for subscribing!"
   - Email field is cleared
   - Check Mailchimp audience - subscriber should appear with `lola-workshops` tag

#### Test Case 2: Invalid Email
1. Enter an invalid email (e.g., `notanemail`)
2. Click "Subscribe"
3. Expected result: Browser validation should prevent submission

#### Test Case 3: Empty Email
1. Leave email field empty
2. Click "Subscribe"
3. Expected result: Button should be disabled

#### Test Case 4: Already Subscribed Email
1. Enter an email that's already in your Mailchimp list
2. Click "Subscribe"
3. Expected result:
   - Success message: "You're already subscribed! We've updated your preferences."
   - The `lola-workshops` tag should be added/updated in Mailchimp

#### Test Case 5: Network Error
1. Stop the Firebase emulator
2. Try to subscribe
3. Expected result: Error message appears

## Production Testing

### Step 1: Deploy Functions

```bash
# Set Firebase config (if not already done)
firebase functions:config:set mailchimp.api_key="YOUR_API_KEY"
firebase functions:config:set mailchimp.list_id="YOUR_LIST_ID"
firebase functions:config:set mailchimp.server_prefix="us21"

# Deploy
firebase deploy --only functions:newsletter
```

### Step 2: Deploy Frontend

```bash
npm run build:prod
firebase deploy --only hosting
```

### Step 3: Test on Production Site

1. Visit your production site
2. Scroll to footer
3. Test the same scenarios as local testing

## Verification in Mailchimp

After each successful subscription, verify in Mailchimp:

1. Log in to Mailchimp
2. Go to **Audience** → **All contacts**
3. Search for the email address you used
4. Verify:
   - ✅ Contact exists
   - ✅ Status is "Subscribed" (or "Pending" if double opt-in is enabled)
   - ✅ Tag `lola-workshops` is present
   - ✅ Merge field `SOURCE` is set to "LOLA Workshops Site"

## Analytics Verification

Check that analytics events are being logged:

1. Open browser developer tools
2. Go to Network tab
3. Subscribe to newsletter
4. Look for Firebase Analytics events
5. Verify `newsletter_signup` event is logged with:
   - `source: "footer"`
   - `timestamp`

## Troubleshooting

### Issue: "Newsletter service is not configured"

**Solution:**
- Check that `.env` file exists in `functions` directory
- Verify environment variables are set correctly
- Restart Firebase emulator

### Issue: "Failed to subscribe"

**Solution:**
- Check Firebase Functions logs: `firebase functions:log`
- Verify Mailchimp API key is valid
- Verify List ID is correct
- Check network connectivity

### Issue: Newsletter component not visible

**Solution:**
- Clear browser cache
- Check browser console for errors
- Verify FooterComponent is importing NewsletterSignupComponent correctly

### Issue: Styling looks broken

**Solution:**
- Check that CSS variables are defined in `src/assets/styles/global.css`
- Verify component is using scoped styles correctly
- Check for CSS conflicts

## Mobile Testing

Test on different screen sizes:

1. Desktop (1920x1080)
2. Tablet (768x1024)
3. Mobile (375x667)

Verify:
- ✅ Newsletter form is visible and accessible
- ✅ Input field and button are properly sized
- ✅ Form layout adapts to screen size (stacks on mobile)
- ✅ Success/error messages are readable

## Browser Compatibility

Test on:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

## Performance Testing

1. Check page load time with newsletter component
2. Verify no console errors
3. Check network requests are optimized
4. Verify Firebase Functions cold start time is acceptable

## Security Testing

1. Verify email validation works correctly
2. Check that API keys are not exposed in frontend code
3. Verify CORS is properly configured
4. Test rate limiting (if implemented)

## Accessibility Testing

1. Test keyboard navigation (Tab through form)
2. Test screen reader compatibility
3. Verify form labels are properly associated
4. Check color contrast meets WCAG standards

## Success Criteria

All tests pass when:
- ✅ Newsletter signup form is visible in footer
- ✅ Valid emails are successfully added to Mailchimp
- ✅ Subscribers are tagged with `lola-workshops`
- ✅ Error handling works correctly
- ✅ Success/error messages are clear and helpful
- ✅ Form is responsive on all devices
- ✅ Analytics events are logged
- ✅ No console errors
- ✅ Accessible to all users

