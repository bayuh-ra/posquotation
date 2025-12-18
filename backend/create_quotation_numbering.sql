-- backend/create_quotation_numbering.sql
-- Creates quotation_counters table, get_next_quotation_no function, and trigger to set quotation_no on insert

-- Create counters table
CREATE TABLE IF NOT EXISTS public.quotation_counters (
  employee_id uuid NOT NULL,
  year int NOT NULL,
  last_number bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (employee_id, year)
);

-- Create helper function to get next quotation number for an employee
CREATE OR REPLACE FUNCTION public.get_next_quotation_no(emp uuid)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  yr int := date_part('year', now())::int;
  nextnum bigint;
  emp_code text;
BEGIN
  -- increment (or insert) counter for this employee & year
  INSERT INTO public.quotation_counters (employee_id, year, last_number)
    VALUES (emp, yr, 1)
  ON CONFLICT (employee_id, year) DO UPDATE
    SET last_number = public.quotation_counters.last_number + 1
  RETURNING last_number INTO nextnum;

  -- fetch employee code (we expect a numeric code like '01', '02')
  SELECT employee_code INTO emp_code FROM public.employees WHERE id = emp;

  -- Extract digits and convert to integer; fallback to 0 if not present
  DECLARE
    id_digits text := regexp_replace(coalesce(emp_code, ''), '\D', '', 'g');
    id_num int := CASE WHEN id_digits = '' THEN 0 ELSE id_digits::int END;
    id_part text := lpad(id_num::text, 2, '0');
    serial text := lpad(nextnum::text, 4, '0');
  BEGIN
    -- Format: EE-YYYY-NNNN where EE is 2-digit employee id, NNNN is zero-padded sequence
    RETURN id_part || '-' || yr::text || '-' || serial;
  END;
END;
$$;

-- Ensure quotations table has employee_id and quotation_no
ALTER TABLE public.quotations
  ADD COLUMN IF NOT EXISTS employee_id uuid,
  ADD COLUMN IF NOT EXISTS quotation_no text;

-- Trigger function to set quotation_no before insert
CREATE OR REPLACE FUNCTION public.set_quotation_no_before_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.quotation_no IS NULL THEN
    IF NEW.employee_id IS NULL THEN
      RAISE EXCEPTION 'employee_id is required to generate quotation_no';
    END IF;
    NEW.quotation_no := public.get_next_quotation_no(NEW.employee_id);
  END IF;
  IF NEW.created_at IS NULL THEN
    NEW.created_at := now();
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_set_quotation_no ON public.quotations;
CREATE TRIGGER trg_set_quotation_no
BEFORE INSERT ON public.quotations
FOR EACH ROW EXECUTE FUNCTION public.set_quotation_no_before_insert();
