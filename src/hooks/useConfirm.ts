"use client";

import { useState, useCallback, useRef } from "react";

interface ConfirmOptions {
  title:       string;
  description: string;
  confirmLabel?: string;
  cancelLabel?:  string;
  destructive?:  boolean;
}

interface ConfirmState extends ConfirmOptions {
  open:    boolean;
  resolve: ((confirmed: boolean) => void) | null;
}

/**
 * Imperative confirmation dialog hook.
 *
 * Usage:
 * ```tsx
 * const { confirm, ConfirmDialog } = useConfirm();
 *
 * const handleDelete = async () => {
 *   const ok = await confirm({
 *     title: "Delete user?",
 *     description: "This cannot be undone.",
 *     destructive: true,
 *   });
 *   if (ok) deleteUser();
 * };
 *
 * return (
 *   <>
 *     <button onClick={handleDelete}>Delete</button>
 *     <ConfirmDialog />
 *   </>
 * );
 * ```
 */
export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({
    open:         false,
    title:        "",
    description:  "",
    confirmLabel: "Confirm",
    cancelLabel:  "Cancel",
    destructive:  false,
    resolve:      null,
  });

  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({
        ...options,
        open:    true,
        resolve: resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    setState((s) => ({ ...s, open: false }));
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false);
    setState((s) => ({ ...s, open: false }));
  }, []);

  return { confirm, confirmState: state, handleConfirm, handleCancel };
}