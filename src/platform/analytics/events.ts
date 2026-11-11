/**
 * Analytics event names and payload types. All events must be
 * declared here; unknown events are rejected by event-schema.ts.
 */

export const ANALYTICS_EVENTS = Object.freeze({
  pageView: 'page_view',
  toolOpen: 'tool_open',
  fileSelected: 'file_selected',
  processingStart: 'processing_start',
  processingSuccess: 'processing_success',
  processingError: 'processing_error',
  downloadClick: 'download_click',
  consentUpdate: 'consent_update',
  adImpression: 'ad_impression',
} as const);

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export interface PageViewPayload {
  path: string;
  title: string;
}

export interface ToolOpenPayload {
  toolId: string;
}

export interface FileSelectedPayload {
  toolId: string;
  fileType: string;
  fileSizeBucket: string;
}

export interface ProcessingStartPayload {
  toolId: string;
  fileCount: number;
}

export interface ProcessingSuccessPayload {
  toolId: string;
  durationMs: number;
}

export interface ProcessingErrorPayload {
  toolId: string;
  reason: string;
}

export interface DownloadClickPayload {
  toolId: string;
}

export interface ConsentUpdatePayload {
  analytics: string;
  ads: string;
}

export interface AdImpressionPayload {
  slot: string;
}

export interface EventPayloadMap {
  page_view: PageViewPayload;
  tool_open: ToolOpenPayload;
  file_selected: FileSelectedPayload;
  processing_start: ProcessingStartPayload;
  processing_success: ProcessingSuccessPayload;
  processing_error: ProcessingErrorPayload;
  download_click: DownloadClickPayload;
  consent_update: ConsentUpdatePayload;
  ad_impression: AdImpressionPayload;
}
