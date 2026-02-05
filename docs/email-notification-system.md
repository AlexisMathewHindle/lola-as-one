# Email Notification System - Complete Template List

**Created:** 2026-02-04  
**Status:** 📋 Planning Phase  
**Purpose:** Comprehensive list of all email templates needed for Lola As One platform

---

## Overview

This document catalogs ALL email notifications needed across the entire platform, organized by category and use case.

---

## 1. ORDER & PURCHASE EMAILS

### 1.1 Order Confirmation (One-Time Purchase)
**Trigger:** `checkout.session.completed` webhook (one-time orders)  
**Recipient:** Customer  
**When:** Immediately after successful payment

**Data Required:**
- Order number
- Customer name and email
- Order items (products/events with quantities, prices)
- Subtotal, shipping, VAT, total
- Shipping address (if applicable)
- Payment method (last 4 digits)
- Estimated delivery date (for physical products)

**Content:**
- Thank you message
- Order summary table
- Shipping information
- Next steps (what to expect)
- Contact information
- Link to order status page

---

### 1.2 Order Shipped (Physical Products)
**Trigger:** Fulfillment status changed to `shipped`  
**Recipient:** Customer  
**When:** When admin marks order as shipped

**Data Required:**
- Order number
- Customer name
- Tracking number
- Carrier name
- Tracking URL
- Estimated delivery date
- Shipped items list

**Content:**
- Shipment notification
- Tracking information with clickable link
- Delivery timeline
- What to do if package doesn't arrive

---

### 1.3 Order Delivered
**Trigger:** Fulfillment status changed to `delivered`  
**Recipient:** Customer  
**When:** When tracking shows delivered OR admin marks as delivered

**Data Required:**
- Order number
- Customer name
- Delivery date
- Items delivered

**Content:**
- Delivery confirmation
- Request for feedback/review
- Link to leave product review
- Customer support contact

---

### 1.4 Order Cancelled
**Trigger:** Order status changed to `cancelled`  
**Recipient:** Customer  
**When:** Admin cancels order

**Data Required:**
- Order number
- Customer name
- Cancellation reason
- Refund amount
- Refund timeline

**Content:**
- Cancellation notification
- Reason for cancellation
- Refund information
- Apology and next steps

---

### 1.5 Refund Processed
**Trigger:** Refund created in `refunds` table  
**Recipient:** Customer  
**When:** Refund is issued

**Data Required:**
- Order number
- Refund amount
- Refund reason
- Original payment method
- Processing timeline (5-10 business days)

**Content:**
- Refund confirmation
- Amount and timeline
- How refund will appear
- Contact for questions

---

## 2. EVENT/WORKSHOP BOOKING EMAILS

### 2.1 Event Booking Confirmation
**Trigger:** Booking created with status `confirmed`  
**Recipient:** Customer  
**When:** Immediately after successful payment

**Data Required:**
- Event name
- Event date and time
- Location/address
- Number of attendees
- Attendee names (if collected)
- Booking reference number
- Order number
- Price paid

**Content:**
- Booking confirmation
- Event details (date, time, location)
- What to bring
- Parking/directions
- Cancellation policy
- Add to calendar link
- Contact information

---

### 2.2 Event Reminder (7 Days Before)
**Trigger:** Scheduled job - 7 days before event  
**Recipient:** Customer with confirmed booking  
**When:** 7 days before event date

**Data Required:**
- Event name
- Event date and time
- Location
- Number of attendees
- What to bring

**Content:**
- Friendly reminder
- Event details
- What to bring/prepare
- Parking and directions
- Contact for questions

---

### 2.3 Event Reminder (24 Hours Before)
**Trigger:** Scheduled job - 24 hours before event  
**Recipient:** Customer with confirmed booking  
**When:** 24 hours before event date

**Data Required:**
- Event name
- Event date and time
- Location
- Weather considerations (if outdoor)

**Content:**
- Final reminder
- Event details
- Last-minute information
- Emergency contact

---

### 2.4 Event Cancelled by Admin
**Trigger:** Event status changed to `cancelled` OR event deleted  
**Recipient:** All customers with bookings for that event  
**When:** Admin cancels event

**Data Required:**
- Event name
- Original event date
- Customer name
- Booking reference
- Refund amount
- Cancellation reason

**Content:**
- Apology for cancellation
- Reason (if appropriate)
- Full refund confirmation
- Alternative event suggestions
- Contact information

---

