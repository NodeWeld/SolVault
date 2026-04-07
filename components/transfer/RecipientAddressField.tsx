"use client";

import { useId, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRecipientBookStore } from "@/store/recipientBookStore";
import { ChevronDown, UserPlus } from "lucide-react";

function validateRecipient(input: string): string | null {
  const t = input.trim();
  if (!t) return "Recipient is required";
  try {
    new PublicKey(t);
    return null;
  } catch {
    return "Invalid recipient address";
  }
}

interface RecipientAddressFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Called after user picks or types; use to clear parent error */
  onClearError?: () => void;
}

export function RecipientAddressField({
  id,
  label,
  value,
  onChange,
  placeholder = "Wallet address",
  disabled,
  onClearError,
}: RecipientAddressFieldProps) {
  const listId = useId();
  const recipients = useRecipientBookStore((s) => s.recipients);
  const upsert = useRecipientBookStore((s) => s.upsertRecipient);
  const remove = useRecipientBookStore((s) => s.removeRecipient);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveLabel, setSaveLabel] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const canSave = !validateRecipient(value);

  function applySaved(addr: string) {
    onChange(addr);
    onClearError?.();
    setPickerOpen(false);
  }

  function handleSave() {
    if (!canSave) return;
    upsert(value.trim(), saveLabel);
    setSaveLabel("");
    setSaveOpen(false);
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {recipients.length > 0 ? (
          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground"
              disabled={disabled}
              aria-expanded={pickerOpen}
              aria-haspopup="listbox"
              onClick={() => setPickerOpen((o) => !o)}
            >
              Saved
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </Button>
            {pickerOpen ? (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40 cursor-default"
                  aria-label="Close saved recipients"
                  onClick={() => setPickerOpen(false)}
                />
                <ul
                  role="listbox"
                  className="absolute right-0 z-50 mt-1 max-h-40 min-w-[12rem] overflow-auto rounded-md border border-border-subtle bg-[#0c101a] py-1 text-left text-xs shadow-lg"
                >
                  {recipients.map((r) => (
                    <li key={r.address} className="flex items-stretch gap-0 border-b border-border-subtle/50 last:border-0">
                      <button
                        type="button"
                        role="option"
                        aria-selected={false}
                        className="flex min-w-0 flex-1 flex-col px-2 py-1.5 text-left hover:bg-white/5"
                        onClick={() => applySaved(r.address)}
                      >
                        <span className="truncate font-medium text-foreground">{r.label}</span>
                        <span className="truncate font-mono text-[10px] text-muted-foreground">
                          {r.address.slice(0, 4)}…{r.address.slice(-4)}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="shrink-0 px-2 text-[10px] text-red-400/90 hover:bg-red-950/40"
                        onClick={() => remove(r.address)}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
      <Input
        id={id}
        className="font-mono text-xs"
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        list={recipients.length ? listId : undefined}
        onChange={(e) => {
          onChange(e.target.value);
          onClearError?.();
        }}
      />
      {recipients.length > 0 ? (
        <datalist id={listId}>
          {recipients.map((r) => (
            <option key={r.address} value={r.address}>
              {r.label}
            </option>
          ))}
        </datalist>
      ) : null}
      {canSave ? (
        <div className="space-y-2">
          {!saveOpen ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-0 text-xs text-solana-green/80 hover:text-solana-green"
              disabled={disabled}
              onClick={() => setSaveOpen(true)}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Save to address book
            </Button>
          ) : (
            <div className="flex flex-wrap items-end gap-2 rounded-md border border-blue-800/40 bg-blue-950/30 p-2">
              <div className="min-w-[8rem] flex-1">
                <Label htmlFor={`${id}-save-label`} className="text-[10px] text-muted-foreground">
                  Label
                </Label>
                <Input
                  id={`${id}-save-label`}
                  className="mt-0.5 h-8 text-xs"
                  placeholder="e.g. Exchange hot"
                  value={saveLabel}
                  onChange={(e) => setSaveLabel(e.target.value)}
                />
              </div>
              <Button type="button" size="sm" className="h-8" onClick={handleSave}>
                Save
              </Button>
              <Button type="button" size="sm" variant="ghost" className="h-8" onClick={() => setSaveOpen(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
