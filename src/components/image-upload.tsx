"use client";

import React, { useRef, useState, useCallback } from "react";
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
  const [validation, setValidation] = useState<ImageValidationResult | null>(
    null
  );
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
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleRemove = () => {
    onChange(undefined);
    setValidation(null);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-sm">
            {isPhoto ? "Student Photo" : "Signature"}
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

        {/* Info box */}
        <div className="flex items-start gap-2 mb-3 p-2 rounded-md bg-muted/50 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <div>
            {isPhoto ? (
              <>
                Upload a <strong>passport-size photo</strong> (portrait
                orientation).
                <br />
                Formats: JPG, PNG • Max: 5MB • Min: 150×180px
              </>
            ) : (
              <>
                Upload your <strong>signature image</strong> (landscape
                orientation).
                <br />
                Formats: JPG, PNG • Max: 2MB • Min: 100×30px
              </>
            )}
          </div>
        </div>

        {/* Upload Area */}
        {!value ? (
          <div
            className={`relative border-2 border-dashed rounded-lg transition-all cursor-pointer ${
              isDragging
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
            } ${isPhoto ? "aspect-[3/4] max-w-[180px] mx-auto" : "aspect-[3/1] max-w-[300px] mx-auto"}`}
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-xs text-muted-foreground text-center">
                    <span className="font-medium text-primary">
                      Click to upload
                    </span>{" "}
                    or drag & drop
                  </p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="relative group">
            <div
              className={`relative overflow-hidden rounded-lg border bg-muted/20 ${
                isPhoto
                  ? "aspect-[3/4] max-w-[180px] mx-auto"
                  : "aspect-[3/1] max-w-[300px] mx-auto"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt={isPhoto ? "Student photo" : "Signature"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                  className="gap-1"
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
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          onChange={handleInputChange}
          className="hidden"
        />

        {/* Validation Messages */}
        {validation && (
          <div className="mt-3 space-y-1.5">
            {validation.errors.map((err, i) => (
              <div
                key={i}
                className="flex items-start gap-1.5 text-xs text-destructive"
              >
                <X className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{err}</span>
              </div>
            ))}
            {validation.warnings.map((warn, i) => (
              <div
                key={i}
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
