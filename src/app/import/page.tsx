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
  preview?: {
    totalLinesProcessed: number;
    entriesFound: number;
    sampleEntries: Array<{
      date: string;
      score: number;
      comment: string;
      lineNumber: number;
    }>;
  };
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [previewResult, setPreviewResult] = useState<ImportResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setPreviewResult(null);
      setLogs([]);
      addLog(`Fichier sélectionné: ${selectedFile.name} (${selectedFile.size} bytes)`);
    }
  };

  const handlePreview = async () => {
    if (!file) return;

    setPreviewing(true);
    setPreviewResult(null);
    addLog("🔍 Démarrage de l'analyse du fichier...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("preview", "true");

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setPreviewResult(data);

      if (data.success && data.preview) {
        addLog(`📊 Analyse terminée: ${data.preview.entriesFound} entrées trouvées sur ${data.preview.totalLinesProcessed} lignes`);
        if (data.errorDetails && data.errorDetails.length > 0) {
          addLog(`⚠️  ${data.errorDetails.length} erreurs détectées`);
        }
      } else {
        addLog(`❌ Erreur d'analyse: ${data.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      addLog(`❌ Erreur réseau: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setPreviewResult({
        success: false,
        error: "Erreur lors de l'analyse du fichier",
      });
    } finally {
      setPreviewing(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);
    addLog("🚀 Démarrage de l'import...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        addLog(`✅ Import terminé avec succès: ${data.imported} entrées importées`);
        if (data.errors && data.errors > 0) {
          addLog(`⚠️  ${data.errors} erreurs rencontrées`);
        }
      } else {
        addLog(`❌ Erreur d'import: ${data.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      addLog(`❌ Erreur réseau: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setResult({
        success: false,
        error: "Erreur lors de l'upload du fichier",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `Date de l'humeur,Score de l'humeur,Heures de sommeil,médicaments,émotions,commentaire
"vendredi 27 juin 2025",7,8.5,0,joyeux,"Très bonne journée au travail.
Réunion productive avec l'équipe."
"samedi 28 juin 2025",8,9.0,0,relaxé,"Week-end détente.
Balade en forêt."
"dimanche 29 juin 2025",6,7.5,0.5,fatigué,"Dimanche calme mais un peu fatigué."`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
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
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>📁 Importer des données CSV</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="file" className="block text-sm font-medium">
                  Sélectionner un fichier CSV
                </label>
                <Input
                    id="file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                />
              </div>

              <div className="flex gap-2">
                <Button
                    onClick={handlePreview}
                    disabled={!file || previewing}
                    variant="outline"
                >
                  {previewing ? "Analyse en cours..." : "🔍 Analyser"}
                </Button>

                <Button
                    onClick={handleImport}
                    disabled={!file || loading || !previewResult?.success}
                    variant="default"
                >
                  {loading ? "Import en cours..." : "📤 Importer"}
                </Button>

                <Button onClick={downloadTemplate} variant="outline">
                  📥 Télécharger le template
                </Button>
              </div>

              {!previewResult?.success && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      🔍 Analysez d'abord votre fichier pour vérifier qu'il sera correctement importé.
                    </p>
                  </div>
              )}
            </CardContent>
          </Card>

          {/* Preview Results */}
          {previewResult && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {previewResult.success ? "📊 Aperçu de l'analyse" : "❌ Erreur d'analyse"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {previewResult.success && previewResult.preview ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Lignes traitées</p>
                            <p className="text-2xl font-bold">{previewResult.preview.totalLinesProcessed}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Entrées trouvées</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{previewResult.preview.entriesFound}</p>
                          </div>
                        </div>

                        {previewResult.preview.sampleEntries.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2">Échantillon des entrées détectées:</h4>
                              <div className="space-y-2">
                                {previewResult.preview.sampleEntries.map((entry, index) => (
                                    <div key={index} className="p-2 bg-muted rounded text-sm">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <span className="font-medium">{entry.date}</span>
                                          <Badge variant="outline" className="ml-2">Score: {entry.score}</Badge>
                                        </div>
                                        <Badge variant="secondary">Ligne {entry.lineNumber}</Badge>
                                      </div>
                                      {entry.comment && (
                                          <p className="text-muted-foreground mt-1">{entry.comment}</p>
                                      )}
                                    </div>
                                ))}
                              </div>
                            </div>
                        )}

                        {previewResult.preview.entriesFound !== previewResult.preview.totalLinesProcessed - 1 && (
                            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                ⚠️ Attention: {previewResult.preview.totalLinesProcessed - 1} lignes dans le fichier mais seulement {previewResult.preview.entriesFound} entrées détectées.
                                Cela peut être dû à des commentaires sur plusieurs lignes (ce qui est normal) ou à des erreurs de format.
                              </p>
                            </div>
                        )}
                      </div>
                  ) : (
                      <div className="text-red-600 dark:text-red-400">
                        <p>{previewResult.error || "Erreur inconnue"}</p>
                      </div>
                  )}
                </CardContent>
              </Card>
          )}

          {/* Import Results */}
          {result && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {result.success ? "✅ Résultats de l'import" : "❌ Erreur d'import"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.success ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Importées</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{result.imported}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Erreurs</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{result.errors}</p>
                          </div>
                        </div>

                        <div className="flex justify-center">
                          <Link href="/analytics">
                            <Button>Voir les analyses</Button>
                          </Link>
                        </div>
                      </div>
                  ) : (
                      <div className="text-red-600 dark:text-red-400">
                        <p>{result.error || "Erreur inconnue"}</p>
                      </div>
                  )}
                </CardContent>
              </Card>
          )}

          {/* Error Details */}
          {(result?.errorDetails || previewResult?.errorDetails) && (
              <Card>
                <CardHeader>
                  <CardTitle>🔍 Détails des erreurs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {(result?.errorDetails || previewResult?.errorDetails || []).map((error, index) => (
                        <div key={index} className="p-2 bg-red-500/10 text-red-600 dark:text-red-400 rounded text-sm">
                          {error}
                        </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
          )}

          {/* Logs */}
          {logs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>📋 Logs d'import</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {logs.map((log, index) => (
                        <div key={index} className="p-2 bg-muted rounded text-sm font-mono">
                          {log}
                        </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
          )}

          {/* Format Information */}
          <Card>
            <CardHeader>
              <CardTitle>📝 Format CSV supporté</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Colonnes supportées:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Date de l'humeur</strong> (requis): DD/MM/YYYY, YYYY-MM-DD, ou "jour DD mois YYYY"</li>
                    <li><strong>Score de l'humeur</strong> (requis): Nombre de 0 à 10</li>
                    <li><strong>Heures de sommeil</strong> (optionnel): Nombre décimal (ex: 8.5)</li>
                    <li><strong>Médicaments</strong> (optionnel): Nombre décimal</li>
                    <li><strong>Émotions</strong> (optionnel): Texte libre</li>
                    <li><strong>Commentaire</strong> (optionnel): Texte libre, peut s'étendre sur plusieurs lignes</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Fonctionnalités avancées:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>✅ Gestion des commentaires sur plusieurs lignes</li>
                    <li>✅ Détection automatique des formats de date français</li>
                    <li>✅ Gestion des guillemets dans les champs</li>
                    <li>✅ Rapport détaillé des erreurs d'import</li>
                    <li>✅ Mode prévisualisation avant import</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Exemple de format:</h4>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`Date de l'humeur,Score de l'humeur,Heures de sommeil,médicaments,émotions,commentaire
"vendredi 27 juin 2025",7,8.5,0,joyeux,"Très bonne journée.
Réunion productive."
"28/06/2025",8,9.0,0,relaxé,"Week-end détente"`}
                </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
  );
}