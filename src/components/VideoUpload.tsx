import { useCallback, useRef, useState } from "react";

interface Props {
  onVideoSelect: (file: File) => void;
  disabled: boolean;
}

export function VideoUpload({ onVideoSelect, disabled }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("video/")) {
        onVideoSelect(file);
      }
    },
    [onVideoSelect, disabled]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onVideoSelect(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`relative w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
        disabled
          ? "border-gray-700 bg-gray-900/50 cursor-not-allowed opacity-50"
          : isDragging
          ? "border-indigo-500 bg-indigo-500/10"
          : "border-gray-600 bg-gray-800/50 hover:border-indigo-400 hover:bg-gray-800"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
          <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <p className="text-gray-300 font-medium">
            {isDragging ? "Drop your video here" : "Upload a video"}
          </p>
          <p className="text-gray-500 text-sm mt-1">MP4, MOV, or WebM — filmed from the side</p>
        </div>
      </div>
    </div>
  );
}
