-- Custom Migration: Sequences, Triggers, and Constraints
-- 1. RECEIPT NUMBER SEQUENCE & GENERATOR
CREATE SEQUENCE IF NOT EXISTS public.receipt_no_seq START WITH 1;

CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status = 'paid' AND (NEW.receipt_no IS NULL OR NEW.receipt_no = '') THEN
        NEW.receipt_no := 'Q2L-' || to_char(timezone('utc'::text, now()), 'YYYY') || '-' || lpad(nextval('public.receipt_no_seq')::text, 6, '0');
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_payment_receipt_no ON public.payments;
CREATE TRIGGER set_payment_receipt_no
    BEFORE INSERT ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.generate_receipt_number();

-- 2. UPDATED_AT TRIGGER FUNCTION & ATTACHMENTS
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_subjects_updated_at ON public.subjects;
CREATE TRIGGER set_subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_chapters_updated_at ON public.chapters;
CREATE TRIGGER set_chapters_updated_at BEFORE UPDATE ON public.chapters FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_faculty_updated_at ON public.faculty;
CREATE TRIGGER set_faculty_updated_at BEFORE UPDATE ON public.faculty FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_youtube_playlists_updated_at ON public.youtube_playlists;
CREATE TRIGGER set_youtube_playlists_updated_at BEFORE UPDATE ON public.youtube_playlists FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_youtube_videos_updated_at ON public.youtube_videos;
CREATE TRIGGER set_youtube_videos_updated_at BEFORE UPDATE ON public.youtube_videos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_batches_updated_at ON public.batches;
CREATE TRIGGER set_batches_updated_at BEFORE UPDATE ON public.batches FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_batch_fee_plans_updated_at ON public.batch_fee_plans;
CREATE TRIGGER set_batch_fee_plans_updated_at BEFORE UPDATE ON public.batch_fee_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_enrollments_updated_at ON public.enrollments;
CREATE TRIGGER set_enrollments_updated_at BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_fee_dues_updated_at ON public.fee_dues;
CREATE TRIGGER set_fee_dues_updated_at BEFORE UPDATE ON public.fee_dues FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_payments_updated_at ON public.payments;
CREATE TRIGGER set_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_resources_updated_at ON public.resources;
CREATE TRIGGER set_resources_updated_at BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_webhook_events_updated_at ON public.webhook_events;
CREATE TRIGGER set_webhook_events_updated_at BEFORE UPDATE ON public.webhook_events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_announcements_updated_at ON public.announcements;
CREATE TRIGGER set_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_testimonials_updated_at ON public.testimonials;
CREATE TRIGGER set_testimonials_updated_at BEFORE UPDATE ON public.testimonials FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_results_updated_at ON public.results;
CREATE TRIGGER set_results_updated_at BEFORE UPDATE ON public.results FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_enquiries_updated_at ON public.enquiries;
CREATE TRIGGER set_enquiries_updated_at BEFORE UPDATE ON public.enquiries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER set_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_lecture_views_updated_at ON public.lecture_views;
CREATE TRIGGER set_lecture_views_updated_at BEFORE UPDATE ON public.lecture_views FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_sync_runs_updated_at ON public.sync_runs;
CREATE TRIGGER set_sync_runs_updated_at BEFORE UPDATE ON public.sync_runs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_audit_log_updated_at ON public.audit_log;
CREATE TRIGGER set_audit_log_updated_at BEFORE UPDATE ON public.audit_log FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. CIRCULAR FOREIGN KEY LINK FOR FEE_DUES -> PAYMENTS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_fee_dues_payment'
    ) THEN
        ALTER TABLE public.fee_dues
            ADD CONSTRAINT fk_fee_dues_payment
            FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE SET NULL;
    END IF;
END;
$$;
