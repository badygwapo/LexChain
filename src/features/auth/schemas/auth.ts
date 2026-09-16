import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;

export const signInResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string().default("bearer"),
  expires_in: z.number(),
  user: z.object({
    id: z.string(),
    email: z.string(),
  }).passthrough(),
});

export type SignInResponse = z.infer<typeof signInResponseSchema>;

export type DemoForgotPasswordResult = {
  message: "If an account exists for that email, a reset link has been sent.";
  demoResetHref: string;
};

export const demoResetToken = "lexchain-web-demo-reset";

export const webResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .regex(/[A-Z]/, "Add at least one uppercase letter.")
      .regex(/[a-z]/, "Add at least one lowercase letter.")
      .regex(/[0-9]/, "Add at least one number."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
