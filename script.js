// Hava durumu ve Gemini AI entegrasyonu
const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");

const resultCard = document.getElementById("resultCard");
const cityNameEl = document.getElementById("cityName");
const temperatureEl = document.getElementById("temperature");
const conditionEl = document.getElementById("condition");
const aiAdviceEl = document.getElementById("aiAdvice");

// Gemini API Key (Vercel'e atarken burayı güvenli hale getireceğiz)
const GEMINI_API_KEY = "AQ.Ab8RN6IS9YqzIs9dQ2AEDmnsrhOwP-997A_geEX4QKhDtNINVQ";

searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) {
    getWeatherData(city);
  } else {
    alert("Lütfen bir şehir adı girin!");
  }
});

// 1. Hava Durumu Verisini Çekme (Open-Meteo & Geocoding API)
async function getWeatherData(city) {
  resultCard.classList.remove("hidden");
  cityNameEl.textContent = city.toUpperCase();
  temperatureEl.textContent = "Yükleniyor...";
  conditionEl.textContent = "";
  aiAdviceEl.textContent = "🤖 Yapay zeka hava durumunu analiz ediyor...";

  try {
    // Şehrin enlem ve boylamını bulma
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=tr&format=json`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      alert("Şehir bulunamadı, lütfen geçerli bir şehir adı girin.");
      resultCard.classList.add("hidden");
      return;
    }

    const { latitude, longitude, name, country } = geoData.results[0];
    cityNameEl.textContent = `${name}, ${country}`;

    // Sıcaklık ve hava durumunu çekme
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    const temp = weatherData.current_weather.temperature;
    const weatherCode = weatherData.current_weather.weathercode;
    const conditionText = getWeatherConditionText(weatherCode);

    temperatureEl.textContent = `${temp}°C`;
    conditionEl.textContent = conditionText;

    // 2. Yapay Zekaya Gönderme
    getAIAdvice(name, temp, conditionText);
  } catch (error) {
    console.error("Hata oluştu:", error);
    aiAdviceEl.textContent = "Veriler alınırken bir hata oluştu.";
  }
}

// Hava Durumu Kodlarını Türkçe Açıklamaya Çevirme
function getWeatherConditionText(code) {
  if (code === 0) return "Açık / Güneşli";
  if (code >= 1 && code <= 3) return "Az Bulutlu / Parçalı Bulutlu";
  if (code >= 45 && code <= 48) return "Sisli";
  if (code >= 51 && code <= 67) return "Yağmurlu";
  if (code >= 71 && code <= 77) return "Kar Yağışlı";
  if (code >= 80 && code <= 82) return "Sağanak Yağışlı";
  if (code >= 95) return "Fırtınalı / Gök Gürültülü";
  return "Bulutlu";
}

// 3. Google Gemini AI'dan Tavsiye Alma
async function getAIAdvice(city, temp, condition) {
  if (GEMINI_API_KEY === "BURAYA_GEMINI_API_KEY_GELECEK") {
    aiAdviceEl.textContent =
      "💡 API Anahtarı henüz eklenmedi. (Sonraki adımda ekleyeceğiz!)";
    return;
  }

  const prompt = `${city} şehrinde hava şu an ${temp}°C ve durum: '${condition}'. Bu hava durumuna göre kullanıcıya ne giymesi gerektiği ve dışarı çıkarken nelere dikkat etmesi gerektiği hakkında 2-3 cümlelik çok sevimli ve pratik bir tavsiye ver.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    );

    const data = await response.json();
    if (data.candidates && data.candidates[0].content.parts[0].text) {
      aiAdviceEl.textContent = data.candidates[0].content.parts[0].text;
    } else {
      aiAdviceEl.textContent = "Tavsiye üretilemedi.";
    }
  } catch (err) {
    console.error(err);
    aiAdviceEl.textContent = "Yapay zeka ile bağlantı kurulamadı.";
  }
}
