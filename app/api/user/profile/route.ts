import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Ad en az 2 karakter olmalı.").max(80).optional(),
  riskProfile: z.enum(["low", "medium", "high"]).optional(),
  monthlyIncome: z.number().int().min(0).optional()
});

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Giriş yapman gerekiyor." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Geçersiz veri." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data
  });

  return NextResponse.json({
    name: updated.name,
    riskProfile: updated.riskProfile,
    monthlyIncome: updated.monthlyIncome
  });
}
