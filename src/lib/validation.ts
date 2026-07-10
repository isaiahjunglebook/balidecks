import { z } from "zod";
import { isValidDateString } from "./dates";

const dateString = z
  .string()
  .refine(isValidDateString, { message: "Invalid date (expected yyyy-MM-dd)" });

export const bookingInputSchema = z
  .object({
    customerName: z.string().trim().min(1, "Name is required").max(200),
    customerEmail: z.string().trim().email("Valid email required").max(200),
    customerPhone: z
      .string()
      .trim()
      .min(4, "Phone / WhatsApp is required")
      .max(50),
    deliveryAddress: z
      .string()
      .trim()
      .min(1, "Delivery address is required")
      .max(500),
    startDate: dateString,
    endDate: dateString,
    notes: z.string().trim().max(1000).optional().or(z.literal("")),
  })
  .refine((v) => v.startDate <= v.endDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

export type BookingInput = z.infer<typeof bookingInputSchema>;

export const adminDecisionSchema = z.object({
  action: z.enum(["confirm", "decline", "cancel"]),
  adminNote: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type AdminDecision = z.infer<typeof adminDecisionSchema>;
