import { Button, Select, TextInput, Textarea } from '@mantine/core';
import { Dialog } from './Dialog';
import type { Strategy } from '../types/models';

export type TradeCreateFormState = {
  strategyId: string;
  ticker: string;
  market: string;
  asset: number;
  direction: number;
  entryPrice: string;
  quantity: string;
  pnl: string;
  comments: string;
  openTimeUtc: string;
};

export const emptyTradeCreateForm: TradeCreateFormState = {
  strategyId: '',
  ticker: '',
  market: '',
  asset: 1,
  direction: 1,
  entryPrice: '',
  quantity: '',
  pnl: '0',
  comments: '',
  openTimeUtc: '',
};

type Props = {
  open: boolean;
  title: string;
  strategies: Strategy[];
  form: TradeCreateFormState;
  creating: boolean;
  onChange: (updater: (previous: TradeCreateFormState) => TradeCreateFormState) => void;
  onClose: () => void;
  onSave: () => void;
};

export const CreateTradeDialog = ({
  open,
  title,
  strategies,
  form,
  creating,
  onChange,
  onClose,
  onSave,
}: Props) => {
  return (
    <Dialog open={open} title={title} onClose={onClose}>
      <div className="grid gap-2 md:grid-cols-2">
        <Select
          label="Strategy"
          placeholder="Select strategy"
          value={form.strategyId}
          data={strategies.map((strategy) => ({ value: strategy.id, label: strategy.name }))}
          onChange={(value) => onChange((previous) => ({ ...previous, strategyId: value ?? '' }))}
        />
        <TextInput
          label="Ticker"
          placeholder="Ticker"
          value={form.ticker}
          onChange={(event) =>
            onChange((previous) => ({ ...previous, ticker: event.target.value }))
          }
        />
        <TextInput
          label="Market"
          placeholder="Market"
          value={form.market}
          onChange={(event) =>
            onChange((previous) => ({ ...previous, market: event.target.value }))
          }
        />
        <Select
          label="Asset"
          value={String(form.asset)}
          data={[
            { value: '1', label: 'Stock' },
            { value: '2', label: 'Future' },
            { value: '3', label: 'Contract' },
            { value: '4', label: 'Crypto' },
            { value: '5', label: 'Forex' },
          ]}
          onChange={(value) => onChange((previous) => ({ ...previous, asset: Number(value ?? '1') }))}
        />
        <Select
          label="Direction"
          value={String(form.direction)}
          data={[
            { value: '1', label: 'Long' },
            { value: '2', label: 'Short' },
          ]}
          onChange={(value) =>
            onChange((previous) => ({ ...previous, direction: Number(value ?? '1') }))
          }
        />
        <TextInput
          label="Entry price"
          type="number"
          step="0.000001"
          placeholder="Entry price"
          value={form.entryPrice}
          onChange={(event) =>
            onChange((previous) => ({ ...previous, entryPrice: event.target.value }))
          }
        />
        <TextInput
          label="Quantity"
          type="number"
          step="0.000001"
          placeholder="Quantity"
          value={form.quantity}
          onChange={(event) =>
            onChange((previous) => ({ ...previous, quantity: event.target.value }))
          }
        />
        <TextInput
          label="PnL"
          type="number"
          step="0.000001"
          placeholder="PnL"
          value={form.pnl}
          onChange={(event) => onChange((previous) => ({ ...previous, pnl: event.target.value }))}
        />
        <TextInput
          label="Open time"
          type="datetime-local"
          value={form.openTimeUtc}
          onChange={(event) =>
            onChange((previous) => ({ ...previous, openTimeUtc: event.target.value }))
          }
        />
        <Textarea
          label="Comments"
          className="md:col-span-2"
          placeholder="Comments"
          value={form.comments}
          onChange={(event) =>
            onChange((previous) => ({ ...previous, comments: event.target.value }))
          }
        />
      </div>
      <div className="mt-3">
        <Button
          variant="filled"
          color="dark"
          onClick={onSave}
          disabled={creating}
        >
          {creating ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </Dialog>
  );
};