### 2.5 Booking Cancelled by Customer
**Trigger:** Booking status changed to `cancelled` by customer
**Recipient:** Customer
**When:** Customer cancels their booking

**Data Required:**
- Event name
- Event date
- Booking reference
- Refund amount (based on cancellation policy)
- Cancellation date

**Content:**
- Cancellation confirmation
- Refund information (if applicable)
- Cancellation policy reminder
- Invitation to book future events

---

## 3. SUBSCRIPTION EMAILS

### 3.1 Subscription Activated
**Trigger:** `customer.subscription.created` webhook
**Recipient:** Customer
**When:** New subscription created

**Data Required:**
- Customer name
- Subscription product name
- Billing interval (monthly/quarterly/annual)
- Price per billing cycle
- Next billing date
- First box shipping date

**Content:**
- Welcome to subscription
- Subscription details
- Billing information
- What to expect (delivery schedule)
- How to manage subscription
- Link to account dashboard

---

### 3.2 Subscription Renewal Success
**Trigger:** `invoice.paid` webhook for subscription
**Recipient:** Customer
**When:** Successful recurring payment

**Data Required:**
- Customer name
- Subscription product name
- Amount charged
- Billing date
- Next billing date
- Invoice number
- Payment method (last 4 digits)

**Content:**
- Payment confirmation
- Invoice details
- Next billing date
- Shipping information for this cycle's box
- Link to manage subscription

---

### 3.3 Subscription Payment Failed
**Trigger:** `invoice.payment_failed` webhook
**Recipient:** Customer
**When:** Recurring payment fails

**Data Required:**
- Customer name
- Subscription product name
- Failed amount
- Failure reason
- Retry schedule
- Link to update payment method

**Content:**
- Payment failure notification
- Reason for failure
- Action required (update payment method)
- Retry information
- Subscription pause/cancellation warning
- Link to update payment

---

### 3.4 Subscription Paused
**Trigger:** Subscription status changed to `paused`
**Recipient:** Customer
**When:** Customer or admin pauses subscription

**Data Required:**
- Customer name
- Subscription product name
- Pause date
- Resume date (if scheduled)
- Reason (if provided)

**Content:**
- Pause confirmation
- When subscription will resume (if scheduled)
- How to resume early
- Billing information (no charges while paused)
- Link to manage subscription

---

### 3.5 Subscription Resumed
**Trigger:** Subscription status changed from `paused` to `active`
**Recipient:** Customer
**When:** Subscription is resumed

**Data Required:**
- Customer name
- Subscription product name
- Resume date
- Next billing date
- Next box shipping date

**Content:**
- Resume confirmation
- Next billing date
- Next box delivery information
- Welcome back message
- Link to manage subscription

---

### 3.6 Subscription Cancelled
**Trigger:** `customer.subscription.deleted` webhook OR status changed to `cancelled`
**Recipient:** Customer
**When:** Subscription is cancelled

**Data Required:**
- Customer name
- Subscription product name
- Cancellation date
- Final billing date (if cancel_at_period_end)
- Cancellation reason (if provided)

**Content:**
- Cancellation confirmation
- Final billing information
- What happens next
- Feedback request (why did you cancel?)
- Invitation to resubscribe in future
- Link to browse one-time products

---

### 3.7 Subscription Ending Soon (cancel_at_period_end)
**Trigger:** Scheduled job - 7 days before subscription ends
**Recipient:** Customer who cancelled with cancel_at_period_end
**When:** 7 days before final billing date

**Data Required:**
- Customer name
- Subscription product name
- End date
- Final billing date

**Content:**
- Reminder that subscription is ending
- Final billing date
- Option to reactivate
- What they'll miss
- Link to reactivate subscription

---

### 3.8 Subscription Box Shipped
**Trigger:** Fulfillment created for subscription order
**Recipient:** Subscriber
**When:** Monthly box is shipped

**Data Required:**
- Customer name
- Box contents (if revealed)
- Tracking number
- Carrier
- Estimated delivery
- Next billing date

**Content:**
- Box shipped notification
- Tracking information
- What's inside (if not a surprise)
- Next box date
- Link to manage subscription

---

## 4. WAITLIST EMAILS

### 4.1 Event Waitlist - Spot Available
**Trigger:** Booking cancelled AND waitlist entry notified
**Recipient:** First person on event waitlist
**When:** Space becomes available

**Data Required:**
- Customer name
- Event name
- Event date and time
- Location
- Number of spaces available
- Price
- Expiry time (24 hours)
- Booking link

