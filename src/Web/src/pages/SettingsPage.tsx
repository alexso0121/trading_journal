import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createApiClient } from '../lib/apiClient';
import { useAuth } from '../providers/AuthProvider';
import { useToast } from '../components/ToastProvider';
import type { ChecklistConfigItem } from '../types/models';

export const SettingsPage = () => {
  const { getToken } = useAuth();
  const api = useMemo(() => createApiClient(getToken), [getToken]);
  const toast = useToast();

  const [items, setItems] = useState<ChecklistConfigItem[]>([]);
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const loadItems = async () => {
    setLoading(true);
    try {
      const loaded = await api.getChecklistSettings();
      setItems(loaded.sort((a, b) => a.sequence - b.sequence));
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Failed to load checklist settings.',
        'Settings'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) {
      toast.warning('Checklist item label is required.', 'Settings');
      return;
    }

    setSaving(true);
    try {
      const created = await api.createChecklistSetting({ label: trimmed });
      setItems((prev) => [...prev, created].sort((a, b) => a.sequence - b.sequence));
      setLabel('');
      toast.success('Checklist item added.', 'Settings');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add checklist item.', 'Settings');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (item: ChecklistConfigItem) => {
    const confirmed = await toast.confirm({
      title: 'Delete checklist item',
      message: `Delete "${item.label}" from checklist settings?`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });

    if (!confirmed) {
      return;
    }

    try {
      await api.deleteChecklistSetting(item.id);
      await loadItems();
      toast.success('Checklist item deleted.', 'Settings');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete checklist item.', 'Settings');
    }
  };

  const moveItem = (targetId: string) => {
    if (!draggingId || draggingId === targetId) {
      return;
    }

    setItems((previous) => {
      const sourceIndex = previous.findIndex((item) => item.id === draggingId);
      const targetIndex = previous.findIndex((item) => item.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) {
        return previous;
      }

      const reordered = [...previous];
      const [moved] = reordered.splice(sourceIndex, 1);
      reordered.splice(targetIndex, 0, moved);

      return reordered.map((item, index) => ({
        ...item,
        sequence: index + 1,
      }));
    });
  };

  const persistOrder = async (orderedItems: ChecklistConfigItem[]) => {
    setReordering(true);
    try {
      await api.reorderChecklistSettings({ itemIds: orderedItems.map((item) => item.id) });
      toast.success('Checklist order updated.', 'Settings');
      await loadItems();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save checklist order.', 'Settings');
      await loadItems();
    } finally {
      setReordering(false);
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="mt-1 text-sm text-slate-600">
          Configure your Daily Journal checklist items and order.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <form className="flex gap-2" onSubmit={onCreate}>
          <input
            type="text"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Add checklist item"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            disabled={saving || reordering}
          >
            Add
          </button>
        </form>

        <div className="mt-4 space-y-2">
          {loading ? <p className="text-sm text-slate-500">Loading checklist...</p> : null}
          {!loading && items.length === 0 ? (
            <p className="text-sm text-slate-500">No checklist items yet.</p>
          ) : null}

          {items.map((item) => (
            <div
              key={item.id}
              draggable={!reordering}
              onDragStart={() => {
                if (reordering) {
                  return;
                }
                setDraggingId(item.id);
              }}
              onDragOver={(event) => {
                event.preventDefault();
              }}
              onDragEnter={() => {
                if (!reordering) {
                  moveItem(item.id);
                }
              }}
              onDragEnd={() => {
                const ordered = [...items];
                setDraggingId(null);
                if (ordered.length > 0) {
                  void persistOrder(ordered);
                }
              }}
              className={`flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 ${reordering ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-slate-400">::</span>
                <span className="text-sm text-slate-800">{item.label}</span>
              </div>
              <button
                type="button"
                className="rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                disabled={reordering}
                onClick={() => {
                  void onDelete(item);
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
