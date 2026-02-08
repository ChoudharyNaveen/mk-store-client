import React from 'react';
import { showErrorToast } from '../utils/toast';

export interface UseDetailWithSummaryConfig<TEntity extends { id: number }, TSummary> {
  /** Route param id (e.g. from useParams) */
  id: string | undefined;
  /** Navigate function from useNavigate() */
  navigate: (path: string) => void;
  /** Path to redirect to when id is missing or fetch fails (e.g. '/brands') */
  redirectPath: string;
  /** Name for error toasts (e.g. 'brand', 'offer', 'promo code') */
  entityName: string;
  /** Fetch the main entity by id */
  fetchEntity: (id: string) => Promise<TEntity>;
  /** Optional: fetch summary by entity id (called after entity loads). If omitted, summary stays null. */
  fetchSummary?: (entityId: number) => Promise<TSummary>;
}

export interface UseDetailWithSummaryResult<TEntity, TSummary> {
  entity: TEntity | null;
  summary: TSummary | null;
  loading: boolean;
  summaryLoading: boolean;
}

/**
 * Reusable hook for detail pages that load an entity and optionally a summary.
 * Prevents double API call on mount (e.g. React Strict Mode) and ignores stale responses when id changes.
 */
export function useDetailWithSummary<TEntity extends { id: number }, TSummary>({
  id,
  navigate,
  redirectPath,
  entityName,
  fetchEntity,
  fetchSummary,
}: UseDetailWithSummaryConfig<TEntity, TSummary>): UseDetailWithSummaryResult<TEntity, TSummary> {
  const [entity, setEntity] = React.useState<TEntity | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [summary, setSummary] = React.useState<TSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = React.useState(false);
  const currentIdRef = React.useRef<string | null>(null);
  const fetchInFlightIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!id) {
      navigate(redirectPath);
      return;
    }
    const effectId = id;
    currentIdRef.current = id;
    if (fetchInFlightIdRef.current === id) return;
    fetchInFlightIdRef.current = id;

    let cancelled = false;
    setLoading(true);
    setSummary(null);
    fetchEntity(id)
      .then((data) => {
        if (cancelled) return;
        setEntity(data);
        setLoading(false);
        if (fetchSummary) {
          setSummaryLoading(true);
          return fetchSummary(data.id).catch(() => null);
        }
        return null;
      })
      .then((summaryData) => {
        if (cancelled) return;
        setSummary(summaryData ?? null);
      })
      .catch((error) => {
        if (!cancelled) {
          setLoading(false);
          console.error(`Error fetching ${entityName}:`, error);
          showErrorToast(`Failed to load ${entityName} details`);
          navigate(redirectPath);
        }
      })
      .finally(() => {
        if (!cancelled) setSummaryLoading(false);
      });
    return () => {
      cancelled = currentIdRef.current !== effectId;
    };
  }, [id, navigate, redirectPath, entityName, fetchEntity, fetchSummary]);

  return { entity, summary, loading, summaryLoading };
}
