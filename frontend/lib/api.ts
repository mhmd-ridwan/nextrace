/**
 * NEXTRACE Typed API Client
 * Connects frontend to Python FastAPI Backend.
 */

import {
  BrandBaseline,
  BuzzerComment,
  BuzzerScan,
  BuzzerStats,
  DnsLookupResult,
  DomainAuditRecord,
  WhoisLookupResult,
  EmailAlias,
  EvidenceArtifact,
  EvidenceVerifyResult,
  Finding,
  GeneratedReport,
  GlobalImageScanResponse,
  ImageForensicsResponse,
  InboundEvent,
  Investigation,
  InvestigationTimeline,
  LeakCheckResponse,
  NucleiScanResponse,
  ScanResponse,
  SubdomainScanResponse,
  SystemInfo,
} from "@/types";

let API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
let BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

if (typeof window !== "undefined") {
  const stored = localStorage.getItem("nextrace_api_url") || localStorage.getItem("nextrace_api_url");
  if (stored) API_BASE_URL = stored;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!options.body || !(options.body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorBody = {};
      try {
        errorBody = await res.json();
      } catch {
        errorBody = { message: res.statusText };
      }
      throw new ApiError(
        (errorBody as any).message ||
          (errorBody as any).detail ||
          `Request failed with status ${res.status}`,
        res.status,
        errorBody
      );
    }

    return await res.json();
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      `Cannot connect to NEXTRACE Backend at ${url}. Please ensure FastAPI is running.`,
      0,
      { originalError: err.message }
    );
  }
}

