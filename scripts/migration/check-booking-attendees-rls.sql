-- Check RLS policies on booking_attendees table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'booking_attendees'
ORDER BY policyname;