**Content:**
- Exciting news - spot available!
- Event details
- Time-sensitive offer (24-hour window)
- Clear call-to-action (Book Now button)
- Expiry warning
- Contact information

---

### 4.2 Product Waitlist - Back in Stock
**Trigger:** Product stock_quantity increased from 0
**Recipient:** All customers on product waitlist
**When:** Product is restocked

**Data Required:**
- Customer name
- Product name
- Product image
- Price
- Stock quantity (optional: "Limited quantity")
- Expiry time (48 hours)
- Product link

**Content:**
- Product back in stock notification
- Product details and image
- Time-sensitive offer (48-hour window)
- Clear call-to-action (Shop Now button)
- Stock warning (limited quantity)
- Link to product page

---

### 4.3 Waitlist Spot Expired
**Trigger:** Scheduled job - waitlist entry expires_at passed
**Recipient:** Customer whose notification expired
**When:** 24/48 hours after notification without conversion

**Data Required:**
- Customer name
- Event/Product name
- Original notification date

**Content:**
- Notification that opportunity expired
- Apology
- Option to rejoin waitlist
- Alternative suggestions
- Contact information

---

## 5. DIGITAL PRODUCT EMAILS

### 5.1 Digital Download Ready
**Trigger:** Order completed with digital products
**Recipient:** Customer
**When:** Immediately after payment

**Data Required:**
- Customer name
- Product name(s)
- Download links (time-limited)
- Link expiry time
- File formats and sizes
- Order number

**Content:**
- Download ready notification
- Download links (buttons)
- Expiry warning
- Instructions for downloading
- File information
- Support contact

---

### 5.2 Download Link Expiring Soon
**Trigger:** Scheduled job - 24 hours before link expires
**Recipient:** Customer
**When:** 24 hours before download link expires

**Data Required:**
- Customer name
- Product name
- Download link
- Expiry time
- Order number

**Content:**
- Reminder to download
- Download link
- Expiry warning
- How to request new link
- Support contact

---

### 5.3 Gift Card Purchased
**Trigger:** Order completed with gift card
**Recipient:** Purchaser
**When:** Immediately after payment

**Data Required:**
- Purchaser name
- Gift card code
- Gift card amount
- Recipient email (if provided)
- Expiry date (if applicable)
- Order number

**Content:**
- Gift card purchase confirmation
- Gift card code
- How to use/redeem
- How to send to recipient
- Terms and conditions
- Support contact

---

### 5.4 Gift Card Received
**Trigger:** Gift card sent to recipient
**Recipient:** Gift card recipient
**When:** Purchaser sends gift card OR immediately if recipient email provided

**Data Required:**
- Recipient name
- Sender name
- Gift card code
- Gift card amount
- Personal message (if provided)
- Redemption link

**Content:**
- You've received a gift card!
- Sender information
- Personal message
- Gift card code
- How to redeem
- Browse products link

---

## 6. ACCOUNT & AUTHENTICATION EMAILS

### 6.1 Welcome Email (New Account)
**Trigger:** Customer account created
**Recipient:** New customer
**When:** Account registration complete

**Data Required:**
- Customer name
- Email address
- Account creation date

**Content:**
- Welcome to Lola As One
- What you can do with your account
- Browse workshops/products
- Manage subscriptions
- View order history
- Contact information

---

### 6.2 Password Reset Request
**Trigger:** Customer requests password reset
**Recipient:** Customer
**When:** Password reset initiated

**Data Required:**
- Customer email
- Reset link (time-limited)
- Link expiry time

