/**
 * NEXTRACE TypeScript Types matching FastAPI Backend Models
 */

// System & Health
export interface SystemInfo {
  app_name: string;
  version: string;
  app_version?: string;
  environment: string;
  demo_mode: boolean;
  capabilities: Record<string, string>;
}

// Module A: Leak Tracer
export type IdentifierType = 'email' | 'phone' | 'id_hash';

export interface BreachIncident {
  incident_id: string;
  source_name: string;
  source_type: string;
  breach_date: string | null;
  reported_date: string | null;
  exposed_fields: string[];
  record_count: number | null;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source_url: string | null;
  description: string | null;
  verification_status: string;
  is_synthetic: boolean;
  lookup_timestamp?: string;
}

export interface RiskFactor {
  factor: string;
  raw_value?: number;
  weight?: number;
  contribution?: number;
  value?: any;
  points?: number;
  description?: string;
}

export interface RiskAssessment {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  explanation: string;
}

export interface IntelligenceMetadata {
  carrier?: string | null;
  operator_group?: string | null;
  country?: string;
  line_type?: string | null;
  prefix?: string | null;
  is_valid_format?: boolean;
  threat_vectors?: string[];
  remediation_steps?: string[];
  is_disposable_email?: boolean;
  disposable_service?: string | null;
  fraud_risk_score?: number | null;
  telecom_category?: string | null;
}

export interface LeakCheckResponse {
  identifier_type: string;
  identifier_masked: string;
  total_incidents: number;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_factors: string[];
  risk_assessment: RiskAssessment | null;
  intelligence_metadata?: IntelligenceMetadata | null;
  incidents: BreachIncident[];
  breaches?: BreachIncident[];
  query?: string;
  investigation_id?: string | null;
  checked_at: string;
  provider_name: string;
  disclaimer: string;
}

// Module A: Trackable Aliases
export interface EmailAlias {
  alias_id: string;
  service_label: string;
  alias_address: string;
  alias_email?: string;
  primary_email?: string;
  inbound_count?: number;
  provider_type: string;
  provider_status: string;
  investigation_id: string | null;
  created_at: string;
}

export interface InboundEvent {
  event_id: string;
  alias_id: string;
  alias_address?: string;
  sender_domain: string;
  subject_snippet: string | null;
  received_at: string;
  message_fingerprint: string | null;
  evidence_provenance: string | null;
  headers_meta?: Record<string, any>;
  created_at?: string;
}

// Module B: Impersonator Hunter
export interface BrandBaseline {
  id: string;
  brand_name: string;
  official_username: string;
  display_name: string;
  avatar_path: string | null;
  website_url: string | null;
  contact_info: Record<string, string>;
  business_category: string | null;
  investigation_id: string | null;
  created_at?: string;
}

export interface CandidateProfile {
  id: string;
  platform: string;
  profile_url: string | null;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  avatar_path: string | null;
  contact_info: Record<string, any>;
  is_active?: boolean;
  activity_status?: 'active' | 'dormant' | 'inactive';
  observation_timestamp: string | null;
  collection_method: string | null;
  metadata?: Record<string, any>;
}

export interface ImageSimilarityResult {
  algorithm: string;
  hash_distance: number;
  hash_bit_length: number;
  similarity_percentage: number;
  threshold_used: number;
  is_above_threshold: boolean;
  baseline_hash: string;
  candidate_hash: string;
}

export interface ConfusableChar {
  position: number;
  original: string;
  replacement: string;
  unicode_name: string;
  unicode_codepoint: string;
  script: string;
}

export interface UsernameSimilarityResult {
  edit_distance: number;
  similarity_ratio: number;
  homoglyph_detected: boolean;
  confusable_chars: ConfusableChar[];
  substitution_patterns: string[];
  suspicious_affixes: string[];
  is_suspicious: boolean;
}

export interface DisplayNameSimilarityResult {
  edit_distance: number;
  similarity_ratio: number;
  normalized_baseline?: string;
  normalized_candidate?: string;
}

export interface LinkAnalysisResult {
  url: string;
  is_shortened: boolean;
  is_punycode: boolean;
  has_suspicious_redirect: boolean;
  domain_similarity_to_official: number | null;
  risk_indicators: string[];
  risk_level: 'low' | 'medium' | 'high';
}

export interface ContactAnalysisResult {
  contact_type: string;
  value_masked: string;
  is_authorized: boolean;
  risk_indicators: string[];
}

export interface Finding {
  finding_id: string;
  investigation_id: string | null;
  baseline_id?: string | null;
  baseline: BrandBaseline | null;
  candidate: CandidateProfile | null;
  image_similarity: ImageSimilarityResult | null;
  username_similarity: UsernameSimilarityResult | null;
  display_name_similarity: DisplayNameSimilarityResult | null;
  link_analysis: LinkAnalysisResult[];
  contact_analysis: ContactAnalysisResult[];
  bio_analysis: {
    has_impersonation_language?: boolean;
    has_urgency_indicators?: boolean;
    has_payment_requests?: boolean;
    indicators: string[];
  } | null;
  risk_score: number;
  risk_severity: 'low' | 'medium' | 'high' | 'critical';
  risk_factors: string[];
  analyst_notes: string | null;
  review_status: 'pending' | 'reviewed' | 'confirmed' | 'dismissed';
  homoglyph_detected?: boolean;
  avatar_similarity_score?: number;
  avatar_hash_distance?: number;
  suspicious_contacts?: any[];
  suspicious_links?: any[];
  created_at: string;
}

