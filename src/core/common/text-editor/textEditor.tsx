import { useEffect } from 'react'
import "yet-another-react-lightbox/styles.css";
import "quill/dist/quill.snow.css";
import "quill/dist/quill.bubble.css";

const FormEditors = () => {

    useEffect(() => {
        let mounted = true;
        (async () => {
          try {
            const { default: Quill } = (await import("quill")) as {
              default: typeof import("quill").default;
            };
    
            if (!mounted) return;
    
            type QuillHost = HTMLElement & { _quill?: unknown };
    
            const snowEl = document.getElementById("snow-editor") as QuillHost | null;
            if (snowEl && !snowEl._quill) {
              const q = new Quill(snowEl, {
                theme: "snow",
                modules: {
                  toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ["bold", "italic", "underline", "strike"],
                    [{ color: [] }, { background: [] }],
                    [{ script: "sub" }, { script: "super" }],
                    [{ list: "ordered" }, { list: "bullet" }],
                    [{ indent: "-1" }, { indent: "+1" }],
                    [{ align: [] }],
                    ["blockquote", "code-block"],
                    ["link", "image", "video"],
                    ["clean"],
                  ],
                },
              });
              snowEl._quill = q;
            }
    
            const bubbleEl = document.getElementById("bubble-editor") as QuillHost | null;
            if (bubbleEl && !bubbleEl._quill) {
              const q2 = new Quill(bubbleEl, {
                theme: "bubble",
              });
              bubbleEl._quill = q2;
            }
          } catch (e) {
            // Quill may be missing if dependency isn't installed
            // eslint-disable-next-line no-console
            console.warn("Quill failed to load:", e);
          }
        })();
    
        return () => {
          mounted = false;
        };
      }, []);
    return (
        <>
            <div id="snow-editor" aria-label="Snow Editor"></div>
        </>
    )
}

export default FormEditors
