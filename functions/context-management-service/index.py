import json
import importlib
import functions_framework

# --- Import your agent module:
# Place my-agents/context-agent-app/ inside this function folder (or copy it in CI),
# so that "from my_agents.context_agent_app import agent" resolves at deploy time.
agent_mod = importlib.import_module("my_agents.context_agent_app.agent")

def _call_agent(event: dict) -> dict:
    """
    Generic shim: if your agent exposes handle_event(event) use it.
    Otherwise fall back to a conservative chat call (agent.root_agent.run).
    """
    # Preferred path
    if hasattr(agent_mod, "handle_event") and callable(getattr(agent_mod, "handle_event")):
        return agent_mod.handle_event(event)

    # Fallback: emulate chat mode if only root_agent exists
    q = event.get("query", "") or event.get("prompt", "")
    sid = event.get("startup_id")
    ctx = event.get("context", {})
    if hasattr(agent_mod, "root_agent"):
        res = agent_mod.root_agent.run(q, context={"startup_id": sid, **ctx})
        # Normalize to the envelope your UI expects
        return {
            "output_text": getattr(res, "output_text", "") or getattr(res, "text", "") or str(res),
            "citations": [],
            "actions": []
        }

    # Last resort: echo
    return {"output_text": "Agent not wired; please implement handle_event(event).", "citations": [], "actions": []}

@functions_framework.http
def agent_query(request):
    """
    Cloud Function HTTP entry.
    Request JSON example:
    {
      "event_type": "chat" | "form_response" | "voice_transcript",
      "startup_id": "acme123",
      "query": "....",                    // for chat
      "form_response": {...},             // for form
      "transcript": "....",               // for voice
      "metadata": {...},                  // for voice (optional)
      "context": { "instruction_hint": "...", "ui": "dashboard" }  // optional prompt wrapper
    }
    """
    try:
        event = request.get_json(silent=True) or {}
        result = _call_agent(event) or {}
        return (json.dumps(result), 200, {"Content-Type": "application/json"})
    except Exception as exc:
        return (json.dumps({"error": str(exc)}), 500, {"Content-Type": "application/json"})
