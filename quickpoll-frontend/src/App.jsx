import React, { useState, useEffect } from "react";
import { WalletProvider } from "./WalletProvider";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

// ---------- Color Palette (adjust here) ----------
const primary = "#2563eb";         // Blue
const border = "#e0e7ef";
const bg = "#f7fafc";
const card = "#fff";
const accent = "#eff6ff";
const text = "#213547";

// ErrorBoundary for clean errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: "red", padding: 16 }}>
          <h2>Something went wrong.</h2>
          <pre>{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// ----------- Config (edit if you redeploy) -----------
const MODULE_ADDR = "0xb062501efb017c8a15c6b684938c20ec8b9828f1a3c68ab1100c7e4860226b9c";
const MODULE_NAME = "quickpoll";
const RESOURCE_TYPE = `${MODULE_ADDR}::${MODULE_NAME}::Polls`;
const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

export default function App() {
  return (
    <ErrorBoundary>
      <WalletProvider>
        <div
          style={{
            maxWidth: 440,
            margin: "40px auto",
            fontFamily: "Inter, Arial, sans-serif",
            background: bg,
            minHeight: "100vh",
            padding: 0,
          }}
        >
          <div
            style={{
              background: card,
              border: `1px solid ${border}`,
              borderRadius: 13,
              padding: 28,
              boxShadow: "0 2px 16px #0001",
            }}
          >
            <h1 style={{
              color: primary,
              textAlign: "center",
              marginBottom: 20,
              fontWeight: 700,
              letterSpacing: 0.5
            }}>
              QuickPoll <span style={{ color: text, fontWeight: 400 }}>DApp</span>
            </h1>
            <WalletConnect />
            <CreatePoll />
            <PollList />
            <AnswerPoll />
          </div>
        </div>
      </WalletProvider>
    </ErrorBoundary>
  );
}

function WalletConnect() {
  const { connect, disconnect, account, connected, wallets } = useWallet();
  const [selected, setSelected] = useState(wallets[0]?.name || "Petra");
  return (
    <div style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
      {connected ? (
        <>
          <div style={{ color: "#175cd3", fontWeight: 500, fontSize: 15 }}>
            <span style={{ color: "#777" }}>Connected:</span>{" "}
            <span style={{ fontFamily: "monospace" }}>{typeof account?.address === "string" ? account.address : ""}</span>
          </div>
          <button
            onClick={disconnect}
            style={{
              background: accent,
              color: "#333",
              border: `1px solid ${border}`,
              padding: "6px 18px",
              borderRadius: 7,
              fontSize: 13,
              cursor: "pointer",
            }}>Disconnect</button>
        </>
      ) : (
        <>
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            style={{
              padding: 6,
              borderRadius: 6,
              border: `1px solid ${border}`,
              fontWeight: 500,
              background: accent,
              minWidth: 90,
              fontSize: 13,
            }}>
            {wallets.map(w => <option key={w.name} value={w.name}>{w.name}</option>)}
          </select>
          <button
            onClick={() => connect(selected)}
            style={{
              background: primary,
              color: "#fff",
              border: "none",
              padding: "7px 22px",
              borderRadius: 7,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}>
            Connect Wallet
          </button>
        </>
      )}
    </div>
  );
}

function CreatePoll() {
  const { account, signAndSubmitTransaction, connected } = useWallet();
  const [prompt, setPrompt] = useState("");
  const [reward, setReward] = useState("");
  const [loading, setLoading] = useState(false);

  async function onCreate() {
    if (!connected) return alert("Connect wallet first");
    if (!prompt || !reward) return alert("Fill all fields");
    setLoading(true);
    try {
      await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: `${MODULE_ADDR}::${MODULE_NAME}::create_poll`,
          functionArguments: [prompt, Number(reward)],
        }
      });
      alert("Poll created!");
      setPrompt("");
      setReward("");
    } catch (e) {
      alert("Error: " + (e.message || e));
    }
    setLoading(false);
  }

  return (
    <div style={{ margin: "16px 0" }}>
      <h3 style={{ color: primary, fontWeight: 600, marginBottom: 8, fontSize: 17 }}>
        Create a New Poll
      </h3>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          placeholder="Prompt"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          style={{
            flex: 2,
            minWidth: 0,
            padding: 8,
            borderRadius: 7,
            border: `1px solid ${border}`,
            fontSize: 14,
            background: accent
          }}
        />
        <input
          placeholder="Reward"
          value={reward}
          type="number"
          onChange={e => setReward(e.target.value)}
          style={{
            width: 80,
            padding: 8,
            borderRadius: 7,
            border: `1px solid ${border}`,
            fontSize: 14,
            background: accent
          }}
        />
        <button
          onClick={onCreate}
          disabled={loading}
          style={{
            background: primary,
            color: "#fff",
            border: "none",
            padding: "8px 17px",
            borderRadius: 7,
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer"
          }}>
          {loading ? "Creating..." : "Create"}
        </button>
      </div>
    </div>
  );
}

