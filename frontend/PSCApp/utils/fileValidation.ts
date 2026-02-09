// File validation utilities for bulk upload

// Valid MIME types for bulk upload
export const VALID_UPLOAD_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
] as const;

// Valid file extensions for bulk upload
export const VALID_UPLOAD_EXTENSIONS = [".pdf", ".xlsx", ".xls"] as const;

// Maximum file size in bytes (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Validates if a file is a valid upload file (PDF or Excel)
 * @param file - The file to validate
 * @returns An object with isValid boolean and error message if invalid
 */
export function validateUploadFile(file: { name: string; type?: string; size?: number }): {
  isValid: boolean;
  error?: string;
} {
  const fileName = file.name.toLowerCase();
  const hasValidExtension = VALID_UPLOAD_EXTENSIONS.some(ext => fileName.endsWith(ext));
  const hasValidType = file.type ? VALID_UPLOAD_MIME_TYPES.includes(file.type as typeof VALID_UPLOAD_MIME_TYPES[number]) : false;

  if (!hasValidExtension && !hasValidType) {
    return {
      isValid: false,
      error: "Invalid file type. Only PDF (.pdf) or Excel (.xlsx, .xls) files are allowed.",
    };
  }

  if (file.size && file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds maximum allowed (${MAX_FILE_SIZE / 1024 / 1024}MB).`,
    };
  }

  return { isValid: true };
}

/**
 * Gets human-readable file type from file name
 */
export function getFileType(fileName: string): "pdf" | "excel" | "unknown" {
  const name = fileName.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return "excel";
  return "unknown";
}
