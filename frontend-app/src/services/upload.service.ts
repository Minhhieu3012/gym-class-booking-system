import { apiClient } from "../core/api";

export interface UploadResponse {
  imageUrl: string;
  format: string;
  createdAt: string;
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await apiClient.post<UploadResponse>("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
}

export const UploadService = {
  uploadFile,
};

export default UploadService;
