const API = "http://127.0.0.1:8000/api/notifications/";

// Fetch all notifications
export async function fetchNotifications(token) {
  const response = await fetch(API, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error("Fetch notifications failed:", await response.text());
    return [];
  }

  return response.json();
}

// Fetch # of unread notifications
export async function fetchUnreadCount(token) {
  const response = await fetch(`${API}unread-count/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}


// Mark notification as read
export async function markAsRead(id, token) {
  const response = await fetch(`${API}${id}/read/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error("Mark read failed:", await res.text());
  }
}
