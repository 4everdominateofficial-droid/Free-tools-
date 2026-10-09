# DocuFlex Test Corpus

This directory contains test fixtures used to verify the security and parsing behavior of DocuFlex:

1. `valid.txt`: Clean UTF-8 plaintext document.
2. `valid.csv`: Standard CSV with headers, quoted strings containing commas, and tabular numeric data.
3. `malicious_script.html`: HTML containing `<script>` tags, inline `onload` handlers, `<iframe>`, and tracking pixels. Verified that all executable scripts and network fetches are stripped by SafeHtmlEngine.
4. `corrupt_pdf.pdf`: Malformed PDF header without standard `%PDF-` sequence. Verified that SafValidator intercepts this before rendering.
5. `mismatched_exe.pdf`: Executable containing binary `MZ` magic bytes disguised with a `.pdf` extension. Verified that MagicBytesDetector rejects this.
6. `encrypted_pdf_sim.pdf`: PDF containing `/Encrypt` trailer dictionary. Verified that SafValidator rejects native decryption and offers external app fallback.
