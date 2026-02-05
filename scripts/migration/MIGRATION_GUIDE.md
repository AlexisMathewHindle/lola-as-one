# Complete Firebase to Supabase Migration Guide

## 📚 Documentation Index

This migration toolkit includes several documentation files:

- **[QUICKSTART.md](./QUICKSTART.md)** - Get started in 15 minutes (recommended for first-time users)
- **[README.md](./README.md)** - Complete technical documentation
- **[FIELD_MAPPING.md](./FIELD_MAPPING.md)** - Detailed field mapping reference
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - This file - comprehensive migration strategy

## 🎯 Migration Strategy

### Phase 1: Preparation (Day 1)

**Goals:**
- Understand current Firebase data structure
- Set up migration environment
- Test migration with sample data

**Tasks:**
1. ✅ Audit Firebase data structure
2. ✅ Review Supabase schema
3. ✅ Install migration scripts
4. ✅ Configure environment variables
5. ✅ Run dry run migration
6. ✅ Review sample migrated data

**Time Required:** 2-3 hours

### Phase 2: Test Migration (Day 2-3)

**Goals:**
- Migrate subset of data
- Validate data integrity
- Test application with migrated data

**Tasks:**
1. ✅ Export 10-20 sample events from Firebase
2. ✅ Run migration on sample data
3. ✅ Verify data in Supabase
4. ✅ Test legacy website with Supabase data
5. ✅ Identify and fix any data issues
6. ✅ Document any custom field mappings needed

**Time Required:** 4-6 hours

### Phase 3: Full Migration (Day 4)

**Goals:**
- Migrate all events
- Validate complete dataset
- Prepare for cutover

**Tasks:**
1. ✅ Backup Firebase data
2. ✅ Run full migration
3. ✅ Validate all data migrated correctly
4. ✅ Test application thoroughly
5. ✅ Prepare rollback plan

**Time Required:** 2-4 hours

### Phase 4: Cutover (Day 5-7)

**Goals:**
- Switch production traffic to Supabase
- Monitor for issues
- Decommission Firebase

**Tasks:**
1. ✅ Update application to use Supabase
2. ✅ Deploy updated application
3. ✅ Monitor for errors
4. ✅ Keep Firebase running in parallel (safety net)
5. ✅ After 48 hours of stable operation, decommission Firebase

**Time Required:** Ongoing monitoring

## 🔄 Migration Approaches

### Approach 1: Big Bang Migration (Recommended for Small Datasets)

**Best for:** < 500 events, low traffic websites

**Process:**
1. Schedule maintenance window (2-4 hours)
2. Put website in maintenance mode
3. Run full migration
4. Validate data
5. Update application to use Supabase
6. Take website out of maintenance mode

**Pros:**
- Simple and straightforward
- Clean cutover
- No data sync issues

**Cons:**
- Requires downtime
- Higher risk if issues occur

### Approach 2: Parallel Running (Recommended for Large Datasets)

**Best for:** > 500 events, high traffic websites

**Process:**
1. Migrate all existing data to Supabase
2. Update application to read from Supabase
3. Keep Firebase for new bookings temporarily
4. Gradually migrate new data
5. Eventually switch all writes to Supabase
6. Decommission Firebase

**Pros:**
- No downtime
- Lower risk
- Can rollback easily

**Cons:**
- More complex
- Requires dual-write logic
- Data sync challenges

### Approach 3: Incremental Migration

**Best for:** Very large datasets, complex data relationships

**Process:**
1. Migrate events by date range (e.g., future events first)
2. Validate each batch
3. Update application to check both databases
4. Gradually migrate historical data
5. Eventually switch to Supabase only

**Pros:**
- Lowest risk
- Can pause/resume migration
- Easy to validate each batch

**Cons:**
- Most complex
- Longest timeline
- Requires application changes

## 📋 Pre-Migration Checklist

### Data Preparation
- [ ] Audit Firebase data structure
- [ ] Identify all event fields used
- [ ] Document custom fields
- [ ] Clean up invalid/test data in Firebase
- [ ] Backup Firebase data

### Environment Setup
- [ ] Supabase project created
- [ ] Schema applied to Supabase
- [ ] Migration scripts installed
- [ ] Environment variables configured
- [ ] Firebase service account downloaded
- [ ] Supabase service role key obtained

