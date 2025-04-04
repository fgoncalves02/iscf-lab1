"use client";

import { useState, useEffect } from "react";
import { db, ref, set, onValue } from "@/config/firebase"; // ajuste o caminho conforme necessário
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Define a interface dos dados do sensor
interface SensorData {
  id: string;
  timestamp: number; // Unix timestamp em segundos
  temperature: number;
  x: number;
  y: number;
  z: number;
}

const Dashboard = () => {
  // Estado para a frequência de extração e dados dos sensores
  const [extractionFreq, setExtractionFreq] = useState<number>(1);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  // Estado para o tamanho da janela (em segundos)
  const [windowSize, setWindowSize] = useState<number>(60); // valor padrão: 1 minuto

  // Buscar a frequência de extração e os dados do acelerómetro na montagem do componente
  useEffect(() => {
    const extractionFreqRef = ref(db, "extraction_freq");
    const unsubscribeFreq = onValue(extractionFreqRef, (snapshot) => {
      const data = snapshot.val();
      if (data !== null) {
        setExtractionFreq(data);
      }
    });

    const accelRef = ref(db, "accelerometer_data");
    const unsubscribeData = onValue(accelRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const dataArray: SensorData[] = Object.entries(data).map(([id, value]) => ({
          id,
          ...(value as Omit<SensorData, "id">),
        }));
        setSensorData(dataArray);
      }
    });

    // Limpar os listeners ao desmontar
    return () => {
      unsubscribeFreq();
      unsubscribeData();
    };
  }, []);

  // Ordena os dados por timestamp (crescente)
  const sortedData = [...sensorData].sort((a, b) => a.timestamp - b.timestamp);

  // Filtra os dados com base no windowSize selecionado
  const currentTime = Date.now() / 1000; // tempo atual em segundos
  const filteredData = sortedData.filter(item => item.timestamp >= (currentTime - windowSize));

  // Prepara os dados para os gráficos (formato adequado para Recharts)
  const chartData = filteredData.map(item => ({
    time: new Date(item.timestamp * 1000).toLocaleTimeString(),
    x: item.x,
    y: item.y,
    z: item.z,
    temperature: item.temperature,
  }));

  // Função para atualizar a frequência de extração no Firebase
  const updateExtractionFreq = async (seconds: number) => {
    setExtractionFreq(seconds);
    try {
      await set(ref(db, "extraction_freq"), seconds);
      console.log("Extraction frequency updated to:", seconds, "seconds");
    } catch (error) {
      console.error("Error updating extraction frequency:", error);
    }
  };

  // Função para atualizar o tamanho da janela
  const updateWindowSize = (seconds: number) => {
    setWindowSize(seconds);
  };

  // Opções para a frequência de extração e para o tamanho da janela (em segundos)
  const freqOptions = [1, 2, 3, 5, 10];
  const windowOptions: { label: string; value: number }[] = [
    { label: "1 min", value: 60 },
    { label: "2 min", value: 120 },
    { label: "5 min", value: 300 },
    { label: "10 min", value: 600 },
    { label: "30 min", value: 1800 },
    { label: "1 hora", value: 3600 },
    { label: "1 dia", value: 86400 },
    { label: "1 semana", value: 604800 },
  ];

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Set Extraction Frequency</h2>
      <div style={{ marginBottom: "1rem" }}>
        {freqOptions.map((sec) => (
          <button
            key={sec}
            onClick={() => updateExtractionFreq(sec)}
            style={{
              backgroundColor: extractionFreq === sec ? "#4caf50" : "#2196f3",
              color: "white",
              border: "none",
              padding: "0.5rem 1rem",
              marginRight: "0.5rem",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {sec} s
          </button>
        ))}
      </div>

      <h2>Set Window Size</h2>
      <div style={{ marginBottom: "1rem" }}>
        {windowOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => updateWindowSize(option.value)}
            style={{
              backgroundColor: windowSize === option.value ? "#4caf50" : "#2196f3",
              color: "white",
              border: "none",
              padding: "0.5rem 1rem",
              marginRight: "0.5rem",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      <h2>Accelerometer Data (X, Y, Z vs Time)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="x" stroke="red" dot={false} />
          <Line type="monotone" dataKey="y" stroke="green" dot={false} />
          <Line type="monotone" dataKey="z" stroke="blue" dot={false} />
        </LineChart>
      </ResponsiveContainer>

      <h2 style={{ marginTop: "2rem" }}>Temperature Data vs Time</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="temperature" stroke="orange" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Dashboard;
