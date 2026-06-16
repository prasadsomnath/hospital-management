import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import type React from "react";

interface PaginationControlProps {
  currentPage: number; // 0-based index
  totalPages: number;
  totalElements?: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  className?: string;
}

export function PaginationControl({
  currentPage,
  totalPages,
  totalElements = 0,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className = "",
}: PaginationControlProps) {

  const safeTotal = Math.max(totalPages, 1);


  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (safeTotal <= maxVisiblePages) {
      for (let i = 0; i < safeTotal; i++) {
        pages.push(i);
      }
    } else {
      pages.push(0);

      const start = Math.max(1, currentPage - 1);
      const end = Math.min(safeTotal - 2, currentPage + 1);

      if (start > 1) {
        pages.push("ellipsis-1");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < safeTotal - 2) {
        pages.push("ellipsis-2");
      }

      pages.push(safeTotal - 1);
    }
    return pages;
  };

  const startElement = totalElements > 0 ? currentPage * pageSize + 1 : 0;
  const endElement = totalElements > 0 ? Math.min((currentPage + 1) * pageSize, totalElements) : 0;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 border-t border-border/40 mt-4 ${className}`}
    >
      {/* Entries Info & Page Size */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {totalElements > 0 && (
          <span>
            Showing{" "}
            <span className="font-semibold text-foreground">
              {startElement}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-foreground">{endElement}</span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">
              {totalElements}
            </span>{" "}
            entries
          </span>
        )}

        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-muted/40 border border-border/80 text-foreground text-xs rounded-xl h-8 px-2.5 focus:ring-accent/20 focus:border-accent outline-none cursor-pointer"
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>entries</span>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="h-9 w-9 rounded-xl border border-border/60 hover:bg-muted text-muted-foreground disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getPageNumbers().map((page) => {
          if (typeof page === "string") {
            return (
              <span
                key={page}
                className="h-9 w-9 flex items-center justify-center text-muted-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </span>
            );
          }

          const isActive = page === currentPage;
          return (
            <Button
              key={page}
              type="button"
              variant={isActive ? "default" : "outline"}
              onClick={() => onPageChange(page)}
              className={`h-9 w-9 rounded-xl p-0 font-medium transition-all ${
                isActive
                  ? "bg-accent hover:bg-accent/90 text-accent-foreground border-accent shadow-sm"
                  : "border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {page + 1}
            </Button>
          );
        })}

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === safeTotal - 1 || safeTotal === 0}
          className="h-9 w-9 rounded-xl border border-border/60 hover:bg-muted text-muted-foreground disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
