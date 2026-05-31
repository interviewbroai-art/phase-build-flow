// Browser helper to load Razorpay Checkout script once.

declare global {
  interface Window {
    Razorpay?: any;
  }
}

let loadingPromise: Promise<void> | null = null;

export function loadRazorpay(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Razorpay) return Promise.resolve();
  if (loadingPromise) return loadingPromise;
  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadingPromise = null;
      reject(new Error("Failed to load Razorpay checkout"));
    };
    document.body.appendChild(script);
  });
  return loadingPromise;
}

export type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  method?: string;
};

export function openRazorpayCheckout(opts: {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefillEmail?: string;
  prefillName?: string;
  onSuccess: (resp: RazorpayHandlerResponse) => void;
  onDismiss?: () => void;
}) {
  if (!window.Razorpay) throw new Error("Razorpay not loaded");
  const rzp = new window.Razorpay({
    key: opts.keyId,
    amount: opts.amount,
    currency: opts.currency,
    name: opts.name,
    description: opts.description,
    order_id: opts.orderId,
    handler: (resp: RazorpayHandlerResponse) => opts.onSuccess(resp),
    prefill: {
      email: opts.prefillEmail,
      name: opts.prefillName,
    },
    theme: { color: "#7c5cff" },
    method: {
      upi: true,
      card: true,
      netbanking: true,
      wallet: true,
    },
    modal: {
      ondismiss: () => opts.onDismiss?.(),
    },
  });
  rzp.on("payment.failed", (resp: any) => {
    console.error("Razorpay payment failed:", resp);
  });
  rzp.open();
}
