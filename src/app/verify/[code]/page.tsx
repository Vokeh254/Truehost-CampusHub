import { db } from "@/server/db";
import { verifyCertificate } from "@/server/services/certificate.service";
import { notFound } from "next/navigation";
import { Globe, CheckCircle2, XCircle, Award, Building2, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Certificate Verification — ${code} | Truehost Campus Builders`,
  };
}

export default async function VerifyCertificatePage({ params }: Props) {
  const { code } = await params;
  const result = await verifyCertificate(db, code.toUpperCase());

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-blue-600 mb-4">
            <Globe className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Certificate Verification</h1>
          <p className="text-gray-500 mt-1">Truehost Cloud Campus Builders</p>
        </div>

        {/* Verification result card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Status banner */}
          {!result ? (
            <div className="bg-red-50 border-b border-red-200 p-4 flex items-center gap-3">
              <XCircle className="h-6 w-6 text-red-600 shrink-0" />
              <div>
                <p className="font-semibold text-red-800">Certificate Not Found</p>
                <p className="text-sm text-red-600">
                  No certificate with code <strong>{code.toUpperCase()}</strong> was found.
                </p>
              </div>
            </div>
          ) : result.isRevoked ? (
            <div className="bg-red-50 border-b border-red-200 p-4 flex items-center gap-3">
              <XCircle className="h-6 w-6 text-red-600 shrink-0" />
              <div>
                <p className="font-semibold text-red-800">Certificate Revoked</p>
                <p className="text-sm text-red-600">{result.revokedReason}</p>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border-b border-green-200 p-4 flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
              <div>
                <p className="font-semibold text-green-800">Certificate Verified</p>
                <p className="text-sm text-green-600">This is a valid, authentic certificate.</p>
              </div>
            </div>
          )}

          {result && (
            <div className="p-6 space-y-4">
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-amber-50 mb-3">
                  <Award className="h-8 w-8 text-amber-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{result.recipientName}</h2>
                <p className="text-sm text-gray-500 mt-1">Certificate Holder</p>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Building2 className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Institution</p>
                    <p className="text-sm text-gray-900">{result.institution}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Award className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Achievement</p>
                    <p className="text-sm text-gray-900 font-medium">{result.achievement}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Date Issued</p>
                    <p className="text-sm text-gray-900">{formatDate(result.issuedAt)}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 text-center">
                  Certificate ID: <span className="font-mono font-medium text-gray-600">{result.certificateCode}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-gray-400">
          This verification page is provided by Truehost Cloud Campus Builders Kenya.
        </p>
      </div>
    </div>
  );
}
