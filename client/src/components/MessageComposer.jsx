import { useRef, useState } from "react";

export default function MessageComposer({ onSend, disabled }) {
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const fileInput = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!content.trim() && !file) return;
    await onSend({ content: content.trim(), file });
    setContent("");
    setFile(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <form className="message-composer" onSubmit={handleSubmit}>
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Write a message"
        maxLength={2000}
        rows={2}
        disabled={disabled}
      />
      <div className="composer-actions">
        <label className="file-label">
          Attach
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            disabled={disabled}
          />
        </label>
        {file && <span className="selected-file">{file.name}</span>}
        <button className="primary-button" type="submit" disabled={disabled}>
          Send
        </button>
      </div>
    </form>
  );
}