export const api = {
  setApiBaseUrl(newUrl: string) {
    API_BASE_URL = newUrl.replace(/\/+$/, "");
    if (typeof window !== "undefined") {
      localStorage.setItem("nextrace_api_url", API_BASE_URL);
    }
  },

  getApiBaseUrl() {
    return API_BASE_URL;
  },

  // System Health
  async getHealth(): Promise<{ status: string; timestamp: string }> {
    return request("/health");
  },

  async getSystemInfo(): Promise<SystemInfo> {
    return request("/health/info");
  },

  // Module A: Leak Tracer
  async checkLeak(
    identifier: string,
    identifierType: string,
    investigationId?: string
  ): Promise<LeakCheckResponse> {
    return request("/leak/check", {
      method: "POST",
      body: JSON.stringify({
        identifier,
        identifier_type: identifierType,
        investigation_id: investigationId || null,
      }),
    });
  },

  async getBreachIncidents(page = 1, perPage = 20): Promise<any> {
    return request(`/leak/incidents?page=${page}&per_page=${perPage}`);
  },

  async getBreachIncident(id: string): Promise<any> {
    return request(`/leak/incidents/${id}`);
  },

  // Module A: Trackable Aliases
  async generateAlias(
    serviceLabel: string,
    primaryEmail: string,
    investigationId?: string
  ): Promise<EmailAlias> {
    return request("/aliases/generate", {
      method: "POST",
      body: JSON.stringify({
        service_label: serviceLabel,
        primary_email: primaryEmail,
        investigation_id: investigationId || null,
      }),
    });
  },

  async listAliases(investigationId?: string): Promise<EmailAlias[]> {
    const query = investigationId
      ? `?investigation_id=${investigationId}`
      : "";
    return request(`/aliases${query}`);
  },

  async getAlias(
    id: string
  ): Promise<{ alias: EmailAlias; events: InboundEvent[]; note?: string }> {
    return request(`/aliases/${id}`);
  },

  async recordInboundEvent(
    aliasId: string,
    data: {
      sender_domain: string;
      subject_snippet?: string;
      headers_meta?: Record<string, any>;
      message_fingerprint?: string;
    }
  ): Promise<InboundEvent> {
    return request(`/aliases/${aliasId}/events`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Module B: Impersonator Hunter
  async createBaseline(formData: FormData): Promise<BrandBaseline> {
    return request("/impersonator/baseline", {
      method: "POST",
      body: formData,
    });
  },

  async getBaseline(id: string): Promise<BrandBaseline> {
    return request(`/impersonator/baseline/${id}`);
  },

  async getBaselines(investigationId?: string): Promise<BrandBaseline[]> {
    const query = new URLSearchParams();
    if (investigationId) query.set("investigation_id", investigationId);
    const qs = query.toString();
    return request(`/impersonator/baselines${qs ? `?${qs}` : ""}`);
  },

  async scanCandidates(
    baselineId: string,
    candidates: any[],
    investigationId?: string
  ): Promise<ScanResponse> {
    return request("/impersonator/scan", {
      method: "POST",
      body: JSON.stringify({
        baseline_id: baselineId,
        candidates,
        investigation_id: investigationId || null,
      }),
    });
  },

  async getFindings(
    investigationId?: string,
    page = 1,
    perPage = 50,
    baselineId?: string,
    activeOnly = false
  ): Promise<{ items: Finding[]; total: number; page: number; pages: number }> {
    const query = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });
    if (investigationId) query.set("investigation_id", investigationId);
    if (baselineId) query.set("baseline_id", baselineId);
    if (activeOnly) query.set("active_only", "true");
    return request(`/impersonator/findings?${query.toString()}`);
  },

  async getFinding(id: string): Promise<Finding> {
    return request(`/impersonator/findings/${id}`);
  },

  async scrapeProfile(
    query: string,
    platform: string = "Instagram"
  ): Promise<{
    success: boolean;
    platform: string;
    profile_url: string;
    username: string;
    display_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    avatar_path: string | null;
    contact_info: Record<string, string>;
    error: string | null;
  }> {
    return request("/impersonator/scrape", {
      method: "POST",
      body: JSON.stringify({ query, platform }),
    });
  },

  async uploadCandidateAvatar(file: File): Promise<{
    success: boolean;
    avatar_path: string;
    filename: string;
    url: string;
  }> {
    const formData = new FormData();
    formData.append("avatar", file);
    return request("/impersonator/candidate-upload", {
      method: "POST",
      body: formData,
    });
  },

  async uploadFindingAvatar(findingId: string, file: File): Promise<Finding> {
    const formData = new FormData();
    formData.append("avatar", file);
    return request(`/impersonator/findings/${findingId}/avatar`, {
      method: "POST",
      body: formData,
    });
  },

  async deleteFinding(findingId: string): Promise<{ success: boolean; message: string }> {
    return request(`/impersonator/findings/${findingId}`, {
      method: "DELETE",
    });
  },

  async clearFindings(investigationId?: string): Promise<{ success: boolean; cleared_count: number }> {
    const query = investigationId ? `?investigation_id=${investigationId}` : "";
    return request(`/impersonator/findings${query}`, {
      method: "DELETE",
    });
  },

  async quickCompare(data: {
    official_query: string;
    official_platform?: string;
    candidate_query: string;
    candidate_platform?: string;
    investigation_id?: string;
    save_to_queue?: boolean;
  }): Promise<Finding> {
    return request("/impersonator/quick-compare", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async autoScanGlobal(data: {
    target_url: string;
    investigation_id?: string;
    max_candidates?: number;
  }): Promise<{
    target_input: string;
    official_username: string;
    display_name: string;
    brand_baseline: BrandBaseline;
    total_permutations_tested: number;
    platforms_scanned: string[];
    candidates_discovered: number;
    high_risk_count: number;
    findings: Finding[];
    scan_timestamp: string;
  }> {
    return request("/impersonator/auto-scan-global", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async generateTakedownReport(data: {
    investigation_id?: string;
    format: "json" | "pdf";
    target_platform?: string;
    reporting_organization?: string;
    finding_ids?: string[];
    requested_action?: string;
  }): Promise<GeneratedReport> {
    return request("/impersonator/generate-takedown-report", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Module C: Investigations
  async createInvestigation(data: {
    title: string;
    description?: string;
    organization?: string;
    target_brand?: string;
    target_platform?: string;
    priority?: string;
    tags?: string[];
  }): Promise<Investigation> {
    return request("/investigations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async listInvestigations(
    page = 1,
    perPage = 20
  ): Promise<{ items: Investigation[]; total: number; page: number }> {
    return request(`/investigations?page=${page}&per_page=${perPage}`);
  },

  async getInvestigation(id: string): Promise<Investigation> {
    return request(`/investigations/${id}`);
  },

  async updateInvestigation(id: string, data: any): Promise<Investigation> {
    return request(`/investigations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async getInvestigationTimeline(id: string): Promise<InvestigationTimeline> {
    return request(`/investigations/${id}/timeline`);
  },

  // Module C: Digital Evidence
  async createEvidence(formData: FormData): Promise<EvidenceArtifact> {
    return request("/evidence", {
      method: "POST",
      body: formData,
    });
  },

  async listEvidence(
    investigationId?: string,
    page = 1,
    perPage = 20
  ): Promise<{ items: EvidenceArtifact[]; total: number; page: number; pages: number }> {
    const query = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });
    if (investigationId) query.set("investigation_id", investigationId);
    return request(`/evidence?${query.toString()}`);
  },

  async getEvidence(id: string): Promise<EvidenceArtifact> {
    return request(`/evidence/${id}`);
  },

  async verifyEvidence(id: string): Promise<EvidenceVerifyResult> {
    return request(`/evidence/${id}/verify`);
  },

  async addCustodyEvent(
    evidenceId: string,
    data: {
      event_type: string;
      actor: string;
      description: string;
      metadata?: Record<string, any>;
    }
  ): Promise<any> {
    return request(`/evidence/${evidenceId}/custody`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Module D: Reports
  async generateReport(data: {
    investigation_id?: string;
    report_type: string;
    format: "json" | "pdf";
    reporting_organization?: string;
    target_platform?: string;
    requested_action?: string;
    finding_ids?: string[];
  }): Promise<GeneratedReport> {
    return request("/reports/generate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async listReports(
    investigationId?: string
  ): Promise<{ reports: GeneratedReport[]; total: number }> {
    const query = investigationId
      ? `?investigation_id=${investigationId}`
      : "";
    return request(`/reports${query}`);
  },

  async getReport(id: string): Promise<GeneratedReport> {
    return request(`/reports/${id}`);
  },

  getReportDownloadUrl(reportId: string): string {
    return `${API_BASE_URL}/reports/${reportId}/download`;
  },

  // Module E: Buzzer & Comment Threat Intelligence
  async runBuzzerScan(data: {
    target_url: string;
    platform?: string;
    max_comments?: number;
    investigation_id?: string;
    target_official_handle?: string;
    preset_scenario?: string;
  }): Promise<BuzzerScan> {
    return request("/buzzer/scan", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getBuzzerScans(investigationId?: string, limit = 20): Promise<BuzzerScan[]> {
    const query = new URLSearchParams({ limit: String(limit) });
    if (investigationId) query.set("investigation_id", investigationId);
    return request(`/buzzer/scans?${query.toString()}`);
  },

  async getBuzzerScan(scanId: string): Promise<BuzzerScan> {
    return request(`/buzzer/scans/${scanId}`);
  },

  async deleteBuzzerScan(scanId: string): Promise<{ success: boolean; message: string }> {
    return request(`/buzzer/scans/${scanId}`, {
      method: "DELETE",
    });
  },

  async getBuzzerStats(): Promise<BuzzerStats> {
    return request("/buzzer/stats");
  },

  // Module F: Network, Domain & DNS OSINT
  async auditDomain(domain: string): Promise<DomainAuditRecord> {
    return request('/network/domain-audit', {
      method: 'POST',
      body: JSON.stringify({ domain }),
    });
  },

  async lookupDns(domain: string): Promise<DnsLookupResult> {
    const query = new URLSearchParams({ domain });
    return request(`/network/dns?${query.toString()}`);
  },

  async lookupWhois(domain: string): Promise<WhoisLookupResult> {
    const query = new URLSearchParams({ domain });
    return request(`/network/whois?${query.toString()}`);
  },

  // Module H: Attack Surface Management & Nuclei Engine
  async scanSubdomains(domain: string, maxSubdomains = 60, investigationId?: string): Promise<SubdomainScanResponse> {
    return request("/attack-surface/subdomains", {
      method: "POST",
      body: JSON.stringify({
        domain,
        max_subdomains: maxSubdomains,
        investigation_id: investigationId,
      }),
    });
  },

  async scanNuclei(data: {
    target: string;
    tags?: string[];
    severity?: string[];
    investigation_id?: string;
  }): Promise<NucleiScanResponse> {
    return request("/attack-surface/nuclei", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Module G: Image Forensics & EXIF Analysis
  async analyzeImageExif(file: File): Promise<ImageForensicsResponse> {
    const formData = new FormData();
    formData.append("file", file);
    return request("/image/exif", {
      method: "POST",
      body: formData,
    });
  },

  async analyzeBase64Exif(dataUrl: string, fileName = "evidence_image.jpg"): Promise<ImageForensicsResponse> {
    return request("/image/exif-base64", {
      method: "POST",
      body: JSON.stringify({ data_url: dataUrl, file_name: fileName }),
    });
  },

  async getForensicSample(sampleType: "iphone_gps" | "canon_dslr" | "photoshop_tampered"): Promise<ImageForensicsResponse> {
    return request(`/image/samples/${sampleType}`);
  },

  async scanImageGlobal(
    file: File,
    investigationId = "inv-jokowi-001",
    threshold = 85.0
  ): Promise<GlobalImageScanResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("investigation_id", investigationId);
    formData.append("threshold", String(threshold));
    return request("/image/scan-global", {
      method: "POST",
      body: formData,
    });
  },

  async getGlobalImageScanSample(
    sampleType: string,
    investigationId = "inv-jokowi-001",
    threshold = 85.0
  ): Promise<GlobalImageScanResponse> {
    const query = new URLSearchParams({
      investigation_id: investigationId,
      threshold: String(threshold),
    });
    return request(`/image/scan-global/sample/${sampleType}?${query.toString()}`);
  },

  async vaultImageEvidence(formData: FormData): Promise<EvidenceArtifact> {
    return request("/image/vault", {
      method: "POST",
      body: formData,
    });
  },

  getUploadUrl(path: string | null | undefined): string {
    if (!path) return "";
    if (path.startsWith("data:")) return path;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    if (path.startsWith("/avatars/") || path.startsWith("/static/")) return path;
    const clean = path.replace(/\\/g, "/");
    const filename = clean.split("/").pop();
    const backendRoot = BACKEND_BASE_URL.replace(/\/api\/v1\/?$/, "");
    return `${backendRoot}/uploads/${filename}`;
  },
};
