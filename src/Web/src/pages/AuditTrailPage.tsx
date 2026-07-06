import { useEffect, useMemo, useState } from 'react';
import { DataTable } from 'mantine-datatable';
import 'mantine-datatable/styles.css';
import { createApiClient } from '../lib/apiClient';
import { useAuth } from '../providers/AuthProvider';
import type { AuditLog } from '../types/models';

const trimPayload = (payloadJson: string) => {
  if (payloadJson.length <= 180) {
    return payloadJson;
  }
  return `${payloadJson.slice(0, 180)}...`;
};

export const AuditTrailPage = () => {
  const { getToken } = useAuth();
  const api = useMemo(() => createApiClient(getToken), [getToken]);

  const [items, setItems] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);

  const loadData = async (targetPage = page, targetPageSize = recordsPerPage) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getAuditLogs({
        pageNumber: targetPage,
        pageSize: targetPageSize,
      });
      setItems(response.items);
      setTotalRecords(response.totalCount);
      if (response.pageNumber !== page) {
        setPage(response.pageNumber);
      }
      if (response.pageSize !== recordsPerPage) {
        setRecordsPerPage(response.pageSize);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load audit trail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData(page, recordsPerPage);
  }, [page, recordsPerPage]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Audit Trail</h2>
        <button
          type="button"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
          onClick={() => {
            void loadData(page, recordsPerPage);
          }}
        >
          Refresh
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-600">Loading...</p> : null}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <DataTable
          withTableBorder
          highlightOnHover
          striped
          records={items}
          fetching={loading}
          totalRecords={totalRecords}
          recordsPerPage={recordsPerPage}
          page={page}
          onPageChange={setPage}
          recordsPerPageOptions={[20, 50, 100]}
          onRecordsPerPageChange={(value) => {
            setRecordsPerPage(value);
            setPage(1);
          }}
          columns={[
            {
              accessor: 'occurredAtUtc',
              title: 'Time',
              render: (item) => new Date(item.occurredAtUtc).toLocaleString(),
            },
            {
              accessor: 'entity',
              title: 'Entity',
              render: (item) => (
                <div>
                  <div>{item.entityType}</div>
                  <div className="text-xs text-slate-500">{item.entityId}</div>
                </div>
              ),
            },
            {
              accessor: 'eventType',
              title: 'Event',
            },
            {
              accessor: 'version',
              title: 'Version',
              render: (item) => item.version ?? '-',
            },
            {
              accessor: 'payloadJson',
              title: 'Payload',
              render: (item) => (
                <code className="text-xs text-slate-700">{trimPayload(item.payloadJson)}</code>
              ),
            },
          ]}
        />
      </div>
    </section>
  );
};
