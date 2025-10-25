/**
 * Chunked Upload Hook
 * Handles splitting and uploading large video files in 10MB chunks
 * with automatic retry logic for failed chunks
 */

import { useCallback, useState } from 'react';
import { uploadApi } from '../lib/api';

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

interface UploadProgress {
    uploadedChunks: number;
    totalChunks: number;
    percentage: number;
    isUploading: boolean;
    isComplete: boolean;
    error: string | null;
}

export const useChunkedUpload = () => {
    const [progress, setProgress] = useState<UploadProgress>({
        uploadedChunks: 0,
        totalChunks: 0,
        percentage: 0,
        isUploading: false,
        isComplete: false,
        error: null
    });

    const uploadVideo = useCallback(async (
        file: File,
        matchId: string,
        teamId: string
    ) => {
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

        setProgress({
            uploadedChunks: 0,
            totalChunks,
            percentage: 0,
            isUploading: true,
            isComplete: false,
            error: null
        });

        try {
            for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
                const start = chunkIndex * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, file.size);
                const chunk = file.slice(start, end);

                let retries = 0;
                const maxRetries = 3;

                while (retries < maxRetries) {
                    try {
                        await uploadApi.uploadChunk(chunk, chunkIndex, totalChunks, matchId, teamId);
                        break;
                    } catch (error) {
                        retries++;
                        if (retries === maxRetries) throw error;
                        // Exponential backoff: wait 1s, 2s, 3s
                        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
                    }
                }

                const uploadedChunks = chunkIndex + 1;
                const percentage = Math.round((uploadedChunks / totalChunks) * 100);

                setProgress({
                    uploadedChunks,
                    totalChunks,
                    percentage,
                    isUploading: true,
                    isComplete: false,
                    error: null
                });
            }

            setProgress(prev => ({
                ...prev,
                isUploading: false,
                isComplete: true
            }));

            return true;
        } catch (error) {
            setProgress(prev => ({
                ...prev,
                isUploading: false,
                error: error instanceof Error ? error.message : 'Upload failed'
            }));
            return false;
        }
    }, []);

    const reset = useCallback(() => {
        setProgress({
            uploadedChunks: 0,
            totalChunks: 0,
            percentage: 0,
            isUploading: false,
            isComplete: false,
            error: null
        });
    }, []);

    return { progress, uploadVideo, reset };
};
