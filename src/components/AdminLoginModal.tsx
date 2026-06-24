import React, { useState } from "react";
import { Lock, Unlock, X, AlertCircle, Loader2, KeyRound } from "lucide-react";

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdminUnlocked: boolean;
  onLoginSuccess: (passcode: string) => void;
  onLogout: () => void;
}

export default function AdminLoginModal({
  isOpen,
  onClose,
  isAdminUnlocked,
  onLoginSuccess,
  onLogout,
}: AdminLoginModalProps) {
  const [passcode, setPasscode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setError("Passcode is required.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/verify-passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Incorrect passcode. Please check and try again.");
      }

      onLoginSuccess(passcode);
      setPasscode("");
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to authenticate.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border-2 border-navy shadow-2xl w-full max-w-md flex flex-col relative rounded-none animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-navy p-4 text-white flex items-center justify-between border-b border-navy/10">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber" />
            <span className="font-mono text-sm uppercase tracking-wider font-bold">
              {isAdminUnlocked ? "Admin Mode Settings" : "Admin Mode Authentication"}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isAdminUnlocked ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto w-12 h-12 bg-amber/10 flex items-center justify-center border border-amber/20 text-amber">
                <Unlock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-lg text-navy">Admin Mode Active</h3>
                <p className="text-xs text-text-muted">
                  You are currently authenticated as the administrator. You can import reviews and edit details.
                </p>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-cream/30 hover:bg-cream/50 text-navy font-mono text-xs font-bold uppercase tracking-wider py-2.5 border border-navy/10 transition-all cursor-pointer"
                >
                  Keep Active
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold uppercase tracking-wider py-2.5 transition-all cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-navy/5 flex items-center justify-center border border-navy/10 text-navy">
                <Lock className="w-6 h-6" />
              </div>
              
              <div className="text-center space-y-1">
                <h3 className="font-display font-bold text-lg text-navy">Enter Passcode</h3>
                <p className="text-xs text-text-muted">
                  Please enter your secure admin passcode to access board game importing and management tools.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 p-3 border-l-2 border-red-500 flex items-start gap-2 font-sans text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <div>{error}</div>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-navy font-bold">
                  Secret Passcode
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  className="w-full border border-navy/15 p-2.5 font-mono text-sm text-navy focus:outline-none focus:border-amber bg-cream/10 text-center"
                  placeholder="••••••••••••"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                />
                <p className="text-[10px] text-text-muted mt-1 text-center">
                  Default preview passcode is <code className="font-mono bg-cream px-1">admin123</code>.
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-cream/30 hover:bg-cream/50 text-navy font-mono text-xs font-bold uppercase tracking-wider py-2.5 border border-navy/10 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-navy text-white hover:bg-navy-mid hover:text-amber font-mono text-xs font-bold uppercase tracking-wider py-2.5 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify Code
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
