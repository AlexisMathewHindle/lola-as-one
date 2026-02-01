# Content Governance

**Last Updated:** 2026-01-31

## Purpose
Define who can create, edit, publish, and delete content, and establish workflows for maintaining quality and consistency.

---

## Roles & Permissions

### Admin
**Full access to all CMS functions.**

| Action | Permission |
|--------|------------|
| Create content | ✅ Yes |
| Edit own content | ✅ Yes |
| Edit others' content | ✅ Yes |
| Publish content | ✅ Yes |
| Archive content | ✅ Yes |
| Delete content | ✅ Yes |
| Manage categories | ✅ Yes |
| Manage users | ✅ Yes |
| Configure homepage | ✅ Yes |
| Configure menus | ✅ Yes |

**Responsibilities:**
- Final approval for publishing
- Category and tag management
- User role assignment
- Content quality oversight
- Homepage and navigation curation

---

### Editor
**Can create and edit content, but cannot publish or delete.**

| Action | Permission |
|--------|------------|
| Create content | ✅ Yes |
| Edit own content | ✅ Yes |
| Edit others' content | ❌ No (v1) / ⚠️ Optional (v2) |
| Publish content | ❌ No (requires admin) |
| Archive content | ❌ No |
| Delete content | ❌ No |
| Manage categories | ❌ No |
| Manage users | ❌ No |
| Configure homepage | ❌ No |
| Configure menus | ❌ No |

**Responsibilities:**
- Draft content creation
- Content updates and revisions
- Tag suggestions
- Submit content for admin review

**v1 Workflow:**
1. Editor creates/edits content
2. Editor saves as `draft`
3. Editor notifies admin (manual process — email, Slack, etc.)
4. Admin reviews and publishes

**v2 Enhancement:** Built-in approval workflow with notifications

---

### Viewer (Optional)
**Read-only access to CMS. Useful for stakeholders who need visibility but not editing rights.**

| Action | Permission |
|--------|------------|
| View content | ✅ Yes |
| Create content | ❌ No |
| Edit content | ❌ No |
| Publish content | ❌ No |
| Delete content | ❌ No |

**Use Cases:**
- External collaborators
- Clients reviewing content
- Auditors or compliance reviewers

**v1 Status:** Optional — implement if needed, otherwise defer to v2

---

## Publishing Workflow

### Draft → Published (Admin)
1. Admin creates content
2. Admin sets status to `published` (or `scheduled`)
3. Content goes live immediately (or at scheduled time)

### Draft → Published (Editor + Admin)
1. Editor creates content
2. Editor saves as `draft`
3. Editor notifies admin (manual in v1)
4. Admin reviews content
5. Admin publishes or requests changes
6. If changes needed, editor revises and repeats

**v1 Limitation:** No in-app notifications or approval queue. Use external communication (email, Slack).

**v2 Enhancement:** 
- In-app notifications
- Approval queue dashboard
- Comments/feedback on drafts

---

## Content Lifecycle

### Status Transitions

```
draft → scheduled → published → archived
  ↑         ↓           ↓           ↓
  └─────────┴───────────┴───────────┘
       (can revert to draft)
```

| From | To | Who Can Do This | Notes |
|------|-----|-----------------|-------|
| draft | scheduled | Admin | Set future publish date/time |
| draft | published | Admin | Immediate go-live |
| scheduled | published | System (auto) | Triggers at scheduled time |
| scheduled | draft | Admin | Cancel scheduled publish |
| published | archived | Admin | Hide from public, keep in DB |
| published | draft | Admin | Unpublish for major edits |
| archived | published | Admin | Restore archived content |

**v1 Rule:** Only admins can change status to `published` or `archived`.

---

## Content Quality Standards

### Required Before Publishing
- [ ] Title is clear and descriptive
- [ ] Slug is SEO-friendly (auto-generated is usually fine)
- [ ] Description is complete (no placeholder text)
- [ ] Featured image is uploaded and appropriate
- [ ] At least one category is assigned
- [ ] Price is set (if applicable)
- [ ] Date/time is correct (for events)
- [ ] Location is specified (for events)

### Optional but Recommended
- [ ] Tags are added for discoverability
- [ ] Description includes formatting (headings, lists, links)
- [ ] Capacity is set (for events)
- [ ] Stock/inventory is set (for products)

**v1 Enforcement:** Manual checklist (admin reviews before publishing)

**v2 Enhancement:** Automated validation with warnings/errors in CMS UI

---

## Category & Tag Management

### Who Manages Categories?
**Admins only.**

**Process:**
1. Admin creates new category
2. Admin assigns category slug (auto-generated, editable)
3. Category appears in dropdown for all editors

**Best Practices:**
- Keep category list short (5–10 per offering type)
- Use clear, non-overlapping names
- Review quarterly and merge/delete unused categories

### Who Manages Tags?
**Anyone can create tags, admins curate.**

**Process:**
1. Editor adds new tag while creating content
2. Tag is saved and available for future use
3. Admin periodically reviews tags and merges duplicates

**Best Practices:**
- Suggest existing tags before creating new ones
- Use lowercase and hyphens
- Avoid redundant tags (`yoga` vs `yoga-class`)

---

## Deletion Policy

### v1 Approach: Soft Delete (Archive)
- Content is **never permanently deleted** in v1
- Use `archived` status to hide from public
- Archived content remains in database for reference

### v2 Approach: Hard Delete (Optional)
- Admins can permanently delete content
- Requires confirmation prompt
- Consider retention policy (e.g., keep archived content for 1 year)

**Rationale:** Prevents accidental data loss in v1. Add hard delete in v2 when audit logs are in place.

---

## Homepage & Navigation Control

### Who Manages?
**Admins only.**

### Homepage Blocks
Admins define:
- Hero section (featured event or product)
- Featured offerings (manually selected)
- Category highlights
- Custom text blocks

**v1 Implementation:** Simple admin UI to select featured content and order blocks.

### Navigation Menus
Admins define:
- Main menu links
- Footer links
- Category menu

**v1 Implementation:** Drag-and-drop menu builder or simple form.

---

## Communication & Collaboration

### v1 (Manual)
- Editors notify admins via email or Slack when content is ready for review
- Admins provide feedback via same channels
- No in-app messaging

### v2 (Automated)
- In-app notifications when content is submitted for review
- Comment threads on drafts
- Activity feed showing recent changes

---

## Audit & Accountability

### v1 (Basic)
- Track `created_at`, `updated_at`, `published_at` timestamps
- Store `created_by` and `updated_by` user IDs

### v2 (Advanced)
- Full activity log (who changed what, when)
- Revision history (compare versions)
- Rollback capability

---

## Summary

**v1 Governance Model:**
- **Admins** have full control and final publishing authority
- **Editors** create and draft content, rely on admins to publish
- **Manual workflows** for review and approval
- **Soft delete** (archive) to prevent data loss
- **Simple role-based permissions** (no granular controls)

**v2 Enhancements:**
- Approval workflows with notifications
- Granular permissions (e.g., editors can publish certain categories)
- Audit logs and revision history
- Hard delete with safeguards

**Key Principle:** Start simple, add complexity only when needed.

