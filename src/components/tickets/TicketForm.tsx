"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AREA_OPTIONS } from "@/types";
import {
  Paperclip,
  Send,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Copy,
  Check,
  X,
  FileText,
} from "lucide-react";

const schema = z.object({
  requester_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  requester_email: z.string().email("Email inválido"),
  area: z.string().min(1, "Seleccioná un área"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  category: z.enum(["hardware", "software", "internet", "printers", "systems", "users", "ecommerce", "other"]),
  title: z.string().min(5, "El título debe tener al menos 5 caracteres"),
  description: z.string().min(20, "La descripción debe tener al menos 20 caracteres"),
});

type FormData = z.infer<typeof schema>;

interface AttachedFile {
  file: File;
  preview: string | null; // object URL for images, null for PDFs
}

export function TicketForm() {
  const [success, setSuccess] = useState<{ ticket_number: string; id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: "medium", category: "software" },
  });

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    setUploadError(null);
    const next: AttachedFile[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`"${file.name}" supera el límite de 5 MB`);
        continue;
      }
      const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
      if (!allowed.includes(file.type)) {
        setUploadError(`"${file.name}" no es un tipo permitido (JPG, PNG, GIF, WEBP, PDF)`);
        continue;
      }
      const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
      next.push({ file, preview });
    }
    setAttachedFiles((prev) => [...prev, ...next]);
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => {
      const copy = [...prev];
      const removed = copy.splice(index, 1)[0];
      if (removed.preview) URL.revokeObjectURL(removed.preview);
      return copy;
    });
  };

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      // Upload attachments first
      const urls: string[] = [];
      for (const { file } of attachedFiles) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/attachments", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Error al subir adjunto");
        urls.push(json.url);
      }

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, attachments: urls }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al crear el ticket");
      setSuccess({ ticket_number: json.ticket_number, id: json.id });
      setAttachedFiles([]);
      reset();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    }
  };

  const copyTicketNumber = async () => {
    if (!success) return;
    await navigator.clipboard.writeText(success.ticket_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (success) {
    return (
      <div className="text-center py-10 animate-fade-in">
        <div className="w-18 h-18 rounded-full bg-[#00e5a0]/10 border-2 border-[#00e5a0]/30 flex items-center justify-center mx-auto mb-5" style={{ width: 72, height: 72 }}>
          <CheckCircle2 className="w-9 h-9 text-[#00e5a0]" />
        </div>
        <h3 className="text-xl font-bold text-[#f8fafc] mb-1.5">
          ¡Ticket creado!
        </h3>
        <p className="text-sm text-[#64748b] mb-5">Tu número de ticket es</p>

        <button
          onClick={copyTicketNumber}
          className="group inline-flex items-center gap-3 bg-[#1a1a2e] border border-[#00e5a0]/25 hover:border-[#00e5a0]/50 rounded-2xl px-6 py-4 mb-5 transition-colors"
          title="Copiar número de ticket"
        >
          <p className="text-2xl font-mono font-bold text-[#00e5a0]">
            {success.ticket_number}
          </p>
          {copied ? (
            <Check className="w-4 h-4 text-[#00e5a0]" />
          ) : (
            <Copy className="w-4 h-4 text-[#334155] group-hover:text-[#64748b] transition-colors" />
          )}
        </button>

        <p className="text-sm text-[#475569] mb-6 leading-relaxed">
          Recibiste un email de confirmación con los detalles.
          <br />
          Nuestro equipo técnico lo atenderá a la brevedad.
        </p>
        <Button onClick={() => setSuccess(null)} variant="secondary">
          <RotateCcw className="w-4 h-4" />
          Crear otro ticket
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Personal info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Nombre completo *"
          placeholder="Juan García"
          error={errors.requester_name?.message}
          autoComplete="name"
          {...register("requester_name")}
        />
        <Input
          label="Email *"
          type="email"
          placeholder="juan@empresa.com"
          error={errors.requester_email?.message}
          autoComplete="email"
          {...register("requester_email")}
        />
      </div>

      <Select
        label="Área / Sector *"
        error={errors.area?.message}
        {...register("area")}
      >
        <option value="">Seleccionar área</option>
        {AREA_OPTIONS.map((area) => (
          <option key={area} value={area}>
            {area}
          </option>
        ))}
      </Select>

      <div className="grid grid-cols-2 gap-4">
        <Select label="Prioridad *" {...register("priority")}>
          <option value="low">Baja</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
          <option value="urgent">Urgente</option>
        </Select>

        <Select label="Categoría *" {...register("category")}>
          <option value="hardware">Hardware</option>
          <option value="software">Software</option>
          <option value="internet">Internet</option>
          <option value="printers">Impresoras</option>
          <option value="systems">Sistemas</option>
          <option value="users">Usuarios</option>
          <option value="ecommerce">E-Commerce</option>
          <option value="other">Otro</option>
        </Select>
      </div>

      <Input
        label="Título del problema *"
        placeholder="Ej: No puedo acceder al sistema de facturación"
        error={errors.title?.message}
        {...register("title")}
      />

      <Textarea
        label="Descripción detallada *"
        placeholder="¿Qué estabas haciendo? ¿Qué error aparece? ¿Desde cuándo ocurre?"
        rows={4}
        error={errors.description?.message}
        {...register("description")}
      />

      {/* File attachments */}
      <div>
        <input
          id="ticket-file-input"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
          className="sr-only"
          onChange={(e) => addFiles(e.target.files)}
        />
        <label
          htmlFor="ticket-file-input"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-white/10 text-[#475569] text-sm hover:border-[#00e5a0]/30 hover:text-[#64748b] transition-colors cursor-pointer"
        >
          <Paperclip className="w-4 h-4 flex-shrink-0" />
          <span>Adjuntar imágenes o PDF (máx. 5 MB c/u)</span>
        </label>

        {uploadError && (
          <p className="text-xs text-red-400 mt-1.5 px-1">{uploadError}</p>
        )}

        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {attachedFiles.map(({ file, preview }, i) => (
              <div
                key={i}
                className="relative group w-20 h-20 rounded-xl overflow-hidden border border-white/10 bg-[#1a1a2e] flex items-center justify-center"
              >
                {preview ? (
                  <Image
                    src={preview}
                    alt={file.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 p-1">
                    <FileText className="w-6 h-6 text-[#475569]" />
                    <span className="text-[9px] text-[#475569] text-center leading-tight line-clamp-2">
                      {file.name}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        loading={isSubmitting}
        className="w-full"
      >
        <Send className="w-4 h-4" />
        Enviar Ticket de Soporte
      </Button>
    </form>
  );
}
