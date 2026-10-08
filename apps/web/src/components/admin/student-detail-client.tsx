"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ManualEnrollModal,
  RecordOfflinePaymentModal,
  WaiveDueModal,
  AddNoteModal,
} from "./student-actions-dialog";
import { GraduationCap, CreditCard, FileText } from "lucide-react";

interface StudentDetailClientProps {
  studentId: string;
  studentName: string;
  availableBatches: Array<{
    id: string;
    title: string;
    feePlans: Array<{
      id: string;
      name: string;
      totalPaise: number;
    }>;
  }>;
  dues: Array<{
    id: string;
    label: string;
    amountPaise: number;
    dueDate: string;
    status: string;
    batchTitle: string;
  }>;
}

export function StudentDetailClient({
  studentId,
  studentName,
  availableBatches,
  dues,
}: StudentDetailClientProps) {
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);

  return (
    <>
      {/* Action Buttons Bar */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <Button
          onClick={() => setEnrollModalOpen(true)}
          size="sm"
          className="gap-1.5 font-semibold"
        >
          <GraduationCap className="w-4 h-4" />
          <span>Enrol in Batch</span>
        </Button>

        <Button
          onClick={() => setPaymentModalOpen(true)}
          variant="outline"
          size="sm"
          className="gap-1.5 font-semibold border-border bg-white text-ink"
        >
          <CreditCard className="w-4 h-4" />
          <span>Record Offline Payment</span>
        </Button>

        <Button
          onClick={() => setNoteModalOpen(true)}
          variant="outline"
          size="sm"
          className="gap-1.5 font-semibold border-border bg-white text-ink"
        >
          <FileText className="w-4 h-4" />
          <span>Add Staff Note</span>
        </Button>
      </div>

      {/* Modals */}
      <ManualEnrollModal
        isOpen={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        studentId={studentId}
        studentName={studentName}
        batches={availableBatches}
      />

      <RecordOfflinePaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        studentId={studentId}
        studentName={studentName}
        dues={dues}
      />

      <AddNoteModal
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        studentId={studentId}
        studentName={studentName}
      />
    </>
  );
}

export function WaiveDueButton({
  due,
  studentId,
  studentName,
}: {
  due: { id: string; label: string; amountPaise: number };
  studentId: string;
  studentName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50 h-7 px-2 font-medium"
      >
        Waive
      </Button>
      <WaiveDueModal
        isOpen={open}
        onClose={() => setOpen(false)}
        due={{ ...due, studentId, studentName }}
      />
    </>
  );
}
