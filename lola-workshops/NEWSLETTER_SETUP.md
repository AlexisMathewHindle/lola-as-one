# Newsletter Signup Setup Guide

This guide explains how to configure the Mailchimp newsletter signup feature for the LOLA Workshops site.

## Overview

The newsletter signup feature has been added to the footer of the website. When users subscribe, they are:
- Added to your Mailchimp audience/list
- Tagged with `lola-workshops` to distinguish them from signups from other sites (e.g., lotsoflovelyart.org)
- Marked with a custom merge field `SOURCE: "LOLA Workshops Site"`

## Setup Instructions

### 1. Get Your Mailchimp API Key

1. Log in to your Mailchimp account
2. Go to **Account** → **Extras** → **API keys**
3. Create a new API key or copy an existing one
4. Note the server prefix (e.g., `us21`) from your account URL or API key

### 2. Get Your Mailchimp List ID

1. In Mailchimp, go to **Audience** → **All contacts**
2. Click **Settings** → **Audience name and defaults**
3. Look for **Audience ID** - this is your List ID

### 3. Configure Environment Variables

#### For Local Development:

1. Navigate to the `functions` directory
2. Create a `.env` file (if it doesn't exist)
3. Add the following variables:

```bash
MAILCHIMP_API_KEY=your_actual_api_key_here
MAILCHIMP_LIST_ID=your_actual_list_id_here
MAILCHIMP_SERVER_PREFIX=us21  # Replace with your server prefix
```

#### For Firebase Production:

Set the environment variables using Firebase CLI:

```bash
cd functions
firebase functions:config:set mailchimp.api_key="your_actual_api_key_here"
firebase functions:config:set mailchimp.list_id="your_actual_list_id_here"
firebase functions:config:set mailchimp.server_prefix="us21"
```

**Note:** You'll need to update the `newsletter.js` file to read from Firebase config instead of `.env` for production:

```javascript
// For production, use:
const apiKey = functions.config().mailchimp?.api_key || process.env.MAILCHIMP_API_KEY;
const listId = functions.config().mailchimp?.list_id || process.env.MAILCHIMP_LIST_ID;
const serverPrefix = functions.config().mailchimp?.server_prefix || process.env.MAILCHIMP_SERVER_PREFIX || "us21";
```

### 4. Deploy the Cloud Function

```bash
cd functions
npm install
firebase deploy --only functions:newsletter
```

Or deploy all functions:

```bash
firebase deploy --only functions
```

## Testing

### Local Testing:

1. Start the Firebase emulator:
```bash
cd functions
npm run serve
```

2. The function will be available at:
```
http://localhost:5001/lola-workshops/us-central1/newsletter-subscribeToNewsletter
```

### Production Testing:

1. Visit your website
2. Scroll to the footer
3. Enter an email address in the newsletter signup form
4. Click "Subscribe"
5. Check your Mailchimp audience to verify the subscriber was added with the `lola-workshops` tag

## Mailchimp Tag Usage

Subscribers from the LOLA Workshops site are tagged with `lola-workshops`. This allows you to:

1. **Segment your audience**: Create segments based on signup source
2. **Send targeted campaigns**: Send workshop-specific emails only to workshop site subscribers
3. **Track performance**: See which site drives more newsletter signups
4. **Manage preferences**: Allow different communication preferences based on source

### Creating a Segment in Mailchimp:

1. Go to **Audience** → **All contacts**
2. Click **New Segment**
3. Add condition: **Tags** → **is** → `lola-workshops`
4. Save the segment

## Customization

### Change the Tag Name:

Edit `functions/src/newsletter.js` line 56:

```javascript
tags: ["your-custom-tag"], // Change this
```

### Add Double Opt-In:

Edit `functions/src/newsletter.js` line 55:

```javascript
status: "pending", // Change from "subscribed" to "pending"
```

This will send a confirmation email before adding the subscriber.

### Add More Merge Fields:

Edit `functions/src/newsletter.js` lines 57-59:

```javascript
merge_fields: {
  SOURCE: "LOLA Workshops Site",
  FNAME: firstName, // Add first name if collected
  LNAME: lastName,  // Add last name if collected
},
```

## Troubleshooting

### "Newsletter service is not configured" error:
- Check that environment variables are set correctly
- Verify the API key and List ID are correct

### "Failed to subscribe" error:
- Check Firebase Functions logs: `firebase functions:log`
- Verify your Mailchimp API key has the correct permissions
- Ensure the List ID is correct

### Subscribers not appearing in Mailchimp:
- Check if double opt-in is enabled (status: "pending")
- Look in the "Unsubscribed" or "Cleaned" sections of your audience
- Verify the email address format is valid

## Support

For issues with:
- **Mailchimp API**: Check [Mailchimp API Documentation](https://mailchimp.com/developer/marketing/api/)
- **Firebase Functions**: Check [Firebase Functions Documentation](https://firebase.google.com/docs/functions)

