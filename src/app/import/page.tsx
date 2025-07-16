"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface ImportResult {
  success: boolean;
  imported?: number;
  errors?: number;
  errorDetails?: string[];
  error?: string;
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: "Failed to upload file",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `date,mood,note,tags,sleepHours,medication,emotions
2024-01-15,7,"Bonne journée au travail",work;friends,8.5,0,calme;joyeux
2024-01-16,5,"Jour normal",,,7.0,0.5,neutre
2024-01-17,8,"Sortie avec des amis",friends;exercise,8.0,0,heureux;energique`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mood-tracker-template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-4">📊 Mood Tracker</h1>
        <nav className="flex justify-center space-x-4">
          <Link href="/">
            <Button variant="outline">Dashboard</Button>
          </Link>
          <Link href="/analytics">
            <Button variant="outline">Analytics</Button>
          </Link>
          <Button variant="default">Import</Button>
        </nav>
      </header>

      <main className="grid gap-6">
        {/* Import Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Import de données CSV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Format requis:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>date</strong> (requis): Format YYYY-MM-DD ou DD/MM/YYYY</li>
                <li>• <strong>mood</strong> (requis): Nombre de 0 à 10</li>
                <li>• <strong>note</strong> (optionnel): Texte libre</li>
                <li>• <strong>tags</strong> (optionnel): Séparés par des points-virgules (ex: work;friends)</li>
                <li>• <strong>sleepHours</strong> (optionnel): Nombre décimal (ex: 8.5)</li>
                <li>• <strong>medication</strong> (optionnel): Nombre décimal</li>
                <li>• <strong>emotions</strong> (optionnel): Texte libre</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={downloadTemplate}
                className="flex-1"
              >
                📁 Télécharger le template
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload fichier CSV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={loading}
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  Fichier sélectionné: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <Button 
              onClick={handleImport}
              disabled={!file || loading}
              className="w-full"
            >
              {loading ? "Import en cours..." : "Importer les données"}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Résultats de l'import</CardTitle>
            </CardHeader>
            <CardContent>
              {result.success ? (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Badge variant="secondary" className="text-green-600">
                      ✅ {result.imported} entrées importées
                    </Badge>
                    {result.errors && result.errors > 0 && (
                      <Badge variant="destructive">
                        ❌ {result.errors} erreurs
                      </Badge>
                    )}
                  </div>

                  {result.errorDetails && result.errorDetails.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold">Détails des erreurs:</h4>
                      <div className="bg-red-50 p-3 rounded border">
                        {result.errorDetails.map((error, index) => (
                          <p key={index} className="text-sm text-red-600">
                            {error}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Badge variant="destructive">
                    ❌ Échec de l'import
                  </Badge>
                  <p className="text-sm text-red-600">
                    {result.error}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Conseils</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Utilisez le template fourni pour éviter les erreurs de format</li>
              <li>• Les dates peuvent être au format DD/MM/YYYY ou YYYY-MM-DD</li>
              <li>• Seules les colonnes "date" et "mood" sont obligatoires</li>
              <li>• Les tags multiples doivent être séparés par des points-virgules</li>
              <li>• Le fichier doit être encodé en UTF-8</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}