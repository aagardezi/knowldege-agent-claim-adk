from google.adk.tools import ToolContext

def set_claim_context(claim_id: str, tool_context: ToolContext) -> dict[str, str]:
    """Sets the active claim ID for the current session.

    Call this tool as soon as you identify the Claim ID from the user's request.

    Args:
        claim_id: The ID of the claim (e.g., 'CLAIM-123').
    """
    if tool_context and tool_context.state is not None:
        tool_context.state["claim_id"] = claim_id
        return {"status": "success", "message": f"Active claim context set to {claim_id}"}
    return {"status": "error", "message": "Failed to set claim context (no state service)"}
