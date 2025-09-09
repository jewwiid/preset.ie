/**
 * Attachment types allowed in messages
 */
export enum AttachmentType {
  IMAGE = 'image',
  VIDEO = 'video',
  PDF = 'pdf',
  OTHER = 'other'
}

/**
 * Value object for message attachments
 */
export class Attachment {
  private static readonly MAX_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  private static readonly ALLOWED_VIDEO_TYPES = ['mp4', 'mov', 'avi', 'webm'];
  private static readonly ALLOWED_DOC_TYPES = ['pdf'];

  constructor(
    private readonly url: string,
    private readonly type: AttachmentType,
    private readonly size: number,
    private readonly filename: string,
    private readonly mimeType?: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.url) {
      throw new Error('Attachment URL is required');
    }

    if (!this.filename) {
      throw new Error('Attachment filename is required');
    }

    if (this.size <= 0) {
      throw new Error('Invalid attachment size');
    }

    if (this.size > Attachment.MAX_SIZE) {
      throw new Error(`Attachment size cannot exceed ${Attachment.MAX_SIZE / 1024 / 1024}MB`);
    }

    // Validate file extension matches type
    const extension = this.filename.split('.').pop()?.toLowerCase();
    if (!extension) {
      throw new Error('Attachment must have a file extension');
    }

    switch (this.type) {
      case AttachmentType.IMAGE:
        if (!Attachment.ALLOWED_IMAGE_TYPES.includes(extension)) {
          throw new Error(`Invalid image type: ${extension}`);
        }
        break;
      case AttachmentType.VIDEO:
        if (!Attachment.ALLOWED_VIDEO_TYPES.includes(extension)) {
          throw new Error(`Invalid video type: ${extension}`);
        }
        break;
      case AttachmentType.PDF:
        if (!Attachment.ALLOWED_DOC_TYPES.includes(extension)) {
          throw new Error(`Invalid document type: ${extension}`);
        }
        break;
    }
  }

  getUrl(): string {
    return this.url;
  }

  getType(): AttachmentType {
    return this.type;
  }

  getSize(): number {
    return this.size;
  }

  getSizeInMB(): number {
    return this.size / (1024 * 1024);
  }

  getFilename(): string {
    return this.filename;
  }

  getMimeType(): string | undefined {
    return this.mimeType;
  }

  isImage(): boolean {
    return this.type === AttachmentType.IMAGE;
  }

  isVideo(): boolean {
    return this.type === AttachmentType.VIDEO;
  }

  isPDF(): boolean {
    return this.type === AttachmentType.PDF;
  }

  /**
   * Get file extension
   */
  getExtension(): string {
    return this.filename.split('.').pop()?.toLowerCase() || '';
  }

  toJSON() {
    return {
      url: this.url,
      type: this.type,
      size: this.size,
      filename: this.filename,
      mimeType: this.mimeType
    };
  }

  equals(other: Attachment): boolean {
    return this.url === other.url &&
           this.type === other.type &&
           this.filename === other.filename;
  }

  /**
   * Create attachment from file metadata
   */
  static fromFile(file: {
    url: string;
    name: string;
    size: number;
    type: string;
  }): Attachment {
    // Determine attachment type from MIME type
    let attachmentType = AttachmentType.OTHER;
    
    if (file.type.startsWith('image/')) {
      attachmentType = AttachmentType.IMAGE;
    } else if (file.type.startsWith('video/')) {
      attachmentType = AttachmentType.VIDEO;
    } else if (file.type === 'application/pdf') {
      attachmentType = AttachmentType.PDF;
    }

    return new Attachment(
      file.url,
      attachmentType,
      file.size,
      file.name,
      file.type
    );
  }
}