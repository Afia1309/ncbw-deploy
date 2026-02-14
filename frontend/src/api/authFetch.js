export async function authFetch(url, options = {}) {
  let access = localStorage.getItem("access");

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${access}`,
    },
  });

  // Auto-refresh token if expired
  if (res.status === 401) {
    const refresh = localStorage.getItem("refresh");

    // ask backend for new access token
    const refreshRes = await fetch(
      "http://127.0.0.1:8000/api/auth/refresh/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      }
    );

    if (!refreshRes.ok) {
      localStorage.clear();
      window.location.href = "/login";
      return;
    }

    // save new token
    const data = await refreshRes.json();
    localStorage.setItem("access", data.access);

    // retry original request
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${data.access}`,
      },
    });
  }

  return res;
}
