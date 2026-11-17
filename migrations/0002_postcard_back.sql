-- Postcards are two-sided: `image` is the painted front, `back` the written side.
-- Cards sent before this change have no back (both columns stay NULL).
ALTER TABLE postcards ADD COLUMN back BLOB;
ALTER TABLE postcards ADD COLUMN back_type TEXT;
