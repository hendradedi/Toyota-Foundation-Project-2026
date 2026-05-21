/**
 * Upload Service
 * Handles file upload, compression, and storage for marketplace images
 */

import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config';
import { db } from '../database';
import logger from '../utils/logger';

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface UploadResult {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
  thumbnailPath: string | null;
  url: string;
  thumbnailUrl: string | null;
}

export interface UploadOptions {
  entityType: string;
  entityId?: string;
  maxFiles?: number;
  maxFileSize?: number;
  allowedTypes?: string[];
}

const DEFAULT_MAX_FILES = 5;
const DEFAULT_MAX_FILE_SIZE = config.upload.maxFileSize; // 5MB
const DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Ensure the upload directory exists
 */
const ensureUploadDir = (subDir: string): string => {
  const uploadPath = path.resolve(config.upload.storagePath, subDir);
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  return uploadPath;
};

/**
 * Generate a unique filename preserving the extension
 */
const generateFileName = (originalName: string): string => {
  const ext = path.extname(originalName).toLowerCase();
  const uniqueId = uuidv4();
  const timestamp = Date.now();
  return `${timestamp}-${uniqueId}${ext}`;
};

/**
 * Validate a single file against constraints
 */
export const validateFile = (
  file: UploadedFile,
  options: UploadOptions
): { valid: boolean; error?: string } => {
  const maxSize = options.maxFileSize || DEFAULT_MAX_FILE_SIZE;
  const allowedTypes = options.allowedTypes || DEFAULT_ALLOWED_TYPES;

  if (!allowedTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: `File type '${file.mimetype}' is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(maxSize / 1024 / 1024).toFixed(2)}MB)`,
    };
  }

  return { valid: true };
};

/**
 * Validate multiple files
 */
export const validateFiles = (
  files: UploadedFile[],
  options: UploadOptions
): { valid: boolean; error?: string } => {
  const maxFiles = options.maxFiles || DEFAULT_MAX_FILES;

  if (files.length > maxFiles) {
    return {
      valid: false,
      error: `Too many files. Maximum allowed: ${maxFiles}`,
    };
  }

  for (const file of files) {
    const result = validateFile(file, options);
    if (!result.valid) {
      return result;
    }
  }

  return { valid: true };
};

/**
 * Save a single file to disk and record in database
 */
export const saveFile = async (
  file: UploadedFile,
  uploaderId: string,
  options: UploadOptions
): Promise<UploadResult> => {
  const subDir = options.entityType;
  const uploadDir = ensureUploadDir(subDir);
  const fileName = generateFileName(file.originalname);
  const filePath = path.join(uploadDir, fileName);

  // Write file to disk
  fs.writeFileSync(filePath, file.buffer);

  // Generate relative path for storage in DB
  const relativeFilePath = path.join(subDir, fileName).replace(/\\/g, '/');
  const url = `/uploads/${relativeFilePath}`;

  // Record in database
  const id = uuidv4();
  await db.query(
    `INSERT INTO media_uploads (id, uploader_id, entity_type, entity_id, file_name, original_name, mime_type, file_size, file_path, is_active, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, CURRENT_TIMESTAMP)`,
    [
      id,
      uploaderId,
      options.entityType,
      options.entityId || null,
      fileName,
      file.originalname,
      file.mimetype,
      file.size,
      relativeFilePath,
    ]
  );

  logger.info(`File uploaded: ${fileName} by user ${uploaderId}`);

  return {
    id,
    fileName,
    originalName: file.originalname,
    mimeType: file.mimetype,
    fileSize: file.size,
    filePath: relativeFilePath,
    thumbnailPath: null,
    url,
    thumbnailUrl: null,
  };
};

/**
 * Save multiple files
 */
export const saveFiles = async (
  files: UploadedFile[],
  uploaderId: string,
  options: UploadOptions
): Promise<UploadResult[]> => {
  const results: UploadResult[] = [];

  for (const file of files) {
    const result = await saveFile(file, uploaderId, options);
    results.push(result);
  }

  return results;
};

/**
 * Delete a file from disk and mark as inactive in database
 */
export const deleteFile = async (fileId: string): Promise<boolean> => {
  try {
    const result = await db.query(
      `SELECT file_path FROM media_uploads WHERE id = $1 AND is_active = true`,
      [fileId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    const filePath = path.resolve(config.upload.storagePath, result.rows[0].file_path);

    // Remove from disk if exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Mark as inactive in database
    await db.query(
      `UPDATE media_uploads SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [fileId]
    );

    logger.info(`File deleted: ${fileId}`);
    return true;
  } catch (error) {
    logger.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Get files for a specific entity
 */
export const getFilesForEntity = async (
  entityType: string,
  entityId: string
): Promise<UploadResult[]> => {
  const result = await db.query(
    `SELECT id, file_name, original_name, mime_type, file_size, file_path, thumbnail_path
     FROM media_uploads
     WHERE entity_type = $1 AND entity_id = $2 AND is_active = true
     ORDER BY created_at ASC`,
    [entityType, entityId]
  );

  return result.rows.map((row: any) => ({
    id: row.id,
    fileName: row.file_name,
    originalName: row.original_name,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    filePath: row.file_path,
    thumbnailPath: row.thumbnail_path,
    url: `/uploads/${row.file_path}`,
    thumbnailUrl: row.thumbnail_path ? `/uploads/${row.thumbnail_path}` : null,
  }));
};

/**
 * Link uploaded files to an entity (e.g., after product creation)
 */
export const linkFilesToEntity = async (
  fileIds: string[],
  entityType: string,
  entityId: string
): Promise<void> => {
  if (fileIds.length === 0) return;

  const placeholders = fileIds.map((_, i) => `$${i + 1}`).join(', ');
  await db.query(
    `UPDATE media_uploads
     SET entity_id = $${fileIds.length + 1}, entity_type = $${fileIds.length + 2}, updated_at = CURRENT_TIMESTAMP
     WHERE id IN (${placeholders}) AND is_active = true`,
    [...fileIds, entityId, entityType]
  );
};

export const uploadService = {
  validateFile,
  validateFiles,
  saveFile,
  saveFiles,
  deleteFile,
  getFilesForEntity,
  linkFilesToEntity,
};

export default uploadService;
