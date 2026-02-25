import { z } from "zod";

export const RoleEnum = z.enum(['ADMIN', 'INSPECTOR', 'UNIVERSITY_COORDINATOR']);
export type Role = z.infer<typeof RoleEnum>;

export const RequestStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'NEED_CHANGES', 'INSPECTOR_CONFIRMED', 'COMPLETED']);
export type RequestStatus = z.infer<typeof RequestStatusEnum>;

export const UserSchema = z.object({
  id: z.number(),
  username: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: RoleEnum,
  university: z.string().nullable().optional(),
  faculty: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  designation: z.string().nullable().optional(),
  phone_number: z.string().nullable().optional(),
  whatsapp_number: z.string().nullable().optional(),
});

export type User = z.infer<typeof UserSchema>;

export const SeminarRequestSchema = z.object({
  id: z.number(),
  coordinator: z.number(),
  coordinator_name: z.string(),
  university_name: z.string(),
  student_count: z.number(),
  preferred_dates: z.array(z.string()),
  final_date: z.string().nullable().optional(),
  location: z.string(),
  notes: z.string().nullable().optional(),
  status: RequestStatusEnum,
  status_history: z.array(z.object({
    status: RequestStatusEnum,
    date: z.string(),
    note: z.string().optional(),
    by: z.string()
  })),
  assigned_inspector: z.number().nullable().optional(),
  assigned_inspector_name: z.string().nullable().optional(),
  inspector_report: z.object({
    message: z.string(),
    completedAt: z.string()
  }).nullable().optional(),
  created_at: z.string(),
});

export type SeminarRequest = z.infer<typeof SeminarRequestSchema>;

export const NotificationSchema = z.object({
  id: z.number(),
  to_user: z.number(),
  title: z.string(),
  message: z.string(),
  read: z.boolean(),
  created_at: z.string(),
});

export type Notification = z.infer<typeof NotificationSchema>;

export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
  email: z.string().email(),
  role: RoleEnum,
  university: z.string().optional(),
});

export const insertRequestSchema = z.object({
  student_count: z.number(),
  preferred_dates: z.array(z.string()),
  location: z.string(),
  notes: z.string().optional(),
});
