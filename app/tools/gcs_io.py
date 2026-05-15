import os

from typing import Any
from google.cloud import storage

from app.config import WIKI_BUCKET_NAME

BUCKET_NAME = WIKI_BUCKET_NAME


def _get_bucket():
    client = storage.Client()
    return client.bucket(BUCKET_NAME)


def _get_claim_id(tool_context: Any) -> str:
    """Extracts the claim_id from any type of ADK context (ToolContext, CallbackContext, InvocationContext)."""
    if tool_context is None:
        return ""
    # Check ToolContext / CallbackContext shortcut
    if hasattr(tool_context, "state") and tool_context.state is not None:
        try:
            return tool_context.state.get("claim_id", "")
        except Exception:
            pass
    # Check InvocationContext
    if hasattr(tool_context, "session") and tool_context.session is not None:
        session = tool_context.session
        if hasattr(session, "state") and session.state is not None:
            try:
                return session.state.get("claim_id", "")
            except Exception:
                pass
    return ""


def read_wiki_file(filename: str, tool_context: Any = None) -> str:
    """Reads a markdown file from the active claim's folder in the wiki GCS bucket.
    
    If a baseline file (schema.md, index.md, log.md) is missing from GCS, this method
    dynamically bootstraps it using the packaged templates to fully automate setup.

    Args:
        filename: The path/name of the blob inside the claim (e.g., 'index.md', 'entities/entity1.md').
    """
    claim_id = _get_claim_id(tool_context)
    if not claim_id:
        raise ValueError("No active Claim ID found in session context. All operations must be scoped to a Claim ID.")

    full_path = f"{claim_id}/{filename}"
    try:
        bucket = _get_bucket()
        blob = bucket.blob(full_path)
        if not blob.exists():
            # Dynamic bootstrapping of baseline files for a new claim
            if filename in {"schema.md", "index.md", "log.md"}:
                # 1. Try reading the global baseline template from the GCS bucket root
                global_blob = bucket.blob(filename)
                if global_blob.exists():
                    content = global_blob.download_as_text()
                    # Copy/bootstrap the global GCS template into the claim's scoped folder
                    blob.upload_from_string(content, content_type="text/markdown")
                    return content
                else:
                    # 2. Fallback: Load from code bundle templates to initialize the global GCS store
                    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
                    local_file_path = os.path.join(base_dir, filename)
                    if os.path.exists(local_file_path):
                        with open(local_file_path, "r", encoding="utf-8") as f:
                            content = f.read()
                        # Auto-populate the global GCS root template for future claim runs
                        try:
                            global_blob.upload_from_string(content, content_type="text/markdown")
                        except Exception as ge:
                            print(f"Warning: Failed to populate global GCS root baseline {filename}: {ge}")
                        # Bootstrap the claim folder
                        blob.upload_from_string(content, content_type="text/markdown")
                        return content
            return ""
        return blob.download_as_text()
    except Exception as e:
        print(f"Error reading wiki file {full_path}: {e}")
        return ""



def write_wiki_file(filename: str, content: str, tool_context: Any = None):
    """Writes a markdown file to the active claim's folder in the wiki GCS bucket.

    Args:
        filename: The path/name of the blob inside the claim.
        content: The markdown string to write.
    """
    claim_id = _get_claim_id(tool_context)
    if not claim_id:
        raise ValueError("No active Claim ID found in session context. All operations must be scoped to a Claim ID.")

    full_path = f"{claim_id}/{filename}"
    try:
        bucket = _get_bucket()
        blob = bucket.blob(full_path)
        blob.upload_from_string(content, content_type="text/markdown")
    except Exception as e:
        print(f"Error writing wiki file {full_path}: {e}")


def list_wiki_files(prefix: str = "", tool_context: Any = None) -> list[str]:
    """Lists markdown files in the active claim's folder in the wiki GCS bucket.

    Args:
        prefix: Optional prefix filter inside the claim folder (e.g., 'evidence/').
    """
    claim_id = _get_claim_id(tool_context)
    if not claim_id:
        raise ValueError("No active Claim ID found in session context. All operations must be scoped to a Claim ID.")

    full_prefix = f"{claim_id}/{prefix}" if prefix else f"{claim_id}/"
    try:
        bucket = _get_bucket()
        blobs = bucket.list_blobs(prefix=full_prefix)
        # Strip the '<claim_id>/' prefix so agents and frontends receive paths relative to the claim folder root
        strip_len = len(f"{claim_id}/")
        return [blob.name[strip_len:] for blob in blobs if blob.name.endswith(".md")]
    except Exception as e:
        print(f"Error listing wiki files for prefix {full_prefix}: {e}")
        return []


def wiki_file_exists(filename: str, tool_context: Any = None) -> bool:
    """Checks if a file exists in the active claim's folder in the wiki GCS bucket."""
    claim_id = _get_claim_id(tool_context)
    if not claim_id:
        raise ValueError("No active Claim ID found in session context. All operations must be scoped to a Claim ID.")

    full_path = f"{claim_id}/{filename}"
    try:
        bucket = _get_bucket()
        blob = bucket.blob(full_path)
        return blob.exists()
    except Exception as e:
        print(f"Error checking wiki file existence for {full_path}: {e}")
        return False
