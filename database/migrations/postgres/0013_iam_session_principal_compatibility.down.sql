UPDATE iam_session
SET principal_id = user_id
WHERE principal_id IS NULL AND user_id IS NOT NULL;

ALTER TABLE iam_session
  ALTER COLUMN principal_id SET NOT NULL;
