"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

type RedeemedTicket = {
  id: string;
  dish_name: string;
  qty: number;
  counter: string;
};

export default function ScanPage() {
  const { toast } = useToast();
  const [lastRedeemed, setLastRedeemed] = useState<RedeemedTicket | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [processing, setProcessing] = useState(false);
  // The scanner fires ~10 times a second while a code is in view, so in-flight state lives
  // in a ref (the camera callback is registered once and would otherwise see stale state).
  const processingRef = useRef(false);
  const lastPayloadRef = useRef<{ payload: string; at: number } | null>(null);

  async function handleRedeem(payload: string) {
    const now = Date.now();
    const last = lastPayloadRef.current;
    if (processingRef.current || (last && last.payload === payload && now - last.at < 5000)) return;
    processingRef.current = true;
    lastPayloadRef.current = { payload, at: now };
    setProcessing(true);
    setErrorMsg(null);

    try {
      const res = await api<{ ok: boolean; ticket: RedeemedTicket }>("/api/scan", {
        method: "POST",
        body: JSON.stringify({ payload }),
      });
      setLastRedeemed(res.ticket);
      toast(`Redeemed: ${res.ticket.dish_name} × ${res.ticket.qty}`, "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to redeem QR ticket";
      setLastRedeemed(null);
      setErrorMsg(message);
      toast(message, "error");
    } finally {
      setTimeout(() => {
        processingRef.current = false;
        setProcessing(false);
      }, 1500);
    }
  }

  const handleRedeemRef = useRef(handleRedeem);
  useEffect(() => {
    handleRedeemRef.current = handleRedeem;
  });

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        void handleRedeemRef.current(decodedText);
      },
      () => {
        // Per-frame "no QR found" errors are expected; ignore them.
      }
    );

    return () => {
      scanner.clear().catch((err) => console.error("Error clearing scanner", err));
    };
  }, []);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Counter Ticket Scanner</h2>
        <p className="text-sm text-zinc-500">Scan student rotating QR codes to fulfill orders</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div id="qr-reader" className="overflow-hidden rounded-lg" />
        </CardContent>
      </Card>

      {/* Manual Input Fallback */}
      <Card>
        <CardContent className="p-4">
          <h4 className="mb-2 text-sm font-semibold">Manual Code Entry</h4>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manualCode) handleRedeem(manualCode);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Paste raw QR token payload..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
            <Button type="submit" disabled={processing || !manualCode}>
              Redeem
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Result Display */}
      {lastRedeemed && (
        <div className="rounded-xl border border-green-300 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-950/30">
          <span className="text-4xl">🎉</span>
          <h3 className="mt-2 text-xl font-bold text-green-900 dark:text-green-100">
            Dispense {lastRedeemed.qty} × {lastRedeemed.dish_name}
          </h3>
          <p className="text-sm text-green-700 dark:text-green-300">
            Counter: {lastRedeemed.counter} · Ticket #{lastRedeemed.id.slice(0, 8)} verified and redeemed!
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-950/30">
          <p className="font-semibold text-red-800 dark:text-red-200">{errorMsg}</p>
        </div>
      )}
    </div>
  );
}
