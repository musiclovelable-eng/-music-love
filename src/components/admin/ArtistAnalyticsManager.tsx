"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Trash2, Save, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface AnalyticsEntry {
  id?: number;
  date: string;
  totalStreams: number;
  streamsOver30s: number;
  uniqueListeners: number;
  subscribers: number;
}

interface Props {
  artistId: string;
}

export function ArtistAnalyticsManager({ artistId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<AnalyticsEntry[]>([]);
  
  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalStreams, setTotalStreams] = useState("");
  const [streamsOver30s, setStreamsOver30s] = useState("");
  const [uniqueListeners, setUniqueListeners] = useState("");
  const [subscribers, setSubscribers] = useState("");

  useEffect(() => {
    fetchAnalytics();
  }, [artistId]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/admin/artists/${artistId}/analytics`);
      if (response.ok) {
        const data = await response.json();
        setEntries(data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Ошибка при загрузке аналитики");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!date) {
      toast.error("Выберите дату");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/artists/${artistId}/analytics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          totalStreams: parseInt(totalStreams) || 0,
          streamsOver30s: parseInt(streamsOver30s) || 0,
          uniqueListeners: parseInt(uniqueListeners) || 0,
          subscribers: parseInt(subscribers) || 0,
        }),
      });

      if (response.ok) {
        toast.success("Данные успешно сохранены");
        fetchAnalytics();
        // Clear numeric fields but keep date
        setTotalStreams("");
        setStreamsOver30s("");
        setUniqueListeners("");
        setSubscribers("");
      } else {
        toast.error("Ошибка при сохранении");
      }
    } catch (error) {
      console.error("Error saving analytics:", error);
      toast.error("Ошибка подключения к серверу");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (entry: AnalyticsEntry) => {
    setDate(entry.date);
    setTotalStreams(entry.totalStreams.toString());
    setStreamsOver30s(entry.streamsOver30s.toString());
    setUniqueListeners(entry.uniqueListeners.toString());
    setSubscribers(entry.subscribers.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Управление аналитикой
          </CardTitle>
          <CardDescription>
            Добавление или обновление данных прослушиваний для этого артиста
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Дата</Label>
              <Input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Всего стримов</Label>
              <Input 
                type="number" 
                placeholder="0" 
                value={totalStreams} 
                onChange={(e) => setTotalStreams(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Стримы &gt;30с</Label>
              <Input 
                type="number" 
                placeholder="0" 
                value={streamsOver30s} 
                onChange={(e) => setStreamsOver30s(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Уник. слушатели</Label>
              <Input 
                type="number" 
                placeholder="0" 
                value={uniqueListeners} 
                onChange={(e) => setUniqueListeners(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Подписчики</Label>
              <Input 
                type="number" 
                placeholder="0" 
                value={subscribers} 
                onChange={(e) => setSubscribers(e.target.value)} 
              />
            </div>
          </div>
          <Button 
            className="mt-6 w-full md:w-auto" 
            onClick={handleSave} 
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Сохранить данные за выбранную дату
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>История данных</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Нет данных аналитики</p>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Стримы</TableHead>
                    <TableHead>&gt;30с</TableHead>
                    <TableHead>Слушатели</TableHead>
                    <TableHead>Подписчики</TableHead>
                    <TableHead className="text-right">Действие</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.slice().reverse().map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {new Date(entry.date).toLocaleDateString('ru-RU')}
                      </TableCell>
                      <TableCell>{entry.totalStreams.toLocaleString()}</TableCell>
                      <TableCell>{entry.streamsOver30s.toLocaleString()}</TableCell>
                      <TableCell>{entry.uniqueListeners.toLocaleString()}</TableCell>
                      <TableCell>{entry.subscribers.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(entry)}>
                          Редактировать
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
