export const CODE_BLOCK_LANGUAGE_OPTIONS = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "kotlin", label: "Kotlin" },
  { value: "swift", label: "Swift" },
] as const;

export type CodeBlockLanguage = (typeof CODE_BLOCK_LANGUAGE_OPTIONS)[number]['value'];
export type CodeBlockLanguageWithAuto = CodeBlockLanguage | '';

export const DEFAULT_CODE_BLOCK_LANGUAGE: CodeBlockLanguage =
  CODE_BLOCK_LANGUAGE_OPTIONS[0].value;

export const getCodeBlockLanguageOptions = () =>
  CODE_BLOCK_LANGUAGE_OPTIONS.map((option) => ({ ...option }));
