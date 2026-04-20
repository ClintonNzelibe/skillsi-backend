export const shortenNotificationMessage = (notifications, length = 30) => {
    return notifications.map((notification) => ({
        ...notification.toObject(),
        message: notification.message.length > length
            ? notification.message.substring(0, length) + "..."
            : notification.message,
    }));
};
export function generateNotificationPreview(html, maxLength = 100) {
    // Strip HTML tags
    const plainText = html.replace(/<[^>]+>/g, "").trim();
    // Shorten if too long
    if (plainText.length > maxLength) {
        return plainText.slice(0, maxLength).trim() + "…";
    }
    return plainText;
}
