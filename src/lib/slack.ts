export async function sendSlackAlert(text: string) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("SLACK_WEBHOOK_URL is not set; skipping Slack alert:", text);
    return { sent: false as const, reason: "no_webhook_url" as const };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      console.error("Slack webhook failed:", res.status, await res.text());
      return { sent: false as const, reason: "webhook_error" as const };
    }
    return { sent: true as const };
  } catch (err) {
    console.error("Slack webhook error:", err);
    return { sent: false as const, reason: "network_error" as const };
  }
}
