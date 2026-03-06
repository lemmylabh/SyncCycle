"use client";

import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";

interface AvatarUploadProps {
  preview: string | null;
  onFileSelected: (file: File, previewUrl: string) => void;
  onRemove: () => void;
}

export function AvatarUpload({ preview, onFileSelected, onRemove }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    onFileSelected(file, url);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`relative w-20 h-20 rounded-full cursor-pointer group transition-all duration-200 ${
          dragging ? "scale-105" : ""
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Profile preview"
              className="w-20 h-20 rounded-full object-cover ring-2 ring-rose-500/40"
            />
            {/* Remove button */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-white hover:bg-rose-600 transition-colors z-10"
            >
              <X size={10} />
            </button>
          </>
        ) : (
          <div
            className={`w-20 h-20 rounded-full flex flex-col items-center justify-center gap-1 border-2 border-dashed transition-all duration-200 ${
              dragging
                ? "border-rose-400 bg-rose-500/10"
                : "border-white/20 bg-white/5 group-hover:border-rose-400/50 group-hover:bg-white/10"
            }`}
          >
            <Camera size={18} className="text-white/40 group-hover:text-white/60 transition-colors" />
            <span className="text-[9px] text-white/30 group-hover:text-white/50 transition-colors">Photo</span>
          </div>
        )}
      </div>

      <span className="text-[11px] text-white/30">Optional profile photo</span>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
