"use client";

import React, { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  X,
  AlertTriangle,
  CheckCircle2,
  Camera,
  FileSignature,
  Info,
} from "lucide-react";
import {
  validateImage,
  readFileAsDataUrl,
  type ImageValidationResult,
} from "@/lib/pdf-utils";

interface ImageUploadProps {
  type: "photo" | "signature";
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
}

export function ImageUpload({ type, value, onChange }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [validation, setValidation] = useState<ImageValidationResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isPhoto = type === "photo";
  const Icon = isPhoto ? Camera : FileSignature;

  const handleFile = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      const result = await validateImage(file, type);
      setValidation(result);
      if (result.valid) {
        const dataUrl = await readFileAsDataUrl(file);
        onChange(dataUrl);
      }
      setIsProcessing(false);
    },
    [type, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleRemove = () => {
    onChange(undefined);
    setValidation(null);
  };

  return (
    <Card className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <h3 className="font-semibold text-sm">
            {isPhoto ? "Student Photo" : "Student Signature"}
          </h3>
          {isPhoto ? (
            <Badge variant="destructive" className="text-[10px] ml-auto">
              Required
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px] ml-auto">
              Optional
            </Badge>
          )}
        </div>

        {/* Info */}
        <div className="flex items-start gap-2 mb-3 p-2.5 rounded-xl bg-muted/50 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <div>
            {isPhoto ? (
              <>
                Upload a <strong>passport-size photo</strong> (portrait).
                <br />
                JPG or PNG • Max 5MB • Min 150×180px
              </>
            ) : (
              <>
                Upload your <strong>signature image</strong>.
                <br />
                JPG or PNG • Max 2MB • Any clear signature
              </>
            )}
          </div>
        </div>

        {/* Upload Area */}
        <AnimatePresence mode="wait">
          {!value ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`relative border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.02]"
                  : "border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/20"
              } ${
                isPhoto
                  ? "aspect-3/4 max-w-40 mx-auto"
                  : "aspect-3/1 max-w-70 mx-auto"
              }`}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3">
                {isProcessing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="rounded-full h-8 w-8 border-2 border-primary border-t-transparent"
                  />
                ) : (
                  <>
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    >
                      <Upload className="h-7 w-7 text-muted-foreground/40" />
                    </motion.div>
                    <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                      <span className="font-medium text-primary">
                        Click to upload
                      </span>
                      <br />
                      or drag & drop
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative group"
            >
              <div
                className={`relative overflow-hidden rounded-xl border border-border/50 bg-muted/10 ${
                  isPhoto
                    ? "aspect-3/4 max-w-40 mx-auto"
                    : "aspect-3/1 max-w-70 mx-auto"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={value}
                  alt={isPhoto ? "Student photo" : "Signature"}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove();
                    }}
                    className="gap-1 rounded-lg shadow-lg"
                  >
                    <X className="h-3.5 w-3.5" /> Remove
                  </Button>
                </div>
              </div>
              {validation?.dimensions && (
                <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                  {validation.dimensions.width}×{validation.dimensions.height}px
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          onChange={handleInputChange}
          className="hidden"
        />

        {/* Validation Messages */}
        <AnimatePresence>
          {validation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-1.5 overflow-hidden"
            >
              {validation.errors.map((err, i) => (
                <div
                  key={`err-${i}`}
                  className="flex items-start gap-1.5 text-xs text-destructive"
                >
                  <X className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{err}</span>
                </div>
              ))}
              {validation.warnings.map((warn, i) => (
                <div
                  key={`warn-${i}`}
                  className="flex items-start gap-1.5 text-xs text-amber-600"
                >
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{warn}</span>
                </div>
              ))}
              {validation.valid && validation.errors.length === 0 && (
                <div className="flex items-center gap-1.5 text-xs text-green-600">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>Image looks good!</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
