
CREATE TABLE public.referrals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referrer_id uuid NOT NULL,
    referee_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.slack_access_surveys (
    user_id uuid NOT NULL,
    q1_answer character varying(255) NOT NULL,
    q2_answer character varying,
    submitted_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.waitlist_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    username character varying(100),
    first_name character varying(100),
    last_name character varying(100),
    phone_number character varying(20),
    marketing_opt_in boolean DEFAULT false NOT NULL,
    additional_remarks character varying,
    referral_code character varying(8) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    magic_link_token character varying(64) NOT NULL,
    welcome_email_sent_at timestamp without time zone
);

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.slack_access_surveys
    ADD CONSTRAINT slack_access_surveys_pkey PRIMARY KEY (user_id);

ALTER TABLE ONLY public.waitlist_users
    ADD CONSTRAINT waitlist_users_email_unique UNIQUE (email);

ALTER TABLE ONLY public.waitlist_users
    ADD CONSTRAINT waitlist_users_magic_link_token_unique UNIQUE (magic_link_token);

ALTER TABLE ONLY public.waitlist_users
    ADD CONSTRAINT waitlist_users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.waitlist_users
    ADD CONSTRAINT waitlist_users_referral_code_unique UNIQUE (referral_code);

CREATE INDEX referrals_referee_id_idx ON public.referrals USING btree (referee_id);

CREATE INDEX referrals_referrer_id_idx ON public.referrals USING btree (referrer_id);

CREATE UNIQUE INDEX unique_referral ON public.referrals USING btree (referrer_id, referee_id);

CREATE INDEX waitlist_users_email_idx ON public.waitlist_users USING btree (email);

CREATE INDEX waitlist_users_magic_link_token_idx ON public.waitlist_users USING btree (magic_link_token);

CREATE INDEX waitlist_users_referral_code_idx ON public.waitlist_users USING btree (referral_code);

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referee_id_waitlist_users_id_fk FOREIGN KEY (referee_id) REFERENCES public.waitlist_users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referrer_id_waitlist_users_id_fk FOREIGN KEY (referrer_id) REFERENCES public.waitlist_users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.slack_access_surveys
    ADD CONSTRAINT slack_access_surveys_user_id_waitlist_users_id_fk FOREIGN KEY (user_id) REFERENCES public.waitlist_users(id) ON DELETE CASCADE;

