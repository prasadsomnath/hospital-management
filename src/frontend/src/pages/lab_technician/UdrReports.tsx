import { useParams } from "@tanstack/react-router";
import React from "react";
import { DiagnosticWorkspace } from "./DiagnosticWorkspace";

export default function UdrReports() {
  const params = useParams({ strict: false }) as Record<string, string>;
  const reportId = params?.reportId || "ct";
  const moduleName = `udr-${reportId}`;
  return <DiagnosticWorkspace module={moduleName} />;
}
