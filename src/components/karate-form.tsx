"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Phone,
  GraduationCap,
  Users,
  Activity,
  Target,
  MapPin,
  Camera,
  Download,
  FileDown,
  RotateCcw,
  Save,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { ImageUpload } from "./image-upload";
import {
  FORM_FIELDS,
  FORM_SECTIONS,
  type FormFieldDef,
} from "@/lib/form-fields";
import {
  type FormData,
  type ImageData,
  fillPdfForm,
  downloadPdf,
  downloadBlankForm,
  saveFormToLocalStorage,
  loadFormFromLocalStorage,
  clearFormLocalStorage,
} from "@/lib/pdf-utils";

const SECTION_ICONS: Record<string, React.ReactNode> = {
  basic: <User className="h-4 w-4" />,
  contact: <Phone className="h-4 w-4" />,
  student: <GraduationCap className="h-4 w-4" />,
  family: <Users className="h-4 w-4" />,
  physical: <Activity className="h-4 w-4" />,
  activities: <Target className="h-4 w-4" />,
  branch: <MapPin className="h-4 w-4" />,
  images: <Camera className="h-4 w-4" />,
};

export function KarateDojoForm() {
  const [formData, setFormData] = useState<FormData>({});
  const [images, setImages] = useState<ImageData>({});
  const [currentSection, setCurrentSection] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Load saved data on mount
  useEffect(() => {
    const saved = loadFormFromLocalStorage();
    if (Object.keys(saved.formData).length > 0) {
      setFormData(saved.formData);
    } else {
      // Set defaults
      const defaults: FormData = {};
      FORM_FIELDS.forEach((f) => {
        if (f.defaultValue !== undefined) defaults[f.id] = f.defaultValue;
      });
      // Auto-fill signature date
      const today = new Date();
      defaults["signature_date"] = today.toISOString().split("T")[0];
      setFormData(defaults);
    }
    setImages(saved.images);
    setHasLoaded(true);
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    if (hasLoaded) {
      saveFormToLocalStorage(formData, images);
    }
  }, [formData, images, hasLoaded]);

  const updateField = useCallback((fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  }, []);

  const validateSection = useCallback(
    (sectionId: string): boolean => {
      const sectionFields = FORM_FIELDS.filter(
        (f) => f.section === sectionId
      );
      const newErrors: Record<string, string> = {};

      for (const field of sectionFields) {
        if (field.required && !field.readOnly) {
          const value = formData[field.id]?.trim();
          if (!value) {
            newErrors[field.id] = `${field.label} is required`;
          }
        }
        if (field.type === "email" && formData[field.id]) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(formData[field.id])) {
            newErrors[field.id] = "Please enter a valid email address";
          }
        }
        if (field.maxLength && formData[field.id]) {
          if (formData[field.id].length > field.maxLength) {
            newErrors[field.id] = `Maximum ${field.maxLength} characters allowed`;
          }
        }
      }

      setErrors((prev) => ({ ...prev, ...newErrors }));
      return Object.keys(newErrors).length === 0;
    },
    [formData]
  );

  const validateAll = useCallback((): boolean => {
    let valid = true;
    const allErrors: Record<string, string> = {};

    for (const field of FORM_FIELDS) {
      if (field.required && !field.readOnly) {
        const value = formData[field.id]?.trim();
        if (!value) {
          allErrors[field.id] = `${field.label} is required`;
          valid = false;
        }
      }
    }

    // Check photo
    if (!images.photo) {
      allErrors["photo"] = "Student photo is required";
      valid = false;
    }

    setErrors(allErrors);
    return valid;
  }, [formData, images]);

  const handleNext = () => {
    const section = FORM_SECTIONS[currentSection];
    if (validateSection(section.id)) {
      setCurrentSection((prev) => Math.min(prev + 1, FORM_SECTIONS.length - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    setCurrentSection((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGenerate = async () => {
    if (!validateAll()) {
      // Find the section with the first error
      const firstError = Object.keys(errors)[0];
      if (firstError === "photo") {
        setCurrentSection(FORM_SECTIONS.length - 1);
      } else {
        const field = FORM_FIELDS.find((f) => f.id === firstError);
        if (field) {
          const sectionIdx = FORM_SECTIONS.findIndex(
            (s) => s.id === field.section
          );
          if (sectionIdx >= 0) setCurrentSection(sectionIdx);
        }
      }
      return;
    }

    setIsGenerating(true);
    try {
      const pdfBytes = await fillPdfForm(formData, images);
      const studentName = formData["name_en"] || "Student";
      const filename = `HSTU_Karate_Dojo_Form_${studentName.replace(/\s+/g, "_")}.pdf`;
      downloadPdf(pdfBytes, filename);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Error generating PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    if (
      confirm(
        "Are you sure you want to reset the form? All data will be cleared."
      )
    ) {
      clearFormLocalStorage();
      const defaults: FormData = {};
      FORM_FIELDS.forEach((f) => {
        if (f.defaultValue !== undefined) defaults[f.id] = f.defaultValue;
      });
      const today = new Date();
      defaults["signature_date"] = today.toISOString().split("T")[0];
      setFormData(defaults);
      setImages({});
      setErrors({});
      setCurrentSection(0);
    }
  };

  // Group fields by current section
  const currentSectionData = FORM_SECTIONS[currentSection];
  const currentFields = useMemo(
    () => FORM_FIELDS.filter((f) => f.section === currentSectionData.id),
    [currentSectionData.id]
  );

  // Calculate section completion
  const getSectionCompletion = useCallback(
    (sectionId: string) => {
      const fields = FORM_FIELDS.filter(
        (f) => f.section === sectionId && f.required && !f.readOnly
      );
      if (fields.length === 0) return 100;
      const filled = fields.filter(
        (f) => formData[f.id]?.trim()
      ).length;
      return Math.round((filled / fields.length) * 100);
    },
    [formData]
  );

  const overallCompletion = useMemo(() => {
    const requiredFields = FORM_FIELDS.filter(
      (f) => f.required && !f.readOnly
    );
    const filled = requiredFields.filter(
      (f) => formData[f.id]?.trim()
    ).length;
    const photoFilled = images.photo ? 1 : 0;
    return Math.round(
      ((filled + photoFilled) / (requiredFields.length + 1)) * 100
    );
  }, [formData, images]);

  if (!hasLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Overall Progress
          </span>
          <span className="text-sm font-bold text-primary">
            {overallCompletion}%
          </span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${overallCompletion}%` }}
          />
        </div>
      </div>

      {/* Section Navigation */}
      <div className="mb-6 overflow-x-auto scrollbar-thin">
        <div className="flex gap-1.5 min-w-max pb-2">
          {FORM_SECTIONS.map((section, idx) => {
            const completion = getSectionCompletion(section.id);
            const isCurrent = idx === currentSection;
            const isComplete = completion === 100;

            return (
              <button
                key={section.id}
                onClick={() => setCurrentSection(idx)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isCurrent
                    ? "bg-primary text-primary-foreground shadow-md scale-105"
                    : isComplete
                      ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {SECTION_ICONS[section.id]}
                <span className="hidden sm:inline">{section.title}</span>
                {isComplete && !isCurrent && (
                  <CheckCircle2 className="h-3 w-3" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Section */}
      <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {SECTION_ICONS[currentSectionData.id]}
            </div>
            <div>
              <CardTitle className="text-xl">
                {currentSectionData.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Step {currentSection + 1} of {FORM_SECTIONS.length}
              </p>
            </div>
            <Badge
              variant={
                getSectionCompletion(currentSectionData.id) === 100
                  ? "default"
                  : "secondary"
              }
              className="ml-auto"
            >
              {getSectionCompletion(currentSectionData.id)}% complete
            </Badge>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          {currentSectionData.id !== "images" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              {currentFields.map((field) => (
                <FormField
                  key={field.id}
                  field={field}
                  value={formData[field.id] || ""}
                  onChange={(val) => updateField(field.id, val)}
                  error={errors[field.id]}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ImageUpload
                type="photo"
                value={images.photo}
                onChange={(url) =>
                  setImages((prev) => ({ ...prev, photo: url }))
                }
              />
              <ImageUpload
                type="signature"
                value={images.signature}
                onChange={(url) =>
                  setImages((prev) => ({ ...prev, signature: url }))
                }
              />
              {errors["photo"] && (
                <div className="col-span-full flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {errors["photo"]}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation & Actions */}
      <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentSection === 0}
            className="flex-1 sm:flex-none gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          {currentSection < FORM_SECTIONS.length - 1 ? (
            <Button
              onClick={handleNext}
              className="flex-1 sm:flex-none gap-1"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1 sm:flex-none gap-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" /> Download Filled Form
                </>
              )}
            </Button>
          )}
        </div>

        <div className="flex gap-2 ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              saveFormToLocalStorage(formData, images);
              alert("Form saved! Your progress has been saved locally.");
            }}
            className="gap-1 text-muted-foreground"
          >
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadBlankForm}
            className="gap-1 text-muted-foreground"
          >
            <FileDown className="h-3.5 w-3.5" /> Blank Form
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-1 text-destructive hover:text-destructive"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
        </div>
      </div>

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-center gap-3 bg-green-600 text-white px-5 py-3 rounded-xl shadow-2xl">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">
              PDF generated and downloaded successfully!
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// === Individual Form Field Component ===

function FormField({
  field,
  value,
  onChange,
  error,
}: {
  field: FormFieldDef;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const fieldId = `field-${field.id}`;
  const isFullWidth =
    field.type === "textarea" ||
    field.id === "present_address" ||
    field.id === "permanent_address";

  return (
    <div
      className={`space-y-1.5 ${isFullWidth ? "md:col-span-2" : ""}`}
    >
      <Label htmlFor={fieldId} className="text-sm font-medium flex items-center gap-2">
        {field.label}
        {field.required && !field.readOnly && (
          <span className="text-destructive text-xs">*</span>
        )}
        {field.labelBn && (
          <span className="text-xs text-muted-foreground font-normal">
            ({field.labelBn})
          </span>
        )}
      </Label>

      {field.type === "textarea" ? (
        <Textarea
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          disabled={field.readOnly}
          className={`resize-none ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
          rows={3}
        />
      ) : field.type === "select" && field.options ? (
        <Select value={value} onValueChange={onChange} disabled={field.readOnly}>
          <SelectTrigger
            id={fieldId}
            className={error ? "border-destructive focus:ring-destructive" : ""}
          >
            <SelectValue placeholder={field.placeholder || "Select..."} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={fieldId}
          type={field.type === "date" ? "date" : field.type === "tel" ? "tel" : field.type === "email" ? "email" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          disabled={field.readOnly}
          className={error ? "border-destructive focus-visible:ring-destructive" : ""}
        />
      )}

      {/* Help text */}
      {field.helpText && !error && (
        <p className="text-[11px] text-muted-foreground">{field.helpText}</p>
      )}

      {/* Character count for textarea */}
      {field.type === "textarea" && field.maxLength && (
        <p
          className={`text-[11px] text-right ${
            value.length > field.maxLength
              ? "text-destructive"
              : "text-muted-foreground"
          }`}
        >
          {value.length}/{field.maxLength}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}
