export interface Props {
  /** @title Código */
  code: string;
  /** @title Linguagem (ex: typescript, bash, json) */
  language?: string;
  /** @title Título / nome do arquivo */
  filename?: string;
}

export default function Code({ code, language = "plaintext", filename }: Props) {
  return (
    <div className="my-6 rounded overflow-hidden border border-[#1a1a18]/10 bg-[#1a1a18] text-sm">
      {filename && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#282828] border-b border-white/10">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#7a7a74] flex-shrink-0" aria-hidden="true">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13 2 13 9 20 9" />
          </svg>
          <span className="text-[11px] text-[#a0a09a] font-mono tracking-wide">{filename}</span>
          <span className="ml-auto text-[10px] text-[#4a4a46] uppercase tracking-wider">{language}</span>
        </div>
      )}
      {!filename && language !== "plaintext" && (
        <div className="flex items-center justify-end px-4 py-1 bg-[#222222]">
          <span className="text-[10px] text-[#4a4a46] uppercase tracking-wider">{language}</span>
        </div>
      )}
      <pre className="overflow-x-auto p-4 m-0">
        <code className={`language-${language} text-[#f0efeb] font-mono text-[0.85rem] leading-relaxed`}>
          {code}
        </code>
      </pre>
    </div>
  );
}
