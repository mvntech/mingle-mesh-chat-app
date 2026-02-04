import { z } from 'zod';

export const messageSchema = z.object({
    content: z.string()
        .min(1, 'Message cannot be empty')
        .max(5000, 'Message too long (max 5000 characters)')
        .optional(),
    fileUrl: z.string().url('Invalid file URL').optional(),
    fileType: z.enum(['image', 'video', 'document']).optional(),
    fileName: z.string().max(255, 'File name too long').optional(),
}).refine(
    (data) => data.content || data.fileUrl,
    { message: 'Message must have content or a file' }
);

export const fileUploadSchema = z.object({
    file: z.instanceof(File)
        .refine((file) => file.size <= 10 * 1024 * 1024, 'File too large (max 10MB)')
        .refine(
            (file) => [
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/webp',
                'video/mp4',
                'video/webm',
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ].includes(file.type),
            'Invalid file type. Allowed: images (JPEG, PNG, GIF, WebP), videos (MP4, WebM), documents (PDF, DOC, DOCX)'
        ),
});

export const userSearchSchema = z.object({
    search: z.string()
        .min(2, 'Search term must be at least 2 characters')
        .max(50, 'Search term too long')
        .optional(),
});

export const createChatSchema = z.object({
    participantIds: z.array(z.string()).min(1, 'At least one participant required'),
    name: z.string().max(100, 'Chat name too long').optional(),
    isGroupChat: z.boolean().optional(),
}).refine(
    (data) => {
        if (data.isGroupChat && !data.name) {
            return false;
        }
        return true;
    },
    { message: 'Group chats must have a name' }
);

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean;
    data?: T;
    error?: string;
} {
    try {
        const result = schema.parse(data);
        return { success: true, data: result };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const firstError = error.errors[0];
            return {
                success: false,
                error: firstError.message
            };
        }
        return {
            success: false,
            error: 'Validation failed'
        };
    }
}