**Content:**
- Password reset request confirmation
- Reset link (button)
- Expiry warning (1 hour)
- Security note (didn't request this?)
- Support contact

---

### 6.3 Password Changed Confirmation
**Trigger:** Password successfully changed
**Recipient:** Customer
**When:** Password is updated

**Data Required:**
- Customer name
- Change date/time
- IP address (optional, for security)

**Content:**
- Password change confirmation
- Security information
- What to do if you didn't make this change
- Support contact

---

### 6.4 Email Address Changed
**Trigger:** Customer updates email address
**Recipient:** Both old and new email addresses
**When:** Email is updated

**Data Required:**
- Customer name
- Old email
- New email
- Change date/time

**Content:**
- Email change confirmation
- Security information
- What to do if you didn't make this change
- Support contact

---

## 7. CONTACT & COMMUNICATION EMAILS

### 7.1 Contact Form Submission (Customer Copy)
**Trigger:** Contact form submitted
**Recipient:** Customer who submitted form
**When:** Form submission successful

**Data Required:**
- Customer name
- Customer email
- Subject
- Message content
- Submission date
- Reference number

**Content:**
- Thank you for contacting us
- Copy of their message
- Expected response time (24-48 hours)
- Reference number
- Alternative contact methods

---

### 7.2 Contact Form Submission (Admin Notification)
**Trigger:** Contact form submitted
**Recipient:** Admin team
**When:** Form submission successful

**Data Required:**
- Customer name
- Customer email
- Customer phone (if provided)
- Subject
- Message content
- Submission date
- Reference number

**Content:**
- New contact form submission
- Customer details
- Message content
- Link to admin panel
- Quick reply option

---

### 7.3 Newsletter Subscription Confirmed
**Trigger:** Newsletter signup submitted
**Recipient:** Subscriber
**When:** Email confirmed (double opt-in)

**Data Required:**
- Subscriber email
- Subscription date
- Preferences (if collected)

**Content:**
- Welcome to newsletter
- What to expect (frequency, content)
- Manage preferences link
- Unsubscribe link
- Browse products/events

---

### 7.4 Newsletter Unsubscribed
**Trigger:** Unsubscribe link clicked
**Recipient:** Former subscriber
**When:** Unsubscribe confirmed

**Data Required:**
- Email address
- Unsubscribe date

**Content:**
- Unsubscribe confirmation
- Feedback request (why did you unsubscribe?)
- Option to resubscribe
- Stay connected (social media)

---

## 8. ADMIN NOTIFICATION EMAILS

### 8.1 Low Stock Alert
**Trigger:** Product stock_quantity <= low_stock_threshold
**Recipient:** Admin team
**When:** Stock reaches threshold

**Data Required:**
- Product name
- Current stock quantity
- Low stock threshold
- Product ID
- Link to admin panel

**Content:**
- Low stock warning
- Product details
- Current stock level
- Reorder suggestion
- Link to inventory management

---

### 8.2 New Order Notification
**Trigger:** Order created
**Recipient:** Admin team
**When:** New order placed

**Data Required:**
- Order number
- Customer name
- Order total
- Items ordered
- Shipping address
- Link to admin panel

**Content:**
- New order notification
- Order summary
- Customer details
- Action required (fulfill order)
- Link to order details

---

### 8.3 Event Capacity Full
**Trigger:** Event spaces_available = 0
**Recipient:** Admin team
**When:** Event sells out

**Data Required:**
- Event name
- Event date
- Total capacity
- Waitlist count
- Link to admin panel

**Content:**
- Event sold out notification
- Event details
- Waitlist information
- Consider adding another date
- Link to event management

---

### 8.4 Subscription Payment Failed (Admin Alert)
**Trigger:** `invoice.payment_failed` webhook
**Recipient:** Admin team
**When:** Subscription payment fails

**Data Required:**
- Customer name
- Customer email
- Subscription product
- Failed amount
- Failure reason
- Retry schedule

**Content:**
- Payment failure alert
- Customer details
- Failure reason
- Automatic retry information
- Manual intervention option
- Link to customer account

---

### 8.5 New Waitlist Entry
**Trigger:** Waitlist entry created
**Recipient:** Admin team
**When:** Customer joins waitlist

**Data Required:**
- Customer name
- Customer email
- Event/Product name
- Spaces/Quantity requested
- Entry date

**Content:**
- New waitlist entry notification
- Customer details
- Event/Product details
- Current waitlist count
- Link to waitlist management

---

## 9. REVIEW & FEEDBACK EMAILS

### 9.1 Request Product Review
**Trigger:** Scheduled job - 7 days after delivery
**Recipient:** Customer
**When:** 7 days after order delivered

**Data Required:**
- Customer name
- Product name(s)
- Order number
- Review link

**Content:**
- How was your purchase?
- Request for review
- Star rating + written review
- Incentive (optional: discount on next purchase)
- Link to review page

---

### 9.2 Request Event Feedback
**Trigger:** Scheduled job - 1 day after event
**Recipient:** Event attendee
**When:** 1 day after event date

**Data Required:**
- Customer name
- Event name
- Event date
- Feedback link

**Content:**
- How was the workshop?
- Request for feedback
- Star rating + written feedback
- Share photos (optional)
- Link to feedback form

---

## 10. MARKETING & PROMOTIONAL EMAILS

### 10.1 Abandoned Cart Reminder
**Trigger:** Scheduled job - cart inactive for 24 hours
**Recipient:** Customer with items in cart
**When:** 24 hours after last cart activity

**Data Required:**
- Customer name (if logged in)
- Cart items
- Cart total
- Cart link

**Content:**
- You left items in your cart
- Cart summary with images
- Limited stock warning (if applicable)
- Discount code (optional)
- Complete purchase link

---

### 10.2 New Workshop Announcement
**Trigger:** New event published
**Recipient:** Newsletter subscribers
**When:** Admin publishes new event

**Data Required:**
- Event name
- Event date and time
- Location
- Price
- Description
- Featured image
- Booking link

**Content:**
- New workshop announcement
- Event details and image
- What you'll learn/create
- Limited spaces available
- Book now CTA
- Link to event page

---

### 10.3 New Product Launch
**Trigger:** New product published
**Recipient:** Newsletter subscribers
**When:** Admin publishes new product

**Data Required:**
- Product name
- Price
- Description
- Featured image
- Product link

**Content:**
- New product announcement
- Product details and image
- Features and benefits
- Limited quantity (if applicable)
- Shop now CTA
- Link to product page

---

### 10.4 Seasonal/Holiday Promotion
**Trigger:** Manual send OR scheduled campaign
**Recipient:** Newsletter subscribers
**When:** Admin schedules campaign

**Data Required:**
- Promotion details
- Discount code
- Valid dates
- Featured products/events
- Images

**Content:**
- Seasonal greeting
- Promotion details
- Discount code
- Featured offerings
- Shop now CTA
- Expiry date

---

### 10.5 Birthday/Anniversary Email
**Trigger:** Scheduled job - customer birthday/signup anniversary
**Recipient:** Customer
**When:** Customer's birthday or account anniversary

**Data Required:**
- Customer name
- Birthday/Anniversary date
- Special offer (discount code)
- Valid dates

**Content:**
- Happy birthday/anniversary!
- Special gift (discount code)
- Personal message
- Browse products/events
- Expiry date

---

## SUMMARY

**Total Email Templates: 50+**

### By Category:
- **Orders & Purchases:** 5 templates
- **Event Bookings:** 5 templates
- **Subscriptions:** 8 templates
- **Waitlist:** 3 templates
- **Digital Products:** 4 templates
- **Account & Auth:** 4 templates
- **Contact & Communication:** 4 templates
- **Admin Notifications:** 5 templates
- **Reviews & Feedback:** 2 templates
- **Marketing & Promotional:** 5 templates

### Priority Levels for Implementation:

**🔴 CRITICAL (Must Have for Launch):**
1. Order Confirmation
2. Event Booking Confirmation
3. Subscription Activated
4. Subscription Renewal Success
5. Subscription Payment Failed
6. Password Reset
7. Contact Form Submission (both)
8. Digital Download Ready

**🟡 HIGH PRIORITY (Launch Soon After):**
9. Order Shipped
10. Event Reminders (7 days, 24 hours)
11. Subscription Paused/Resumed/Cancelled
12. Waitlist Notifications (event & product)
13. New Order Notification (admin)
14. Low Stock Alert (admin)

**🟢 MEDIUM PRIORITY (Post-Launch):**
15. Order Delivered
16. Event Cancelled
17. Subscription Box Shipped
18. Gift Card emails
19. Review/Feedback requests
20. Newsletter subscription emails

**🔵 LOW PRIORITY (Nice to Have):**
21. Abandoned Cart
22. Marketing campaigns
23. Birthday/Anniversary
24. Download link expiring
25. Waitlist expired

---

## Next Steps

1. **Choose Email Service Provider:**
   - Resend (recommended - modern, developer-friendly)
   - SendGrid (enterprise-grade)
   - Postmark (transactional focus)
   - AWS SES (cost-effective)

2. **Design Email Templates:**
   - Create HTML email templates
   - Ensure mobile responsiveness
   - Brand consistency (colors, fonts, logo)
   - Plain text fallbacks

3. **Build Supabase Edge Functions:**
   - Email sending function
   - Template rendering
   - Webhook handlers

4. **Implement Triggers:**
   - Database triggers
   - Webhook handlers
   - Scheduled jobs (cron)

5. **Testing:**
   - Test all email templates
   - Verify deliverability
   - Check spam scores
   - Test on multiple email clients

---

**Ready to implement! 🚀**

