"use client";

import { useCallback, useMemo, useState } from "react";
import { nftImageUrlCandidates } from "@/lib/nft-image-urls";
import { cn } from "@/lib/utils";

interface NftImageProps {
  src: string | null;
  alt: string;
  className?: string;
  /** Shown when all candidates fail. */
  emptyClassName?: string;
}

/**
 * Tries multiple IPFS gateways and the original URL so thumbnails recover when a host blocks hotlinking.
 */
export function NftImage({ src, alt, className, emptyClassName }: NftImageProps) {
  const candidates = useMemo(() => nftImageUrlCandidates(src), [src]);
  const [index, setIndex] = useState(0);

  const onError = useCallback(() => {
    setIndex((i) => i + 1);
  }, []);

  if (!candidates.length || index >= candidates.length) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-black/40 text-xs text-muted-foreground",
          emptyClassName,
          className
        )}
      >
        No image
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={candidates[index]}
      alt={alt}
      className={className}
      referrerPolicy="origin"
      loading="lazy"
      decoding="async"
      onError={onError}
    />
  );
}
