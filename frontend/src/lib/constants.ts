import { RecordType } from "./types";

export const RECORD_TYPES: RecordType[] = [
  "A",
  "AAAA",
  "CNAME",
  "TXT",
  "MX",
  "NS",
  "PTR",
  "SRV",
  "CAA"
];

export const RECORD_TYPE_DESCRIPTIONS: Record<RecordType, string> = {
  A: "A — Routes traffic to an IPv4 address.",
  AAAA: "AAAA — Routes traffic to an IPv6 address.",
  CNAME: "CNAME — Canonical name record. Routes traffic to another domain name. Cannot exist at zone apex.",
  TXT: "TXT — Text record. Contains arbitrary text data.",
  MX: "MX — Mail exchange record. Routes email to mail servers.",
  NS: "NS — Name server record. Identifies the name servers for a hosted zone.",
  PTR: "PTR — Pointer record. Used for reverse DNS lookups.",
  SRV: "SRV — Service record. Defines the location of servers for specific services.",
  CAA: "CAA — Certification authority authorization. Limits which CAs can issue certificates."
};

export const CAA_TAGS = [
  { value: "issue", label: "issue (allows CA to issue certificate)" },
  { value: "issuewild", label: "issuewild (allows CA to issue wildcard certificate)" },
  { value: "iodef", label: "iodef (specifies URL for CA to report policy violations)" }
];

export const DEFAULT_TTL = 300;

export const TTL_OPTIONS = [
  { value: 60, label: "60 seconds (1 minute)" },
  { value: 300, label: "300 seconds (5 minutes)" },
  { value: 900, label: "900 seconds (15 minutes)" },
  { value: 3600, label: "3600 seconds (1 hour)" },
  { value: 86400, label: "86400 seconds (1 day)" },
  { value: 172800, label: "172800 seconds (2 days)" }
];
