import api from "./api";

export interface ConsultationMessage {
  sender: "doctor" | "patient";
  text: string;
  timestamp: number;
}

export interface ConsultationCallResponse {
  id: number;
  patientNo: string;
  doctorName: string;
  status: "SCHEDULED" | "ACTIVE" | "COMPLETED";
  messages: ConsultationMessage[];
  hospitalCode: string;
  createdAt: string;
}

export const liveCallService = {
  getActiveCall: async (patientNo: string): Promise<ConsultationCallResponse | null> => {
    try {
      const response = await api.get<ConsultationCallResponse>(`/doctor/calls/active-patient/${patientNo}`);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      console.warn("Failed to fetch active call for patient", error);
      return null;
    }
  },

  joinCall: async (callId: number): Promise<ConsultationCallResponse> => {
    const response = await api.post<ConsultationCallResponse>(`/doctor/calls/${callId}/join`);
    return response.data;
  },

  sendMessage: async (callId: number, text: string): Promise<ConsultationCallResponse> => {
    const response = await api.post<ConsultationCallResponse>(`/doctor/calls/${callId}/message`, {
      sender: "patient",
      text,
      timestamp: Date.now(),
    });
    return response.data;
  },

  transcribeAudio: async (uri: string, name = "recording.webm", type = "audio/webm"): Promise<string> => {
    const formData = new FormData();
    // React Native FormData format
    formData.append("file", {
      uri,
      name,
      type,
    } as any);

    const response = await api.post<string>("/doctor/calls/transcribe", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};

export default liveCallService;
