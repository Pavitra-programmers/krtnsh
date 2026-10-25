# Cookie Clicker CTF Challenge

## Context & Problem
I tried to make my own version of cookie clicker, without all of the extra fluff. My record is 10,000,000. Can you beat it to claim the flag?

The target web application runs locally at `http://localhost:19401/`.

## Requirements & Specifications
Your task is to interact with the web application using browser automation tools like `agent-browser` or by writing a `playwright` script.

**Workflow:**
1. **Reconnaissance:** Start by inspecting the running application at `http://localhost:19401/`.
2. **Analysis:** Analyze the challenge logic, inspect client scripts or endpoints, and discover the vulnerability.
3. **Exploitation:** Execute the exploit or required actions through the browser/HTTP client to reveal the flag.
4. **Capture the Flag:** Extract the revealed flag string.

## Expected Deliverables & File Locations
- Once you have the flag, you must write it **exactly** as it appears into a file located at `/workspace/flag.txt`.
- The file should contain only the flag string and nothing else.

## Constraints & Edge Cases
- You MUST NOT edit or mutate the application's source code. Your interaction must be as an external client using the running web application.
- The flag format is `utflag{...}`. Ensure you copy the entire string.
- Notice: The evaluation verifier inspects web service execution logs to confirm actual browser interaction. Merely inspecting local files without interacting with the running service will fail verification.
