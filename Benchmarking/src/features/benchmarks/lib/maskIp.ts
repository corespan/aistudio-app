// Masks the host-identifying half of every IPv4 address found in a string —
// keeps the first two octets (useful for spotting which subnet/rack a machine
// is on) and replaces the last two with a bullet, e.g. "10.6.82.45" becomes
// "10.6.•.•". Regex-based so it works equally on a bare IP ("10.6.82.45"), a
// comma-joined list of them (`machineIp` — see `toBenchmarkRows.ts`), or an
// IP embedded in a longer string like a notebook URL
// ("http://10.6.82.45:8888/lab" -> "http://10.6.•.•:8888/lab"). Strings with
// no IPv4-shaped substring (hostnames, "—", "") pass through unchanged.
const IPV4_PATTERN = /\b(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\b/g

export const maskIp = (value: string | null | undefined): string => {
  if (!value) return value ?? ''
  return value.replace(IPV4_PATTERN, (_match, a: string, b: string) => `${a}.${b}.•.•`)
}
