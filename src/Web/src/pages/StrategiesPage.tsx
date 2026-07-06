import { useEffect, useMemo, useState } from 'react';
import { DataTable } from 'mantine-datatable';
import 'mantine-datatable/styles.css';
import { Dialog } from '../components/Dialog';
import { StrategyRichTextEditor } from '../components/StrategyRichTextEditor';
import { ApiError, createApiClient } from '../lib/apiClient';
import { useAuth } from '../providers/AuthProvider';
import type { Strategy } from '../types/models';

type PaginationState = {
  pageIndex: number;
  pageSize: number;
};

type StrategyFormState = {
  name: string;
  description: string;
  tags: string[];
  tagInput: string;
};

const emptyForm: StrategyFormState = { name: '', description: '', tags: [], tagInput: '' };

const normalizeTag = (value: string) => value.trim().toLowerCase();

export const StrategiesPage = () => {
  const { getToken } = useAuth();
  const api = useMemo(() => createApiClient(getToken), [getToken]);

  const [items, setItems] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalCount, setTotalCount] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createForm, setCreateForm] = useState<StrategyFormState>(emptyForm);
  const [editForm, setEditForm] = useState<StrategyFormState>(emptyForm);
  const [editing, setEditing] = useState<Strategy | null>(null);
  const [createDraftStrategy, setCreateDraftStrategy] = useState<Strategy | null>(null);

  const appendTag = (form: StrategyFormState): StrategyFormState => {
    const candidate = form.tagInput.trim();
    if (!candidate) {
      return form;
    }

    if (form.tags.length >= 20) {
      return form;
    }

    if (form.tags.some((tag) => normalizeTag(tag) === normalizeTag(candidate))) {
      return { ...form, tagInput: '' };
    }

    return { ...form, tags: [...form.tags, candidate], tagInput: '' };
  };

  const removeTagAt = (form: StrategyFormState, index: number): StrategyFormState => ({
    ...form,
    tags: form.tags.filter((_, i) => i !== index),
  });

  const loadData = async (
    targetPage = pagination.pageIndex + 1,
    targetPageSize = pagination.pageSize
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getStrategies({
        pageNumber: targetPage,
        pageSize: targetPageSize,
      });
      setItems(response.items);
      setTotalCount(response.totalCount);
      setPagination((prev) => {
        const nextPageIndex = Math.max(0, response.pageNumber - 1);
        const nextPageSize = response.pageSize;
        if (prev.pageIndex === nextPageIndex && prev.pageSize === nextPageSize) {
          return prev;
        }
        return {
          pageIndex: nextPageIndex,
          pageSize: nextPageSize,
        };
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load strategies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData(pagination.pageIndex + 1, pagination.pageSize);
  }, [pagination.pageIndex, pagination.pageSize]);

  const onCreate = async () => {
    if (!createForm.name.trim()) {
      setError('Name is required.');
      return;
    }

    setError(null);
    try {
      const tags = appendTag(createForm).tags;

      if (createDraftStrategy) {
        await api.updateStrategy(createDraftStrategy.id, {
          name: createForm.name.trim(),
          description: createForm.description.trim(),
          tags,
          lastKnownVersion: createDraftStrategy.version,
        });
      } else {
        await api.createStrategy({
          name: createForm.name.trim(),
          description: createForm.description.trim(),
          tags,
        });
      }

      setCreateDraftStrategy(null);
      setCreateForm(emptyForm);
      setCreateOpen(false);
      setPagination((prev) => (prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }));
      await loadData(1, pagination.pageSize);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create strategy.');
    }
  };

  const onDelete = async (strategy: Strategy) => {
    if (!window.confirm(`Delete strategy "${strategy.name}"?`)) {
      return;
    }

    setError(null);
    try {
      await api.deleteStrategy(strategy.id, strategy.version);
      await loadData(pagination.pageIndex + 1, pagination.pageSize);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setError('Conflict: strategy changed on server. Refresh and try again.');
        return;
      }
      setError(e instanceof Error ? e.message : 'Failed to delete strategy.');
    }
  };

  const startEdit = (strategy: Strategy) => {
    setEditing(strategy);
    setEditForm({
      name: strategy.name,
      description: strategy.description,
      tags: strategy.tags.map((tag) => tag.name),
      tagInput: '',
    });
    setEditOpen(true);
  };

  const onUpdate = async () => {
    if (!editing) {
      return;
    }

    if (!editForm.name.trim()) {
      setError('Name is required.');
      return;
    }

    setError(null);
    try {
      const updated = await api.updateStrategy(editing.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        tags: editForm.tags,
        lastKnownVersion: editing.version,
      });
      setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditOpen(false);
      setEditing(null);
      await loadData(pagination.pageIndex + 1, pagination.pageSize);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setError('Conflict: strategy changed on server. Refresh and try again.');
        return;
      }
      setError(e instanceof Error ? e.message : 'Failed to update strategy.');
    }
  };

  const uploadStrategyEditorImage = async (file: File): Promise<string> => {
    if (!editing) {
      throw new Error('Save strategy first before uploading images.');
    }

    const uploadInfo = await api.createStrategyContentImageUploadUrl(editing.id, {
      fileName: file.name,
      contentType: file.type,
    });

    await api.uploadFileToPresignedUrl(uploadInfo.uploadUrl, file);
    return uploadInfo.downloadUrl;
  };

  const uploadCreateStrategyEditorImage = async (file: File): Promise<string> => {
    let draft = createDraftStrategy;

    if (!draft) {
      if (!createForm.name.trim()) {
        throw new Error('Enter a strategy name before uploading images.');
      }

      const normalized = appendTag(createForm);
      const created = await api.createStrategy({
        name: normalized.name.trim(),
        description: normalized.description.trim(),
        tags: normalized.tags,
      });

      setCreateForm((prev) => ({
        ...prev,
        tags: normalized.tags,
        tagInput: '',
      }));

      setCreateDraftStrategy(created);
      draft = created;
    }

    const uploadInfo = await api.createStrategyContentImageUploadUrl(draft.id, {
      fileName: file.name,
      contentType: file.type,
    });

    await api.uploadFileToPresignedUrl(uploadInfo.uploadUrl, file);
    return uploadInfo.downloadUrl;
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Strategies</h2>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
            onClick={() => setCreateOpen(true)}
          >
            New strategy
          </button>
          <button
            type="button"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
            onClick={() => {
              void loadData(pagination.pageIndex + 1, pagination.pageSize);
            }}
          >
            Refresh
          </button>
        </div>
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
          totalRecords={totalCount}
          recordsPerPage={pagination.pageSize}
          page={pagination.pageIndex + 1}
          onPageChange={(page) => {
            setPagination((prev) => ({ ...prev, pageIndex: page - 1 }));
          }}
          recordsPerPageOptions={[10, 20, 50]}
          onRecordsPerPageChange={(pageSize) => {
            setPagination({ pageIndex: 0, pageSize });
          }}
          columns={[
            {
              accessor: 'name',
              title: 'Name',
            },

            {
              accessor: 'tags',
              title: 'Tags',
              render: (strategy) =>
                strategy.tags.length === 0 ? (
                  <span className="text-slate-400">-</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {strategy.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                ),
            },

            {
              accessor: 'tradesCount',
              title: 'Trades',
              render: (strategy) => strategy.trades.length,
            },
            {
              accessor: 'actions',
              title: '',
              render: (strategy) => (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-100"
                    onClick={() => startEdit(strategy)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded border border-red-300 px-2 py-1 text-red-700 hover:bg-red-50"
                    onClick={() => {
                      void onDelete(strategy);
                    }}
                  >
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
        />
      </div>

      <Dialog
        open={createOpen}
        title="Create strategy"
        onClose={() => {
          setCreateOpen(false);
          setCreateDraftStrategy(null);
          setCreateForm(emptyForm);
        }}
      >
        <div className="space-y-3">
          <input
            placeholder="Strategy name"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={createForm.name}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <textarea hidden value={createForm.description} onChange={() => {}} />
          <StrategyRichTextEditor
            value={createForm.description}
            onChange={(description) => setCreateForm((prev) => ({ ...prev, description }))}
            onImageUpload={uploadCreateStrategyEditorImage}
            placeholder="Rich text strategy notes"
          />
          <div className="space-y-2">
            <input
              placeholder="Add tags and press Enter"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={createForm.tagInput}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, tagInput: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  setCreateForm((prev) => appendTag(prev));
                }
                if (e.key === 'Backspace' && !createForm.tagInput && createForm.tags.length > 0) {
                  setCreateForm((prev) => removeTagAt(prev, prev.tags.length - 1));
                }
              }}
            />
            <div className="flex flex-wrap gap-2">
              {createForm.tags.map((tag, index) => (
                <button
                  key={`${tag}-${index}`}
                  type="button"
                  className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs hover:bg-slate-100"
                  onClick={() => setCreateForm((prev) => removeTagAt(prev, index))}
                >
                  {tag} x
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
            onClick={() => {
              void onCreate();
            }}
          >
            Save
          </button>
        </div>
      </Dialog>

      <Dialog
        open={editOpen}
        title={`Edit strategy${editing ? `: ${editing.name}` : ''}`}
        onClose={() => {
          setEditOpen(false);
          setEditing(null);
        }}
      >
        <div className="space-y-3">
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={editForm.name}
            onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <textarea hidden value={editForm.description} onChange={() => {}} />
          <StrategyRichTextEditor
            value={editForm.description}
            onChange={(description) => setEditForm((prev) => ({ ...prev, description }))}
            onImageUpload={uploadStrategyEditorImage}
            placeholder="Rich text strategy notes"
          />
          <div className="space-y-2">
            <input
              placeholder="Add tags and press Enter"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={editForm.tagInput}
              onChange={(e) => setEditForm((prev) => ({ ...prev, tagInput: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  setEditForm((prev) => appendTag(prev));
                }
                if (e.key === 'Backspace' && !editForm.tagInput && editForm.tags.length > 0) {
                  setEditForm((prev) => removeTagAt(prev, prev.tags.length - 1));
                }
              }}
            />
            <div className="flex flex-wrap gap-2">
              {editForm.tags.map((tag, index) => (
                <button
                  key={`${tag}-${index}`}
                  type="button"
                  className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs hover:bg-slate-100"
                  onClick={() => setEditForm((prev) => removeTagAt(prev, index))}
                >
                  {tag} x
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
            onClick={() => {
              void onUpdate();
            }}
          >
            Update
          </button>
        </div>
      </Dialog>
    </section>
  );
};
