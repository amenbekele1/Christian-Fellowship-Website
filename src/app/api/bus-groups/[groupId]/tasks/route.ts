import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { groupAuth, isAuthError } from "@/lib/group-auth";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  assignedToId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

const updateSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["IN_PROGRESS"],
  IN_PROGRESS: ["COMPLETED", "PENDING"],
  COMPLETED: ["IN_PROGRESS"],
};

export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const auth = await groupAuth(params.groupId);
  if (isAuthError(auth)) return auth;

  const tasks = await prisma.groupTask.findMany({
    where: { busGroupId: params.groupId },
    include: {
      createdBy: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const auth = await groupAuth(params.groupId);
  if (isAuthError(auth)) return auth;

  if (!auth.isLeader) {
    return NextResponse.json({ error: "Only leaders can create tasks" }, { status: 403 });
  }

  const body = await req.json();
  const data = createSchema.parse(body);

  const task = await prisma.groupTask.create({
    data: {
      busGroupId: params.groupId,
      createdById: auth.userId,
      title: data.title,
      description: data.description,
      assignedToId: data.assignedToId ?? null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
    include: {
      createdBy: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(task, { status: 201 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const auth = await groupAuth(params.groupId);
  if (isAuthError(auth)) return auth;

  const taskId = req.nextUrl.searchParams.get("taskId");
  if (!taskId) return NextResponse.json({ error: "taskId required" }, { status: 400 });

  const task = await prisma.groupTask.findUnique({ where: { id: taskId } });
  if (!task || task.busGroupId !== params.groupId) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const body = await req.json();
  const patch = updateSchema.parse(body);

  // Members can only update status of tasks assigned to them or whole-group tasks
  if (!auth.isLeader) {
    const canUpdate = task.assignedToId === auth.userId || task.assignedToId === null;
    if (!canUpdate) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Members can only change status, not other fields
    if (patch.title || patch.description !== undefined || patch.assignedToId !== undefined || patch.dueDate !== undefined) {
      return NextResponse.json({ error: "Members can only update task status" }, { status: 403 });
    }

    // Validate state machine for members
    if (patch.status && !VALID_TRANSITIONS[task.status]?.includes(patch.status)) {
      return NextResponse.json({ error: `Cannot transition from ${task.status} to ${patch.status}` }, { status: 400 });
    }
  }

  const updated = await prisma.groupTask.update({
    where: { id: taskId },
    data: {
      ...(patch.status && { status: patch.status }),
      ...(auth.isLeader && {
        ...(patch.title && { title: patch.title }),
        ...(patch.description !== undefined && { description: patch.description }),
        ...(patch.assignedToId !== undefined && { assignedToId: patch.assignedToId }),
        ...(patch.dueDate !== undefined && { dueDate: patch.dueDate ? new Date(patch.dueDate) : null }),
      }),
    },
    include: {
      createdBy: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const auth = await groupAuth(params.groupId);
  if (isAuthError(auth)) return auth;

  if (!auth.isLeader) {
    return NextResponse.json({ error: "Only leaders can delete tasks" }, { status: 403 });
  }

  const taskId = req.nextUrl.searchParams.get("taskId");
  if (!taskId) return NextResponse.json({ error: "taskId required" }, { status: 400 });

  await prisma.groupTask.delete({ where: { id: taskId } });
  return NextResponse.json({ ok: true });
}
