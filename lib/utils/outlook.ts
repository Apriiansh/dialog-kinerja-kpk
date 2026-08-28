export function getOutlookLink({
  title, start, end, body
}: {
    title: string,
    start: Date | string,
    end: Date | string,
  body: string,
  }): string {
  const formatISO = (d: Date | string) => {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  }

  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: title,
    startdt: formatISO(start),
    enddt: formatISO(end),
    body
  });

  return `https://outlook.office.com/calendar/0/deeplink/compose?${params}`;
}
