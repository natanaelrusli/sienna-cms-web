import { useEffect, useRef, useCallback } from "react";
import Quill from "quill";
import "quill/dist/quill.core.css";
import "quill/dist/quill.snow.css";

interface ContentEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  className?: string;
  isOpen?: boolean;
}

const ContentEditor = ({
  initialContent = "",
  onChange,
  placeholder = "Enter the text content...",
  minHeight = "200px",
  maxHeight = "300px",
  className = "",
  isOpen = true,
}: ContentEditorProps) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const isUpdatingContentRef = useRef(false);

  // Callback ref to ensure editor initializes when element is mounted
  const setEditorRef = useCallback(
    (element: HTMLDivElement | null) => {
      editorRef.current = element;
      if (element && isOpen && !quillRef.current) {
        // Small delay to ensure element is fully in DOM
        setTimeout(() => {
          if (editorRef.current && !quillRef.current) {
            editorRef.current.innerHTML = "";
            quillRef.current = new Quill(editorRef.current, {
              theme: "snow",
              placeholder,
            });

            // Set initial content if provided
            if (initialContent) {
              quillRef.current.root.innerHTML = initialContent;
            }

            // Update content when editor changes
            quillRef.current.on("text-change", () => {
              if (
                quillRef.current &&
                !isUpdatingContentRef.current &&
                onChange
              ) {
                const content = quillRef.current.root.innerHTML;
                onChange(content);
              }
            });
          }
        }, 50);
      }
    },
    [isOpen, placeholder, initialContent, onChange]
  );

  // Initialize editor when component mounts or isOpen changes
  useEffect(() => {
    if (isOpen && editorRef.current && !quillRef.current) {
      const timer = setTimeout(() => {
        if (editorRef.current && !quillRef.current) {
          editorRef.current.innerHTML = "";
          quillRef.current = new Quill(editorRef.current, {
            theme: "snow",
            placeholder,
          });

          // Set initial content if provided
          if (initialContent) {
            quillRef.current.root.innerHTML = initialContent;
          }

          // Update content when editor changes
          quillRef.current.on("text-change", () => {
            if (quillRef.current && !isUpdatingContentRef.current && onChange) {
              const content = quillRef.current.root.innerHTML;
              onChange(content);
            }
          });
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isOpen, placeholder, initialContent, onChange]);

  // Cleanup when component closes
  useEffect(() => {
    if (!isOpen) {
      if (quillRef.current) {
        quillRef.current = null;
      }
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
    }
  }, [isOpen]);

  // Update editor content when initialContent changes (e.g., when editing)
  useEffect(() => {
    if (quillRef.current && initialContent && isOpen) {
      const currentContent = quillRef.current.root.innerHTML;
      // Only update if content is different and not empty (to avoid clearing user input)
      if (currentContent !== initialContent && initialContent) {
        isUpdatingContentRef.current = true;
        quillRef.current.root.innerHTML = initialContent;
        // Reset flag after a brief delay to allow the update to complete
        setTimeout(() => {
          isUpdatingContentRef.current = false;
        }, 0);
      }
    }
  }, [initialContent, isOpen]);

  return (
    <div
      ref={setEditorRef}
      className={`quill-editor-wrapper ${className}`}
      style={{
        minHeight,
        maxHeight,
      }}
    />
  );
};

export default ContentEditor;
export type { ContentEditorProps };
