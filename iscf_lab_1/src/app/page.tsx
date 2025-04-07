"use client";

import { useState, useEffect, useRef } from "react";
import { db, ref, set, onValue } from "@/config/firebase";
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
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface SensorData {
  id: string;
  timestamp: number;
  temperature: number;
  x: number;
  y: number;
  z: number;
}

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  return date.toDateString() === now.toDateString()
    ? date.toLocaleTimeString()
    : date.toLocaleString();
};

const Dashboard = () => {
  const [extractionFreq, setExtractionFreq] = useState<number>(1);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [windowSize, setWindowSize] = useState<number>(60);
  const [reportInterval, setReportInterval] = useState<number>(604800);
  const [customTime, setCustomTime] = useState({ days: 0, hours: 0, minutes: 0 });

  const accelChartRef = useRef<HTMLDivElement>(null);
  const tempChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const extractionFreqRef = ref(db, "extraction_freq");
    const unsubscribeFreq = onValue(extractionFreqRef, (snapshot) => {
      const data = snapshot.val();
      if (data !== null) setExtractionFreq(data);
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

    return () => {
      unsubscribeFreq();
      unsubscribeData();
    };
  }, []);

  const sortedData = [...sensorData].sort((a, b) => a.timestamp - b.timestamp);
  const currentTime = Date.now() / 1000;
  const filteredData = sortedData.filter(
    (item) => item.timestamp >= currentTime - windowSize
  );

  const chartData = filteredData.map((item) => ({
    time: formatDate(item.timestamp),
    x: item.x,
    y: item.y,
    z: item.z,
    temperature: item.temperature,
  }));

  const updateExtractionFreq = async (seconds: number) => {
    setExtractionFreq(seconds);
    try {
      await set(ref(db, "extraction_freq"), seconds);
      console.log("Extraction frequency updated to:", seconds, "seconds");
    } catch (error) {
      console.error("Error updating extraction frequency:", error);
    }
  };

  const updateWindowSize = (seconds: number) => {
    setWindowSize(seconds);
  };

  const calculateStats = (values: number[]) => {
    if (values.length === 0) return { avg: 0, min: 0, max: 0 };
    const sum = values.reduce((acc, v) => acc + v, 0);
    return {
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  };

  const generatePDFReport = async () => {
    const reportData =
      reportInterval === -1
        ? sortedData
        : sortedData.filter((item) => item.timestamp >= currentTime - reportInterval);
    
    if (reportData.length === 0) {
      alert("No data available for the selected interval.");
      return;
    }

    const tempValues = reportData.map((item) => item.temperature);
    const xValues = reportData.map((item) => item.x);
    const yValues = reportData.map((item) => item.y);
    const zValues = reportData.map((item) => item.z);

    const tempStats = calculateStats(tempValues);
    const xStats = calculateStats(xValues);
    const yStats = calculateStats(yValues);
    const zStats = calculateStats(zValues);

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Sensor Report", 10, 15);
    doc.setFontSize(10);
    doc.text(
      `Interval: ${reportInterval === -1 ? "All Time" : `${(reportInterval / 60).toFixed(0)} minutes`}`,
      10,
      25
    );
    doc.text(`Date: ${new Date().toLocaleString()}`, 10, 32);

    let yPos = 40;
    doc.setFontSize(12);
    doc.text("Statistics:", 10, yPos);
    yPos += 8;
    doc.setFontSize(10);
    doc.text(
      `Temperature: Avg = ${tempStats.avg.toFixed(2)}°C, Min = ${tempStats.min}°C, Max = ${tempStats.max}°C`,
      10,
      yPos
    );
    yPos += 6;
    doc.text(
      `Accelerometer X: Avg = ${xStats.avg.toFixed(2)}, Min = ${xStats.min}, Max = ${xStats.max}`,
      10,
      yPos
    );
    yPos += 6;
    doc.text(
      `Accelerometer Y: Avg = ${yStats.avg.toFixed(2)}, Min = ${yStats.min}, Max = ${yStats.max}`,
      10,
      yPos
    );
    yPos += 6;
    doc.text(
      `Accelerometer Z: Avg = ${zStats.avg.toFixed(2)}, Min = ${zStats.min}, Max = ${zStats.max}`,
      10,
      yPos
    );
    yPos += 10;

    const captureElementAsImage = async (element: HTMLElement) => {
      const canvas = await html2canvas(element, { scale: 2 });
      return canvas.toDataURL("image/png", 1.0);
    };

    if (accelChartRef.current && tempChartRef.current) {
      const accelImg = await captureElementAsImage(accelChartRef.current);
      doc.addImage(accelImg, "PNG", 10, yPos, 190, 80);
      yPos += 90;

      const tempImg = await captureElementAsImage(tempChartRef.current);
      doc.addImage(tempImg, "PNG", 10, yPos, 190, 80);
      yPos += 90;
    } else {
      doc.text("Charts not available.", 10, yPos);
    }

    doc.save("sensor_report.pdf");

    // Reset custom time values after PDF generation
    setCustomTime({ days: 0, hours: 0, minutes: 0 });
    setReportInterval(0); // Reset the report interval to 0
    setWindowSize(60); // Reset the window size (this will ensure consistency between the report interval and window size)
  };

  const freqOptions = [1, 2, 3, 5, 10];
  const windowOptions = [
    { label: "1 min", value: 60 },
    { label: "2 min", value: 120 },
    { label: "5 min", value: 300 },
    { label: "10 min", value: 600 },
    { label: "30 min", value: 1800 },
    { label: "1 hour", value: 3600 },
    { label: "1 day", value: 86400 },
    { label: "1 week", value: 604800 },
  ];

  const handleReportIntervalChange = (unit: "days" | "hours" | "minutes", value: number) => {
    const updated = { ...customTime, [unit]: value };
    setCustomTime(updated);
    const totalSeconds = updated.days * 86400 + updated.hours * 3600 + updated.minutes * 60;
    setReportInterval(totalSeconds);
    setWindowSize(totalSeconds); // Sync windowSize to match reportInterval
  };

  const humanReadableWindowSize = () => {
    const d = Math.floor(windowSize / 86400);
    const h = Math.floor((windowSize % 86400) / 3600);
    const m = Math.floor((windowSize % 3600) / 60);
    return `${d}d ${h}h ${m}min`;
  };

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
      <p style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
        Current Window Size: {humanReadableWindowSize()}
      </p>
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

      <h2>Generate PDF Report</h2>
      <div style={{ marginBottom: "1rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
        <label style={{ fontWeight: "bold" }}>Report Interval:</label>
        <input
          type="number"
          placeholder="Days"
          min={0}
          onChange={(e) => handleReportIntervalChange("days", Number(e.target.value))}
          style={{ width: "70px", padding: "0.5rem" }}
        />
        <input
          type="number"
          placeholder="Hours"
          min={0}
          onChange={(e) => handleReportIntervalChange("hours", Number(e.target.value))}
          style={{ width: "70px", padding: "0.5rem" }}
        />
        <input
          type="number"
          placeholder="Minutes"
          min={0}
          onChange={(e) => handleReportIntervalChange("minutes", Number(e.target.value))}
          style={{ width: "80px", padding: "0.5rem" }}
        />
        <button
          onClick={generatePDFReport}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            border: "none",
            backgroundColor: "#2196f3",
            color: "white",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          Download PDF
        </button>
      </div>

      <h2>Accelerometer Data (X, Y, Z vs Time)</h2>
      <div ref={accelChartRef} style={{ backgroundColor: "#f0f0f0", padding: "1rem", borderRadius: "8px" }}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="x" stroke="red" dot={false} />
            <Line type="monotone" dataKey="y" stroke="green" dot={false} />
            <Line type="monotone" dataKey="z" stroke="blue" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h2 style={{ marginTop: "2rem" }}>Temperature Data vs Time</h2>
      <div ref={tempChartRef} style={{ backgroundColor: "#f0f0f0", padding: "1rem", borderRadius: "8px" }}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="temperature" stroke="orange" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
