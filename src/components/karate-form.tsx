"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Sparkles,
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

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 80 : -80,
    opacity: 0,
  }),
};

const staggerContainer = {
  center: {
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const fadeInUp = {
  enter: { opacity: 0, y: 12 },
  center: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

export function KarateDojoForm() {
  const [formData, setFormData] = useState<FormData>({});
  const [images, setImages] = useState<ImageData>({});
  const [currentSection, setCurrentSection] = useState(0);
  const [direction, setDirection] = useState(0);
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
      const defaults: FormData = {};
      FORM_FIELDS.forEach((f) => {
        if (f.defaultValue !== undefined) defaults[f.id] = f.defaultValue;
      });
      const today = new Date();
      defaults["signature_date"] = today.toISOString().split("T")[0];
      setFormData(defaults);
    }
    setImages(saved.images);
    setHasLoaded(true);
  }, []);

  // Auto-save
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
      const sectionFields = FORM_FIELDS.filter((f) => f.section === sectionId);
      const newErrors: Record<string, string> = {};
      for (const field of sectionFields) {
        if (field.required && !field.readOnly) {
          const value = formData[field.id]?.trim();
          if (!value) newErrors[field.id] = `${field.label} is required`;
        }
        if (field.type === "email" && formData[field.id]) {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData[field.id]))
            newErrors[field.id] = "Please enter a valid email address";
        }
        if (field.maxLength && formData[field.id]?.length > field.maxLength)
          newErrors[field.id] = `Maximum ${field.maxLength} characters allowed`;
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
        if (!formData[field.id]?.trim()) {
          allErrors[field.id] = `${field.label} is required`;
          valid = false;
        }
      }
    }
    if (!images.photo) {
      allErrors["photo"] = "Student photo is required";
      valid = false;
    }
    setErrors(allErrors);
    return valid;
  }, [formData, images]);

  const navigateTo = (idx: number) => {
    setDirection(idx > currentSection ? 1 : -1);
    setCurrentSection(idx);
  };

  const handleNext = () => {
    const section = FORM_SECTIONS[currentSection];
    if (validateSection(section.id)) {
      setDirection(1);
      setCurrentSection((prev) => Math.min(prev + 1, FORM_SECTIONS.length - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentSection((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGenerate = async () => {
    if (!validateAll()) {
      const firstError = Object.keys(errors)[0];
      if (firstError === "photo") {
        navigateTo(FORM_SECTIONS.length - 1);
      } else {
        const field = FORM_FIELDS.find((f) => f.id === firstError);
        if (field) {
          const idx = FORM_SECTIONS.findIndex((s) => s.id === field.section);
          if (idx >= 0) navigateTo(idx);
        }
      }
      return;
    }
    setIsGenerating(true);
    try {
      const pdfBytes = await fillPdfForm(formData, images);
      const name = formData["name_en"] || "Student";
      downloadPdf(pdfBytes, `HSTU_Karate_Dojo_Form_${name.replace(/\s+/g, "_")}.pdf`);
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
    if (!confirm("Are you sure? All data will be cleared.")) return;
    clearFormLocalStorage();
    const defaults: FormData = {};
    FORM_FIELDS.forEach((f) => {
      if (f.defaultValue !== undefined) defaults[f.id] = f.defaultValue;
    });
    defaults["signature_date"] = new Date().toISOString().split("T")[0];
    setFormData(defaults);
    setImages({});
    setErrors({});
    navigateTo(0);
  };

  const currentSectionData = FORM_SECTIONS[currentSection];
  const currentFields = useMemo(
    () => FORM_FIELDS.filter((f) => f.section === currentSectionData.id),
    [currentSectionData.id]
  );

  const getSectionCompletion = useCallback(
    (sectionId: string) => {
      const fields = FORM_FIELDS.filter(
        (f) => f.section === sectionId && f.required && !f.readOnly
      );
      if (fields.length === 0) return 100;
      const filled = fields.filter((f) => formData[f.id]?.trim()).length;
      return Math.round((filled / fields.length) * 100);
    },
    [formData]
  );

  const overallCompletion = useMemo(() => {
    const required = FORM_FIELDS.filter((f) => f.required && !f.readOnly);
    const filled = required.filter((f) => formData[f.id]?.trim()).length;
    const photo = images.photo ? 1 : 0;
    return Math.round(((filled + photo) / (required.length + 1)) * 100);
  }, [formData, images]);

  if (!hasLoaded) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Loader2 className="h-8 w-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full"
    >
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">
            Overall Progress
          </span>
          <span className="text-xs font-bold text-primary">
            {overallCompletion}%
          </span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-linear-to-r from-primary via-primary/80 to-accent"
            initial={{ width: 0 }}
            animate={{ width: `${overallCompletion}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Section Navigation */}
      <div className="mb-6 -mx-4 px-4 overflow-x-auto scrollbar-thin">
        <div className="flex gap-1.5 min-w-max pb-2">
          {FORM_SECTIONS.map((section, idx) => {
            const completion = getSectionCompletion(section.id);
            const isCurrent = idx === currentSection;
            const isComplete = completion === 100;
            return (
              <motion.button
                key={section.id}
                onClick={() => navigateTo(idx)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                  isCurrent
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : isComplete
                      ? "bg-green-500/10 text-green-700 hover:bg-green-500/15 dark:text-green-400"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                {SECTION_ICONS[section.id]}
                <span className="hidden sm:inline">{section.title}</span>
                {isComplete && !isCurrent && (
                  <CheckCircle2 className="h-3 w-3" />
                )}
                {isCurrent && (
                  <motion.div
                    layoutId="activeSection"
                    className="absolute inset-0 rounded-xl bg-primary -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Form Card */}
      <Card className="shadow-xl shadow-primary/5 border-border/50 bg-card/90 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <motion.div
              key={currentSectionData.id}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 text-primary"
            >
              {SECTION_ICONS[currentSectionData.id]}
            </motion.div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg sm:text-xl truncate">
                {currentSectionData.title}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Step {currentSection + 1} of {FORM_SECTIONS.length}
              </p>
            </div>
            <Badge
              variant={
                getSectionCompletion(currentSectionData.id) === 100
                  ? "default"
                  : "secondary"
              }
              className="shrink-0"
            >
              {getSectionCompletion(currentSectionData.id) === 100 ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Done
                </span>
              ) : (
                `${getSectionCompletion(currentSectionData.id)}%`
              )}
            </Badge>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6 pb-8 min-h-75">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentSectionData.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {currentSectionData.id !== "images" ? (
                <motion.div
                  variants={staggerContainer}
                  initial="enter"
                  animate="center"
                  className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5"
                >
                  {currentFields.map((field) => (
                    <motion.div key={field.id} variants={fadeInUp}>
                      <FormField
                        field={field}
                        value={formData[field.id] || ""}
                        onChange={(val) => updateField(field.id, val)}
                        error={errors[field.id]}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="enter"
                  animate="center"
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <motion.div variants={fadeInUp}>
                    <ImageUpload
                      type="photo"
                      value={images.photo}
                      onChange={(url) =>
                        setImages((prev) => ({ ...prev, photo: url }))
                      }
                    />
                  </motion.div>
                  <motion.div variants={fadeInUp}>
                    <ImageUpload
                      type="signature"
                      value={images.signature}
                      onChange={(url) =>
                        setImages((prev) => ({ ...prev, signature: url }))
                      }
                    />
                  </motion.div>
                  {errors["photo"] && (
                    <motion.div
                      variants={fadeInUp}
                      className="col-span-full flex items-center gap-2 text-destructive text-sm"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {errors["photo"]}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Navigation & Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
      >
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentSection === 0}
            className="flex-1 sm:flex-none gap-1 rounded-xl"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          {currentSection < FORM_SECTIONS.length - 1 ? (
            <Button
              onClick={handleNext}
              className="flex-1 sm:flex-none gap-1 rounded-xl"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1 sm:flex-none gap-1.5 rounded-xl bg-linear-to-r from-primary to-accent hover:opacity-90 text-white shadow-lg shadow-primary/20"
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

        <div className="flex gap-1 sm:ml-auto justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              saveFormToLocalStorage(formData, images);
              alert("Form saved! Your progress has been saved locally.");
            }}
            className="gap-1 text-xs text-muted-foreground rounded-xl"
          >
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadBlankForm}
            className="gap-1 text-xs text-muted-foreground rounded-xl"
          >
            <FileDown className="h-3.5 w-3.5" /> Blank Form
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-1 text-xs text-destructive hover:text-destructive rounded-xl"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
        </div>
      </motion.div>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <div className="flex items-center gap-3 bg-linear-to-r from-green-600 to-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl shadow-green-500/30">
              <Sparkles className="h-5 w-5" />
              <span className="font-medium text-sm">
                PDF generated successfully!
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// === Form Field Component ===

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
    <div className={`space-y-1.5 ${isFullWidth ? "md:col-span-2" : ""}`}>
      <Label
        htmlFor={fieldId}
        className="text-sm font-medium flex items-center gap-1.5 flex-wrap"
      >
        <span>{field.label}</span>
        {field.required && !field.readOnly && (
          <span className="text-destructive text-xs">*</span>
        )}
        {field.labelBn && (
          <span className="text-[11px] text-muted-foreground font-normal">
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
          className={`resize-none rounded-xl transition-shadow focus:shadow-md focus:shadow-primary/10 ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
          rows={3}
        />
      ) : field.type === "select" && field.options ? (
        <Select value={value} onValueChange={onChange} disabled={field.readOnly}>
          <SelectTrigger
            id={fieldId}
            className={`rounded-xl ${error ? "border-destructive focus:ring-destructive" : ""}`}
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
          type={
            field.type === "date"
              ? "date"
              : field.type === "tel"
                ? "tel"
                : field.type === "email"
                  ? "email"
                  : "text"
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          disabled={field.readOnly}
          className={`rounded-xl transition-shadow focus:shadow-md focus:shadow-primary/10 ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
        />
      )}

      {field.helpText && !error && (
        <p className="text-[11px] text-muted-foreground">{field.helpText}</p>
      )}

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

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-destructive flex items-center gap-1 overflow-hidden"
          >
            <AlertCircle className="h-3 w-3 shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
