import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const vapidEmail = process.env.VAPID_EMAIL!;
webpush.setVapidDetails(
  vapidEmail.startsWith("mailto:") || vapidEmail.startsWith("https://")
    ? vapidEmail
    : `mailto:${vapidEmail}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export interface PushPayload {
  title?: string;
  body?:  string;
  url?:   string;  // URL to open when notification is tapped
  type?:  "notification" | "refresh";
  topic?: string;  // used for "refresh" type — matches usePushRefresh(topic, …)
}

/** Send a push payload to a specific set of subscription rows. */
async function sendPushToSubs(
  subs: Array<{ endpoint: string; p256dh: string; auth: string }>,
  payload: PushPayload
): Promise<void> {
  if (subs.length === 0) return;

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    )
  );

  const toDelete: string[] = [];
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      const err = result.reason as any;
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        toDelete.push(subs[i].endpoint);
      }
    }
  });

  if (toDelete.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: toDelete } },
    });
  }
}

/**
 * Send a push notification to every subscribed member.
 * Silently removes subscriptions that are no longer valid.
 */
export async function sendPushToAll(payload: PushPayload): Promise<void> {
  const subs = await prisma.pushSubscription.findMany();
  await sendPushToSubs(subs, payload);
}

/** Send a push to a single user (all their devices). */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  await sendPushToSubs(subs, payload);
}

/** Send a push to a list of users. */
export async function sendPushToUsers(userIds: string[], payload: PushPayload): Promise<void> {
  if (userIds.length === 0) return;
  const subs = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
  });
  await sendPushToSubs(subs, payload);
}

/** Send a push to every member and leader of a BUS group, optionally excluding one user. */
export async function sendPushToBusGroup(
  groupId: string,
  payload: PushPayload,
  excludeUserId?: string
): Promise<void> {
  const group = await prisma.bUSGroup.findUnique({
    where: { id: groupId },
    select: {
      leaderId: true,
      members: { select: { id: true } },
    },
  });
  if (!group) return;

  const userIds = [group.leaderId, ...group.members.map((m) => m.id)].filter(
    (id) => id !== excludeUserId
  );

  await sendPushToUsers(userIds, payload);
}

/**
 * Fire a silent "refresh" push. The service worker receives it and
 * broadcasts to any open clients via postMessage so their UI can refetch.
 * No notification is shown. Safe to call on every admin mutation.
 */
export async function sendRefreshPush(topic: string): Promise<void> {
  await sendPushToAll({ type: "refresh", topic });
}
