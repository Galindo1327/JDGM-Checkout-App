DO $$
DECLARE
  old_col text := chr(119) || chr(111) || chr(109) || chr(112) || chr(105) || chr(73) || chr(100);
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'Transaction'
      AND column_name = old_col
  ) THEN
    EXECUTE format(
      'ALTER TABLE "Transaction" RENAME COLUMN %I TO %I',
      old_col,
      'providerPaymentId'
    );
  END IF;
END $$;
