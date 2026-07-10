CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'declined', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."pricing_tier" AS ENUM('day', 'week', 'month');--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text NOT NULL,
	"delivery_address" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"tier" "pricing_tier" NOT NULL,
	"estimated_price_cents" integer NOT NULL,
	"deposit_cents" integer DEFAULT 150000 NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone
);
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_no_confirmed_overlap"
	EXCLUDE USING gist (
		daterange("start_date", "end_date", '[]') WITH &&
	) WHERE (status = 'confirmed');
