import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const profileUpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phoneNumber: z.string().optional(),
});

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/;

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .regex(PASSWORD_REGEX, "Password must contain uppercase, lowercase, and a number"),
  confirmPassword: z.string().min(10),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Check if this is a password change request
  if (body.currentPassword) {
    const passwordData = passwordChangeSchema.parse(body);

    // Verify current password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(
      passwordData.currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(passwordData.newPassword, 10);

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    return NextResponse.json({
      message: "Password updated successfully",
      user: updated,
    });
  }

  // Profile update
  const profileData = profileUpdateSchema.parse(body);
  const updateData: any = {};

  if (profileData.firstName || profileData.lastName) {
    const firstName = profileData.firstName || "";
    const lastName = profileData.lastName || "";
    updateData.name = `${firstName} ${lastName}`.trim();
  }

  if (profileData.phoneNumber !== undefined) {
    updateData.phone = profileData.phoneNumber;
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      role: true,
    },
  });

  return NextResponse.json(updated);
}