export interface ScanResponse {
  scan_id: string;
  investigation_id: string | null;
  total_candidates: number;
  findings: Finding[];
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
}

// Module C: Investigations & Evidence
export interface InvestigationStats {
  findings_count: number;
  evidence_count: number;
  reports_count: number;
  breach_lookups_count: number;
  aliases_count: number;
  high_risk_findings: number;
}

export interface Investigation {
  id: string;
  title: string;
  description: string | null;
  status: 'draft' | 'active' | 'review' | 'closed' | 'archived';
  created_by: string | null;
  organization: string | null;
  target_brand: string | null;
  target_platform: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  stats?: InvestigationStats;
  created_at: string;
  updated_at: string | null;
  closed_at: string | null;
}

export interface TimelineEvent {
  event_id: string;
  event_type: string;
  event_source: 'observed' | 'reported' | 'analyst' | 'synthetic';
  timestamp: string;
  title: string;
  event_title?: string;
  description: string;
  event_description?: string;
  related_entity_type?: string | null;
  entity_type?: string | null;
  related_entity_id?: string | null;
  metadata?: Record<string, any>;
}

export interface InvestigationTimeline {
  investigation_id: string;
  events: TimelineEvent[];
  total_events: number;
}

export interface CustodyEvent {
  event_id: string;
  evidence_id: string;
  event_type?: string;
  action?: string;
  actor: string | null;
  description?: string | null;
  notes?: string | null;
  event_timestamp?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface EvidenceArtifact {
  evidence_id: string;
  investigation_id: string;
  evidence_type: string;
  source_url: string | null;
  collection_method: string | null;
  observation_timestamp: string | null;
  collection_timestamp: string | null;
  captured_at?: string;
  file_path: string | null;
  file_hash_sha256: string | null;
  sha256_hash?: string;
  metadata: Record<string, any>;
  processing_history: any[];
  custody_events: CustodyEvent[];
  chain_of_custody?: CustodyEvent[];
  created_at: string;
}

export interface EvidenceVerifyResult {
  evidence_id: string;
  is_valid: boolean;
  status?: 'intact' | 'modified' | 'invalid' | string;
  expected_hash: string | null;
  actual_hash: string | null;
  message: string;
  verified_at: string;
}

// Module D: Reports
export interface GeneratedReport {
  report_id: string;
  investigation_id: string | null;
  report_type: 'takedown' | 'breach_summary' | 'investigation_full' | 'buzzer_threat_dossier' | string;
  format: 'json' | 'pdf';
  status: string;
  version: string;
  file_hash_sha256: string | null;
  metadata: Record<string, any>;
  generated_by: string | null;
  created_at: string;
  download_url: string | null;
}

// Module E: Buzzer & Comment Threat Intelligence
export interface BuzzerComment {
  id: string;
  scan_id: string;
  author_username: string;
  author_display_name: string | null;
  author_avatar_url: string | null;
  author_avatar_path: string | null;
  platform: string;
  comment_text: string;
  comment_timestamp: string | null;
  likes_count: number;
  buzzer_score: number;
  account_classification: 'buzzer' | 'bot' | 'organic' | 'suspicious_farm';
  threat_intent: 'impersonation_lure' | 'target_seeking' | 'astroturfing' | 'neutral' | 'doxxing';
  matched_keywords: string[];
  account_signals: {
    followers_count?: number;
    following_count?: number;
    ratio?: number;
    account_age_days?: number;
    handle_entropy?: number;
    copypasta_cluster?: number | null;
    burst_gap_seconds?: number;
    [key: string]: any;
  };
  sentiment: string;
  takedown_recommended: boolean;
  analyst_notes: string | null;
  created_at?: string;
}

export interface BuzzerScan {
  scan_id: string;
  investigation_id: string | null;
  target_url: string;
  target_platform: string;
  target_author: string | null;
  post_snippet: string | null;
  total_comments: number;
  buzzer_count: number;
  bot_count: number;
  organic_count: number;
  threat_comments_count: number;
  astroturfing_index: number;
  scan_metadata: {
    clusters_detected?: number;
    scan_depth?: number;
    inauthentic_ratio_pct?: number;
    [key: string]: any;
  };
  comments: BuzzerComment[];
  created_at?: string;
}

export interface BuzzerStats {
  total_scans: number;
  total_comments_monitored: number;
  buzzer_detected_count: number;
  threat_lures_detected: number;
  average_astroturfing_index: number;
}

// Module F: Network, Domain & DNS Intelligence
export interface DomainAuditRecord {
  domain: string;
  clean_domain: string;
  registrar: string;
  created_date: string;
  expiry_date: string;
  updated_date: string;
  domain_age_days: number | null;
  domain_age_formatted: string;
  nameservers: string[];
  ip_addresses: string[];
  primary_ip: string;
  ssl_issuer: string;
  ssl_expiry: string;
  risk_status: 'Aman' | 'Sedang' | 'Tinggi';
  risk_score: number;
  risk_reasons: string[];
  reputation_notes: string;
  dns_records: Record<string, string[]>;
  raw_whois: string;
  is_live_data: boolean;
  audited_at: string;
}

export interface DnsLookupResult {
  domain: string;
  records: Record<string, string[]>;
  ip_addresses: string[];
}

export interface WhoisLookupResult {
  domain: string;
  fields: {
    registrar: string;
    created_date: string;
    expiry_date: string;
    updated_date: string;
    nameservers: string[];
    age_days: number | null;
    age_formatted: string;
  };
  raw_whois: string;
}

// Module F: Network Graph Intelligence
export interface NetworkNode {
  id: string;
  label: string;
  sublabel?: string;
  type: 'target' | 'buzzer' | 'bot' | 'organic' | 'threat_lure' | 'cluster';
  riskScore?: number;
  avatarUrl?: string;
  details?: Record<string, any>;
  x?: number;
  y?: number;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  weight?: number;
  type?: 'interaction' | 'lure' | 'copypasta' | 'coordination';
}

export interface NetworkGraphData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

// Module G: Image Forensics & EXIF Telemetry
export interface ImageDimensions {
  width: number;
  height: number;
  megapixels: number;
  aspect_ratio: string;
}

export interface ImageHashes {
  sha256: string;
  md5: string;
  phash: string;
  dhash: string;
}

export interface CameraHardware {
  make: string | null;
  model: string | null;
  lens_make: string | null;
  lens_model: string | null;
  serial_number: string | null;
}

export interface ShootingOptics {
  exposure_time: string | null;
  f_number: string | null;
  iso: number | null;
  focal_length: string | null;
  focal_length_35mm: string | null;
  flash: string | null;
  white_balance: string | null;
  exposure_mode: string | null;
}

export interface SoftwareTampering {
  software: string | null;
  tampering_detected: boolean;
  tampering_indicators: string[];
}

export interface ImageChronology {
  date_time_original: string | null;
  date_time_digitized: string | null;
  date_time_modified: string | null;
  offset_time: string | null;
}

export interface GPSLocation {
  has_gps: boolean;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  altitude_ref: string | null;
  latitude_ref: string | null;
  longitude_ref: string | null;
  google_maps_url: string | null;
  openstreetmap_url: string | null;
  location_hint: string | null;
  gps_timestamp: string | null;
}

export interface ImageForensicsResponse {
  file_name: string;
  file_size_bytes: number;
  file_size_formatted: string;
  mime_type: string;
  format: string;
  color_mode: string;
  dimensions: ImageDimensions;
  hashes: ImageHashes;
  camera: CameraHardware;
  optics: ShootingOptics;
  software: {
    software: string | null;
    tampering_detected: boolean;
    tampering_indicators: string[];
  };
  chronology: ImageChronology;
  gps: GPSLocation;
  raw_exif: Record<string, string>;
  preview_data_url: string | null;
}

export interface MatchedProfile {
  candidate_id: string;
  platform: string;
  username: string;
  display_name: string;
  profile_url: string;
  avatar_url?: string | null;
  avatar_path?: string | null;
  visual_similarity_score: number;
  hash_distance: number;
  match_classification: string;
  risk_severity: string;
  risk_score: number;
  threat_indicators: string[];
  suspicious_contacts: string[];
  is_official_anchor: boolean;
}

export interface GlobalImageScanResponse {
  forensics: ImageForensicsResponse;
  investigation_id: string;
  target_phash: string;
  target_sha256: string;
  total_profiles_matched: number;
  high_risk_matches: number;
  matched_entity_name: string;
  matched_profiles: MatchedProfile[];
}

// Module H: Attack Surface Management & Nuclei Scanner
export interface SubdomainItem {
  subdomain: string;
  ip_addresses: string[];
  status_code: number | null;
  title: string | null;
  server: string | null;
  cname: string | null;
  is_takeover_risk: boolean;
  takeover_service: string | null;
  is_live: boolean;
}

export interface SubdomainScanResponse {
  target_domain: string;
  total_found: number;
  live_count: number;
  takeover_risk_count: number;
  subdomains: SubdomainItem[];
  scanned_at: string;
  execution_time_seconds: number;
}

export interface NucleiVulnerabilityItem {
  template_id: string;
  name: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  matched_at: string;
  extracted_results: string[];
  description: string | null;
  cve_id: string | null;
  type: string | null;
  curl_command: string | null;
  remediation: string | null;
}

export interface NucleiScanResponse {
  target: string;
  preset?: string;
  total_findings: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  info_count: number;
  findings: NucleiVulnerabilityItem[];
  scanned_at: string;
  execution_time_seconds: number;
}



