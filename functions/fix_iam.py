import json
import urllib.request
import urllib.error
from google.oauth2 import service_account
from google.auth.transport.requests import Request
import os

def make_cloud_run_public():
    creds_path = "firebase-credentials.json"
    if not os.path.exists(creds_path):
        print("Credentials file not found.")
        return

    # Load credentials
    creds = service_account.Credentials.from_service_account_file(
        creds_path,
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    creds.refresh(Request())

    # Get project info
    with open(creds_path) as f:
        data = json.load(f)
        project_id = data["project_id"]

    # Endpoint para Cloud Run (Region default us-central1 y service "backend")
    # Firebase functions are prefixed. Oh wait, what is the exact service name?
    # Firebase v2 functions naming: backend
    service_name = f"projects/{project_id}/locations/us-central1/services/backend"
    url = f"https://run.googleapis.com/v2/{service_name}:setIamPolicy"

    # Get current policy first? No, we can just set it. Wait, setIamPolicy overrides.
    # It is safer to use GetIamPolicy, modify, and SetIamPolicy.
    
    get_url = f"https://run.googleapis.com/v2/{service_name}:getIamPolicy"
    
    req = urllib.request.Request(get_url, headers={
        "Authorization": f"Bearer {creds.token}",
        "Content-Type": "application/json"
    })
    
    try:
        with urllib.request.urlopen(req) as response:
            policy = json.loads(response.read().decode())
    except Exception as e:
        print(f"Error fetching policy: {e}")
        return

    # Add allUsers binding
    bindings = policy.get("bindings", [])
    invoker_binding = next((b for b in bindings if b.get("role") == "roles/run.invoker"), None)
    
    if invoker_binding:
        if "allUsers" not in invoker_binding.get("members", []):
            invoker_binding.setdefault("members", []).append("allUsers")
    else:
        bindings.append({
            "role": "roles/run.invoker",
            "members": ["allUsers"]
        })
        
    policy["bindings"] = bindings

    # Set the updated policy
    set_req = urllib.request.Request(url, data=json.dumps({"policy": policy}).encode('utf-8'), headers={
        "Authorization": f"Bearer {creds.token}",
        "Content-Type": "application/json"
    }, method="POST")
    
    try:
        with urllib.request.urlopen(set_req) as response:
            print("Successfully updated IAM policy to allow public access.")
    except Exception as e:
        print(f"Error updating policy: {e}")

if __name__ == "__main__":
    make_cloud_run_public()
