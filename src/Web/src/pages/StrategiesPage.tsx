import { useEffect, useMemo, useState } from 'react';
import { Button, TextInput } from '@mantine/core';
import { DataTable } from 'mantine-datatable';
import 'mantine-datatable/styles.css';
import { Dialog } from '../components/Dialog';
import { StrategyRichTextEditor } from '../components/StrategyRichTextEditor';
import { ApiError, createApiClient } from '../lib/apiClient';
import {
  extractStoredFileIds,
  normalizeStoredFileContentForSave,
  resolveStoredFileContent,
} from '../lib/storedFileContent';
import { useToast } from '../components/ToastProvider';
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
  const toast = useToast();

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
  const [pendingCreateFileIds, setPendingCreateFileIds] = useState<string[]>([]);
  const [pendingEditFileIds, setPendingEditFileIds] = useState<string[]>([]);

  useEffect(() => {
    if (!error) {
      return;
    }

    toast.error(error, 'Strategies');
    setError(null);
  }, [error, toast]);

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

      const created = await api.createStrategy({
        name: createForm.name.trim(),
        description: normalizeStoredFileContentForSave(createForm.description.trim()),
        tags,
      });

      if (pendingCreateFileIds.length > 0) {
        await api.finalizeStrategyFiles(created.id, {
          fileIds: pendingCreateFileIds,
        });
      }

      setPendingCreateFileIds([]);
      setCreateForm(emptyForm);
      setCreateOpen(false);
      setPagination((prev) => (prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }));
      await loadData(1, pagination.pageSize);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create strategy.');
    }
  };

  const onDelete = async (strategy: Strategy) => {
    const confirmed = await toast.confirm({
      title: 'Delete strategy',
      message: `Delete strategy "${strategy.name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });

    if (!confirmed) {
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

  const startEdit = async (strategy: Strategy) => {
    const fileIds = extractStoredFileIds(strategy.description);
    let resolvedDescription = strategy.description;

    if (fileIds.length > 0) {
      const resolved = await api.resolveStoredFiles({ fileIds });
      const resolvedUrls = new Map(
        resolved.items.map((item) => [item.fileId, item.downloadUrl] as const)
      );
      resolvedDescription = resolveStoredFileContent(strategy.description, resolvedUrls);
    }

    setEditing(strategy);
    setEditForm({
      name: strategy.name,
      description: resolvedDescription,
      tags: strategy.tags.map((tag) => tag.name),
      tagInput: '',
    });
    setPendingEditFileIds([]);
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
        description: normalizeStoredFileContentForSave(editForm.description.trim()),
        tags: editForm.tags,
        lastKnownVersion: editing.version,
      });

      if (pendingEditFileIds.length > 0) {
        await api.finalizeStrategyFiles(editing.id, {
          fileIds: pendingEditFileIds,
        });
      }

      setPendingEditFileIds([]);
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

  const uploadStrategyEditorImage = async (
    file: File
  ): Promise<{ src: string; fileId: string }> => {
    const uploadInfo = await api.createStrategyContentTempFileUploadUrl({
      fileName: file.name,
      contentType: file.type,
    });

    await api.uploadFileToPresignedUrl(uploadInfo.uploadUrl, file);
    setPendingEditFileIds((prev) =>
      prev.includes(uploadInfo.fileId) ? prev : [...prev, uploadInfo.fileId]
    );
    return { src: uploadInfo.downloadUrl, fileId: uploadInfo.fileId };
  };

  const uploadCreateStrategyEditorImage = async (
    file: File
  ): Promise<{ src: string; fileId: string }> => {
    const uploadInfo = await api.createStrategyContentTempFileUploadUrl({
      fileName: file.name,
      contentType: file.type,
    });

    await api.uploadFileToPresignedUrl(uploadInfo.uploadUrl, file);
    setPendingCreateFileIds((prev) =>
      prev.includes(uploadInfo.fileId) ? prev : [...prev, uploadInfo.fileId]
    );
    return { src: uploadInfo.downloadUrl, fileId: uploadInfo.fileId };
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
                    onClick={() => {
                      void startEdit(strategy);
                    }}
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
          setPendingCreateFileIds([]);
          setCreateForm(emptyForm);
        }}
      >
        <div className="space-y-3">
          <TextInput
            label="Strategy name"
            placeholder="Strategy name"
            value={createForm.name}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <StrategyRichTextEditor
            value={createForm.description}
            onChange={(description) => setCreateForm((prev) => ({ ...prev, description }))}
            onImageUpload={uploadCreateStrategyEditorImage}
            placeholder="Rich text strategy notes"
          />
          <div className="space-y-2">
            <TextInput
              label="Tags"
              placeholder="Add tags and press Enter"
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
          <Button
            variant="filled"
            color="dark"
            onClick={() => {
              void onCreate();
            }}
          >
            Save
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={editOpen}
        title={`Edit strategy${editing ? `: ${editing.name}` : ''}`}
        onClose={() => {
          setEditOpen(false);
          setEditing(null);
          setPendingEditFileIds([]);
        }}
      >
        <div className="space-y-3">
          <TextInput
            label="Strategy name"
            value={editForm.name}
            onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <StrategyRichTextEditor
            value={editForm.description}
            onChange={(description) => setEditForm((prev) => ({ ...prev, description }))}
            onImageUpload={uploadStrategyEditorImage}
            placeholder="Rich text strategy notes"
          />
          <div className="space-y-2">
            <TextInput
              label="Tags"
              placeholder="Add tags and press Enter"
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
          <Button
            variant="filled"
            color="dark"
            onClick={() => {
              void onUpdate();
            }}
          >
            Update
          </Button>
        </div>
      </Dialog>
    </section>
  );
};
