import { UploadCloud } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  type DragEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "../../lib/utils";

type FileStatus = "idle" | "dragging" | "uploading" | "error";

interface FileError {
  message: string;
  code: string;
}

interface FileUploadProps {
  onUploadSuccess?: (file: File) => void;
  onUploadError?: (error: FileError) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  currentFile?: File | null;
  onFileRemove?: () => void;
  uploadDelay?: number;
  validateFile?: (file: File) => FileError | null;
  className?: string;
}

const DEFAULT_MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const UPLOAD_STEP_SIZE = 12;
const FILE_SIZES = ["Bytes", "KB", "MB", "GB"] as const;

const formatBytes = (bytes: number, decimals = 2): string => {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const unit = FILE_SIZES[i] || FILE_SIZES[FILE_SIZES.length - 1];
  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${unit}`;
};

const UploadIllustration = () => (
  <div className="relative h-12 w-12">
    <svg
      aria-label="Upload illustration"
      className="h-full w-full"
      fill="none"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="stroke-slate-700"
        cx="50"
        cy="50"
        r="45"
        strokeDasharray="4 4"
        strokeWidth="1.5"
      >
        <animateTransform
          attributeName="transform"
          dur="60s"
          from="0 50 50"
          repeatCount="indefinite"
          to="360 50 50"
          type="rotate"
        />
      </circle>

      <path
        className="fill-gold-500/15 stroke-gold-400"
        d="M30 35H70C75 35 75 40 75 40V65C75 70 70 70 70 70H30C25 70 25 65 25 65V40C25 35 30 35 30 35Z"
        strokeWidth="1.5"
      />

      <g className="translate-y-2 transform">
        <line
          className="stroke-gold-400"
          strokeLinecap="round"
          strokeWidth="2"
          x1="50"
          x2="50"
          y1="45"
          y2="60"
        />
        <polyline
          className="stroke-gold-400"
          fill="none"
          points="42,52 50,45 58,52"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </g>
    </svg>
  </div>
);

const UploadingAnimation = ({ progress }: { progress: number }) => (
  <div className="relative h-12 w-12">
    <svg
      aria-label={`Upload progress: ${Math.round(progress)}%`}
      className="h-full w-full"
      fill="none"
      viewBox="0 0 240 240"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="120" cy="120" r="100" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
      <circle
        cx="120"
        cy="120"
        r="100"
        stroke="#e5a93c"
        strokeWidth="12"
        strokeDasharray="628"
        strokeDashoffset={628 - (progress / 100) * 628}
        transform="rotate(-90 120 120)"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

export default function FileUpload({
  onUploadSuccess = () => {},
  onUploadError = () => {},
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  currentFile: initialFile = null,
  onFileRemove = () => {},
  uploadDelay = 600,
  validateFile = () => null,
  className,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(initialFile);
  const [status, setStatus] = useState<FileStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<FileError | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadIntervalRef = useRef<any>(null);

  useEffect(
    () => () => {
      if (uploadIntervalRef.current) {
        clearInterval(uploadIntervalRef.current);
      }
    },
    []
  );

  const validateFileSize = useCallback(
    (file: File): FileError | null => {
      if (file.size > maxFileSize) {
        return {
          message: `File size exceeds ${formatBytes(maxFileSize)}`,
          code: "FILE_TOO_LARGE",
        };
      }
      return null;
    },
    [maxFileSize]
  );

  const handleError = useCallback(
    (error: FileError) => {
      setError(error);
      setStatus("error");
      onUploadError?.(error);

      setTimeout(() => {
        setError(null);
        setStatus("idle");
      }, 3000);
    },
    [onUploadError]
  );

  const simulateUpload = useCallback(
    (uploadingFile: File) => {
      let currentProgress = 0;

      if (uploadIntervalRef.current) {
        clearInterval(uploadIntervalRef.current);
      }

      uploadIntervalRef.current = setInterval(
        () => {
          currentProgress += UPLOAD_STEP_SIZE;
          if (currentProgress >= 100) {
            if (uploadIntervalRef.current) {
              clearInterval(uploadIntervalRef.current);
            }
            setProgress(0);
            setStatus("idle");
            setFile(null);
            onUploadSuccess?.(uploadingFile);
          } else {
            setStatus((prevStatus) => {
              if (prevStatus === "uploading") {
                setProgress(currentProgress);
                return "uploading";
              }
              if (uploadIntervalRef.current) {
                clearInterval(uploadIntervalRef.current);
              }
              return prevStatus;
            });
          }
        },
        uploadDelay / (100 / UPLOAD_STEP_SIZE)
      );
    },
    [onUploadSuccess, uploadDelay]
  );

  const handleFileSelect = useCallback(
    (selectedFile: File | null) => {
      if (!selectedFile) return;

      setError(null);

      const sizeError = validateFileSize(selectedFile);
      if (sizeError) {
        handleError(sizeError);
        return;
      }

      const customError = validateFile?.(selectedFile);
      if (customError) {
        handleError(customError);
        return;
      }

      setFile(selectedFile);
      setStatus("uploading");
      setProgress(0);
      simulateUpload(selectedFile);
    },
    [simulateUpload, validateFileSize, validateFile, handleError]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setStatus((prev) => (prev !== "uploading" ? "dragging" : prev));
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setStatus((prev) => (prev === "dragging" ? "idle" : prev));
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (status === "uploading") return;
      setStatus("idle");
      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) handleFileSelect(droppedFile);
    },
    [status, handleFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      handleFileSelect(selectedFile || null);
      if (e.target) e.target.value = "";
    },
    [handleFileSelect]
  );

  const triggerFileInput = useCallback(() => {
    if (status === "uploading") return;
    fileInputRef.current?.click();
  }, [status]);

  const resetState = useCallback(() => {
    setFile(null);
    setStatus("idle");
    setProgress(0);
    if (onFileRemove) onFileRemove();
  }, [onFileRemove]);

  return (
    <div
      aria-label="File upload"
      className={cn("relative mx-auto w-full", className || "")}
      role="complementary"
    >
      <div className="group relative w-full rounded-2xl bg-obsidian-900 border border-obsidian-border p-1">
        <div className="relative w-full rounded-xl bg-obsidian-950/60 p-2">
          <div
            className={cn(
              "relative mx-auto w-full overflow-hidden rounded-lg border border-dashed border-obsidian-border bg-obsidian-900/40 hover:border-gold-500/50 transition-colors",
              error ? "border-rose-500/50" : ""
            )}
          >
            <div className="relative h-[160px]">
              <AnimatePresence mode="wait">
                {status === "idle" || status === "dragging" ? (
                  <motion.div
                    animate={{
                      opacity: status === "dragging" ? 0.8 : 1,
                      scale: status === "dragging" ? 0.98 : 1,
                    }}
                    className="absolute inset-0 flex flex-col items-center justify-center p-4 cursor-pointer"
                    exit={{ opacity: 0 }}
                    initial={{ opacity: 0 }}
                    key="dropzone"
                    onClick={triggerFileInput}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="mb-2">
                      <UploadIllustration />
                    </div>

                    <div className="mb-2 text-center">
                      <h3 className="font-semibold text-slate-100 text-xs">
                        Drop candidate PDF resume
                      </h3>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Client-side PDF extraction via pdfjs-dist
                      </p>
                    </div>

                    <button
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-gold-500/15 hover:bg-gold-500/25 border border-gold-500/30 px-3 py-1 font-semibold text-gold-400 text-xs transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerFileInput();
                      }}
                      type="button"
                    >
                      <span>Select PDF File</span>
                      <UploadCloud className="h-3.5 w-3.5" />
                    </button>

                    <input
                      accept=".pdf,application/pdf"
                      aria-label="File input"
                      className="sr-only"
                      onChange={handleFileInputChange}
                      ref={fileInputRef}
                      type="file"
                    />
                  </motion.div>
                ) : status === "uploading" ? (
                  <motion.div
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex flex-col items-center justify-center p-4"
                    exit={{ opacity: 0 }}
                    initial={{ opacity: 0 }}
                    key="uploading"
                  >
                    <div className="mb-2">
                      <UploadingAnimation progress={progress} />
                    </div>

                    <div className="mb-2 text-center">
                      <h3 className="truncate font-semibold text-slate-200 text-xs max-w-[200px]">
                        {file?.name}
                      </h3>
                      <span className="font-mono text-xs text-gold-400 font-bold">
                        {Math.round(progress)}% Parsing Vectors
                      </span>
                    </div>

                    <button
                      className="rounded-lg bg-obsidian-800 hover:bg-obsidian-700 border border-obsidian-border px-3 py-1 text-xs text-slate-300 font-medium"
                      onClick={resetState}
                      type="button"
                    >
                      Cancel
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 transform rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1"
                  exit={{ opacity: 0, y: -10 }}
                  initial={{ opacity: 0, y: 10 }}
                >
                  <p className="text-rose-400 text-xs">
                    {error.message}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
