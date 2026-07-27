export interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export type ZoneType = "public" | "private";

export interface HostedZone {
  id: string;
  name: string;
  type: ZoneType;
  comment: string | null;
  record_count: number;
  created_at: string;
  updated_at: string;
}

export type RecordType = "A" | "AAAA" | "CNAME" | "TXT" | "MX" | "NS" | "PTR" | "SRV" | "CAA";

export interface MXData {
  priority: number;
  mail_server: string;
}

export interface SRVData {
  priority: number;
  weight: number;
  port: number;
  target: string;
}

export interface CAAData {
  flag: number;
  tag: "issue" | "issuewild" | "iodef";
  value: string;
}

export type CompoundRecordData = MXData | SRVData | CAAData;

export interface DNSRecord {
  id: string;
  zone_id: string;
  name: string;
  type: RecordType;
  ttl: number;
  value: string | null;
  extra_json: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface ZoneEvent {
  id: string;
  zone_id: string;
  event_type: string;
  description: string;
  created_at: string;
}

export interface ResponseMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: ResponseMeta;
}

export interface ApiError {
  message: string;
  code?: string;
  fields?: Record<string, string>;
}
