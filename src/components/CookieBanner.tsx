import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { Cookie, X } from "lucide-react";

const KEY = "ibai_cookie_consent_v1";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* ignore */
    }
  }, []);

  const set = (value: "accepted" | "essential" | "dismissed") => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ value, ts: Date.now() }));
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-[60] md:max-w-md"
          role="dialog"
          aria-label="Cookie consent"
        >
          <div className="clay p-5 relative">
            <button
              type="button"
              onClick={() => set("dismissed")}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-3">
              <span className="grid place-items-center w-10 h-10 rounded-2xl clay-sm shrink-0">
                <Cookie className="w-4 h-4 text-primary-glow" />
              </span>
              <div>
                <h3 className="font-semibold text-sm">We use cookies</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  We use essential cookies to keep you signed in, plus analytics & preference cookies to improve your experience. Read our{" "}
                  <Link to="/cookies" className="underline hover:text-foreground">Cookie Policy</Link>{" "}and{" "}
                  <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => set("accepted")} className="btn-clay py-2 px-4 text-xs">
                    Accept all
                  </button>
                  <button type="button" onClick={() => set("essential")} className="btn-ghost-clay py-2 px-4 text-xs">
                    Essential only
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
