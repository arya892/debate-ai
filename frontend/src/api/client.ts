import {
  DebateRecord,
  DebateSettings,
  DebateListResponse,
  HealthStatus,
  StreamEvent
} from '../types/debate';

const API_BASE = '/api';

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function createDebate(topic: string, settings: DebateSettings): Promise<DebateRecord> {
  const res = await fetch(`${API_BASE}/debates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, settings }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to start debate generation');
  }
  return res.json();
}

export async function getDebate(id: string): Promise<DebateRecord> {
  const res = await fetch(`${API_BASE}/debates/${id}`);
  if (!res.ok) throw new Error('Failed to load debate');
  return res.json();
}

export async function listDebates(
  page: number = 1,
  limit: number = 10,
  search?: string
): Promise<DebateListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search && search.trim()) {
    params.set('search', search.trim());
  }
  const res = await fetch(`${API_BASE}/debates?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to load history');
  return res.json();
}

export async function deleteDebate(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/debates/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete debate');
}

export async function regenerateDebate(
  id: string,
  settings: DebateSettings
): Promise<DebateRecord> {
  const res = await fetch(`${API_BASE}/debates/${id}/regenerate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ settings }),
  });
  if (!res.ok) throw new Error('Failed to regenerate debate');
  return res.json();
}

export function getExportUrl(id: string, format: 'pdf' | 'md'): string {
  return `${API_BASE}/debates/${id}/export?format=${format}`;
}

export function connectDebateStream(
  debateId: string,
  onEvent: (event: StreamEvent) => void,
  onError?: (err: any) => void
): () => void {
  const eventSource = new EventSource(`${API_BASE}/debates/${debateId}/stream`);

  eventSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onEvent(data);
    } catch (err) {
      console.error('Failed to parse SSE event data', err);
    }
  };

  eventSource.onerror = (err) => {
    if (onError) onError(err);
    eventSource.close();
  };

  return () => {
    eventSource.close();
  };
}