function PollList() {
  const { account, connected } = useWallet();
  const [owner, setOwner] = useState("");
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!owner) return;
    setLoading(true);
    aptos
      .getAccountResource({
        accountAddress: owner,
        resourceType: RESOURCE_TYPE
      })
      .then(resource => {
        const pollArray = resource.data?.list || resource.list || [];
        setPolls(pollArray);
        // Debug log
        // console.log("Fetched polls:", pollArray);
      })
      .catch(() => setPolls([]))
      .finally(() => setLoading(false));
  }, [owner]);

  useEffect(() => {
    if (connected && account?.address) setOwner(account.address);
  }, [connected, account]);

  return (
    <div style={{ margin: "22px 0" }}>
      <h3 style={{ color: primary, fontWeight: 600, fontSize: 16, marginBottom: 7 }}>Polls On-Chain</h3>
      <input
        placeholder="Owner address"
        value={owner}
        onChange={e => setOwner(e.target.value)}
        style={{
          width: "100%",
          marginBottom: 8,
          padding: 8,
          borderRadius: 7,
          border: `1px solid ${border}`,
          background: accent,
          fontSize: 14
        }}
      />
      {loading && <div style={{ fontSize: 13 }}>Loading polls…</div>}
      {!loading && polls.length === 0 && <div style={{ fontSize: 13, color: "#888" }}>No polls found for this address.</div>}
      {!loading && polls.length > 0 && (
        <div>
          {polls.map((poll, i) => (
            <div key={i} style={{
              marginBottom: 13,
              padding: 11,
              border: `1px solid ${border}`,
              borderRadius: 8,
              background: accent
            }}>
              <div style={{ fontWeight: 500, fontSize: 15, color: primary }}>{poll.prompt}</div>
              <div style={{ fontSize: 13, margin: "3px 0" }}>
                <b>ID:</b> {poll.id} &middot; <b>Reward:</b> {poll.reward}
              </div>
              <div style={{ fontSize: 12, color: "#555" }}>
                <b>Participants:</b> {poll.participants?.length} &middot; <b>Responses:</b> {poll.responses?.length}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnswerPoll() {
  const { account, signAndSubmitTransaction, connected } = useWallet();
  const [owner, setOwner] = useState("");
  const [pollId, setPollId] = useState("");
  const [response, setResponse] = useState("");

  async function onAnswer() {
    if (!connected) return alert("Connect wallet first");
    if (!owner || !pollId || !response) return alert("Fill all fields");
    try {
      await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: `${MODULE_ADDR}::${MODULE_NAME}::answer_poll`,
          functionArguments: [owner, Number(pollId), response],
        }
      });
      alert("Answer submitted!");
      setOwner("");
      setPollId("");
      setResponse("");
    } catch (e) {
      alert("Error: " + (e.message || e));
    }
  }

  return (
    <div style={{ margin: "16px 0" }}>
      <h3 style={{ color: primary, fontWeight: 600, marginBottom: 8, fontSize: 16 }}>
        Answer Poll
      </h3>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          placeholder="Owner Address"
          value={owner}
          onChange={e => setOwner(e.target.value)}
          style={{
            flex: 2,
            minWidth: 0,
            padding: 8,
            borderRadius: 7,
            border: `1px solid ${border}`,
            fontSize: 14
          }}
        />
        <input
          placeholder="Poll ID"
          value={pollId}
          type="number"
          onChange={e => setPollId(e.target.value)}
          style={{
            width: 75,
            padding: 8,
            borderRadius: 7,
            border: `1px solid ${border}`,
            fontSize: 14
          }}
        />
        <input
          placeholder="Your Answer"
          value={response}
          onChange={e => setResponse(e.target.value)}
          style={{
            flex: 2,
            minWidth: 0,
            padding: 8,
            borderRadius: 7,
            border: `1px solid ${border}`,
            fontSize: 14
          }}
        />
        <button
          onClick={onAnswer}
          style={{
            background: primary,
            color: "#fff",
            border: "none",
            padding: "8px 18px",
            borderRadius: 7,
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer"
          }}>
          Submit
        </button>
      </div>
    </div>
  );
}
