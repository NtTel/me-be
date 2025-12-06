import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_API_KEY as string;

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const getAiAnswer = async (
  questionTitle: string,
  questionContent: string
): Promise<string> => {
  if (!ai) {
    return "Vui lòng cấu hình VITE_API_KEY trên Vercel để sử dụng tính năng này.";
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
Bạn là chuyên gia tư vấn nuôi dạy con trên Asking.vn.

Câu hỏi: ${questionTitle}
Chi tiết: ${questionContent}

Yêu cầu:
- Trả lời tiếng Việt
- Giọng ân cần, dễ hiểu
- Khoảng 150–200 từ
- Kết thúc bằng lưu ý:
"Đây là gợi ý từ AI tham khảo, mẹ nên hỏi ý kiến bác sĩ chuyên khoa nếu bé có dấu hiệu bất thường nhé."
      `,
    });

    return response.text ?? "Hiện AI chưa thể trả lời, mẹ thử lại sau nhé.";
  } catch (err) {
    console.error("Gemini error:", err);
    return "Hệ thống đang bận, mẹ vui lòng thử lại sau.";
  }
};
