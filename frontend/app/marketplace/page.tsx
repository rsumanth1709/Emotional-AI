"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { marketplaceAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  ShoppingBag, Search, Key, Code, Terminal, CheckCircle, Copy, Plus, RefreshCw,
  Zap, Database, Shield, FileText, Layers, Play, CheckSquare, ChevronRight, Activity, Server
} from "lucide-react";
import toast from "react-hot-toast";
import MindCareLoading from "@/components/ui/MindCareLoading";

interface APIProductItem {
  id: string;
  api_id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  status: string;
  endpoint_path: string;
  rate_limit_rpm: number;
  monthly_quota: number;
  sdks: {
    python: string;
    javascript: string;
    curl: string;
  };
}

interface APIKeyItem {
  id: string;
  key_name: string;
  environment: string;
  masked_key: string;
  tier: string;
  scopes: string[];
  rate_limit_rpm: number;
  monthly_quota: number;
  quota_used: number;
  is_active: boolean;
  created_at: string;
  last_used_at?: string;
}

export default function MarketplacePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);
  const [catalog, setCatalog] = useState<APIProductItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [keys, setKeys] = useState<APIKeyItem[]>([]);
  const [usage, setUsage] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<APIProductItem | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<"python" | "javascript" | "curl">("python");

  // Create Key Modal & Generated Secret State
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [newKeyName, setNewKeyName] = useState<string>("");
  const [newKeyEnv, setNewKeyEnv] = useState<string>("live");
  const [newKeyTier, setNewKeyTier] = useState<string>("FREE");
  const [createdSecretKey, setCreatedSecretKey] = useState<string | null>(null);

  // Interactive Tester State
  const [testText, setTestText] = useState<string>("I feel inspired and calm today");
  const [testResponse, setTestResponse] = useState<any>(null);
  const [testingAPI, setTestingAPI] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, kRes, uRes] = await Promise.all([
        marketplaceAPI.getCatalog(searchQuery),
        marketplaceAPI.getKeys(),
        marketplaceAPI.getUsage(),
      ]);
      setCatalog(cRes.data);
      setKeys(kRes.data);
      setUsage(uRes.data);
      if (cRes.data.length > 0 && !selectedProduct) {
        setSelectedProduct(cRes.data[0]);
      }
    } catch {
      toast.error("Failed to load API marketplace catalog.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    else if (user) fetchData();
  }, [user, authLoading, router, searchQuery]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      toast.error("Please enter a key name.");
      return;
    }
    setLoading(true);
    try {
      const res = await marketplaceAPI.createKey({
        key_name: newKeyName,
        environment: newKeyEnv,
        tier: newKeyTier,
        scopes: ["emotion:analyze", "chat:write", "wellness:generate"],
      });
      setCreatedSecretKey(res.data.full_api_key);
      toast.success("API Key Generated!");
      setNewKeyName("");
      fetchData();
    } catch {
      toast.error("Failed to generate API Key.");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      await marketplaceAPI.revokeKey(keyId);
      toast.success("API key revoked.");
      fetchData();
    } catch {
      toast.error("Failed to revoke API key.");
    }
  };

  const handleTestAPI = async () => {
    setTestingAPI(true);
    try {
      const firstActiveKey = keys.find((k) => k.is_active)?.masked_key;
      const res = await marketplaceAPI.testTextEmotionAPI(testText, firstActiveKey);
      setTestResponse(res.data);
      toast.success("API call successful!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "API test request failed.");
    } finally {
      setTestingAPI(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (authLoading || !user) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="API Marketplace & Developer Platform" />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-indigo-950/30 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                      Build with MindCare AI
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Developer Marketplace
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm max-w-2xl">
                    Integrate production-ready REST &amp; GraphQL APIs for Emotion AI, Multimodal Fusion, AI Companion Chat, and Wellness Generators.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowKeyModal(true)}
                  className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 whitespace-nowrap"
                >
                  <Key className="w-4 h-4" /> Create API Key
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mt-6 relative max-w-xl">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search APIs by keyword or category (e.g. emotion, fusion, wellness)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Usage Analytics Cards */}
          {usage && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-slate-400">Requests Today</span>
                <p className="text-2xl font-extrabold text-white">{usage.requests_today?.toLocaleString()}</p>
                <span className="text-[10px] text-emerald-400 font-semibold">✓ 99.1% Success Rate</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-slate-400">Monthly Quota</span>
                <p className="text-2xl font-extrabold text-white">
                  {usage.monthly_quota_used?.toLocaleString()} / {usage.monthly_quota_total?.toLocaleString()}
                </p>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-emerald-400 h-full rounded-full"
                    style={{ width: `${(usage.monthly_quota_used / usage.monthly_quota_total) * 100}%` }}
                  />
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-slate-400">Average Gateway Latency</span>
                <p className="text-2xl font-extrabold text-white">{usage.average_latency_ms} ms</p>
                <span className="text-[10px] text-cyan-400 font-semibold">Async Telemetry Logged</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-slate-400">Active API Keys</span>
                <p className="text-2xl font-extrabold text-white">{keys.filter((k) => k.is_active).length}</p>
                <span className="text-[10px] text-slate-400 font-semibold">SHA256 Hashed Secret</span>
              </div>
            </div>
          )}

          {/* API Catalog Products Grid */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              API Products Catalog
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catalog.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => setSelectedProduct(prod)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                    selectedProduct?.id === prod.id
                      ? "bg-slate-900 border-emerald-500 shadow-lg shadow-emerald-500/10"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {prod.category}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">v{prod.version}</span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-sm">{prod.name}</h4>
                    <p className="text-slate-400 text-xs line-clamp-2">{prod.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
                    <span>Limit: <strong>{prod.rate_limit_rpm} req/min</strong></span>
                    <span className="text-emerald-400 font-bold">{prod.endpoint_path}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SDK Code Snippets & Interactive Tester */}
          {selectedProduct && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* SDK Code Snippets */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Code className="w-4 h-4 text-emerald-400" />
                    SDK Code Examples ({selectedProduct.name})
                  </h3>

                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px]">
                    {(["python", "javascript", "curl"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveCodeTab(tab)}
                        className={`px-2.5 py-1 rounded-lg font-bold uppercase transition-all ${
                          activeCodeTab === tab ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-slate-400"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <pre className="p-4 rounded-xl bg-slate-950 text-slate-300 font-mono text-xs overflow-x-auto border border-slate-800">
                    {selectedProduct.sdks[activeCodeTab]}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(selectedProduct.sdks[activeCodeTab])}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Interactive REST & GraphQL API Tester */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Play className="w-4 h-4 text-emerald-400" />
                  Interactive API Console &amp; GraphQL Tester
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Input Text Payload</label>
                    <input
                      type="text"
                      value={testText}
                      onChange={(e) => setTestText(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                    />
                  </div>

                  <button
                    onClick={handleTestAPI}
                    disabled={testingAPI}
                    className="btn-primary w-full py-2.5 font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    {testingAPI ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Send API Request
                  </button>

                  {testResponse && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase">Response JSON</span>
                      <pre className="p-3 rounded-xl bg-slate-950 text-emerald-300 font-mono text-xs overflow-x-auto border border-slate-800 max-h-48">
                        {JSON.stringify(testResponse, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Developer API Keys Management Portal */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Key className="w-4 h-4 text-emerald-400" />
              Developer API Keys Management Portal
            </h3>

            <div className="space-y-3 text-xs">
              {keys.map((k) => (
                <div
                  key={k.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{k.key_name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        k.environment === "live" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      }`}>
                        {k.environment.toUpperCase()}
                      </span>
                      <span className="text-slate-500">• Tier: {k.tier}</span>
                    </div>
                    <p className="font-mono text-slate-400 text-xs">{k.masked_key}</p>
                    <span className="text-[10px] text-slate-500">
                      Quota Used: {k.quota_used?.toLocaleString()} / {k.monthly_quota?.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {k.is_active ? (
                      <button
                        onClick={() => handleRevokeKey(k.id)}
                        className="py-1.5 px-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold hover:bg-rose-500/20"
                      >
                        Revoke Key
                      </button>
                    ) : (
                      <span className="text-slate-500 font-bold">REVOKED</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create API Key Modal */}
          {showKeyModal && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white">Generate New API Key</h3>
                  <button onClick={() => setShowKeyModal(false)} className="text-slate-400 hover:text-white">✕</button>
                </div>

                {!createdSecretKey ? (
                  <form onSubmit={handleCreateKey} className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold">Key Name</label>
                      <input
                        type="text"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="e.g. Production Mobile App Key"
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-slate-400 font-bold">Environment</label>
                        <select
                          value={newKeyEnv}
                          onChange={(e) => setNewKeyEnv(e.target.value)}
                          className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                        >
                          <option value="live">Live (mk_live_)</option>
                          <option value="test">Test (mk_test_)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-400 font-bold">Tier</label>
                        <select
                          value={newKeyTier}
                          onChange={(e) => setNewKeyTier(e.target.value)}
                          className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                        >
                          <option value="FREE">FREE (60 RPM)</option>
                          <option value="DEVELOPER">DEVELOPER (300 RPM)</option>
                          <option value="PRO">PRO (1000 RPM)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowKeyModal(false)}
                        className="py-2 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary py-2 px-4 font-bold shadow-lg shadow-emerald-500/20"
                      >
                        Generate Secret Key
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4 text-xs">
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-1">
                      <span className="font-bold flex items-center gap-1">
                        ⚠️ Copy your Secret API Key now!
                      </span>
                      <p className="text-[11px] text-amber-200/80">
                        This key will <strong>NEVER</strong> be displayed again. Store it securely in your environment variables.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-slate-400 font-bold">Full Secret API Key</label>
                        <button
                          onClick={() => copyToClipboard(createdSecretKey)}
                          className="text-emerald-400 font-bold hover:underline flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      </div>
                      <input
                        type="text"
                        readOnly
                        value={createdSecretKey}
                        className="w-full p-2.5 bg-slate-950 border border-emerald-500/40 rounded-xl text-emerald-400 font-mono text-xs"
                      />
                    </div>

                    <button
                      onClick={() => {
                        setShowKeyModal(false);
                        setCreatedSecretKey(null);
                      }}
                      className="btn-primary w-full py-2.5 font-bold"
                    >
                      Done &amp; Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
