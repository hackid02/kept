"""
Test-only instrumentation for gltest's direct VM:

  direct_vm.llm_prompts      every prompt the contract sent to the (mocked) LLM, in order
  direct_vm.posted_messages  every outbound message the contract emitted — including plain value
                             transfers (emit_transfer), as {"to": hex, "value": int, "method": name|None}

Both are what the review asked for: proof that the adjudication prompt contains what we think
it contains, and proof that an upheld claim actually moves value to the customer's address.
"""
import pytest
from gltest.direct import vm as _vm_mod


@pytest.fixture(autouse=True)
def _instrument(direct_vm):
    direct_vm.llm_prompts = []
    direct_vm.posted_messages = []

    orig_match = direct_vm._match_llm_mock

    def match(prompt):
        direct_vm.llm_prompts.append(prompt)
        return orig_match(prompt)

    direct_vm._match_llm_mock = match

    def hook(vm, request):
        if isinstance(request, dict) and "PostMessage" in request:
            m = request["PostMessage"]
            addr = m.get("address")
            to = getattr(addr, "as_hex", None) or (
                "0x" + bytes(addr).hex() if isinstance(addr, (bytes, bytearray)) else str(addr)
            )
            cd = m.get("calldata") or {}
            method = cd.get("method") if isinstance(cd, dict) else None
            vm.posted_messages.append({"to": str(to).lower(), "value": int(m.get("value") or 0), "method": method})
            return {"ok": None}
        return None

    direct_vm._gl_call_hook = hook
    yield
