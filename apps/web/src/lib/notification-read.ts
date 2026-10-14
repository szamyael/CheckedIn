export function getUpdatedNotificationIds(result: {
  data: { id: string }[] | null;
  error: { message: string } | null;
}): string[] {
  if (result.error) {
    throw new Error(`Unable to mark notifications as read: ${result.error.message}`);
  }
  return result.data?.map(({ id }) => id) ?? [];
}

export function requireNotificationUpdated(
  result: {
    data: { id: string }[] | null;
    error: { message: string } | null;
  },
  id: string,
): string[] {
  const updatedIds = getUpdatedNotificationIds(result);
  if (!updatedIds.includes(id)) {
    throw new Error("No notification was updated. Refresh and try again.");
  }
  return updatedIds;
}
