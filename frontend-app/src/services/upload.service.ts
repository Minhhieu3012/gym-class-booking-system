import { axiosInstance } from "../core/api";

/**
 * Phản hồi trả về từ API POST /upload sau khi tải tệp lên thành công.
 */
export interface UploadResponse {
  /** Đường dẫn URL công khai của hình ảnh được lưu trữ */
  imageUrl: string;
  /** Định dạng định dạng của tệp (ví dụ: png, jpg, webp) */
  format: string;
  /** Thời gian tạo tệp (định dạng ISO 8601) */
  createdAt: string;
}

/**
 * Tải một tệp tin (hình ảnh) lên hệ thống Cloudinary qua backend API.
 *
 * @param file - File hình ảnh cần tải lên
 * @returns Promise chứa dữ liệu {@link UploadResponse}
 */
export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  // TODO(mock-pending-api): chờ BE hoàn thiện UploadController — xem api-contract.md mục 21
  const { data } = await axiosInstance.post<UploadResponse>("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
}

/**
 * Service xử lý tải tệp tin và ảnh lên Cloudinary qua Backend.
 */
export const UploadService = {
  uploadFile,
};

export default UploadService;
