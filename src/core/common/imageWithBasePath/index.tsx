import { useState } from "react";
import { img_path } from "../../../environment";

interface ImageProps {
  className?: string;
  src: string;
  alt?: string;
  height?: number;
  width?: number;
  id?: string;
  fallbackSrc?: string;
}

const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const resolveSrc = (src: string | undefined): string => {
  if (!src) return TRANSPARENT_PIXEL;
  if (/^https?:\/\//i.test(src)) return src;
  return `${img_path}${src}`;
};

const ImageWithBasePath = (props: ImageProps) => {
  const [currentSrc, setCurrentSrc] = useState<string>(() => resolveSrc(props.src));
  const [hasErrored, setHasErrored] = useState(false);

  const handleError = () => {
    if (hasErrored) return;
    setHasErrored(true);
    if (props.fallbackSrc) {
      setCurrentSrc(resolveSrc(props.fallbackSrc));
    } else {
      // Prevent a broken image icon from collapsing the layout.
      setCurrentSrc(TRANSPARENT_PIXEL);
    }
  };

  return (
    <img
      className={props.className}
      src={currentSrc}
      height={props.height}
      alt={props.alt}
      width={props.width}
      id={props.id}
      onError={handleError}
      loading="lazy"
    />
  );
};

export default ImageWithBasePath;
