import { useParams } from "@tanstack/react-router";
import React from "react";
import DiagnosticsEntry from "./DiagnosticsEntry";

export default function DoctorUdrReports() {
  const params = useParams({ strict: false }) as Record<string, string>;
  const reportId = params?.reportId || "ct";

  const titleMap: Record<string, string> = {
    ct: "CT Scan",
    daycare: "Day Care",
    echo: "Echo",
    mri: "MRI",
    ot: "OT",
    physio: "Physiotherapy",
  };

  const title = titleMap[reportId.toLowerCase()] || "CT Scan";
  return <DiagnosticsEntry title={title.toUpperCase()} />;
}
