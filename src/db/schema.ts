import {
  pgTable,
  pgEnum,
  uuid,
  text,
  date,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

export const pricingTier = pgEnum("pricing_tier", ["day", "week", "month"]);
export const bookingStatus = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "declined",
  "cancelled",
]);

export const bookings = pgTable("bookings", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  // Stored as plain calendar dates (no time / no timezone) to avoid off-by-one shifts.
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  tier: pricingTier("tier").notNull(),
  estimatedPriceCents: integer("estimated_price_cents").notNull(),
  depositCents: integer("deposit_cents").notNull().default(150000),
  status: bookingStatus("status").notNull().default("pending"),
  notes: text("notes"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
});

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
