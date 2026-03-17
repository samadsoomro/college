-- Fix card_number: unique per college, not globally
ALTER TABLE library_card_applications 
  DROP CONSTRAINT library_card_applications_card_number_key;
ALTER TABLE library_card_applications 
  ADD CONSTRAINT library_card_applications_card_number_college_unique 
  UNIQUE (card_number, college_id);

-- Fix field_key: unique per college, not globally
ALTER TABLE library_card_fields 
  DROP CONSTRAINT library_card_fields_field_key_key;
ALTER TABLE library_card_fields 
  ADD CONSTRAINT library_card_fields_field_key_college_unique 
  UNIQUE (field_key, college_id);

-- Fix student card_id: unique per college, not globally
ALTER TABLE students 
  DROP CONSTRAINT students_card_id_key;
ALTER TABLE students 
  ADD CONSTRAINT students_card_id_college_unique 
  UNIQUE (card_id, college_id);

-- Fix users email: unique per college, not globally (CRITICAL)
ALTER TABLE users 
  DROP CONSTRAINT users_email_key;
ALTER TABLE users 
  ADD CONSTRAINT users_email_college_unique 
  UNIQUE (email, college_id);
