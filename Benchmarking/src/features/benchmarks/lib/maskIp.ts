// Masks the host-identifying half of every IPv4 address found in a string —
// keeps the first two octets (useful for spotting which subnet/rack a machine
// is on) and replaces the last two with a bullet, e.g. "192.0.2.45" becomes
// "192.0.•.•". Regex-based so it works equally on a bare IP ("192.0.2.45"), a
// comma-joined list of them (`machineIp` — see `toBenchmarkRows.ts`), or an
// IP embedded in a longer string like a notebook URL
// ("http://192.0.2.45:8888/lab" -> "http://192.0.•.•:8888/lab"). Strings with
// no IPv4-shaped substring (hostnames, "—", "") pass through unchanged.
//
// Addresses in these comments are from 192.0.2.0/24, the RFC 5737
// documentation range, so no real host is named in a public repository.
const IPV4_PATTERN = /\b(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\b/g

export const maskIp = (value: string | null | undefined): string => {
  if (!value) return value ?? ''
  return value.replace(IPV4_PATTERN, (_match, a: string, b: string) => `${a}.${b}.•.•`)
}
