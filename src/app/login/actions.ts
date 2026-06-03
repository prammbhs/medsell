"use server"

import { signIn } from "@/auth"
import { AuthError } from "next-auth"
import { loginSchema } from "@/lib/validations"

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  const email = formData.get("email")
  const password = formData.get("password")

  const validation = loginSchema.safeParse({ email, password })
  if (!validation.success) {
    return validation.error.issues[0].message
  }

  try {
    await signIn("credentials", formData)
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials."
        default:
          return "Something went wrong."
      }
    }
    throw error
  }
}
