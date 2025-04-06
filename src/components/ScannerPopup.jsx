import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { FaCamera, FaTimesCircle, FaLeaf, FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import { MdOutlineScreenSearchDesktop } from "react-icons/md";
import { GoogleGenerativeAI } from "@google/generative-ai";

const videoConstraints = {
  width: 400,
  facingMode: "environment",
};

const ScannerPopup = ({ onClose }) => {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [detectedText, setDetectedText] = useState("");
  const [pros, setPros] = useState([]);
  const [cons, setCons] = useState([]);
  const [environmentalImpact, setEnvironmentalImpact] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("pros");

  // ✅ Load API keys securely
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
  const VISION_API_KEY = import.meta.env.VITE_GOOGLE_VISION_API_KEY;

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
  };

  const scanImage = async () => {
    if (!capturedImage) return;
    setLoading(true);
    const base64Img = capturedImage.replace(/^data:image\/(png|jpg);base64,/, "");

    try {
      const visionResponse = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`,
        {
          method: "POST",
          body: JSON.stringify({
            requests: [
              {
                image: { content: base64Img },
                features: [{ type: "TEXT_DETECTION" }],
              },
            ],
          }),
        }
      );

      const visionData = await visionResponse.json();
      const text = visionData.responses?.[0]?.fullTextAnnotation?.text || "";
      setDetectedText(text);

      const possibleName = text.split("\n")[0].slice(0, 50);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `You are a health and environment expert. Analyze this packed food or product and return the following:

1. Health-related **Pros** and **Cons** in short bullet points (maximum 5 each).
2. A brief paragraph on the **environmental impact** (such as impact of production, packaging, or ingredients).

Product Name (if known): ${possibleName}

Full Label or Info:
${text}`;

      const result = await model.generateContent({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      });

      const output = await result.response.text();

      const prosList = output.match(/Pros:(.*?)(Cons:|Environmental Impact:|$)/is)?.[1]?.trim().split("\n") || [];
      const consListRaw = output.match(/Cons:(.*?)(Environmental Impact:|$)/is)?.[1]?.trim().split("\n") || [];

      const cleanedPros = prosList
        .map(line => line.replace(/^-|\*/, "").trim())
        .filter(line => line.length > 0)
        .slice(0, 5);

      const cleanedCons = consListRaw
        .map(line => line.replace(/^-|\*/, "").trim())
        .filter(line => line.length > 0)
        .filter(line => !cleanedPros.some(pro => pro.toLowerCase() === line.toLowerCase()))
        .slice(0, 5);

      const impactMatch = output.match(/Environmental Impact:(.*)/is);
      const impact = impactMatch?.[1]?.trim() || "No environmental impact data available. Try scanning a popular product or one with clearer labeling.";

      setPros(cleanedPros);
      setCons(cleanedCons);
      setEnvironmentalImpact(impact);
      setActiveTab("pros");
    } catch (err) {
      console.error("Error:", err);
      setDetectedText("Error analyzing the product. Please try again.");
      setEnvironmentalImpact("No data available due to analysis error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (capturedImage) {
      const stream = webcamRef.current?.video?.srcObject;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  }, [capturedImage]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "pros":
        return (
          <div className="space-y-2">
            {pros.length > 0 ? (
              pros.map((item, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-green-50 rounded-lg">
                  <FaThumbsUp className="text-green-500 mt-1 flex-shrink-0" />
                  <p className="text-green-800">{item}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">No pros detected</p>
            )}
          </div>
        );
      case "cons":
        return (
          <div className="space-y-2">
            {cons.length > 0 ? (
              cons.map((item, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-red-50 rounded-lg">
                  <FaThumbsDown className="text-red-500 mt-1 flex-shrink-0" />
                  <p className="text-red-800">{item}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">No cons detected</p>
            )}
          </div>
        );
      case "environment":
        return (
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
            <FaLeaf className="text-blue-500 mt-1 flex-shrink-0" />
            <p className="text-blue-800">{environmentalImpact}</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-white rounded-2xl p-5 shadow-xl w-full max-w-lg text-gray-800 max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="bg-green-100 text-green-600 p-2 rounded-full">
              <MdOutlineScreenSearchDesktop />
            </span>
            <span>Product Scanner</span>
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-red-500 text-xl transition-colors"
            aria-label="Close scanner"
          >
            <FaTimesCircle />
          </button>
        </div>

        {!capturedImage ? (
          <div className="relative">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/png"
              videoConstraints={videoConstraints}
              className="rounded-lg w-full mb-4 border-2 border-gray-200"
            />
            <div className="absolute inset-0 border-4 border-dashed border-green-400 rounded-lg pointer-events-none"></div>
          </div>
        ) : (
          <div className="relative">
            <img
              src={capturedImage}
              alt="Captured product"
              className="rounded-lg w-full mb-4 border-2 border-gray-200"
            />
            <button
              onClick={() => setCapturedImage(null)}
              className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
              aria-label="Retake photo"
            >
              <FaTimesCircle className="text-red-500" />
            </button>
          </div>
        )}

        <div className="flex justify-center gap-4 mb-6">
          {!capturedImage ? (
            <button
              onClick={capture}
              className="bg-blue-600 text-white px-6 py-3 rounded-full flex items-center gap-2 shadow hover:bg-blue-700 transition-colors"
            >
              <FaCamera /> Capture Photo
            </button>
          ) : (
            <button
              onClick={scanImage}
              disabled={loading}
              className={`px-6 py-3 rounded-full flex items-center gap-2 shadow transition-colors ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              <MdOutlineScreenSearchDesktop /> 
              {loading ? "Analyzing..." : "Analyze Product"}
            </button>
          )}
        </div>

        {(pros.length > 0 || cons.length > 0 || environmentalImpact) && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex border-b border-gray-200 mb-4">
              <button
                className={`py-2 px-4 font-medium flex items-center gap-2 ${
                  activeTab === "pros"
                    ? "text-green-600 border-b-2 border-green-600"
                    : "text-gray-500 hover:text-green-500"
                }`}
                onClick={() => setActiveTab("pros")}
              >
                <FaThumbsUp /> Pros
              </button>
              <button
                className={`py-2 px-4 font-medium flex items-center gap-2 ${
                  activeTab === "cons"
                    ? "text-red-600 border-b-2 border-red-600"
                    : "text-gray-500 hover:text-red-500"
                }`}
                onClick={() => setActiveTab("cons")}
              >
                <FaThumbsDown /> Cons
              </button>
              <button
                className={`py-2 px-4 font-medium flex items-center gap-2 ${
                  activeTab === "environment"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-blue-500"
                }`}
                onClick={() => setActiveTab("environment")}
              >
                <FaLeaf /> Environment
              </button>
            </div>

            <div className="min-h-[200px]">{renderTabContent()}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScannerPopup;