### Testing
- [ ] Dry run completed successfully
- [ ] Sample data migrated and validated
- [ ] Application tested with Supabase data
- [ ] Performance tested
- [ ] Rollback procedure tested

### Stakeholder Communication
- [ ] Migration plan shared with team
- [ ] Maintenance window scheduled (if needed)
- [ ] Rollback plan documented
- [ ] Support team briefed

## 🚨 Risk Mitigation

### Risk 1: Data Loss
**Mitigation:**
- Always backup Firebase data before migration
- Use DRY_RUN mode first
- Validate data after migration
- Keep Firebase running in parallel initially

### Risk 2: Data Corruption
**Mitigation:**
- Validate data types during transformation
- Check required fields are present
- Verify relationships (offerings ↔ offering_events)
- Sample check migrated data

### Risk 3: Application Downtime
**Mitigation:**
- Use parallel running approach
- Test application thoroughly before cutover
- Have rollback plan ready
- Schedule migration during low-traffic period

### Risk 4: Performance Issues
**Mitigation:**
- Test with production-like data volume
- Monitor Supabase performance
- Optimize queries if needed
- Use connection pooling

## 📊 Success Criteria

Migration is successful when:

- ✅ All events migrated (count matches Firebase)
- ✅ Data integrity validated (no orphaned records)
- ✅ Application works correctly with Supabase
- ✅ Performance is acceptable
- ✅ No data loss or corruption
- ✅ Bookings work correctly
- ✅ Images display correctly
- ✅ Search/filtering works
- ✅ Admin CMS works correctly

## 🔍 Post-Migration Validation

### Automated Validation
```bash
npm run validate
```

### Manual Validation
1. **Count Check:**
   ```sql
   SELECT COUNT(*) FROM offerings WHERE type = 'event';
   ```
   Should match Firebase event count

2. **Sample Data Check:**
   - Pick 10 random events
   - Compare Firebase vs Supabase data
   - Verify all fields match

3. **Relationship Check:**
   ```sql
   SELECT COUNT(*) FROM offerings o
   LEFT JOIN offering_events oe ON oe.offering_id = o.id
   WHERE o.type = 'event' AND oe.id IS NULL;
   ```
   Should return 0 (no orphaned offerings)

4. **Application Testing:**
   - Browse events on website
   - View event details
   - Test booking flow
   - Test admin CMS
   - Test search/filtering

## 🔄 Rollback Procedure

If migration fails or issues are discovered:

### Immediate Rollback (During Migration)
```bash
npm run rollback
```

### Post-Migration Rollback (After Cutover)
1. Revert application to use Firebase
2. Deploy reverted application
3. Delete Supabase data: `npm run rollback`
4. Investigate issues
5. Fix and retry migration

## 📞 Support & Troubleshooting

### Common Issues

**Issue:** Slug conflicts
**Solution:** Existing events with same title. Delete old data or modify slug generation.

**Issue:** Date format errors
**Solution:** Check Firebase date format. Update transformation script if needed.

**Issue:** Missing required fields
**Solution:** Check Firebase data has all required fields. Add defaults in transformation script.

**Issue:** Image URLs not working
**Solution:** Verify image URLs are accessible. May need to migrate images to Supabase Storage.

### Getting Help

1. Check logs in `logs/` directory
2. Review validation report
3. Check Supabase Dashboard for errors
4. Review Firebase data structure
5. Consult documentation files

## 📈 Monitoring Post-Migration

### Week 1: Intensive Monitoring
- Check error logs daily
- Monitor Supabase performance
- Verify new bookings work correctly
- Keep Firebase running as backup

### Week 2-4: Regular Monitoring
- Check error logs weekly
- Monitor performance metrics
- Verify data consistency
- Plan Firebase decommissioning

### Month 2+: Normal Operations
- Standard monitoring
- Decommission Firebase
- Archive Firebase data for compliance

## ✅ Migration Complete Checklist

- [ ] All events migrated successfully
- [ ] Data validated and verified
- [ ] Application updated to use Supabase
- [ ] Application deployed to production
- [ ] No errors in production for 48 hours
- [ ] Performance is acceptable
- [ ] Team trained on new system
- [ ] Documentation updated
- [ ] Firebase decommissioned
- [ ] Firebase data archived

---

**Estimated Total Timeline:** 5-7 days  
**Estimated Effort:** 15-25 hours  
**Risk Level:** Low-Medium (with proper testing)

