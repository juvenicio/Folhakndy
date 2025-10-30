"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UploadCloud, FileText, FileSpreadsheet, FileWarning } from "lucide-react";

interface FileUploadProps {
  onDataUpload: (data: any[]) => void;
}

const FileUpload = ({ onDataUpload }: FileUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Por favor, selecione um arquivo para importar.");
      return;
    }

    setLoading(true);
    const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase();

    try {
      if (fileExtension === "xls" || fileExtension === "xlsx") {
        await processExcelFile(selectedFile);
      } else if (["doc", "docx", "pdf"].includes(fileExtension || "")) {
        // Para documentos e PDFs, apenas confirmamos o upload.
        // A extração de dados estruturados para gráficos é complexa client-side.
        toast.info(`Arquivo "${selectedFile.name}" (${fileExtension}) carregado com sucesso.
        A extração de dados estruturados para gráficos de documentos e PDFs é uma funcionalidade avançada que requer processamento no servidor.`);
        onDataUpload([]); // Não há dados estruturados para o dashboard neste caso
      } else {
        toast.error("Formato de arquivo não suportado. Por favor, use .xls, .xlsx, .doc, .docx ou .pdf.");
        onDataUpload([]);
      }
    } catch (error) {
      console.error("Erro ao processar o arquivo:", error);
      toast.error("Erro ao processar o arquivo. Verifique o formato e o conteúdo.");
      onDataUpload([]);
    } finally {
      setLoading(false);
      setSelectedFile(null); // Limpa o arquivo selecionado após o upload
    }
  };

  const processExcelFile = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          onDataUpload(json);
          toast.success(`Arquivo Excel "${file.name}" importado com sucesso!`);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  };

  const getFileIcon = (fileName: string | undefined) => {
    if (!fileName) return <FileText className="h-5 w-5 text-gray-500" />;
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "xls":
      case "xlsx":
        return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
      case "doc":
      case "docx":
        return <FileText className="h-5 w-5 text-blue-600" />;
      case "pdf":
        return <FileText className="h-5 w-5 text-red-600" />;
      default:
        return <FileWarning className="h-5 w-5 text-yellow-600" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Label htmlFor="file-upload" className="sr-only">
          Escolher arquivo
        </Label>
        <Input
          id="file-upload"
          type="file"
          onChange={handleFileChange}
          className="flex-1"
          accept=".xls,.xlsx,.doc,.docx,.pdf"
        />
        <Button onClick={handleUpload} disabled={loading || !selectedFile}>
          {loading ? (
            <>
              <UploadCloud className="mr-2 h-4 w-4 animate-bounce" />
              Importando...
            </>
          ) : (
            <>
              <UploadCloud className="mr-2 h-4 w-4" />
              Importar
            </>
          )}
        </Button>
      </div>
      {selectedFile && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          {getFileIcon(selectedFile.name)}
          <span>{selectedFile.name}</span>
          <span>({(selectedFile.size / 1024).toFixed(2)} KB)</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;