"use client";

import { useEffect, useRef, useState } from "react";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const photoRef = useRef<HTMLCanvasElement | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [photoData, setPhotoData] = useState<string | null>(null);

  // Запуск камеры
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }, // основная камера на телефоне
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (e) {
        console.error(e);
        setHasCamera(false);
      }
    }

    if (typeof navigator !== "undefined" && navigator.mediaDevices) {
      startCamera();
    } else {
      setHasCamera(false);
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  // Сделать снимок
  const takePhoto = () => {
    if (!videoRef.current || !photoRef.current) return;

    const video = videoRef.current;
    const canvas = photoRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg");
    setPhotoData(dataUrl);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
      <h1 className="text-2xl font-semibold mb-4">
        CaloAI — трекер калорий по фото (MVP)
      </h1>

      {!hasCamera && (
        <p className="mb-4 text-red-400 text-center max-w-md">
          Камера недоступна (iOS/HTTP). Это нормально для локальной разработки.
          После деплоя на HTTPS камера заработает.
        </p>
      )}

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="border border-slate-700 rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-80 h-60 bg-black object-cover"
          />
        </div>

        <AnalyzerBlock onTakePhoto={takePhoto} photoData={photoData} />
      </div>
    </main>
  );
}
type AnalyzerProps = {
  onTakePhoto: () => void;
  photoData: string | null;
};

type Meal = {
  id: string;
  name: string;
  weight: number;
  calories: number;
  createdAt: string;
};

function AnalyzerBlock({ onTakePhoto, photoData }: AnalyzerProps) {
  const [result, setResult] = useState<{
    name: string;
    weight: number;
    calories: number;
  } | null>(null);

  const [editableName, setEditableName] = useState("");
  const [editableWeight, setEditableWeight] = useState("");
  const [caloriesPer100g, setCaloriesPer100g] = useState("");

  const [meals, setMeals] = useState<Meal[]>([]);

  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);

  const mockRecognize = () => {
    const samples = [
      { name: "Пицца", weight: 250, calories: 700 },
      { name: "Борщ со сметаной", weight: 300, calories: 320 },
      { name: "Суши (ролл)", weight: 180, calories: 360 },
      { name: "Гречка с курицей", weight: 220, calories: 410 },
    ];
    const random = samples[Math.floor(Math.random() * samples.length)];
    setResult(random);
    setEditableName(random.name);
    setEditableWeight(String(random.weight));
    const per100 = Math.round((random.calories / random.weight) * 100);
    setCaloriesPer100g(String(per100));
  };

  const handleClick = () => {
    onTakePhoto();
    mockRecognize();
  };

  const handleRecalculate = () => {
    const w = Number(editableWeight);
    const per100 = Number(caloriesPer100g);
    if (!w || !per100) return;

    const totalCalories = Math.round((w * per100) / 100);

    setResult({
      name: editableName || "Блюдо",
      weight: w,
      calories: totalCalories,
    });
  };

  const handleAddMeal = () => {
    if (!result) return;

    const newMeal: Meal = {
      id: crypto.randomUUID(),
      name: result.name,
      weight: result.weight,
      calories: result.calories,
      createdAt: new Date().toISOString(),
    };

    setMeals((prev) => [newMeal, ...prev]);
  };

  const handleClearMeals = () => {
    setMeals([]);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleClick}
        className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-600 transition"
      >
        Сделать снимок еды
      </button>

      {photoData && (
        <p className="text-xs text-slate-400">
          Фото сохранено локально (для будущего Vision API).
        </p>
      )}

      {result && (
        <div className="mt-2 w-80 border border-slate-700 rounded-lg p-3 bg-slate-800 space-y-2">
          <p className="text-sm text-slate-300">
            Распознанное блюдо (можно исправить):
          </p>

          <input
            value={editableName}
            onChange={(e) => setEditableName(e.target.value)}
            className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1 text-sm"
            placeholder="Название блюда"
          />

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-slate-400 mb-1">
                Вес, г
              </label>
              <input
                type="number"
                value={editableWeight}
                onChange={(e) => setEditableWeight(e.target.value)}
                className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1 text-sm"
                min={1}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-slate-400 mb-1">
                Ккал на 100 г
              </label>
              <input
                type="number"
                value={caloriesPer100g}
                onChange={(e) => setCaloriesPer100g(e.target.value)}
                className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1 text-sm"
                min={1}
              />
            </div>
          </div>

          <button
            onClick={handleRecalculate}
            className="w-full mt-1 px-3 py-1.5 rounded bg-sky-500 hover:bg-sky-600 text-sm transition"
          >
            Пересчитать калорийность
          </button>

          <div className="border-t border-slate-700 pt-2 mt-1 text-sm">
            <p className="text-slate-300">Текущее блюдо:</p>
            <p className="font-semibold">{result.name}</p>
            <p>Вес: {result.weight} г</p>
            <p>Калорийность: {result.calories} ккал</p>
          </div>

          <button
            onClick={handleAddMeal}
            className="w-full mt-2 px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-600 text-sm transition"
          >
            Добавить в дневник за сегодня
          </button>
        </div>
      )}

      {meals.length > 0 && (
        <div className="mt-3 w-80 border border-slate-700 rounded-lg p-3 bg-slate-800 space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <p className="font-semibold">Сегодня съел:</p>
            <button
              onClick={handleClearMeals}
              className="text-xs text-red-300 hover:text-red-400"
            >
              Очистить
            </button>
          </div>

          <ul className="space-y-1 max-h-40 overflow-auto pr-1">
            {meals.map((meal) => (
              <li
                key={meal.id}
                className="flex justify-between gap-2 border-b border-slate-700/60 pb-1 last:border-b-0"
              >
                <div>
                  <p className="font-medium">{meal.name}</p>
                  <p className="text-xs text-slate-400">
                    {meal.weight} г • {meal.calories} ккал
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-1 font-semibold">
            Итого за сегодня: {totalCalories} ккал
          </p>
        </div>
      )}
    </div>
  );
}
