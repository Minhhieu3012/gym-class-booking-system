import type { AxiosError } from "axios";
import {
  apiClient,
  setSession,
  clearAuthAndRedirect,
} from "../core/api";
import type {
  LoginRequest,
  LoginResponse,
  RegisterMemberRequest,
  RegisterMemberResponse,
  RegisterTrainerRequest,
  RegisterTrainerResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  MessageResponse,
  UserProfile,
} from "../models/auth";

export const authService = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>(
      "/auth/login",
      payload,
    );
    setSession(data);
    return data;
  },

  async registerMember(
    payload: RegisterMemberRequest,
  ): Promise<RegisterMemberResponse> {
    const { data } = await apiClient.post<RegisterMemberResponse>(
      "/auth/register",
      payload,
    );
    return data;
  },

  async registerTrainer(
    payload: RegisterTrainerRequest,
  ): Promise<RegisterTrainerResponse> {
    const { data } = await apiClient.post<RegisterTrainerResponse>(
      "/auth/register-trainer",
      payload,
    );
    return data;
  },

  async forgotPassword(
    payload: ForgotPasswordRequest,
  ): Promise<MessageResponse> {
    const { data } = await apiClient.post<MessageResponse>(
      "/auth/forgot-password",
      payload,
    );
    return data;
  },

  async resetPassword(
    payload: ResetPasswordRequest,
  ): Promise<MessageResponse> {
    const { data } = await apiClient.post<MessageResponse>(
      "/auth/reset-password",
      payload,
    );
    return data;
  },

  async getMe(): Promise<UserProfile> {
    const { data } = await apiClient.get<UserProfile>("/auth/me");
    return data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      clearAuthAndRedirect();
    }
  },

  extractErrorMessage(error: unknown): string {
    const details = this.extractErrorDetails(error);
    if (details.details.length > 0) {
      return details.details.join(", ");
    }
    return details.message;
  },

  extractErrorDetails(error: unknown): {
    title: string;
    message: string;
    details: string[];
  } {
    const err = error as AxiosError<any>;

    if (err.response?.data) {
      const data = err.response.data;

      if (typeof data === "string") {
        return {
          title: "Thông báo lỗi",
          message: data,
          details: [],
        };
      }

      const details: string[] = [];

      // 1. Check validation errors (field-level)
      const validationErrors = data.errors;
      if (validationErrors) {
        if (typeof validationErrors === "object" && !Array.isArray(validationErrors)) {
          for (const [field, val] of Object.entries(validationErrors)) {
            const rawMsg = typeof val === "string" ? val : JSON.stringify(val);
            if (field === "phone") {
              details.push(
                "Số điện thoại phải gồm 10–11 chữ số, bắt đầu bằng số 0 (ví dụ: 0912345678)."
              );
            } else if (field === "password") {
              details.push(
                "Mật khẩu tối thiểu 6 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (@$!%*?&)."
              );
            } else if (field === "email") {
              details.push("Địa chỉ email không đúng định dạng.");
            } else if (field === "fullName") {
              details.push("Họ và tên không được để trống.");
            } else if (field === "specialization") {
              details.push("Chuyên môn huấn luyện không được để trống.");
            } else if (field === "experienceYears") {
              details.push("Số năm kinh nghiệm không được nhỏ hơn 0.");
            } else if (field === "hourlyFee") {
              details.push("Mức phí theo giờ không được nhỏ hơn 0.");
            } else if (field === "bio") {
              details.push("Thông tin giới thiệu bản thân không được để trống.");
            } else {
              details.push(rawMsg);
            }
          }
        } else if (Array.isArray(validationErrors)) {
          for (const item of validationErrors) {
            const m = item.message || item.defaultMessage || String(item);
            if (m) details.push(m);
          }
        }
      }

      let title = "Đăng ký không thành công";
      let message = "Vui lòng kiểm tra lại các thông tin đã nhập.";

      if (data.message) {
        if (data.message === "Email already exists") {
          title = "Email đã tồn tại";
          message =
            "Email này đã được sử dụng trong hệ thống. Vui lòng chọn một email khác hoặc đăng nhập nếu bạn đã có tài khoản.";
        } else if (data.message === "Phone already exists") {
          title = "Số điện thoại đã tồn tại";
          message =
            "Số điện thoại này đã được đăng ký trong hệ thống. Vui lòng sử dụng số điện thoại khác.";
        } else if (
          data.message === "Bad credentials" ||
          data.message?.toLowerCase().includes("bad credentials")
        ) {
          title = "Đăng nhập thất bại";
          message = "Sai tài khoản hoặc mật khẩu.";
        } else if (data.message?.includes("No static resource upload for request '/upload'")) {
          title = "Máy chủ chưa khởi động lại";
          message = "Endpoint /upload chưa được nạp. Vui lòng dừng và khởi động lại Spring Boot (./mvnw spring-boot:run) để hoàn tất cập nhật.";
        } else if (data.message !== "Invalid request data") {
          message = data.message;
        }
      }

      return { title, message, details };
    }

    if (err.message) {
      return {
        title: "Lỗi kết nối",
        message: err.message,
        details: [],
      };
    }

    return {
      title: "Đã xảy ra lỗi",
      message: "Không thể xử lý yêu cầu. Vui lòng thử lại sau.",
      details: [],
    };
  },
};

export default authService;